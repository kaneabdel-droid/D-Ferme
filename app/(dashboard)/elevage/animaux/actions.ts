'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

export async function creerAnimal(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const numero_boucle = formData.get('numero_boucle') as string
  const nom_ou_surnom = (formData.get('nom_ou_surnom') as string) || null
  const espece_code = formData.get('espece_code') as string
  const race = (formData.get('race') as string) || null
  const batiment_id = (formData.get('batiment_id') as string) || null
  const sexe = formData.get('sexe') as 'M' | 'F'
  const date_naissance = (formData.get('date_naissance') as string) || null
  const date_entree = (formData.get('date_entree') as string) || new Date().toISOString().split('T')[0]
  const origine = (formData.get('origine') as string) || 'ne_sur_ferme'
  const pere_boucle = (formData.get('pere_boucle') as string) || null
  const mere_boucle = (formData.get('mere_boucle') as string) || null
  const poids_actuel_kg = parseFloat((formData.get('poids_actuel_kg') as string) || '0')
  const en_lactation = formData.get('en_lactation') === 'on'
  const cout_achat = parseFloat((formData.get('cout_achat') as string) || '0')

  if (!numero_boucle || !espece_code || !sexe) {
    return { error: 'Le numéro de boucle, l’espèce et le sexe sont obligatoires' }
  }

  const { error } = await supabase.from('animaux').insert({
    entreprise_id: tenant.entrepriseId,
    numero_boucle,
    nom_ou_surnom,
    espece_code,
    race,
    batiment_id,
    sexe,
    date_naissance,
    date_entree,
    origine,
    pere_boucle,
    mere_boucle,
    poids_actuel_kg: poids_actuel_kg > 0 ? poids_actuel_kg : null,
    en_lactation,
    etat_sante: 'sain'
  })

  if (error) return { error: error.message }

  if (cout_achat > 0) {
    await supabase.from('finances_elevage').insert({
      entreprise_id: tenant.entrepriseId,
      type_operation: 'achat_animaux',
      date_operation: date_entree,
      montant_total: cout_achat,
      quantite: 1,
      prix_unitaire: cout_achat,
      description: `Achat sujet boucle ${numero_boucle}`
    })
  }

  revalidatePath('/elevage/animaux')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function modifierAnimal(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const id = formData.get('id') as string
  if (!id) return { error: 'ID animal manquant' }

  const numero_boucle = formData.get('numero_boucle') as string
  const nom_ou_surnom = (formData.get('nom_ou_surnom') as string) || null
  const espece_code = formData.get('espece_code') as string
  const race = (formData.get('race') as string) || null
  const batiment_id = (formData.get('batiment_id') as string) || null
  const sexe = formData.get('sexe') as 'M' | 'F'
  const date_naissance = (formData.get('date_naissance') as string) || null
  const poids_actuel_kg = parseFloat((formData.get('poids_actuel_kg') as string) || '0')
  const en_lactation = formData.get('en_lactation') === 'on'
  const etat_sante = (formData.get('etat_sante') as string) || 'sain'
  const pere_boucle = (formData.get('pere_boucle') as string) || null
  const mere_boucle = (formData.get('mere_boucle') as string) || null

  const { error } = await supabase
    .from('animaux')
    .update({
      numero_boucle,
      nom_ou_surnom,
      espece_code,
      race,
      batiment_id,
      sexe,
      date_naissance,
      poids_actuel_kg: poids_actuel_kg > 0 ? poids_actuel_kg : null,
      en_lactation,
      etat_sante,
      pere_boucle,
      mere_boucle,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) return { error: error.message }

  revalidatePath(`/elevage/animaux/${id}`)
  revalidatePath('/elevage/animaux')
  return { success: true }
}

export async function ajouterSoinAnimal(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const animal_id = formData.get('animal_id') as string
  const intrant_id = formData.get('intrant_id') as string
  const date_administration = (formData.get('date_administration') as string) || new Date().toISOString().split('T')[0]
  const quantite_administree = parseFloat((formData.get('quantite_administree') as string) || '1')
  const dose_par_sujet = (formData.get('dose_par_sujet') as string) || null
  const motif = (formData.get('motif') as string) || 'antibiotique_curatif'
  const duree_latence_jours = parseInt((formData.get('duree_latence_jours') as string) || '0', 10)
  const administre_par = (formData.get('administre_par') as string) || null
  const notes = (formData.get('notes') as string) || null

  if (!animal_id || !intrant_id) {
    return { error: 'Animal et médicament/vaccin obligatoires' }
  }

  // Calcul date fin de latence
  const d = new Date(date_administration)
  d.setDate(d.getDate() + (duree_latence_jours || 0))
  const date_fin_latence = d.toISOString().split('T')[0]

  const { error: traitError } = await supabase.from('traitements_medicaux').insert({
    entreprise_id: tenant.entrepriseId,
    animal_id,
    intrant_id,
    date_administration,
    quantite_administree,
    dose_par_sujet,
    motif,
    duree_latence_jours,
    date_fin_latence,
    administre_par,
    notes
  })

  if (traitError) return { error: traitError.message }

  // Mettre à jour l'animal
  const aujourdhui = new Date().toISOString().split('T')[0]
  const estEnLatence = duree_latence_jours > 0 && date_fin_latence >= aujourdhui
  const nouvelEtat = estEnLatence ? 'en_latence' : 'en_soins'

  await supabase
    .from('animaux')
    .update({
      etat_sante: nouvelEtat,
      date_fin_latence: duree_latence_jours > 0 ? date_fin_latence : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', animal_id)
    .eq('entreprise_id', tenant.entrepriseId)

  // Décrémenter stock intrant si possible
  const { data: intrant } = await supabase.from('intrants').select('stock_actuel').eq('id', intrant_id).single()
  if (intrant && intrant.stock_actuel > 0) {
    const nouveauStock = Math.max(0, Number(intrant.stock_actuel) - quantite_administree)
    await supabase.from('intrants').update({ stock_actuel: nouveauStock }).eq('id', intrant_id)
  }

  revalidatePath(`/elevage/animaux/${animal_id}`)
  revalidatePath('/elevage/animaux')
  revalidatePath('/elevage/sanitaire')
  return { success: true }
}

export async function ajouterSuiviAnimal(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const animal_id = formData.get('animal_id') as string
  const date_suivi = (formData.get('date_suivi') as string) || new Date().toISOString().split('T')[0]
  const poids_kg = parseFloat((formData.get('poids_moyen_mesure_kg') as string) || '0')
  const lait_litres = parseFloat((formData.get('lait_recolte_litres') as string) || '0')
  const observations = (formData.get('observations') as string) || null

  if (!animal_id) return { error: 'ID animal manquant' }

  const { error } = await supabase.from('suivi_quotidien').insert({
    entreprise_id: tenant.entrepriseId,
    animal_id,
    date_suivi,
    poids_moyen_mesure_kg: poids_kg > 0 ? poids_kg : null,
    lait_recolte_litres: lait_litres > 0 ? lait_litres : 0,
    observations
  })

  if (error) return { error: error.message }

  // Mettre à jour le poids actuel de l'animal si renseigné
  if (poids_kg > 0) {
    await supabase
      .from('animaux')
      .update({
        poids_actuel_kg: poids_kg,
        updated_at: new Date().toISOString()
      })
      .eq('id', animal_id)
      .eq('entreprise_id', tenant.entrepriseId)
  }

  revalidatePath(`/elevage/animaux/${animal_id}`)
  revalidatePath('/elevage/animaux')
  return { success: true }
}
