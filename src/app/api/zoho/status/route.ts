import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    const customers = mockDb.state.customers || []
    const customer = customers.find((c: any) => c.id === customerId || c.user_id === customerId)

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const meetingUrl = customer.zoho_meeting_url || customer.google_meet_url || customer.meeting_url || null

    return NextResponse.json({
      success: true,
      meeting_url: meetingUrl,
      provider: meetingUrl?.includes('zoho.com') ? 'zoho_meeting' : 'custom',
      meeting_key: customer.zoho_meeting_key || null,
      created_at: customer.zoho_meeting_created_at || customer.created_at,
      is_active: Boolean(meetingUrl),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
