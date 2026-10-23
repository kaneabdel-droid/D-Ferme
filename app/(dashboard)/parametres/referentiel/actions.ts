'use server'

import { createClient } from '@/utils/supabase/server'
import { getTenantContext } from '@/utils/supabase/tenant'
import { revalidatePath } from 'next/cache'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export async function ajouterEspece(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const nom = (formData.get('nom') as string)?.trim()
  const categorie = (formData.get('categorie') as string) || 'bovin'
  const mode_suivi = (formData.get('mode_suivi') as string) || 'mixte'
  const unite_effectif = (formData.get('unite_effectif') as string) || 'têtes'

  if (!nom) return { error: 'Le nom de l’espèce est requis' }

  const baseCode = slugify(nom)
  const code = `${baseCode}_${tenant.entrepriseId.slice(0, 8)}`

  const { error } = await supabase.from('especes_elevage').insert({
    entreprise_id: tenant.entrepriseId,
    code,
    nom,
    categorie,
    mode_suivi,
    unite_effectif
  })

  if (error) return { error: error.message }

  revalidatePath('/parametres/referentiel')
  revalidatePath('/elevage/animaux')
  revalidatePath('/elevage/bandes')
  return { success: true, code, nom }
}

export async function ajouterRace(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const nom = (formData.get('nom') as string)?.trim()
  const espece_code = (formData.get('espece_code') as string) || null
  const description = (formData.get('description') as string) || null

  if (!nom) return { error: 'Le nom de la race est requis' }

  const { data, error } = await supabase.from('races_elevage').insert({
    entreprise_id: tenant.entrepriseId,
    nom,
    espece_code,
    description
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/parametres/referentiel')
  revalidatePath('/elevage/animaux')
  return { success: true, race: data }
}

export async function ajouterSpeculation(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const nom = (formData.get('nom') as string)?.trim()
  const type_culture = (formData.get('type_culture') as string) || 'maraichere'
  const variete_defaut = (formData.get('variete_defaut') as string) || null
  const rendement_estime_ha = parseFloat((formData.get('rendement_estime_ha') as string) || '0')
  const cycle_jours = parseInt((formData.get('cycle_jours') as string) || '0', 10)

  if (!nom) return { error: 'Le nom de la culture / spéculation est requis' }

  const { data, error } = await supabase.from('speculations_vegetales').insert({
    entreprise_id: tenant.entrepriseId,
    nom,
    type_culture,
    variete_defaut,
    rendement_estime_ha: rendement_estime_ha > 0 ? rendement_estime_ha : null,
    cycle_jours: cycle_jours > 0 ? cycle_jours : null
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/parametres/referentiel')
  revalidatePath('/vegetal')
  return { success: true, speculation: data }
}

export async function ajouterCategorieIntrant(formData: FormData) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const nom = (formData.get('nom') as string)?.trim()
  const description = (formData.get('description') as string) || null

  if (!nom) return { error: 'Le nom de la catégorie est requis' }

  const code = slugify(nom)

  const { data, error } = await supabase.from('categories_intrants').insert({
    entreprise_id: tenant.entrepriseId,
    code,
    nom,
    description
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/parametres/referentiel')
  revalidatePath('/elevage/stocks')
  return { success: true, categorie: data }
}

export async function supprimerElementReferentiel(table: 'races_elevage' | 'speculations_vegetales' | 'categories_intrants' | 'especes_elevage', id: string) {
  const tenant = await getTenantContext()
  if (!tenant) return { error: 'Non authentifié' }

  const supabase = await createClient()

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('entreprise_id', tenant.entrepriseId)

  if (error) return { error: error.message }

  revalidatePath('/parametres/referentiel')
  return { success: true }
}
