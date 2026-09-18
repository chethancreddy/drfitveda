import { NextResponse } from 'next/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'

const pendingOtps: Record<string, { otp: string; expiresAt: number }> = {}

// ============================================================
// POST /api/auth/login-otp — Mobile OTP Based Login
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone_or_email, otp, action } = body

    if (!phone_or_email) {
      return NextResponse.json({ error: 'Phone number or Email is required' }, { status: 400 })
    }

    const key = phone_or_email.toLowerCase().replace(/\s+/g, '').trim()

    // 1. Send OTP
    if (action === 'send_otp') {
      const generatedOtp = '123456' // Default test OTP for instant local testing
      pendingOtps[key] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      }

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully to ${phone_or_email}`,
        otp_preview: generatedOtp,
        hint: 'Use test code 123456 or the code generated above',
      })
    }

    // 2. Verify OTP & Log in
    if (action === 'verify_otp') {
      if (!otp) {
        return NextResponse.json({ error: 'Please enter the 6-digit OTP code' }, { status: 400 })
      }

      const validOtp = pendingOtps[key]?.otp || '123456'
      if (otp !== validOtp && otp !== '123456') {
        return NextResponse.json({ error: 'Invalid or expired OTP code. Use test code 123456' }, { status: 400 })
      }

      // Find user
      let targetUser = Object.values(MOCK_USERS).find(u =>
        u.email.toLowerCase() === key ||
        u.phone.replace(/\s+/g, '') === key ||
        key.includes(u.role)
      )

      if (!targetUser && mockDb.state.team_members) {
        targetUser = mockDb.state.team_members.find((tm: any) =>
          tm.email.toLowerCase() === key ||
          tm.phone.replace(/\s+/g, '') === key
        )
      }

      if (!targetUser) {
        // Default to customer for new mobile numbers
        targetUser = MOCK_USERS.customer
      }

      let redirectTo = '/customer'
      if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(targetUser.role)) {
        redirectTo = '/admin'
      } else if (['doctor', 'trainer', 'nutritionist', 'yoga_doctor'].includes(targetUser.role)) {
        redirectTo = '/professional'
      }

      const sessionPayload = {
        user_id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        full_name: targetUser.full_name,
      }

      const response = NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        user: sessionPayload,
        redirectTo,
      })

      response.cookies.set('drf_session', JSON.stringify(sessionPayload), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 86400 * 7,
      })

      delete pendingOtps[key]
      return response
    }

    return NextResponse.json({ error: 'Invalid OTP action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OTP login failed' }, { status: 500 })
  }
}
