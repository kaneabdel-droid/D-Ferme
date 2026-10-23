'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

export async function getEcritures(journal?: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { ecritures: [], error: 'Non authentifié' }

  const supabase = await createClient()

  let query = supabase
    .from('ecritures_comptables')
    .select(`
      id,
      journal,
      date_ecriture,
      numero_piece,
      libelle,
      validee,
      created_at,
      lignes_ecritures_comptables (
        id,
        compte,
        libelle,
        debit,
        credit
      )
    `)
    .eq('entreprise_id', tenant.entrepriseId)
    .order('date_ecriture', { ascending: false })
    .order('created_at', { ascending: false })

  if (journal && journal !== 'tous') {
    query = query.eq('journal', journal)
  }

  const { data, error } = await query
  return { ecritures: data || [], error: error?.message }
}

export async function getPlanComptable() {
  const tenant = await getTenantContext()
  if (!tenant) return { plan: [], error: 'Non authentifié' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plan_comptable_ferme')
    .select('*')
    .or(`entreprise_id.is.null,entreprise_id.eq.${tenant.entrepriseId}`)
    .eq('actif', true)
    .order('compte', { ascending: true })

  return { plan: data || [], error: error?.message }
}

export async function creerEcriture(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const journal = (formData.get('journal') as string) || 'ventes'
  const date_ecriture = (formData.get('date_ecriture') as string) || new Date().toISOString().split('T')[0]
  const numero_piece = (formData.get('numero_piece') as string) || null
  const libelle = (formData.get('libelle') as string)?.trim()
  const lignesRaw = formData.get('lignes') as string

  if (!libelle) return { error: 'Le libellé de l’opération est requis' }
  if (!lignesRaw) return { error: 'Les lignes d’écriture sont requises' }

  let lignes: Array<{ compte: string; libelle?: string; debit: number; credit: number }> = []
  try {
    lignes = JSON.parse(lignesRaw)
  } catch {
    return { error: 'Format des lignes d’écriture invalide' }
  }

  if (lignes.length < 2) {
    return { error: 'Une écriture comptable en partie double doit comporter au moins 2 lignes' }
  }

  // Vérification de l'équilibre Débit = Crédit
  const totalDebit = lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0)

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return { error: `Déséquilibre : Total Débit (${totalDebit.toLocaleString()} FCFA) ≠ Total Crédit (${totalCredit.toLocaleString()} FCFA)` }
  }

  // 1. Insérer l'écriture principale
  const { data: ecriture, error: ecritureError } = await supabase
    .from('ecritures_comptables')
    .insert({
      entreprise_id: tenant.entrepriseId,
      journal,
      date_ecriture,
      numero_piece,
      libelle,
      validee: true
    })
    .select('id')
    .single()

  if (ecritureError || !ecriture) {
    return { error: ecritureError?.message || 'Erreur lors de la création de la pièce comptable' }
  }

  // 2. Insérer les lignes
  const lignesToInsert = lignes.map((l) => ({
    ecriture_id: ecriture.id,
    entreprise_id: tenant.entrepriseId,
    compte: l.compte,
    libelle: l.libelle || libelle,
    debit: Number(l.debit) || 0,
    credit: Number(l.credit) || 0
  }))

  const { error: lignesError } = await supabase
    .from('lignes_ecritures_comptables')
    .insert(lignesToInsert)

  if (lignesError) {
    return { error: lignesError.message }
  }

  revalidatePath('/comptabilite')
  revalidatePath('/comptabilite/balance')
  revalidatePath('/comptabilite/resultat')
  revalidatePath('/comptabilite/bilan')
  return { success: true, id: ecriture.id }
}

export async function ajouterComptePlan(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const compte = (formData.get('compte') as string)?.trim()
  const libelle = (formData.get('libelle') as string)?.trim()
  const classe = parseInt((formData.get('classe') as string) || '6', 10)
  const type = (formData.get('type') as string) || 'charge'

  if (!compte || !libelle) {
    return { error: 'N° de compte et libellé obligatoires' }
  }

  const { error } = await supabase.from('plan_comptable_ferme').insert({
    entreprise_id: tenant.entrepriseId,
    compte,
    libelle,
    classe,
    type,
    actif: true
  })

  if (error) return { error: error.message }

  revalidatePath('/comptabilite/plan-comptable')
  return { success: true }
}

export async function getBalance() {
  const tenant = await getTenantContext()
  if (!tenant) return { balance: [], totaux: null, error: 'Non authentifié' }

  const supabase = await createClient()

  const [{ data: lignes, error }, { plan }] = await Promise.all([
    supabase
      .from('lignes_ecritures_comptables')
      .select('compte, debit, credit')
      .eq('entreprise_id', tenant.entrepriseId),
    getPlanComptable()
  ])

  if (error) return { balance: [], totaux: null, error: error.message }

  const mapPlan = new Map((plan || []).map((p: any) => [p.compte, p.libelle]))

  // Agréger par compte
  const statsParCompte: Record<string, { compte: string; libelle: string; debit: number; credit: number }> = {}

  for (const l of lignes || []) {
    if (!statsParCompte[l.compte]) {
      statsParCompte[l.compte] = {
        compte: l.compte,
        libelle: mapPlan.get(l.compte) || `Compte ${l.compte}`,
        debit: 0,
        credit: 0
      }
    }
    statsParCompte[l.compte].debit += Number(l.debit) || 0
    statsParCompte[l.compte].credit += Number(l.credit) || 0
  }

  const balance = Object.values(statsParCompte)
    .sort((a, b) => a.compte.localeCompare(b.compte))
    .map((item) => {
      const solde = item.debit - item.credit
      return {
        ...item,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0
      }
    })

  const totaux = balance.reduce(
    (acc, b) => {
      acc.debit += b.debit
      acc.credit += b.credit
      acc.soldeDebiteur += b.soldeDebiteur
      acc.soldeCrediteur += b.soldeCrediteur
      return acc
    },
    { debit: 0, credit: 0, soldeDebiteur: 0, soldeCrediteur: 0 }
  )

  return { balance, totaux, error: null }
}

export async function getResultat() {
  const tenant = await getTenantContext()
  if (!tenant) return {
    produits: [],
    charges: [],
    totalProduits: 0,
    totalCharges: 0,
    margeBrute: 0,
    resultatNet: 0
  }

  const { balance } = await getBalance()

  // Charges : Classe 6
  const charges = balance.filter((b) => b.compte.startsWith('6'))
  const totalCharges = charges.reduce((acc, c) => acc + (c.soldeDebiteur - c.soldeCrediteur), 0)

  // Produits : Classe 7
  const produits = balance.filter((b) => b.compte.startsWith('7'))
  const totalProduits = produits.reduce((acc, p) => acc + (p.soldeCrediteur - p.soldeDebiteur), 0)

  // Achats d'animaux & intrants (601, 602, 604, 608)
  const achatsAppro = charges
    .filter((c) => ['601', '602', '604', '608'].includes(c.compte))
    .reduce((acc, c) => acc + (c.soldeDebiteur - c.soldeCrediteur), 0)

  const margeBrute = totalProduits - achatsAppro
  const resultatNet = totalProduits - totalCharges

  return {
    produits,
    charges,
    totalProduits,
    totalCharges,
    achatsAppro,
    margeBrute,
    resultatNet
  }
}

export async function getBilan() {
  const tenant = await getTenantContext()
  if (!tenant) return {
    actif: { immobilise: [], circulant: [], tresorerie: [], total: 0 },
    passif: { capitaux: [], dettes: [], total: 0 },
    equilibre: true
  }

  const { balance } = await getBalance()
  const { resultatNet } = await getResultat()

  // Actif Immobilisé : Classe 2
  const immobilise = balance
    .filter((b) => b.compte.startsWith('2'))
    .map((b) => ({ compte: b.compte, libelle: b.libelle, montant: b.soldeDebiteur - b.soldeCrediteur }))

  // Actif Circulant : Classe 3 (Stocks) + 411 (Clients)
  const circulant = balance
    .filter((b) => b.compte.startsWith('3') || b.compte.startsWith('41'))
    .map((b) => ({ compte: b.compte, libelle: b.libelle, montant: b.soldeDebiteur - b.soldeCrediteur }))

  // Trésorerie Actif : Classe 5 (521 Banque, 531 Caisse, 571 Mobile)
  const tresorerie = balance
    .filter((b) => b.compte.startsWith('5'))
    .map((b) => ({ compte: b.compte, libelle: b.libelle, montant: b.soldeDebiteur - b.soldeCrediteur }))

  const totalActif = 
    immobilise.reduce((s, i) => s + i.montant, 0) +
    circulant.reduce((s, c) => s + c.montant, 0) +
    tresorerie.reduce((s, t) => s + t.montant, 0)

  // Passif Capitaux : Classe 1 (101 Capital) + Résultat Net
  const capitaux = balance
    .filter((b) => b.compte.startsWith('10'))
    .map((b) => ({ compte: b.compte, libelle: b.libelle, montant: b.soldeCrediteur - b.soldeDebiteur }))

  if (resultatNet !== 0) {
    capitaux.push({
      compte: '12',
      libelle: resultatNet >= 0 ? 'Résultat net d’exercice (Bénéfice)' : 'Résultat net d’exercice (Perte)',
      montant: resultatNet
    })
  }

  // Passif Dettes : Emprunts (16) + Fournisseurs (401) + Tiers/Personnel (42, 43, 44)
  const dettes = balance
    .filter((b) => b.compte.startsWith('16') || b.compte.startsWith('40') || b.compte.startsWith('42') || b.compte.startsWith('43') || b.compte.startsWith('44'))
    .map((b) => ({ compte: b.compte, libelle: b.libelle, montant: b.soldeCrediteur - b.soldeDebiteur }))

  const totalPassif =
    capitaux.reduce((s, c) => s + c.montant, 0) +
    dettes.reduce((s, d) => s + d.montant, 0)

  return {
    actif: {
      immobilise,
      circulant,
      tresorerie,
      total: totalActif
    },
    passif: {
      capitaux,
      dettes,
      total: totalPassif
    },
    equilibre: Math.abs(totalActif - totalPassif) < 0.01
  }
}
