'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

import { isUuid } from '@/lib/uuid'

export async function enregistrerOperation(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const type_operation = formData.get('type_operation') as string
  const raw_bande_id = (formData.get('bande_id') as string) || null
  const raw_animal_id = (formData.get('animal_id') as string) || null
  const bande_id = isUuid(raw_bande_id) ? raw_bande_id : null
  const animal_id = isUuid(raw_animal_id) ? raw_animal_id : null
  const date_operation = (formData.get('date_operation') as string) || new Date().toISOString().split('T')[0]
  const montant_total = parseFloat(formData.get('montant_total') as string || '0')
  const quantite = parseFloat(formData.get('quantite') as string || '1')
  const moyen_paiement = formData.get('moyen_paiement') as string || 'especes'
  const tiers_nom = (formData.get('tiers_nom') as string) || ''
  const description = (formData.get('description') as string) || ''

  if (!type_operation || montant_total <= 0) {
    return { error: 'Veuillez saisir un type d’opération et un montant valide' }
  }

  // Sécurité Sanitaire : Empêcher la vente d'une bande ou d'un animal en latence active
  if (type_operation === 'vente_sujets' && bande_id) {
    const { data: b } = await supabase.from('bandes').select('statut, code_bande').eq('id', bande_id).single()
    if (b && b.statut === 'en_latence') {
      return { 
        error: `Action Bloquée : La bande ${b.code_bande} est actuellement sous délai de latence médicale (interdiction de vente/abattage) !` 
      }
    }
  }

  if (type_operation === 'vente_sujets' && animal_id) {
    const { data: a } = await supabase.from('animaux').select('etat_sante, numero_boucle').eq('id', animal_id).single()
    if (a && a.etat_sante === 'en_latence') {
      return { 
        error: `Action Bloquée : L'animal ${a.numero_boucle} est en cours de rémanence médicamenteuse (vente interdite) !` 
      }
    }
  }

  const { error } = await supabase.from('finances_elevage').insert({
    entreprise_id: tenant.entrepriseId,
    type_operation,
    bande_id,
    animal_id,
    date_operation,
    montant_total,
    quantite,
    prix_unitaire: quantite > 0 ? montant_total / quantite : montant_total,
    moyen_paiement,
    tiers_nom,
    description
  })

  if (error) return { error: error.message }

  // Si c'est une vente de sujets d'une bande, décrémenter l'effectif actuel
  if (type_operation === 'vente_sujets' && bande_id && quantite > 0) {
    const { data: b } = await supabase.from('bandes').select('effectif_actuel').eq('id', bande_id).single()
    if (b) {
      await supabase.from('bandes').update({
        effectif_actuel: Math.max(0, b.effectif_actuel - Math.floor(quantite)),
        updated_at: new Date().toISOString()
      }).eq('id', bande_id)
    }
  }

  // Si c'est une vente d'un animal identifié, marquer l'état en 'vendu'
  if (type_operation === 'vente_sujets' && animal_id) {
    await supabase.from('animaux').update({
      etat_sante: 'vendu',
      updated_at: new Date().toISOString()
    }).eq('id', animal_id)
  }

  revalidatePath('/elevage/finances')
  revalidatePath('/elevage/bandes')
  revalidatePath('/elevage/animaux')
  revalidatePath('/dashboard')
  return { success: true }
}
