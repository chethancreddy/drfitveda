import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleMeetService } from '@/lib/services/google-meet.service'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

export async function GET(request: Request) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    const config = GoogleMeetService.getConfigurationStatus()
    const authUrl = GoogleMeetService.getOAuthAuthorizationUrl()

    let customerMeeting: any = null
    if (customerId) {
      const customers = mockDb.state.customers || []
      const customer = customers.find((c: any) => c.id === customerId || c.user_id === customerId)
      if (customer) {
        const meetingUrl = customer.google_meet_url || customer.meeting_url || null
        customerMeeting = {
          customer_id: customer.id,
          meeting_url: meetingUrl,
          provider: 'google_meet',
          meeting_id: customer.meeting_id || null,
          calendar_event_id: customer.google_calendar_event_id || null,
          created_at: customer.google_meet_created_at || customer.created_at,
          historical_zoho_url: customer.historical_zoho_url || null,
          is_active: Boolean(meetingUrl),
        }
      }
    }

    return NextResponse.json({
      success: true,
      configuration: config,
      oauth_connect_url: authUrl,
      customer_meeting: customerMeeting,
      setup_instructions: {
        step1: 'Create a Project in Google Cloud Console (https://console.cloud.google.com).',
        step2: 'Enable the Google Calendar API under APIs & Services > Library.',
        step3: 'Configure OAuth Consent Screen with User Type External and scope https://www.googleapis.com/auth/calendar.events.',
        step4: `Create OAuth 2.0 Web Application credentials and add Authorized redirect URI: ${config.redirectUri}.`,
        step5: 'Save GOOGLE_MEET_CLIENT_ID, GOOGLE_MEET_CLIENT_SECRET, and click Connect Google Calendar in Admin Portal.',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

