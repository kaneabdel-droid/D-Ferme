'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

export async function creerIntrant(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const code_article = (formData.get('code_article') as string) || null
  const nom = formData.get('nom') as string
  const categorie = formData.get('categorie') as string
  const raw_conditionnement = formData.get('conditionnement') as string
  const raw_unite = formData.get('unite') as string
  const conditionnement = raw_conditionnement || raw_unite || 'sachet'
  const unite = raw_unite || raw_conditionnement || 'sachet'
  const stock_actuel = parseFloat(formData.get('stock_actuel') as string || '0')
  const stock_minimum = parseFloat(formData.get('stock_minimum') as string || '5')
  const prix_unitaire_moyen = parseFloat(formData.get('prix_unitaire_moyen') as string || '0')
  const latence_jours_defaut = parseInt(formData.get('latence_jours_defaut') as string || '0', 10)

  if (!nom || !categorie) {
    return { error: 'Le nom et la catégorie sont obligatoires' }
  }

  const { data: newIntrant, error } = await supabase.from('intrants').insert({
    entreprise_id: tenant.entrepriseId,
    code_article,
    nom,
    categorie,
    conditionnement,
    unite,
    stock_actuel,
    stock_minimum,
    prix_unitaire_moyen,
    latence_jours_defaut
  }).select('id').single()

  if (error) return { error: error.message }

  // Enregistrer le coût du stock initial si renseigné
  if (stock_actuel > 0 && prix_unitaire_moyen > 0) {
    await supabase.from('finances_elevage').insert({
      entreprise_id: tenant.entrepriseId,
      intrant_id: newIntrant?.id || null,
      type_operation: 'achat_intrant',
      date_operation: new Date().toISOString().split('T')[0],
      montant_total: stock_actuel * prix_unitaire_moyen,
      quantite: stock_actuel,
      prix_unitaire: prix_unitaire_moyen,
      description: `Stock initial ${nom} (${stock_actuel} ${conditionnement || unite})`
    })
  }

  revalidatePath('/elevage/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function ajusterStock(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const intrant_id = formData.get('intrant_id') as string
  const type_mouvement = formData.get('type_mouvement') as 'entree' | 'sortie'
  const quantite = parseFloat(formData.get('quantite') as string || '0')
  const prix_unitaire = parseFloat(formData.get('prix_unitaire') as string || '0')
  const motif = formData.get('motif') as string || ''

  if (!intrant_id || quantite <= 0) {
    return { error: 'Paramètres invalides' }
  }

  const { data: item } = await supabase.from('intrants').select('stock_actuel, nom, unite').eq('id', intrant_id).single()
  if (!item) return { error: 'Article introuvable' }

  const nouveauStock = type_mouvement === 'entree' 
    ? item.stock_actuel + quantite 
    : Math.max(0, item.stock_actuel - quantite)

  const { error } = await supabase.from('intrants').update({
    stock_actuel: nouveauStock,
    updated_at: new Date().toISOString()
  }).eq('id', intrant_id)

  if (error) return { error: error.message }

  if (type_mouvement === 'entree' && prix_unitaire > 0) {
    await supabase.from('finances_elevage').insert({
      entreprise_id: tenant.entrepriseId,
      intrant_id,
      type_operation: 'achat_intrant',
      date_operation: new Date().toISOString().split('T')[0],
      montant_total: quantite * prix_unitaire,
      quantite,
      prix_unitaire,
      description: `Approvisionnement ${item.nom}: ${motif || 'Réapprovisionnement'}`
    })
  }

  revalidatePath('/elevage/stocks')
  return { success: true }
}

export async function enregistrerAchatArticles(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const tiers_nom = (formData.get('tiers_nom') as string) || 'Fournisseur'
  const date_operation = (formData.get('date_operation') as string) || new Date().toISOString().split('T')[0]
  const moyen_paiement = (formData.get('moyen_paiement') as string) || 'especes'
  const rawLignes = formData.get('lignes_articles') as string

  let lignes: Array<{ intrant_id: string; quantite: number; prix_unitaire: number; nom?: string }> = []
  try {
    lignes = JSON.parse(rawLignes || '[]')
  } catch {
    return { error: 'Format de la liste des articles invalide' }
  }

  if (!lignes || lignes.length === 0) {
    return { error: 'Veuillez ajouter au moins un article à la liste des achats' }
  }

  for (const l of lignes) {
    const qte = Number(l.quantite) || 0
    const prix = Number(l.prix_unitaire) || 0
    if (!l.intrant_id) {
      return { error: 'Veuillez sélectionner un article pour chaque ligne' }
    }
    if (qte <= 0) {
      return { error: 'La quantité doit être supérieure à 0' }
    }
    if (prix < 0) {
      return { error: 'Le prix unitaire ne peut pas être négatif' }
    }
  }

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
      intrant_id: l.intrant_id,
      type_operation: 'achat_intrant',
      date_operation,
      montant_total: montant,
      quantite: qte,
      prix_unitaire: prix,
      moyen_paiement,
      tiers_nom,
      description: `Achat ${qte} ${cond} de ${nomArticle} (${prix.toLocaleString('fr-FR')} FCFA/${cond})`
    })

    if (item) {
      const nouveauStock = (Number(item.stock_actuel) || 0) + qte
      const pmp = prix > 0 ? prix : (item.prix_unitaire_moyen || 0)

      await supabase.from('intrants').update({
        stock_actuel: nouveauStock,
        prix_unitaire_moyen: pmp,
        updated_at: new Date().toISOString()
      }).eq('id', item.id)
    }
  }

  revalidatePath('/elevage/stocks')
  revalidatePath('/elevage/finances')
  revalidatePath('/dashboard')
  return { success: true }
}
