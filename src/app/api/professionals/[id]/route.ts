import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id || p.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

    pros[idx] = {
      ...pros[idx],
      ...body,
      id: pros[idx].id,
      user_id: pros[idx].user_id,
      updated_at: new Date().toISOString(),
    }

    // Update user profile if full_name or role changed
    if (body.full_name || body.role) {
      const userProfiles = mockDb.state.user_profiles || []
      const uIdx = userProfiles.findIndex((up: any) => up.id === pros[idx].user_id)
      if (uIdx !== -1) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          full_name: body.full_name || userProfiles[uIdx].full_name,
          role: body.role || userProfiles[uIdx].role,
        }
      }
    }

    return NextResponse.json({ professional: pros[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Soft toggle/deactivate
    pros[idx].is_active = false
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
