// ============================================================
// POST /api/training-recordings
// Trainer creates a recording record (starts in 'uploading' state).
// TRD §47.7
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data: prof } = await (svc as any)
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!prof) return NextResponse.json({ error: 'Forbidden: trainers only' }, { status: 403 })

    const body = await req.json()
    const { session_id, storage_key, file_size_bytes, duration_seconds } = body as {
      session_id: string
      storage_key: string
      file_size_bytes?: number
      duration_seconds?: number
    }
    if (!session_id || !storage_key) {
      return NextResponse.json({ error: 'session_id and storage_key required' }, { status: 400 })
    }

    // Verify session belongs to this trainer
    const { data: session } = await (svc as any)
      .from('training_sessions')
      .select('id, customer_id, trainer_id')
      .eq('id', session_id)
      .single()
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.trainer_id !== prof.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = new Date().toISOString()
    const { data: recording, error } = await (svc as any)
      .from('training_recordings')
      .insert({
        session_id,
        customer_id: session.customer_id,
        storage_key,
        recording_status: 'uploading',
        is_active: false,
        file_size_bytes: file_size_bytes ?? null,
        duration_seconds: duration_seconds ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    await (svc as any).from('audit_logs').insert({
      user_id: user.id,
      action: 'training_recording.uploaded',
      table_name: 'training_recordings',
      record_id: recording.id,
      new_data: { session_id, storage_key, customer_id: session.customer_id },
    })

    return NextResponse.json({ recording }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
