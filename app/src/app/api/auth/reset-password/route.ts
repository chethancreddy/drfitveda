import { NextResponse } from 'next/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'

// In-memory OTP storage for reset requests
const activeResetOtps: Record<string, { otp: string; expiresAt: number }> = {}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { identifier, new_password, otp, action } = body

    if (!identifier) {
      return NextResponse.json({ error: 'User ID or Email is required' }, { status: 400 })
    }

    const key = identifier.toLowerCase().trim()

    // 1. Find user in MOCK_USERS, team_members, or user_profiles
    let foundUser: any = Object.values(MOCK_USERS).find(u =>
      u.email.toLowerCase() === key ||
      u.id.toLowerCase() === key ||
      u.phone.replace(/\s+/g, '') === key.replace(/\s+/g, '')
    )

    if (!foundUser && mockDb.state.team_members) {
      foundUser = mockDb.state.team_members.find((tm: any) =>
        tm.email.toLowerCase() === key ||
        tm.id.toLowerCase() === key ||
        tm.phone.replace(/\s+/g, '') === key.replace(/\s+/g, '')
      )
    }

    if (!foundUser) {
      // Default to customer account if generic identifier
      foundUser = MOCK_USERS.customer
    }

    // Action 1: Request OTP / Verification Code
    if (action === 'request_otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
      activeResetOtps[key] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      }

      return NextResponse.json({
        success: true,
        message: `Verification code generated for ${foundUser.email || foundUser.full_name}`,
        otp_preview: generatedOtp, // Provided for easy demo & localhost testing
        phone_hint: foundUser.phone ? `+91 ******${foundUser.phone.slice(-4)}` : 'SMS Gateway Ready',
      })
    }

    // Action 2: Reset Password
    if (action === 'reset_password' || new_password) {
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      // Update password in MOCK_USERS
      for (const roleKey of Object.keys(MOCK_USERS)) {
        if (
          MOCK_USERS[roleKey].email.toLowerCase() === key ||
          MOCK_USERS[roleKey].id.toLowerCase() === key ||
          MOCK_USERS[roleKey].phone.replace(/\s+/g, '') === key.replace(/\s+/g, '')
        ) {
          MOCK_USERS[roleKey].password = new_password
        }
      }

      // Clear any pending OTP
      delete activeResetOtps[key]

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      })
    }

    return NextResponse.json({ error: 'Invalid reset request' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password reset failed' }, { status: 500 })
  }
}
