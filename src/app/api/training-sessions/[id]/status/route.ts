// ============================================================
// PATCH /api/training-sessions/[id]/status
// Trainer updates session status (live → completed / cancelled).
// TRD §47.7
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { syncSessionRemindersForTrainingSession } from '@/lib/services/whatsapp-notification.service'

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

    const body = await req.json() as { status?: string; scheduled_at?: string; trainer_id?: string }
    const status = body.status || 'scheduled'
    const allowed = ['scheduled', 'live', 'completed', 'cancelled']
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    // Verify session belongs to this trainer (unless admin)
    const { data: session } = await (svc as any)
      .from('training_sessions')
      .select('id, customer_id, trainer_id, scheduled_at, meeting_url, status')
      .eq('id', id)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (!isAdmin && session.trainer_id !== prof?.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date().toISOString()
    const patch: Record<string, string | null> = { status, updated_at: now }
    if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at
    if (body.trainer_id !== undefined && isAdmin) patch.trainer_id = body.trainer_id
    if (status === 'live')      patch.started_at = now
    if (status === 'completed') patch.ended_at   = now

    const { data: updatedSession, error } = await (svc as any)
      .from('training_sessions')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)

    if (updatedSession) {
      await syncSessionRemindersForTrainingSession(updatedSession)
    }

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
