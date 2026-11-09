import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

async function handleSignOut(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Erreur lors du signOut Supabase:', err)
  }

  try {
    const cookieStore = await cookies()
    cookieStore.delete('demba_offline_active')
  } catch (err) {
    console.error('Erreur suppression cookie demba_offline_active:', err)
  }

  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`, { status: 302 })
}

export async function POST(request: Request) {
  return handleSignOut(request)
}

export async function GET(request: Request) {
  return handleSignOut(request)
}
