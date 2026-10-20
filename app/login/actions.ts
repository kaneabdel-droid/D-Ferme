'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdminEmail } from '@/lib/admin/auth'
import { pageSuivante } from '@/lib/suite'
import { resoudreAuthEmail } from '@/lib/auth-identifier'

export type LoginActionResult = {
  success?: boolean
  error?: string
  redirectUrl?: string
  userContext?: {
    userId: string
    nomComplet?: string | null
    identifiant: string
    telephone?: string | null
    email?: string | null
    role: string
    entrepriseId: string
    entrepriseNom: string
    gieId?: string
    gieNom?: string
    devise?: string
    permissions?: any
  }
}

export async function login(formData: FormData): Promise<LoginActionResult> {
  const cookieStore = await cookies()
  
  // Vérification de la limitation de tentatives (lockout)
  const lockoutUntil = cookieStore.get('lockout_until')?.value
  if (lockoutUntil && parseInt(lockoutUntil) > Date.now()) {
    return {
      error: 'Veuillez patienter 1 minute avant de vous reconnecter (tentatives excessives).',
    }
  }

  const supabase = await createClient()
  const suite = pageSuivante(formData.get('next'))

  const rawIdentifier = ((formData.get('email') as string) || (formData.get('identifier') as string) || '').trim()
  const password = (formData.get('password') as string) || ''

  if (!rawIdentifier) {
    return { error: 'Veuillez renseigner votre identifiant, téléphone ou e-mail.' }
  }
  if (!password) {
    return { error: 'Veuillez saisir votre mot de passe.' }
  }

  // Résolution multi-identifiant (identifiant textuel, téléphone ou e-mail direct)
  let resolvedEmail = rawIdentifier
  try {
    const adminSupabase = createAdminClient()
    const resolved = await resoudreAuthEmail(rawIdentifier, adminSupabase)
    resolvedEmail = resolved.email
  } catch {
    resolvedEmail = rawIdentifier
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  })

  if (error) {
    const attemptsCookie = cookieStore.get('login_attempts')?.value
    const attempts = attemptsCookie ? parseInt(attemptsCookie) + 1 : 1

    if (attempts >= 3) {
      cookieStore.set('lockout_until', (Date.now() + 60000).toString(), { maxAge: 60 })
      cookieStore.delete('login_attempts')
      return {
        error: 'Trop de tentatives échouées. Veuillez patienter 1 minute avant de réessayer.',
      }
    } else {
      cookieStore.set('login_attempts', attempts.toString(), { maxAge: 300 })
      return {
        error: 'Identifiant ou mot de passe non conforme. Veuillez réessayer.',
      }
    }
  }

  // Réinitialiser les compteurs de tentatives
  cookieStore.delete('login_attempts')
  cookieStore.delete('lockout_until')

  // Redirection administrateur super-admin sans exploitation
  if (isAdminEmail(resolvedEmail) || (signInData?.user?.email && isAdminEmail(signInData.user.email))) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: rattachement } = user
      ? await supabase.from('utilisateurs').select('id').eq('id', user.id).maybeSingle()
      : { data: null }
    if (!rattachement) {
      await supabase.auth.signOut()
      return {
        redirectUrl: `/admin/login?message=${encodeURIComponent("Compte administrateur : connectez-vous ici pour accéder à l'administration.")}`,
      }
    }
  }

  // Récupérer le contexte utilisateur et exploitation pour la persistance locale hors-ligne
  let userContext: LoginActionResult['userContext']
  try {
    const { data: userProfile } = await supabase
      .from('utilisateurs')
      .select('id, identifiant, telephone, nom_complet, role, permissions, entreprise_id, entreprises(nom, devise)')
      .eq('id', signInData.user.id)
      .maybeSingle()

    if (userProfile) {
      const ent = Array.isArray(userProfile.entreprises) ? userProfile.entreprises[0] : userProfile.entreprises
      userContext = {
        userId: userProfile.id,
        nomComplet: userProfile.nom_complet || null,
        identifiant: userProfile.identifiant || rawIdentifier,
        telephone: userProfile.telephone || null,
        email: signInData.user.email || null,
        role: userProfile.role || 'gerant',
        entrepriseId: userProfile.entreprise_id,
        entrepriseNom: ent?.nom || 'Mon Exploitation',
        gieId: userProfile.entreprise_id,
        gieNom: ent?.nom || 'Mon Exploitation',
        devise: ent?.devise || 'FCFA',
        permissions: userProfile.permissions || null,
      }
    }
  } catch (err) {
    console.warn('Erreur récupération profil utilisateur pour cache hors-ligne D-FERME:', err)
  }

  revalidatePath('/', 'layout')

  return {
    success: true,
    redirectUrl: suite ?? '/dashboard',
    userContext,
  }
}
