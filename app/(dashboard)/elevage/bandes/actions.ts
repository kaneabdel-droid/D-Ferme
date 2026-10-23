'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

import { isUuid } from '@/lib/uuid'

export async function creerBande(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const code_bande = formData.get('code_bande') as string
  const espece_code = formData.get('espece_code') as string
  const raw_batiment_id = formData.get('batiment_id') as string || null
  const batiment_id = isUuid(raw_batiment_id) ? raw_batiment_id : null
  const date_entree = formData.get('date_entree') as string || new Date().toISOString().split('T')[0]
  const effectif_initial = parseInt(formData.get('effectif_initial') as string, 10)
  const poids_moyen_initial_kg = parseFloat(formData.get('poids_moyen_initial_kg') as string || '0.040')
  const cout_achat_sujet = parseFloat(formData.get('cout_achat_sujet') as string || '0')
  const notes = formData.get('notes') as string || ''

  if (!code_bande || !espece_code || isNaN(effectif_initial) || effectif_initial <= 0) {
    return { error: 'Champs obligatoires manquants ou invalides' }
  }

  const { error } = await supabase.from('bandes').insert({
    entreprise_id: tenant.entrepriseId,
    code_bande,
    espece_code,
    batiment_id,
    date_entree,
    effectif_initial,
    effectif_actuel: effectif_initial,
    poids_moyen_initial_kg,
    poids_moyen_actuel_kg: poids_moyen_initial_kg,
    cout_achat_sujet,
    notes,
    statut: 'en_cours'
  })

  if (error) {
    return { error: error.message }
  }

  // Si un coût d'achat par sujet est renseigné, créer l'opération de charge financière
  if (cout_achat_sujet > 0) {
    const montant_total = cout_achat_sujet * effectif_initial
    await supabase.from('finances_elevage').insert({
      entreprise_id: tenant.entrepriseId,
      type_operation: 'achat_animaux',
      date_operation: date_entree,
      montant_total,
      quantite: effectif_initial,
      prix_unitaire: cout_achat_sujet,
      description: `Achat bande ${code_bande} (${effectif_initial} sujets)`
    })
  }

  revalidatePath('/elevage/bandes')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function cloturerBande(bandeId: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('bandes')
    .update({
      statut: 'cloturee',
      date_cloture: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .eq('id', bandeId)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) return { error: error.message }

  revalidatePath('/elevage/bandes')
  revalidatePath('/dashboard')
  return { success: true }
}
