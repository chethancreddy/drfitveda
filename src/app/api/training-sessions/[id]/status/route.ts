// ============================================================
// PATCH /api/training-sessions/[id]/status
// Trainer updates session status (live → completed / cancelled).
// TRD §47.7
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()

    // Resolve trainer
    const { data: prof } = await (svc as any)
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Admin override allowed
    const { data: profile } = await (svc as any)
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (!prof && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { status } = await req.json() as { status: string }
    const allowed = ['scheduled', 'live', 'completed', 'cancelled']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    // Verify session belongs to this trainer (unless admin)
    const { data: session } = await (svc as any)
      .from('training_sessions')
      .select('id, trainer_id, status')
      .eq('id', id)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!isAdmin && session.trainer_id !== prof?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date().toISOString()
    const patch: Record<string, string | null> = { status, updated_at: now }
    if (status === 'live')      patch.started_at = now
    if (status === 'completed') patch.ended_at   = now

    const { error } = await (svc as any)
      .from('training_sessions')
      .update(patch)
      .eq('id', id)
    if (error) throw new Error(error.message)

    await (svc as any).from('audit_logs').insert({
      user_id: user.id,
      action: 'training_session.status_changed',
      table_name: 'training_sessions',
      record_id: id,
      old_data: { status: session.status },
      new_data: { status },
    })

    return NextResponse.json({ ok: true, status })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
