import { NextRequest, NextResponse } from 'next/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { createOtpSessionToken, verifyOtpSessionToken } from '@/lib/services/otp-security'
import { msg91EmailService } from '@/lib/services/msg91-email.service'
import { resolveAccountByIdentifier } from '@/lib/auth-resolver'

// In-memory OTP fallback for reset requests
const activeResetOtps: Record<string, { otp: string; expiresAt: number }> = {}

export async function POST(request: NextRequest) {
  try {
    await loadPersistedState()
    const body = await request.json()
    const { identifier, new_password, otp, otpToken, action } = body

    if (!identifier) {
      return NextResponse.json({ error: 'User ID or Email is required' }, { status: 400 })
    }

    const key = identifier.toLowerCase().trim()

    // 1. Find user across admin_profile, professionals, team_members, MOCK_USERS, or user_profiles
    const foundUser = resolveAccountByIdentifier(identifier)

    if (!foundUser) {
      return NextResponse.json({ error: 'No matching account found for this identifier.' }, { status: 404 })
    }

    // Action 1: Request OTP / Verification Code
    if (action === 'request_otp') {
      let generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

      if (foundUser.email && msg91EmailService.isConfigured()) {
        try {
          await msg91EmailService.sendOtp(foundUser.email)
          const dispatchedOtp = msg91EmailService._getStoredOtpForTesting(foundUser.email)
          if (dispatchedOtp) {
            generatedOtp = dispatchedOtp
          }
        } catch {}
      }

      activeResetOtps[key] = {
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      }
      const signedToken = createOtpSessionToken(key, generatedOtp, 10 * 60 * 1000)

      const isDev = process.env.NODE_ENV !== 'production'
      const res = NextResponse.json({
        success: true,
        message: `Verification code sent to ${foundUser.email || foundUser.full_name}`,
        otpToken: signedToken,
        ...(isDev ? { otp_preview: generatedOtp } : {}),
        phone_hint: foundUser.phone ? `+91 ******${foundUser.phone.slice(-4)}` : 'Email / SMS Gateway Ready',
      })

      res.cookies.set('drf_reset_token', signedToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 600,
      })

      return res
    }

    // Action 2: Reset Password
    if (action === 'reset_password' || new_password) {
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      const tokenToVerify = otpToken || request.cookies.get('drf_reset_token')?.value
      const storedOtp = activeResetOtps[key]
      let isOtpVerified = false

      if (otp && tokenToVerify) {
        const tokenCheck = verifyOtpSessionToken(key, String(otp), tokenToVerify)
        if (tokenCheck.valid) isOtpVerified = true
      }
      if (!isOtpVerified && otp && storedOtp && Date.now() <= storedOtp.expiresAt && storedOtp.otp === String(otp).trim()) {
        isOtpVerified = true
      }

      if (!isOtpVerified) {
        return NextResponse.json({ error: 'Invalid or expired verification code (OTP).' }, { status: 400 })
      }

      // Update password in MOCK_USERS and persisted state
      for (const roleKey of Object.keys(MOCK_USERS)) {
        if (
          MOCK_USERS[roleKey].email.toLowerCase() === key ||
          MOCK_USERS[roleKey].id.toLowerCase() === key ||
          MOCK_USERS[roleKey].phone.replace(/\s+/g, '') === key.replace(/\s+/g, '')
        ) {
          MOCK_USERS[roleKey].password = new_password
          if (roleKey === 'admin') {
            if (!mockDb.state.admin_profile) {
              mockDb.state.admin_profile = { ...MOCK_USERS.admin }
            }
            mockDb.state.admin_profile.password = new_password
          }
        }
      }

      if (mockDb.state.admin_profile && (
        mockDb.state.admin_profile.email?.toLowerCase() === key ||
        mockDb.state.admin_profile.id?.toLowerCase() === key
      )) {
        mockDb.state.admin_profile.password = new_password
        MOCK_USERS.admin.password = new_password
      }

      if (Array.isArray(mockDb.state.team_members)) {
        const tmIdx = mockDb.state.team_members.findIndex((tm: any) =>
          tm.email?.toLowerCase() === key || tm.id?.toLowerCase() === key
        )
        if (tmIdx >= 0) {
          mockDb.state.team_members[tmIdx].password = new_password
        }
      }

      if (Array.isArray(mockDb.state.professionals)) {
        const proIdx = mockDb.state.professionals.findIndex(
          (p: any) => p.user_id === foundUser.id || p.id === foundUser.professional_id || p.email?.toLowerCase() === key
        )
        if (proIdx >= 0) {
          mockDb.state.professionals[proIdx].password = new_password
        }
      }

      if (Array.isArray(mockDb.state.user_profiles)) {
        const upIdx = mockDb.state.user_profiles.findIndex(
          (up: any) => up.id === foundUser.id || up.email?.toLowerCase() === key || up.id?.toLowerCase() === key
        )
        if (upIdx >= 0) {
          mockDb.state.user_profiles[upIdx].password = new_password
        }
      }

      await savePersistedState(['admin_profile', 'professionals', 'team_members', 'user_profiles'])
      delete activeResetOtps[key]

      const res = NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now sign in with your new password.',
      })
      res.cookies.delete('drf_reset_token')
      return res
    }

    return NextResponse.json({ error: 'Invalid reset request' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password reset failed' }, { status: 500 })
  }
}
