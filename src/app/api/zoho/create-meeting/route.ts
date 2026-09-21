import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ZohoMeetingService } from '@/lib/services/zoho-meeting.service'
import { mockDb } from '@/lib/mock-db'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customer_id,
      customer_name,
      customer_email,
      force_new = false,
    } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    // Resolve customer name if not provided
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

    name = name || 'Patient'

    const result = await ZohoMeetingService.getOrCreateCustomerMeeting({
      customerId: customer_id,
      customerName: name,
      customerEmail: email,
      forceNew: force_new,
    })

    return NextResponse.json({ success: true, meeting: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
