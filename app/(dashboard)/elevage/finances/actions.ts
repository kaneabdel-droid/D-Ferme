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
  const raw_intrant_id = (formData.get('intrant_id') as string) || null
  const bande_id = isUuid(raw_bande_id) ? raw_bande_id : null
  const animal_id = isUuid(raw_animal_id) ? raw_animal_id : null
  const intrant_id = isUuid(raw_intrant_id) ? raw_intrant_id : null
  const date_operation = (formData.get('date_operation') as string) || new Date().toISOString().split('T')[0]
  const raw_quantite = parseFloat(formData.get('quantite') as string || '1')
  const quantite = isNaN(raw_quantite) || raw_quantite <= 0 ? 1 : raw_quantite
  const raw_prix = parseFloat(formData.get('prix_unitaire') as string || '0')
  const prix_unitaire = isNaN(raw_prix) ? 0 : raw_prix

  // Formule automatique : montant = quantité * prix si renseignés, sinon lire montant_total saisi
  const raw_montant = parseFloat(formData.get('montant_total') as string || '0')
  const montant_total = (quantite > 0 && prix_unitaire > 0) ? (quantite * prix_unitaire) : raw_montant

  const moyen_paiement = formData.get('moyen_paiement') as string || 'especes'
  const tiers_nom = (formData.get('tiers_nom') as string) || ''
  const description = (formData.get('description') as string) || ''
  const raw_lignes_articles = formData.get('lignes_articles') as string

  // Traitement d'un achat avec une liste d'articles
  if (type_operation === 'achat_intrant' && raw_lignes_articles) {
    let lignes: Array<{ intrant_id: string; quantite: number; prix_unitaire: number; nom?: string }> = []
    try {
      lignes = JSON.parse(raw_lignes_articles)
    } catch {
      lignes = []
    }

    if (lignes.length > 0) {
      for (const l of lignes) {
        const qte = Number(l.quantite) || 0
        const prix = Number(l.prix_unitaire) || 0
        const montant = qte * prix

        const { data: item } = await supabase
          .from('intrants')
          .select('id, nom, conditionnement, unite, stock_actuel, prix_unitaire_moyen')
          .eq('id', l.intrant_id)
          .single()

        const nomArticle = item?.nom || l.nom || 'Article'
        const cond = item?.conditionnement || item?.unite || 'sachet'

        await supabase.from('finances_elevage').insert({
          entreprise_id: tenant.entrepriseId,
          intrant_id: l.intrant_id || null,
          type_operation: 'achat_intrant',
          bande_id,
          animal_id,
          date_operation,
          montant_total: montant,
          quantite: qte,
          prix_unitaire: prix,
          moyen_paiement,
          tiers_nom,
          description: description || `Achat ${qte} ${cond} de ${nomArticle} (${prix.toLocaleString('fr-FR')} FCFA/${cond})`
        })

        if (item) {
          const nouveauStock = (Number(item.stock_actuel) || 0) + qte
          await supabase.from('intrants').update({
            stock_actuel: nouveauStock,
            prix_unitaire_moyen: prix > 0 ? prix : (item.prix_unitaire_moyen || 0),
            updated_at: new Date().toISOString()
          }).eq('id', item.id)
        }
      }

      revalidatePath('/elevage/finances')
      revalidatePath('/elevage/stocks')
      revalidatePath('/dashboard')
      return { success: true }
    }
  }

  if (!type_operation || montant_total <= 0) {
    return { error: 'Veuillez saisir un type d’opération et un montant valide (Quantité × Prix > 0)' }
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
    intrant_id,
    date_operation,
    montant_total,
    quantite,
    prix_unitaire: prix_unitaire > 0 ? prix_unitaire : (quantite > 0 ? montant_total / quantite : montant_total),
    moyen_paiement,
    tiers_nom,
    description
  })

  if (error) return { error: error.message }

  // Si c'est un achat d'intrant individuel, incrémenter le stock de l'article
  if (type_operation === 'achat_intrant' && intrant_id && quantite > 0) {
    const { data: item } = await supabase.from('intrants').select('stock_actuel, prix_unitaire_moyen').eq('id', intrant_id).single()
    if (item) {
      const nouveauStock = (Number(item.stock_actuel) || 0) + quantite
      await supabase.from('intrants').update({
        stock_actuel: nouveauStock,
        prix_unitaire_moyen: prix_unitaire > 0 ? prix_unitaire : (item.prix_unitaire_moyen || 0),
        updated_at: new Date().toISOString()
      }).eq('id', intrant_id)
    }
  }

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
  revalidatePath('/elevage/stocks')
  revalidatePath('/elevage/bandes')
  revalidatePath('/elevage/animaux')
  revalidatePath('/dashboard')
  return { success: true }
}
