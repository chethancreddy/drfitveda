import { cookies } from 'next/headers'
import { createMockSupabaseClient } from './mock-adapter'
import { MOCK_USERS, type MockUser } from '../mock-db'
import { loadPersistedState } from '../persistent-store'

export async function createServerSupabaseClient() {
  await loadPersistedState()
  let activeUser: MockUser | null = null

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('drf_session')?.value
    if (sessionCookie) {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      activeUser = {
        id: parsed.user_id,
        email: parsed.email,
        role: parsed.role,
        full_name: parsed.full_name,
        phone: parsed.phone || '',
      }
    }
  } catch {}

  return createMockSupabaseClient(activeUser) as any
}

export async function createServiceRoleClient() {
  await loadPersistedState()
  return createMockSupabaseClient(MOCK_USERS.admin) as any
}
