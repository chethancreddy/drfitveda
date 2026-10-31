// ============================================================
// POST /api/training-sessions
// Trainer creates a new training session for an assigned customer.
// TRD §47.7
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { syncSessionRemindersForTrainingSession } from '@/lib/services/whatsapp-notification.service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve trainer professional record
    const svc = await createServiceRoleClient()
    const { data: prof } = await (svc as any)
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!prof) return NextResponse.json({ error: 'Not a trainer' }, { status: 403 })

    const body = await req.json()
    const { customer_id, scheduled_at, notes } = body as {
      customer_id: string
      scheduled_at?: string
      notes?: string
    }
    if (!customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 })

    // Verify trainer is actively assigned to this customer
    const { data: assignment } = await (svc as any)
      .from('professional_assignments')
      .select('id')
      .eq('professional_id', prof.id)
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .single()
    if (!assignment) return NextResponse.json({ error: 'Not assigned to this customer' }, { status: 403 })

    const now = new Date().toISOString()
    const { data: custRecord } = await (svc as any)
      .from('customers')
      .select('is_active, is_archived, membership_status, zoho_meeting_url, google_meet_url, meeting_url')
      .eq('id', customer_id)
      .single()

    if (custRecord && (custRecord.is_active === false || custRecord.is_archived === true)) {
      return NextResponse.json(
        { error: 'Customer is inactive and cannot receive new membership training sessions.' },
        { status: 403 }
      )
    }
    if (custRecord && custRecord.membership_status !== 'active') {
      return NextResponse.json(
        { error: 'Customer membership is inactive. Cannot schedule membership training session.' },
        { status: 403 }
      )
    }

    const meetingUrl =
      custRecord?.zoho_meeting_url ||
      custRecord?.google_meet_url ||
      custRecord?.meeting_url ||
      'https://meet.zoho.com/drfitveda-live'

    const { data: session, error } = await (svc as any)
      .from('training_sessions')
      .insert({
        customer_id,
        trainer_id: prof.id,
        scheduled_at: scheduled_at ?? null,
        notes: notes ?? null,
        meeting_url: meetingUrl,
        status: 'scheduled',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Audit log
    await (svc as any).from('audit_logs').insert({
      user_id: user.id,
      action: 'training_session.created',
      table_name: 'training_sessions',
      record_id: session.id,
      new_data: { customer_id, trainer_id: prof.id, scheduled_at },
    })

    // Schedule automated 15-minute WhatsApp reminders for customer & trainer
    const reminderRes = await syncSessionRemindersForTrainingSession(session)

    return NextResponse.json({ session, scheduledReminders: reminderRes.scheduled }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
