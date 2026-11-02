// ============================================================
// Dr Fit Veda — Meeting Service (Zoho to Google Meet Bridge)
// Delegates all meeting creation and management to GoogleMeetService.
// Fully backwards-compatible drop-in replacement.
// ============================================================

import { GoogleMeetService, GoogleMeetResult } from './google-meet.service'

export interface ZohoMeetingResult {
  success: boolean
  meeting_url: string
  meeting_key: string
  provider: 'zoho_meeting' | 'google_meet'
  customer_id: string
  customer_name: string
  created_at: string
  is_active: boolean
  error?: string
}

export class ZohoMeetingService {
  /**
   * Delegates token check to GoogleMeetService
   */
  public static async getAccessToken(): Promise<string | null> {
    return GoogleMeetService.getAccessToken()
  }

  /**
   * Create or Retrieve meeting room for a customer (Delegates to Google Meet)
   */
  public static async getOrCreateCustomerMeeting(params: {
    customerId: string
    customerName: string
    customerEmail?: string
    forceNew?: boolean
  }): Promise<ZohoMeetingResult> {
    const meetRes: GoogleMeetResult = await GoogleMeetService.getOrCreateCustomerMeeting(params)
    return {
      success: meetRes.success,
      meeting_url: meetRes.meeting_url,
      meeting_key: meetRes.meeting_code || meetRes.meeting_id,
      provider: 'google_meet',
      customer_id: meetRes.customer_id,
      customer_name: meetRes.customer_name,
      created_at: meetRes.created_at,
      is_active: meetRes.is_active,
      error: meetRes.error,
    }
  }

  /**
   * Admin: Update or replace meeting link manually
   */
  public static async updateCustomerMeetingUrl(customerId: string, newUrl: string) {
    return GoogleMeetService.updateCustomerMeetingUrl(customerId, newUrl)
  }
}
