import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'

function getRole(req: NextRequest, user: any) {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try { role = JSON.parse(decodeURIComponent(cookie)).role } catch {
        try { role = JSON.parse(cookie).role } catch {}
      }
    }
  }
  return role
}

export async function GET() {
  try {
    await loadPersistedState()
    const pros = mockDb.state.professionals || []
    return NextResponse.json({ professionals: pros })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { full_name, role: proRole, qualification, specialization, is_available, is_active, phone, email } = body

    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanPhone = String(phone || '').trim()
    const targetRole = proRole || 'trainer'

    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []

    // Check if an existing user_profile already has this email or phone (e.g. if they logged in earlier)
    const existingProfileIdx = mockDb.state.user_profiles.findIndex((up: any) => {
      if (cleanEmail && up.email && up.email.trim().toLowerCase() === cleanEmail) return true
      if (cleanPhone && up.phone && up.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) return true
      return false
    })

    const userId =
      existingProfileIdx >= 0 && mockDb.state.user_profiles[existingProfileIdx]?.id
        ? mockDb.state.user_profiles[existingProfileIdx].id
        : `u-pro-${Date.now()}`
    const proId = `p0000000-0000-0000-0000-${Date.now().toString().slice(-12)}`

    if (existingProfileIdx >= 0) {
      mockDb.state.user_profiles[existingProfileIdx] = {
        ...mockDb.state.user_profiles[existingProfileIdx],
        role: targetRole,
        full_name: full_name || mockDb.state.user_profiles[existingProfileIdx].full_name || 'New Professional',
        phone: cleanPhone || mockDb.state.user_profiles[existingProfileIdx].phone || '',
        email: cleanEmail || mockDb.state.user_profiles[existingProfileIdx].email || '',
        is_active: is_active !== undefined ? is_active : true,
      }
    } else {
      mockDb.state.user_profiles.push({
        id: userId,
        role: targetRole,
        full_name: full_name || 'New Professional',
        phone: cleanPhone,
        email: cleanEmail,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
      })
    }

    // Create professional record with email and phone included
    const newPro = {
      id: proId,
      user_id: userId,
      role: targetRole,
      full_name: full_name || 'New Professional',
      qualification: qualification || '',
      specialization: specialization || '',
      phone: cleanPhone,
      email: cleanEmail,
      is_available: is_available !== undefined ? is_available : true,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
    }

    if (!mockDb.state.professionals) mockDb.state.professionals = []
    mockDb.state.professionals.push(newPro)
    await savePersistedState(['professionals', 'user_profiles'])

    return NextResponse.json({ professional: newPro, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create professional' }, { status: 400 })
  }
}
