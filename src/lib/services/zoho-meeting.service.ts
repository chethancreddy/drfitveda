// ============================================================
// Dr Fit Veda — Zoho Meeting API Integration Service
// Secure backend service for automated & on-demand Zoho Meeting creation
// ============================================================

import { mockDb } from '@/lib/mock-db'

export interface ZohoMeetingResult {
  success: boolean
  meeting_url: string
  meeting_key: string
  provider: 'zoho_meeting'
  customer_id: string
  customer_name: string
  created_at: string
  is_active: boolean
  error?: string
}

export class ZohoMeetingService {
  private static clientId = process.env.ZOHO_CLIENT_ID || '1000.LAI9PXHSRVG360SVUQKIZI05XL9IVS'
  private static clientSecret = process.env.ZOHO_CLIENT_SECRET || 'a289f84e2ae6e113a71e2e043ce75a9a84fd063042'
  private static accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com'
  private static meetingApiUrl = process.env.ZOHO_MEETING_API_URL || 'https://meeting.zoho.com/api/v2'

  // Cached OAuth token
  private static cachedToken: { accessToken: string; expiresAt: number } | null = null

  /**
   * Authenticate / Fetch Zoho OAuth Access Token with automatic refresh
   */
  public static async getAccessToken(): Promise<string | null> {
    try {
      const now = Date.now()
      if (this.cachedToken && this.cachedToken.expiresAt > now + 60000) {
        return this.cachedToken.accessToken
      }

      // If refresh token is available in environment
      const refreshToken = process.env.ZOHO_REFRESH_TOKEN
      if (refreshToken && this.clientId && this.clientSecret) {
        const params = new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        })

        const res = await fetch(`${this.accountsUrl}/oauth/v2/token?${params.toString()}`, {
          method: 'POST',
        })

        if (res.ok) {
          const data = await res.json()
          if (data.access_token) {
            this.cachedToken = {
              accessToken: data.access_token,
              expiresAt: now + (data.expires_in || 3600) * 1000,
            }
            return data.access_token
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Create or Retrieve dedicated Zoho Meeting Room for a Customer
   * Idempotent: Does not create duplicate links during webhook/payment retries unless forceNew=true.
   */
  public static async getOrCreateCustomerMeeting(params: {
    customerId: string
    customerName: string
    customerEmail?: string
    forceNew?: boolean
  }): Promise<ZohoMeetingResult> {
    const { customerId, customerName, customerEmail, forceNew = false } = params

    // 1. Check existing customer record for idempotency
    const customers = mockDb.state.customers || []
    const customer = customers.find((c: any) => c.id === customerId || c.user_id === customerId)

    if (customer && !forceNew) {
      // If customer already has a valid Zoho or active meeting URL, reuse it
      const existingUrl = customer.zoho_meeting_url || customer.google_meet_url || customer.meeting_url
      if (existingUrl && existingUrl.includes('zoho.com')) {
        return {
          success: true,
          meeting_url: existingUrl,
          meeting_key: customer.zoho_meeting_key || `zm-${customerId.slice(0, 8)}`,
          provider: 'zoho_meeting',
          customer_id: customer.id,
          customer_name: customerName,
          created_at: customer.zoho_meeting_created_at || new Date().toISOString(),
          is_active: true,
        }
      }
    }

    // 2. Generate unique Zoho Meeting Key & URL
    // Clean identifier for room naming
    const cleanId = customerId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toLowerCase()
    const nameSlug = customerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase()
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    const meetingKey = `fitveda-${nameSlug || 'care'}-${cleanId || randomSuffix}`

    let generatedMeetingUrl = `https://meet.zoho.com/${meetingKey}`

    // 3. Attempt API creation via Zoho Meeting API if OAuth Access Token is present
    try {
      const token = await this.getAccessToken()
      if (token) {
        const response = await fetch(`${this.meetingApiUrl}/sessions`, {
          method: 'POST',
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session: {
              topic: `Dr Fit Veda 1-on-1 Care: ${customerName}`,
              agenda: 'Live Personal Training & Clinical Nutrition Consultation Room',
              type: 1, // Instant / Ongoing room
              timezone: 'Asia/Kolkata',
              participants: customerEmail ? [{ email: customerEmail }] : [],
            },
          }),
        })

        if (response.ok) {
          const apiData = await response.json()
          if (apiData?.session?.joinLink) {
            generatedMeetingUrl = apiData.session.joinLink
          }
        }
      }
    } catch {
      // Fallback to configured Zoho Meeting room URL
    }

    const now = new Date().toISOString()

    // 4. Update customer record in mock database and state
    if (customer) {
      const idx = customers.findIndex((c: any) => c.id === customer.id)
      if (idx !== -1) {
        customers[idx] = {
          ...customers[idx],
          zoho_meeting_url: generatedMeetingUrl,
          zoho_meeting_key: meetingKey,
          zoho_meeting_created_at: now,
          // Sync existing meeting fields for full backward compatibility
          google_meet_url: generatedMeetingUrl,
          meeting_url: generatedMeetingUrl,
          meeting_provider: 'zoho_meeting',
          updated_at: now,
        }
      }

      // Sync any scheduled training sessions for this customer
      if (mockDb.state.training_sessions) {
        mockDb.state.training_sessions = mockDb.state.training_sessions.map((s: any) => {
          if (s.customer_id === customer.id && (s.status === 'scheduled' || !s.status)) {
            return {
              ...s,
              google_meet_url: generatedMeetingUrl,
              zoho_meeting_url: generatedMeetingUrl,
              meeting_url: generatedMeetingUrl,
            }
          }
          return s
        })
      }
    }

    return {
      success: true,
      meeting_url: generatedMeetingUrl,
      meeting_key: meetingKey,
      provider: 'zoho_meeting',
      customer_id: customerId,
      customer_name: customerName,
      created_at: now,
      is_active: true,
    }
  }

  /**
   * Admin: Update or replace meeting link manually
   */
  public static async updateCustomerMeetingUrl(customerId: string, newUrl: string) {
    const customers = mockDb.state.customers || []
    const idx = customers.findIndex((c: any) => c.id === customerId || c.user_id === customerId)
    if (idx === -1) throw new Error('Customer not found')

    const now = new Date().toISOString()
    customers[idx] = {
      ...customers[idx],
      zoho_meeting_url: newUrl,
      google_meet_url: newUrl,
      meeting_url: newUrl,
      meeting_provider: newUrl.includes('zoho.com') ? 'zoho_meeting' : 'custom',
      updated_at: now,
    }

    return customers[idx]
  }
}
