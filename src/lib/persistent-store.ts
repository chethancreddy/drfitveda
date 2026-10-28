// ============================================================
// Dr Fit Veda — Durable Supabase State Persistence Layer
// Bridges mockDb.state with Supabase PostgreSQL (public.website_settings)
// so all Admin, CMS, Customer, and Professional changes persist
// across Vercel serverless cold starts, devices, and sessions.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mockDb, MOCK_USERS } from './mock-db'

const STATE_KEY_PREFIX = 'drf_state:'
const CACHE_TTL_MS = 400 // Deduplicate multiple reads within the same request tick

let cachedClient: SupabaseClient | null = null
let lastLoadTimestamp = 0
let inFlightLoad: Promise<boolean> | null = null

function getRawSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder')) {
    return null
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}

/**
 * Synchronizes runtime in-memory references (like MOCK_USERS.admin)
 * after loading persisted state from Supabase.
 */
function syncRuntimeReferences() {
  const adminProf = mockDb.state?.admin_profile
  if (adminProf) {
    if (adminProf.email) MOCK_USERS.admin.email = adminProf.email
    if (adminProf.full_name) MOCK_USERS.admin.full_name = adminProf.full_name
    if (adminProf.phone) MOCK_USERS.admin.phone = adminProf.phone
    if (adminProf.password) MOCK_USERS.admin.password = adminProf.password

    if (Array.isArray(mockDb.state.user_profiles)) {
      const idx = mockDb.state.user_profiles.findIndex(
        (u: any) => u.id === MOCK_USERS.admin.id || u.role === 'admin'
      )
      if (idx >= 0) {
        mockDb.state.user_profiles[idx] = {
          ...mockDb.state.user_profiles[idx],
          full_name: adminProf.full_name || mockDb.state.user_profiles[idx].full_name,
          phone: adminProf.phone || mockDb.state.user_profiles[idx].phone,
          email: adminProf.email || mockDb.state.user_profiles[idx].email,
        }
      }
    }
  }
}

/**
 * Loads all persisted `drf_state:*` collections from Supabase `public.website_settings`
 * into `mockDb.state`. Safe to call at the start of any API route or Server Component.
 */
export async function loadPersistedState(force = false): Promise<boolean> {
  const client = getRawSupabaseAdmin()
  if (!client) return false

  const now = Date.now()
  if (!force && now - lastLoadTimestamp < CACHE_TTL_MS) {
    return true
  }

  if (!force && inFlightLoad) {
    return inFlightLoad
  }

  inFlightLoad = (async () => {
    try {
      const { data, error } = await client
        .from('website_settings')
        .select('key, value')
        .like('key', `${STATE_KEY_PREFIX}%`)

      if (error) {
        console.error('[persistent-store] Failed to load state from Supabase:', error.message)
        return false
      }

      if (Array.isArray(data)) {
        for (const row of data) {
          if (row?.key && typeof row.key === 'string' && row.key.startsWith(STATE_KEY_PREFIX)) {
            const stateKey = row.key.slice(STATE_KEY_PREFIX.length)
            if (stateKey && row.value !== undefined && row.value !== null) {
              mockDb.state[stateKey] = row.value
            }
          }
        }
      }

      syncRuntimeReferences()
      lastLoadTimestamp = Date.now()
      return true
    } catch (err: any) {
      console.error('[persistent-store] Unexpected error loading state:', err?.message || err)
      return false
    } finally {
      inFlightLoad = null
    }
  })()

  return inFlightLoad
}

/**
 * Persists one or more `mockDb.state` keys durably into Supabase `public.website_settings`.
 */
export async function savePersistedState(keys: string | string[]): Promise<boolean> {
  const client = getRawSupabaseAdmin()
  const keyList = Array.isArray(keys) ? keys : [keys]
  const uniqueKeys = Array.from(new Set(keyList.filter(Boolean)))

  syncRuntimeReferences()

  if (!client || uniqueKeys.length === 0) {
    return false
  }

  try {
    const nowIso = new Date().toISOString()
    const rowsToUpsert: Array<{ key: string; value: any; updated_at: string }> = []

    for (const k of uniqueKeys) {
      if (mockDb.state[k] !== undefined) {
        rowsToUpsert.push({
          key: `${STATE_KEY_PREFIX}${k}`,
          value: mockDb.state[k],
          updated_at: nowIso,
        })
      }
    }

    // Also mirror core settings keys directly in website_settings for external readers
    if (uniqueKeys.includes('settings') && mockDb.state.settings) {
      const s = mockDb.state.settings
      const mirroredKeys = ['site_name', 'site_tagline', 'contact_email', 'contact_phone', 'address']
      for (const mk of mirroredKeys) {
        if (s[mk] !== undefined) {
          rowsToUpsert.push({
            key: mk,
            value: s[mk],
            updated_at: nowIso,
          })
        }
      }
    }

    if (rowsToUpsert.length === 0) return true

    const { error } = await client
      .from('website_settings')
      .upsert(rowsToUpsert, { onConflict: 'key' })

    if (error) {
      console.error('[persistent-store] Failed to save state to Supabase:', error.message)
      return false
    }

    lastLoadTimestamp = Date.now()
    return true
  } catch (err: any) {
    console.error('[persistent-store] Unexpected error saving state:', err?.message || err)
    return false
  }
}

