'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = ((formData.get('password') as string) || '').trim()
  const confirmPassword = ((formData.get('confirm_password') as string) || '').trim()
  const isAdmin = formData.get('admin') === '1'

  if (!password || password.length < 6) {
    return redirect(
      `/update-password?message=${encodeURIComponent('Le mot de passe doit comporter au moins 6 caractères.')}${isAdmin ? '&admin=1' : ''}`
    )
  }

  if (confirmPassword && password !== confirmPassword) {
    return redirect(
      `/update-password?message=${encodeURIComponent('Les deux mots de passe ne correspondent pas.')}${isAdmin ? '&admin=1' : ''}`
    )
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    const params = new URLSearchParams({ message: error.message })
    if (isAdmin) params.set('admin', '1')
    return redirect(`/update-password?${params.toString()}`)
  }

  return redirect(
    `${isAdmin ? '/admin/login' : '/login'}?message=${encodeURIComponent(
      'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.'
    )}`
  )
}
