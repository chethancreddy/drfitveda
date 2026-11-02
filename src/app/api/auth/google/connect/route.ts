import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'
import { GoogleMeetService } from '@/lib/services/google-meet.service'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`
    const authUrl = GoogleMeetService.getOAuthAuthorizationUrl('admin_connect', redirectUri)
    return NextResponse.redirect(authUrl)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error generating Google OAuth URL' }, { status: 500 })
  }
}

