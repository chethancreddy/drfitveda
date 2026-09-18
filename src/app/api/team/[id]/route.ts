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

    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const members = mockDb.state.team_members || []
    const idx = members.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    members[idx] = {
      ...members[idx],
      ...body,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, member: members[idx] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update member' }, { status: 400 })
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

    const members = mockDb.state.team_members || []
    const idx = members.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    members.splice(idx, 1)
    return NextResponse.json({ success: true, message: 'Team member removed' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete member' }, { status: 400 })
  }
}
