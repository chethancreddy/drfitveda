import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route → required roles map
const ROUTE_ROLES: Record<string, string[]> = {
  '/customer': ['customer'],
  '/professional': [
    'doctor',
    'naturopathy_doctor',
    'ayurveda_doctor',
    'nutritionist',
    'trainer',
    'yoga_doctor',
    'yoga_consultant',
    'physiotherapist',
    'wellness_coach',
    'doctor_lead',
    'trainer_lead',
  ],
  '/admin': ['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'],
}

const PUBLIC_ROUTES = [
  '/', '/programs', '/memberships', '/how-it-works', '/yoga', '/nutrition',
  '/womens-wellness', '/about', '/testimonials', '/faq', '/contact',
  '/login', '/register', '/auth',
  '/privacy', '/terms', '/cookies', '/refund-policy', '/disclaimer', '/data-request',
]

function matchRoute(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(prefix)) return roles
  }
  return null
}

function isPublicRoute(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') || // any static file with extension like .json, .ico, .png, etc.
    PUBLIC_ROUTES.includes(pathname)
  ) {
    return true
  }
  return false
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes and all API routes directly
  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request })
  }

  // 1. Check for session cookie
  const demoCookie = request.cookies.get('drf_session')?.value
  if (demoCookie) {
    try {
      const session = JSON.parse(decodeURIComponent(demoCookie))
      const userRole = String(session.role || '')
      const requiredRoles = matchRoute(pathname)

      if (requiredRoles && !requiredRoles.includes(userRole)) {
        const roleHome = getRoleHome(userRole)
        return NextResponse.redirect(new URL(roleHome, request.url))
      }

      return NextResponse.next({ request })
    } catch {}
  }

  // 2. If placeholder Supabase and no session, redirect to login
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  if (isPlaceholder) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Real Supabase auth check
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Require auth for protected routes
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  const requiredRoles = matchRoute(pathname)
  if (requiredRoles) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!requiredRoles.includes(String(profile.role))) {
      const roleHome = getRoleHome(String(profile.role))
      return NextResponse.redirect(new URL(roleHome, request.url))
    }
  }

  return supabaseResponse
}

function getRoleHome(role: string): string {
  if (role === 'customer') return '/customer'
  if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(role)) return '/admin'
  return '/professional'
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)'],
}
