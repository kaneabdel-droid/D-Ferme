'use server'

import { revalidatePath } from 'next/cache'
import { getSharedAdminUser } from '@/utils/supabase/admin-identity'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import { defaultPermissionsForRole, sanitizePermissions, type PermissionMap } from '@/lib/permissions'
import { genererEmailSynthetique } from '@/lib/auth-identifier'

type ActionResult = { success?: true; error?: string }

async function checkAdmin(): Promise<string | null> {
  const user = await getSharedAdminUser()
  return isAdminEmail(user?.email) ? null : 'Non autorisé'
}

export async function changerForfait(entrepriseId: string, niveau: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase.from('entreprises').update({ subscription_tier: niveau }).eq('id', entrepriseId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/entreprises')
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function prolongerEssai(entrepriseId: string, jours: number): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const nouvelleDate = new Date(Date.now() + jours * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('entreprises').update({ essai_expire_le: nouvelleDate }).eq('id', entrepriseId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/entreprises')
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function verrouillerCompte(entrepriseId: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase.from('entreprises').update({ compte_verrouille: true }).eq('id', entrepriseId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/entreprises')
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function deverrouillerCompte(entrepriseId: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase.from('entreprises').update({ compte_verrouille: false, essai_expire_le: null }).eq('id', entrepriseId)
  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/entreprises')
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function modifierEntreprise(
  entrepriseId: string,
  data: {
    nom: string
    telephone?: string | null
    email?: string | null
    adresse?: string | null
    devise?: string
    subscription_tier?: string
  }
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  if (!data.nom?.trim()) return { error: "Le nom de l'exploitation est obligatoire" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('entreprises')
    .update({
      nom: data.nom.trim(),
      telephone: data.telephone?.trim() || null,
      email: data.email?.trim() || null,
      adresse: data.adresse?.trim() || null,
      devise: data.devise?.trim() || 'FCFA',
      subscription_tier: data.subscription_tier || 'standard',
      updated_at: new Date().toISOString(),
    })
    .eq('id', entrepriseId)

  if (error) return { error: error.message }

  revalidatePath('/admin/entreprises')
  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function accorderAbonnementManuel(
  entrepriseId: string,
  params: {
    niveau: string
    mois: number
    montant?: number
    moyen?: string
    reference?: string
  }
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const niveau = params.niveau || 'standard'
  const mois = params.mois || 1
  const moyen = params.moyen || 'virement'
  const ref = params.reference?.trim() || `MANUEL-${Date.now().toString().slice(-6)}`
  const defaultMontant = niveau === 'premium' ? 25000 * mois : niveau === 'medium' ? 15000 * mois : 10000 * mois
  const montant = typeof params.montant === 'number' && params.montant > 0 ? params.montant : defaultMontant

  // 1. Enregistrer dans abonnement_paiements avec statut 'completed'
  const { error: insErr } = await supabase
    .from('abonnement_paiements')
    .insert({
      entreprise_id: entrepriseId,
      gie_id: entrepriseId,
      niveau,
      montant,
      devise: 'FCFA',
      provider: 'manuel',
      moyen_paiement: moyen,
      provider_reference: ref,
      statut: 'completed',
    })

  if (insErr) return { error: insErr.message }

  // 2. Activer le forfait et lever l'expiration d'essai
  const { error: entErr } = await supabase
    .from('entreprises')
    .update({
      subscription_tier: niveau,
      essai_expire_le: null,
      compte_verrouille: false,
    })
    .eq('id', entrepriseId)

  if (entErr) return { error: entErr.message }

  revalidatePath('/admin/paiements')
  revalidatePath('/admin/entreprises')
  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function validerPaiementManuel(paiementId: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { data: paiement, error: pErr } = await supabase
    .from('abonnement_paiements')
    .select('id, gie_id, entreprise_id, niveau, montant, statut')
    .eq('id', paiementId)
    .single()

  if (pErr || !paiement) return { error: 'Paiement introuvable' }

  const entId = paiement.entreprise_id || paiement.gie_id
  if (!entId) return { error: 'Exploitation non rattachée au paiement' }

  // Mettre à jour le paiement
  const { error: upPayErr } = await supabase
    .from('abonnement_paiements')
    .update({ statut: 'completed', updated_at: new Date().toISOString() })
    .eq('id', paiementId)

  if (upPayErr) return { error: upPayErr.message }

  // Mettre à jour l'entreprise
  const { error: upEntErr } = await supabase
    .from('entreprises')
    .update({
      subscription_tier: paiement.niveau,
      essai_expire_le: null,
      compte_verrouille: false,
    })
    .eq('id', entId)

  if (upEntErr) return { error: upEntErr.message }

  revalidatePath('/admin/paiements')
  revalidatePath('/admin/entreprises')
  revalidatePath(`/admin/entreprises/${entId}`)
  revalidatePath('/admin/elevage')
  return { success: true }
}

export async function rejeterPaiementManuel(paiementId: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('abonnement_paiements')
    .update({ statut: 'failed', updated_at: new Date().toISOString() })
    .eq('id', paiementId)

  if (error) return { error: error.message }

  revalidatePath('/admin/paiements')
  return { success: true }
}

export async function creerUtilisateurPourEntreprise(
  entrepriseId: string,
  identifiantOuEmail: string,
  password: string,
  role: string,
  permissions: PermissionMap | null = null,
  options?: {
    nomComplet?: string
    telephone?: string
  }
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const identifiant = identifiantOuEmail.trim()
  if (!identifiant) return { error: "L'identifiant ou email est requis" }
  if (!password || password.length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caractères' }

  const supabase = createAdminClient()

  let authEmail = identifiant
  if (!authEmail.includes('@')) {
    authEmail = genererEmailSynthetique(identifiant)
  } else {
    authEmail = authEmail.toLowerCase()
  }

  const cleanRole = role.trim() || 'agent'
  const effectivePerms =
    cleanRole.toLowerCase() === 'admin'
      ? null
      : permissions
      ? sanitizePermissions(permissions)
      : defaultPermissionsForRole(cleanRole)

  const { data: created, error } = await supabase.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: {
      existing_entreprise_id: entrepriseId,
      existing_gie_id: entrepriseId,
      role: cleanRole,
      nom_complet: options?.nomComplet?.trim() || null,
      telephone: options?.telephone?.trim() || null,
      identifiant: !identifiant.includes('@') ? identifiant : null,
    },
  })

  if (error) return { error: error.message }

  if (created.user) {
    const { error: upsertErr } = await supabase
      .from('utilisateurs')
      .upsert({
        id: created.user.id,
        entreprise_id: entrepriseId,
        nom_complet: options?.nomComplet?.trim() || (identifiant.includes('@') ? identifiant : null),
        role: cleanRole,
        permissions: effectivePerms,
        actif: true,
      })

    if (upsertErr) {
      return { error: `Compte Auth créé, mais erreur insertion profil : ${upsertErr.message}` }
    }
  }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

export async function changerRoleUtilisateur(
  entrepriseId: string,
  utilisateurId: string,
  role: string
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }
  if (!role.trim()) return { error: 'Le rôle ne peut pas être vide' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('utilisateurs')
    .update({ role: role.trim() })
    .eq('id', utilisateurId)
    .eq('entreprise_id', entrepriseId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

export async function changerPermissionsUtilisateur(
  entrepriseId: string,
  utilisateurId: string,
  permissions: PermissionMap | null
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('utilisateurs')
    .update({ permissions: permissions ? sanitizePermissions(permissions) : null })
    .eq('id', utilisateurId)
    .eq('entreprise_id', entrepriseId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

const BAN_DUREE_DESACTIVATION = '87600h'

export async function desactiverCompteUtilisateur(
  entrepriseId: string,
  utilisateurId: string
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  await supabase.from('utilisateurs').update({ actif: false }).eq('id', utilisateurId)
  const { error } = await supabase.auth.admin.updateUserById(utilisateurId, {
    ban_duration: BAN_DUREE_DESACTIVATION,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

export async function reactiverCompteUtilisateur(
  entrepriseId: string,
  utilisateurId: string
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  await supabase.from('utilisateurs').update({ actif: true }).eq('id', utilisateurId)
  const { error } = await supabase.auth.admin.updateUserById(utilisateurId, {
    ban_duration: 'none',
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

export async function retirerUtilisateur(
  entrepriseId: string,
  utilisateurId: string
): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  await supabase.from('utilisateurs').delete().eq('id', utilisateurId).eq('entreprise_id', entrepriseId)
  await supabase.auth.admin.deleteUser(utilisateurId).catch(() => {})

  revalidatePath(`/admin/entreprises/${entrepriseId}`)
  return { success: true }
}

export async function supprimerEntreprise(entrepriseId: string): Promise<ActionResult> {
  const authError = await checkAdmin()
  if (authError) return { error: authError }

  const supabase = createAdminClient()
  const { data: utilisateurs } = await supabase
    .from('utilisateurs')
    .select('id')
    .eq('entreprise_id', entrepriseId)

  const { error } = await supabase.from('entreprises').delete().eq('id', entrepriseId)
  if (error) return { error: error.message }

  for (const u of utilisateurs ?? []) {
    await supabase.auth.admin.deleteUser(u.id).catch(() => {})
  }

  revalidatePath('/admin/entreprises')
  revalidatePath('/admin/elevage')
  return { success: true }
}
