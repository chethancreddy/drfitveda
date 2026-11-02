import { NextRequest, NextResponse } from 'next/server'
import { GoogleMeetService } from '@/lib/services/google-meet.service'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = req.nextUrl.origin

  if (error || !code) {
    const errorMsg = error || 'Authorization code was not returned by Google.'
    return NextResponse.redirect(`${baseUrl}/admin/settings?google_meet_error=${encodeURIComponent(errorMsg)}`)
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const result = await GoogleMeetService.exchangeCodeForTokens(code, redirectUri)
  if (!result.success) {
    return NextResponse.redirect(
      `${baseUrl}/admin/settings?google_meet_error=${encodeURIComponent(result.error || 'Token exchange failed')}`
    )
  }

  return NextResponse.redirect(`${baseUrl}/admin/settings?google_meet_status=connected`)
}

