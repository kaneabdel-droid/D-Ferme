import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from './keys'
import { isAdminEmail } from '@/lib/admin/auth'
import { createAdminIdentityMiddlewareClient } from './admin-identity'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Exclusions directes des endpoints d'API, assets statiques
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon')
  ) {
    return supabaseResponse
  }

  // Connexion admin dédiée
  if (pathname === '/admin/login') {
    return supabaseResponse
  }

  // Récupération de la session utilisateur
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  // Protection espace admin
  if (pathname.startsWith('/admin')) {
    let adminUser = null
    try {
      const adminClient = createAdminIdentityMiddlewareClient(request, supabaseResponse)
      const { data } = await adminClient.auth.getUser()
      adminUser = data?.user ?? null
    } catch {
      adminUser = null
    }

    if (isAdminEmail(adminUser?.email) || isAdminEmail(user?.email)) {
      return supabaseResponse
    }

    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  // Liste des routes publiques accessibles sans session
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/update-password') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/signout') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/decouvrir-delevage') ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/tarifs') ||
    pathname.startsWith('/checkout')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
