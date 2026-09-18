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
    const assignments = mockDb.state.professional_assignments || []
    const idx = assignments.findIndex((a: any) => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    assignments[idx] = {
      ...assignments[idx],
      ...body,
      id: assignments[idx].id,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ assignment: assignments[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 400 })
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

    const assignments = mockDb.state.professional_assignments || []
    const idx = assignments.findIndex((a: any) => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    assignments[idx].is_active = false
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
