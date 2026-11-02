import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleMeetService } from '@/lib/services/google-meet.service'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

// Backward-compatible endpoint: Replaces Zoho Meeting with Google Meet
export async function POST(request: Request) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customer_id,
      customer_name,
      customer_email,
      appointment_id,
      scheduled_at,
      duration_min,
      force_new = false,
    } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    let name = customer_name
    let email = customer_email

    if (!name) {
      const customers = mockDb.state.customers || []
      const customer = customers.find((c: any) => c.id === customer_id || c.user_id === customer_id)
      if (customer) {
        const userProfiles = mockDb.state.user_profiles || []
        const up = userProfiles.find((u: any) => u.id === customer.user_id)
        if (up) {
          name = up.full_name
          email = email || up.email
        }
      }
    }

    name = name || 'Customer'

    const result = await GoogleMeetService.getOrCreateCustomerMeeting({
      customerId: customer_id,
      customerName: name,
      customerEmail: email,
      appointmentId: appointment_id,
      scheduledAt: scheduled_at,
      durationMin: duration_min || 45,
      forceNew: force_new,
    })

    return NextResponse.json({ success: true, meeting: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
