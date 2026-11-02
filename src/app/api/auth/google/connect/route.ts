import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'
import { GoogleMeetService } from '@/lib/services/google-meet.service'
import { loadPersistedState } from '@/lib/persistent-store'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    await loadPersistedState()

    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`
    const clientId = GoogleMeetService.clientId

    if (!clientId) {
      return NextResponse.redirect(
        new URL(
          '/admin/settings?google_meet_error=' +
            encodeURIComponent('Missing GOOGLE_MEET_CLIENT_ID. Please enter your Google Client ID in Settings or Vercel Environment Variables.'),
          req.url
        )
      )
    }

    const authUrl = GoogleMeetService.getOAuthAuthorizationUrl('admin_connect', redirectUri)
    return NextResponse.redirect(authUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating Google OAuth URL' }, { status: 500 })
  }
}

