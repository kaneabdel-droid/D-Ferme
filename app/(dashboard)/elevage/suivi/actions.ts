'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

import { isUuid } from '@/lib/uuid'

export async function enregistrerSuiviQuotidien(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const raw_bande_id = (formData.get('bande_id') as string) || null
  const raw_animal_id = (formData.get('animal_id') as string) || null
  const bande_id = isUuid(raw_bande_id) ? raw_bande_id : null
  const animal_id = isUuid(raw_animal_id) ? raw_animal_id : null
  const date_suivi = (formData.get('date_suivi') as string) || new Date().toISOString().split('T')[0]
  const mortalites = parseInt(formData.get('mortalites') as string || '0', 10)
  const cause_mortalite = (formData.get('cause_mortalite') as string) || null
  const raw_aliment_intrant_id = (formData.get('aliment_intrant_id') as string) || null
  const aliment_intrant_id = isUuid(raw_aliment_intrant_id) ? raw_aliment_intrant_id : null
  const aliment_quantite_kg = parseFloat(formData.get('aliment_quantite_kg') as string || '0')
  const oeufs_recoltes = parseInt(formData.get('oeufs_recoltes') as string || '0', 10)
  const oeufs_casses = parseInt(formData.get('oeufs_casses') as string || '0', 10)
  const lait_recolte_litres = parseFloat(formData.get('lait_recolte_litres') as string || '0')
  const poids_moyen_mesure_kg = parseFloat(formData.get('poids_moyen_mesure_kg') as string || '0')
  const observations = (formData.get('observations') as string) || ''

  if (!raw_bande_id && !raw_animal_id) {
    return { error: 'Veuillez sélectionner au moins une bande ou un animal' }
  }

  // 1. Insertion du relevé de suivi
  const { error } = await supabase.from('suivi_quotidien').insert({
    entreprise_id: tenant.entrepriseId,
    bande_id,
    animal_id,
    date_suivi,
    mortalites,
    cause_mortalite,
    aliment_intrant_id,
    aliment_quantite_kg,
    oeufs_recoltes,
    oeufs_casses,
    lait_recolte_litres,
    poids_moyen_mesure_kg: poids_moyen_mesure_kg > 0 ? poids_moyen_mesure_kg : null,
    observations
  })

  if (error) return { error: error.message }

  // 2. Si mortalité et bande, mise à jour de l'effectif actuel
  if (mortalites > 0 && bande_id) {
    const { data: b } = await supabase.from('bandes').select('effectif_actuel').eq('id', bande_id).single()
    if (b) {
      const nouvelEffectif = Math.max(0, b.effectif_actuel - mortalites)
      await supabase.from('bandes').update({
        effectif_actuel: nouvelEffectif,
        updated_at: new Date().toISOString()
      }).eq('id', bande_id)
    }
  }

  // 3. Si pesée et bande, mise à jour du poids moyen actuel
  if (poids_moyen_mesure_kg > 0 && bande_id) {
    await supabase.from('bandes').update({
      poids_moyen_actuel_kg: poids_moyen_mesure_kg,
      updated_at: new Date().toISOString()
    }).eq('id', bande_id)
  }

  // 4. Si pesée et animal, mise à jour du poids
  if (poids_moyen_mesure_kg > 0 && animal_id) {
    await supabase.from('animaux').update({
      poids_actuel_kg: poids_moyen_mesure_kg,
      updated_at: new Date().toISOString()
    }).eq('id', animal_id)
  }

  revalidatePath('/elevage/suivi')
  revalidatePath('/elevage/bandes')
  revalidatePath('/elevage/animaux')
  revalidatePath('/dashboard')
  return { success: true }
}
