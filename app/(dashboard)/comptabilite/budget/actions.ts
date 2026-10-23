'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'

export interface LigneBudgetCalcul {
  id: string
  budget_id: string
  type_flux: 'charge' | 'produit' | 'investissement'
  categorie: string
  compte_syscohada: string | null
  libelle: string
  montant_prevu: number
  montant_realise: number
  ecart: number
  taux_realisation: number
  statut_alerte: 'conforme' | 'vigilance' | 'depassement' | 'atteint' | 'en_cours' | 'retard'
  notes: string | null
}

export interface BudgetAvecDetails {
  id: string
  titre: string
  exercice: number
  periode_type: string
  date_debut: string
  date_fin: string
  atelier: string
  statut: string
  description: string | null
  created_at: string
  lignes: LigneBudgetCalcul[]
  totaux: {
    charges_prevues: number
    charges_realisees: number
    taux_charges: number
    produits_prevus: number
    produits_realises: number
    taux_produits: number
    marge_prevue: number
    marge_realisee: number
    ecart_marge: number
    investissements_prevus: number
    investissements_realises: number
  }
}

export async function getBudgets(exerciceSelectionne?: number) {
  const tenant = await getTenantContext()
  if (!tenant) return { budgets: [], error: 'Non authentifié' }

  const supabase = await createClient()

  let query = supabase
    .from('budgets_ferme')
    .select('*')
    .eq('entreprise_id', tenant.entrepriseId)
    .order('exercice', { ascending: false })
    .order('date_debut', { ascending: false })

  if (exerciceSelectionne) {
    query = query.eq('exercice', exerciceSelectionne)
  }

  const { data, error } = await query

  return { budgets: data || [], error: error?.message }
}

export async function getBudgetComplet(budgetId: string): Promise<{ budget: BudgetAvecDetails | null; error?: string }> {
  const tenant = await getTenantContext()
  if (!tenant) return { budget: null, error: 'Non authentifié' }

  const supabase = await createClient()

  // 1. Récupérer le budget
  const { data: bData, error: bError } = await supabase
    .from('budgets_ferme')
    .select('*')
    .eq('id', budgetId)
    .eq('entreprise_id', tenant.entrepriseId)
    .maybeSingle()

  if (bError || !bData) {
    return { budget: null, error: bError?.message || 'Budget introuvable' }
  }

  // 2. Récupérer les lignes de prévision budgétaire
  const { data: lignesData, error: lError } = await supabase
    .from('lignes_budget_ferme')
    .select('*')
    .eq('budget_id', budgetId)
    .eq('entreprise_id', tenant.entrepriseId)
    .order('type_flux', { ascending: true })
    .order('categorie', { ascending: true })

  if (lError) {
    return { budget: null, error: lError.message }
  }

  const dateDebut = bData.date_debut
  const dateFin = bData.date_fin

  // 3. Récupérer les écritures comptables réelles sur la période
  const { data: lignesEcritures } = await supabase
    .from('lignes_ecritures_comptables')
    .select(`
      compte,
      debit,
      credit,
      ecritures_comptables!inner (
        date_ecriture,
        validee
      )
    `)
    .eq('entreprise_id', tenant.entrepriseId)
    .gte('ecritures_comptables.date_ecriture', dateDebut)
    .lte('ecritures_comptables.date_ecriture', dateFin)

  // 4. Récupérer également les opérations d'exploitation si les écritures ne sont pas encore passées
  const [{ data: opsElevage }, { data: ventesVeg }] = await Promise.all([
    supabase
      .from('finances_elevage')
      .select('type_operation, montant_total, date_operation')
      .eq('entreprise_id', tenant.entrepriseId)
      .gte('date_operation', dateDebut)
      .lte('date_operation', dateFin),
    supabase
      .from('ventes_vegetales')
      .select('montant_total, date_vente')
      .eq('entreprise_id', tenant.entrepriseId)
      .gte('date_vente', dateDebut)
      .lte('date_vente', dateFin),
  ])

  // Associer et calculer les réalisations pour chaque ligne
  const lignesCalculees: LigneBudgetCalcul[] = (lignesData || []).map((ligne) => {
    let realise = 0
    const prevu = Number(ligne.montant_prevu) || 0
    const typeFlux = ligne.type_flux as 'charge' | 'produit' | 'investissement'
    const compte = ligne.compte_syscohada ? String(ligne.compte_syscohada).trim() : null
    const cat = (ligne.categorie || '').toLowerCase()

    // 1. Calcul depuis la comptabilité générale (prioritaire si disponible)
    if (lignesEcritures && lignesEcritures.length > 0) {
      lignesEcritures.forEach((le: any) => {
        const c = String(le.compte || '').trim()
        const deb = Number(le.debit) || 0
        const cred = Number(le.credit) || 0

        // Correspondance de compte
        const matchExact = compte && c === compte
        const matchPrefix = compte && c.startsWith(compte)
        const matchType =
          typeFlux === 'charge' && c.startsWith('6') && (!compte || matchPrefix)
          ? matchPrefix
          : typeFlux === 'produit' && c.startsWith('7') && (!compte || matchPrefix)
          ? matchPrefix
          : typeFlux === 'investissement' && c.startsWith('2') && (!compte || matchPrefix)
          ? matchPrefix
          : false

        if (matchExact || matchType) {
          if (typeFlux === 'charge' || typeFlux === 'investissement') {
            realise += (deb - cred)
          } else {
            realise += (cred - deb)
          }
        }
      })
    }

    // 2. Si aucune écriture comptable sur ce poste, regarder les opérations opérationnelles d'élevage/végétal
    if (realise === 0) {
      if (typeFlux === 'charge' && opsElevage) {
        opsElevage.forEach((op: any) => {
          const typeOp = (op.type_operation || '').toLowerCase()
          const mont = Number(op.montant_total) || 0
          if (
            (cat.includes('aliment') && typeOp.includes('aliment')) ||
            (cat.includes('soin') && (typeOp.includes('soin') || typeOp.includes('medicament') || typeOp.includes('vaccin'))) ||
            (cat.includes('achat') && (typeOp.includes('achat') || typeOp.includes('poussin') || typeOp.includes('sujet'))) ||
            (cat.includes('salaire') && typeOp.includes('salaire')) ||
            (cat.includes('carburant') && (typeOp.includes('carburant') || typeOp.includes('energie'))) ||
            (!typeOp.startsWith('vente') && cat === 'autre')
          ) {
            realise += mont
          }
        })
      } else if (typeFlux === 'produit') {
        if (opsElevage) {
          opsElevage.forEach((op: any) => {
            const typeOp = (op.type_operation || '').toLowerCase()
            const mont = Number(op.montant_total) || 0
            if (
              (cat.includes('vente') && typeOp.startsWith('vente')) ||
              (cat.includes('oeuf') && typeOp.includes('oeuf')) ||
              (cat.includes('lait') && typeOp.includes('lait')) ||
              (cat.includes('animal') && (typeOp.includes('sujet') || typeOp.includes('bovin') || typeOp.includes('volaille')))
            ) {
              realise += mont
            }
          })
        }
        if (ventesVeg && (cat.includes('vegetal') || cat.includes('recolte') || cat.includes('maraichere'))) {
          ventesVeg.forEach((v: any) => {
            realise += Number(v.montant_total) || 0
          })
        }
      }
    }

    realise = Math.max(0, Math.round(realise))

    const ecart = typeFlux === 'charge' ? realise - prevu : realise - prevu
    const taux = prevu > 0 ? Math.round((realise / prevu) * 100) : (realise > 0 ? 100 : 0)

    let alerte: LigneBudgetCalcul['statut_alerte'] = 'conforme'
    if (typeFlux === 'charge') {
      if (taux > 100) alerte = 'depassement'
      else if (taux >= 85) alerte = 'vigilance'
      else alerte = 'conforme'
    } else {
      if (taux >= 100) alerte = 'atteint'
      else if (taux >= 70) alerte = 'en_cours'
      else alerte = 'retard'
    }

    return {
      id: ligne.id,
      budget_id: ligne.budget_id,
      type_flux: typeFlux,
      categorie: ligne.categorie,
      compte_syscohada: ligne.compte_syscohada,
      libelle: ligne.libelle,
      montant_prevu: prevu,
      montant_realise: realise,
      ecart,
      taux_realisation: taux,
      statut_alerte: alerte,
      notes: ligne.notes,
    }
  })

  // 4. Totaux d'agrégation
  let chargesPrev = 0
  let chargesReal = 0
  let prodPrev = 0
  let prodReal = 0
  let invPrev = 0
  let invReal = 0

  lignesCalculees.forEach((l) => {
    if (l.type_flux === 'charge') {
      chargesPrev += l.montant_prevu
      chargesReal += l.montant_realise
    } else if (l.type_flux === 'produit') {
      prodPrev += l.montant_prevu
      prodReal += l.montant_realise
    } else if (l.type_flux === 'investissement') {
      invPrev += l.montant_prevu
      invReal += l.montant_realise
    }
  })

  const margePrev = prodPrev - chargesPrev
  const margeReal = prodReal - chargesReal

  const budgetComplet: BudgetAvecDetails = {
    ...bData,
    lignes: lignesCalculees,
    totaux: {
      charges_prevues: chargesPrev,
      charges_realisees: chargesReal,
      taux_charges: chargesPrev > 0 ? Math.round((chargesReal / chargesPrev) * 100) : 0,
      produits_prevus: prodPrev,
      produits_realises: prodReal,
      taux_produits: prodPrev > 0 ? Math.round((prodReal / prodPrev) * 100) : 0,
      marge_prevue: margePrev,
      marge_realisee: margeReal,
      ecart_marge: margeReal - margePrev,
      investissements_prevus: invPrev,
      investissements_realises: invReal,
    },
  }

  return { budget: budgetComplet }
}

export async function creerBudget(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  // Vérification de souscription: au moins Médium
  if (tenant.subscriptionTier === 'standard') {
    return { error: 'Le module Suivi Budgétaire nécessite au minimum le forfait Médium.' }
  }

  const supabase = await createClient()

  const titre = (formData.get('titre') as string)?.trim()
  const exercice = Number(formData.get('exercice')) || new Date().getFullYear()
  const periode_type = (formData.get('periode_type') as string) || 'annuel'
  const date_debut = formData.get('date_debut') as string
  const date_fin = formData.get('date_fin') as string
  const atelier = (formData.get('atelier') as string) || 'global'
  const description = (formData.get('description') as string)?.trim() || null
  const inclureTemplate = formData.get('inclure_template_agricole') === 'true'

  if (!titre || !date_debut || !date_fin) {
    return { error: 'Veuillez renseigner un titre et des dates de début et de fin valides.' }
  }

  if (new Date(date_fin) < new Date(date_debut)) {
    return { error: 'La date de fin ne peut pas être antérieure à la date de début.' }
  }

  const { data: bData, error: bError } = await supabase
    .from('budgets_ferme')
    .insert({
      entreprise_id: tenant.entrepriseId,
      titre,
      exercice,
      periode_type,
      date_debut,
      date_fin,
      atelier,
      description,
      statut: 'en_cours',
      created_by: tenant.userId,
    })
    .select('id')
    .single()

  if (bError || !bData) {
    return { error: bError?.message || 'Erreur lors de la création du budget.' }
  }

  // Pré-remplissage avec modèle standard d'exploitation agro-pastorale si demandé
  if (inclureTemplate) {
    const lignesStandard = [
      // Charges prévisionnelles
      { type_flux: 'charge', categorie: 'aliments', compte_syscohada: '602', libelle: 'Aliments bétail, provendes & tourteaux', montant_prevu: 2500000 },
      { type_flux: 'charge', categorie: 'soins_veterinaires', compte_syscohada: '608', libelle: 'Soins vétérinaires, vaccins & produits sanitaires', montant_prevu: 450000 },
      { type_flux: 'charge', categorie: 'achats_animaux', compte_syscohada: '601', libelle: 'Achat de reproducteurs / poussins d’un jour', montant_prevu: 1200000 },
      { type_flux: 'charge', categorie: 'semences_engrais', compte_syscohada: '604', libelle: 'Semences certifiées, engrais minéraux & bio', montant_prevu: 800000 },
      { type_flux: 'charge', categorie: 'carburant_energie', compte_syscohada: '605', libelle: 'Carburant tracteurs, électricité & eau d’irrigation', montant_prevu: 650000 },
      { type_flux: 'charge', categorie: 'main_oeuvre', compte_syscohada: '631', libelle: 'Rémunérations ouvriers agricoles & bergers', montant_prevu: 1800000 },
      { type_flux: 'charge', categorie: 'transport_logistique', compte_syscohada: '624', libelle: 'Transports d’animaux & acheminement intrants', montant_prevu: 300000 },

      // Produits prévisionnels
      { type_flux: 'produit', categorie: 'ventes_animaux', compte_syscohada: '701', libelle: 'Ventes d’animaux vifs (volailles, ovins, bovins)', montant_prevu: 6500000 },
      { type_flux: 'produit', categorie: 'ventes_lait', compte_syscohada: '702', libelle: 'Ventes de lait frais & caillé', montant_prevu: 1500000 },
      { type_flux: 'produit', categorie: 'ventes_oeufs', compte_syscohada: '703', libelle: 'Ventes d’œufs de table', montant_prevu: 1200000 },
      { type_flux: 'produit', categorie: 'ventes_recoltes', compte_syscohada: '704', libelle: 'Ventes de récoltes maraîchères & céréalières', montant_prevu: 2500000 },
    ]

    const insertLignes = lignesStandard.map((l) => ({
      budget_id: bData.id,
      entreprise_id: tenant.entrepriseId,
      type_flux: l.type_flux,
      categorie: l.categorie,
      compte_syscohada: l.compte_syscohada,
      libelle: l.libelle,
      montant_prevu: l.montant_prevu,
    }))

    await supabase.from('lignes_budget_ferme').insert(insertLignes)
  }

  revalidatePath('/comptabilite/budget')
  revalidatePath(`/comptabilite/budget/${bData.id}`)
  return { success: true, budgetId: bData.id }
}

export async function ajouterLigneBudget(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  if (tenant.subscriptionTier === 'standard') {
    return { error: 'Le module Suivi Budgétaire nécessite le forfait Médium ou supérieur.' }
  }

  const supabase = await createClient()

  const budget_id = formData.get('budget_id') as string
  const type_flux = (formData.get('type_flux') as string) || 'charge'
  const categorie = (formData.get('categorie') as string)?.trim() || 'autre'
  const compte_syscohada = (formData.get('compte_syscohada') as string)?.trim() || null
  const libelle = (formData.get('libelle') as string)?.trim()
  const montant_prevu = Number(formData.get('montant_prevu')) || 0
  const notes = (formData.get('notes') as string)?.trim() || null

  if (!budget_id || !libelle || montant_prevu <= 0) {
    return { error: 'Veuillez saisir un libellé et un montant prévisionnel valide supérieur à 0.' }
  }

  const { error } = await supabase.from('lignes_budget_ferme').insert({
    budget_id,
    entreprise_id: tenant.entrepriseId,
    type_flux,
    categorie,
    compte_syscohada,
    libelle,
    montant_prevu,
    notes,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/comptabilite/budget')
  revalidatePath(`/comptabilite/budget/${budget_id}`)
  return { success: true }
}

export async function supprimerLigneBudget(ligneId: string, budgetId: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('lignes_budget_ferme')
    .delete()
    .eq('id', ligneId)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/comptabilite/budget/${budgetId}`)
  return { success: true }
}

export async function modifierStatutBudget(budgetId: string, statut: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('budgets_ferme')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', budgetId)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/comptabilite/budget')
  revalidatePath(`/comptabilite/budget/${budgetId}`)
  return { success: true }
}

export async function supprimerBudget(budgetId: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('budgets_ferme')
    .delete()
    .eq('id', budgetId)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/comptabilite/budget')
  return { success: true }
}
