import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'
import { createMockSupabaseClient } from './mock-adapter'
import { MOCK_USERS, type MockUser } from '../mock-db'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  const sessionCookie = cookieStore.get('drf_session')?.value

  let activeUser: MockUser | null = null
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      activeUser = {
        id: parsed.user_id,
        email: parsed.email,
        role: parsed.role,
        full_name: parsed.full_name,
        phone: '',
      }
    } catch {}
  }

  // If placeholder or demo session active, return mock Supabase client
  if (isPlaceholder || activeUser) {
    return createMockSupabaseClient(activeUser) as any
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceRoleClient() {
  const cookieStore = await cookies()
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  if (isPlaceholder) {
    return createMockSupabaseClient(MOCK_USERS.admin) as any
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
