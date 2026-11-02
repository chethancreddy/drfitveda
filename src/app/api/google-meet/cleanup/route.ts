import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleMeetService } from '@/lib/services/google-meet.service'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      appointment_id,
      session_id,
      customer_id,
      action = 'completed',
      reason,
    } = body

    if (!['completed', 'cancelled', 'rescheduled', 'retired'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid cleanup action. Allowed: completed, cancelled, rescheduled, retired' },
        { status: 400 }
      )
    }

    const result = await GoogleMeetService.cleanupMeeting({
      appointmentId: appointment_id,
      sessionId: session_id,
      customerId: customer_id,
      action,
      reason,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

