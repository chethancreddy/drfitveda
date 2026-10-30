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
        try { role = JSON.parse(cookie).role } catch { }
      }
    }
  }
  return role
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await loadPersistedState()
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id || p.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

    const updatedEmail =
      body.email !== undefined ? String(body.email).trim().toLowerCase() : pros[idx].email
    const updatedPhone =
      body.phone !== undefined ? String(body.phone).trim() : pros[idx].phone

    pros[idx] = {
      ...pros[idx],
      ...body,
      email: updatedEmail,
      phone: updatedPhone,
      id: pros[idx].id,
      user_id: pros[idx].user_id,
      updated_at: new Date().toISOString(),
    }

    // Always synchronize linked user_profiles entry (full_name, role, email, phone, is_active)
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    const userProfiles = mockDb.state.user_profiles
    const uIdx = userProfiles.findIndex((up: any) => up.id === pros[idx].user_id)
    if (uIdx !== -1) {
      userProfiles[uIdx] = {
        ...userProfiles[uIdx],
        full_name: pros[idx].full_name || userProfiles[uIdx].full_name,
        role: pros[idx].role || userProfiles[uIdx].role,
        email: updatedEmail ?? userProfiles[uIdx].email ?? '',
        phone: updatedPhone ?? userProfiles[uIdx].phone ?? '',
        is_active: pros[idx].is_active !== undefined ? pros[idx].is_active : userProfiles[uIdx].is_active,
      }
    } else {
      userProfiles.push({
        id: pros[idx].user_id,
        role: pros[idx].role || 'doctor',
        full_name: pros[idx].full_name || 'Specialist',
        email: updatedEmail || '',
        phone: updatedPhone || '',
        is_active: pros[idx].is_active !== undefined ? pros[idx].is_active : true,
        created_at: new Date().toISOString(),
      })
    }

    await savePersistedState(['professionals', 'user_profiles'])
    return NextResponse.json({ professional: pros[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await loadPersistedState()
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Soft toggle/deactivate
    pros[idx].is_active = false
    await savePersistedState('professionals')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
