// ============================================================
// Dr Fit Veda — Durable Supabase State Persistence Layer
// Bridges mockDb.state with Supabase PostgreSQL (public.website_settings)
// so all Admin, CMS, Customer, and Professional changes persist
// across Vercel serverless cold starts, devices, and sessions.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mockDb, MOCK_USERS } from './mock-db'
import { emailsMatch, normalizePhoneForMatch, isProfessionalRole } from './auth-resolver'

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
 * Synchronizes runtime in-memory references (like MOCK_USERS.admin, MOCK_USERS.doctor,
 * MOCK_USERS.trainer, user_profiles, professionals, and customers)
 * after loading persisted state from Supabase.
 */
export function syncRuntimeReferences() {
  if (!mockDb.state) return
  if (!Array.isArray(mockDb.state.user_profiles)) {
    mockDb.state.user_profiles = []
  }

  const userProfiles: any[] = mockDb.state.user_profiles

  // 1. Sync Admin Profile into user_profiles (keep MOCK_USERS.admin as immutable fallback)
  const adminProf = mockDb.state.admin_profile
  if (adminProf) {
    const adminIdx = userProfiles.findIndex(
      (u: any) => u.id === MOCK_USERS.admin.id || u.role === 'admin' || u.role === 'super_admin'
    )
    if (adminIdx >= 0) {
      userProfiles[adminIdx] = {
        ...userProfiles[adminIdx],
        role: adminProf.role || userProfiles[adminIdx].role || 'admin',
        full_name: adminProf.full_name || userProfiles[adminIdx].full_name,
        phone: adminProf.phone || userProfiles[adminIdx].phone,
        email: adminProf.email || userProfiles[adminIdx].email,
      }
    }
  }

  // 2. Sync Professionals (Doctors, Trainers, Nutritionists, Yoga Specialists) -> user_profiles
  if (Array.isArray(mockDb.state.professionals)) {
    for (const pro of mockDb.state.professionals) {
      if (!pro || !pro.user_id) continue

      // Ensure user_profiles has an up-to-date record for this professional's user_id
      const uIdx = userProfiles.findIndex((up: any) => up.id === pro.user_id)
      if (uIdx >= 0) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          role: pro.role || userProfiles[uIdx].role || 'doctor',
          full_name: pro.full_name || userProfiles[uIdx].full_name,
          email: pro.email || userProfiles[uIdx].email || '',
          phone: pro.phone || userProfiles[uIdx].phone || '',
          is_active: pro.is_active !== false && !pro.is_archived,
          is_archived: Boolean(pro.is_archived),
        }
      } else {
        userProfiles.push({
          id: pro.user_id,
          role: pro.role || 'doctor',
          full_name: pro.full_name || 'Specialist',
          email: pro.email || '',
          phone: pro.phone || '',
          is_active: pro.is_active !== false && !pro.is_archived,
          is_archived: Boolean(pro.is_archived),
          created_at: pro.created_at || new Date().toISOString(),
        })
      }
    }
  }

  // 3. Sync Operations Team Members -> user_profiles
  if (Array.isArray(mockDb.state.team_members)) {
    for (const tm of mockDb.state.team_members) {
      if (!tm) continue
      const tmUserId = tm.user_id || tm.id
      if (!tmUserId) continue
      const uIdx = userProfiles.findIndex((up: any) => up.id === tmUserId)
      if (uIdx >= 0) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          role: tm.role || userProfiles[uIdx].role || 'care_coordinator',
          full_name: tm.full_name || userProfiles[uIdx].full_name,
          email: tm.email || userProfiles[uIdx].email || '',
          phone: tm.phone || userProfiles[uIdx].phone || '',
          is_active: tm.is_active !== false && !tm.is_archived,
          is_archived: Boolean(tm.is_archived),
        }
      } else {
        userProfiles.push({
          id: tmUserId,
          role: tm.role || 'care_coordinator',
          full_name: tm.full_name || 'Team Member',
          email: tm.email || '',
          phone: tm.phone || '',
          is_active: tm.is_active !== false && !tm.is_archived,
          is_archived: Boolean(tm.is_archived),
          created_at: tm.created_at || new Date().toISOString(),
        })
      }
    }
  }

  // 4. Remove any stale auto-provisioned `u-otp-*` customer profile whose email or phone
  // actually belongs to an Admin, Professional (Doctor/Trainer), or Team Member.
  const privilegedEmails: string[] = []
  const privilegedPhones: string[] = []

  if (adminProf?.email) privilegedEmails.push(adminProf.email)
  if (adminProf?.phone) privilegedPhones.push(normalizePhoneForMatch(adminProf.phone))

  for (const mu of Object.values(MOCK_USERS)) {
    if (mu.role !== 'customer') {
      if (mu.email) privilegedEmails.push(mu.email)
      if (mu.phone) privilegedPhones.push(normalizePhoneForMatch(mu.phone))
    }
  }

  if (Array.isArray(mockDb.state.professionals)) {
    for (const p of mockDb.state.professionals) {
      if (p.is_active === false) continue
      if (p.email) privilegedEmails.push(p.email)
      if (p.phone) privilegedPhones.push(normalizePhoneForMatch(p.phone))
    }
  }

  if (Array.isArray(mockDb.state.team_members)) {
    for (const tm of mockDb.state.team_members) {
      if (tm.is_active === false) continue
      if (tm.email) privilegedEmails.push(tm.email)
      if (tm.phone) privilegedPhones.push(normalizePhoneForMatch(tm.phone))
    }
  }

  mockDb.state.user_profiles = userProfiles.filter((up: any) => {
    if (!up || typeof up.id !== 'string') return false
    if (up.id.startsWith('u-otp-') && up.role === 'customer') {
      const upEmail = up.email || ''
      const upPhoneNorm = normalizePhoneForMatch(up.phone)
      const conflictsEmail =
        upEmail && privilegedEmails.some(pe => emailsMatch(pe, upEmail))
      const conflictsPhone =
        upPhoneNorm && privilegedPhones.some(pp => pp && pp === upPhoneNorm)
      if (conflictsEmail || conflictsPhone) {
        return false
      }
    }
    return true
  })

  // 5. Ensure every user_profile with a professional role has a corresponding record in `professionals`
  if (Array.isArray(mockDb.state.professionals)) {
    for (const up of mockDb.state.user_profiles) {
      if (up && isProfessionalRole(up.role) && up.is_active !== false && !up.is_archived) {
        const hasPro = mockDb.state.professionals.some((p: any) => p.user_id === up.id)
        if (!hasPro) {
          mockDb.state.professionals.push({
            id: `p0000000-0000-0000-0000-${String(up.id).replace(/\D/g, '').slice(-12).padStart(12, '0')}`,
            user_id: up.id,
            role: up.role,
            full_name: up.full_name || 'Specialist',
            email: up.email || '',
            phone: up.phone || '',
            qualification: up.role === 'trainer' ? 'Certified Fitness Trainer' : 'Naturopathy & Wellness Specialist',
            specialization: 'Holistic Lifestyle Management',
            is_available: true,
            is_active: true,
          })
        }
      }
    }
  }

  // 6. Ensure consultation_categories and consultation_services have backward-compatible defaults
  const defaultCategories = [
    { id: 'cc-001', key: 'doctor_consultation', name: 'Doctor Consultation', icon: '🩺', is_active: true, display_order: 1 },
    { id: 'cc-002', key: 'nutrition_consultation', name: 'Nutrition Consultation', icon: '🥗', is_active: true, display_order: 2 },
    { id: 'cc-003', key: 'yoga', name: 'Yoga Consultation', icon: '🧘', is_active: true, display_order: 3 },
    { id: 'cc-004', key: 'womens_health', name: "Women's Health Consultation", icon: '🌸', is_active: true, display_order: 4 },
    { id: 'cc-005', key: 'pcod', name: 'PCOD / PCOS Consultation', icon: '🩺', is_active: true, display_order: 5 },
    { id: 'cc-006', key: 'lifestyle_consultation', name: 'Lifestyle Consultation', icon: '🌿', is_active: true, display_order: 6 },
    { id: 'cc-007', key: 'wellness', name: 'General Wellness Consultation', icon: '💚', is_active: true, display_order: 7 },
    { id: 'cc-008', key: 'other', name: 'Other Services', icon: '🏥', is_active: true, display_order: 8 },
  ]
  if (!Array.isArray(mockDb.state.consultation_categories) || mockDb.state.consultation_categories.length === 0) {
    mockDb.state.consultation_categories = defaultCategories
  }

  const categoryIconMap: Record<string, string> = {
    doctor_consultation: '🩺',
    nutrition_consultation: '🥗',
    yoga: '🧘',
    womens_health: '🌸',
    pcod: '🩺',
    lifestyle_consultation: '🌿',
    wellness: '💚',
    other: '🏥',
  }

  if (Array.isArray(mockDb.state.consultation_services)) {
    mockDb.state.consultation_services = mockDb.state.consultation_services.map((s: any, idx: number) => ({
      ...s,
      short_description: s.short_description || s.description || '',
      full_description: s.full_description || s.description || s.short_description || '',
      description: s.description || s.full_description || s.short_description || '',
      specialist_designation: s.specialist_designation || 'Certified Specialist Doctor',
      icon: s.icon || categoryIconMap[s.category] || '🩺',
      image_url: s.image_url || '',
      consultation_type: s.consultation_type || 'Online Video (Zoho Meeting)',
      currency: s.currency || 'INR',
      is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
      is_archived: Boolean(s.is_archived),
      display_order: s.display_order !== undefined ? Number(s.display_order) : idx + 1,
    }))
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

