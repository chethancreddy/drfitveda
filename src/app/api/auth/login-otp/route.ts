import { NextRequest, NextResponse } from 'next/server'
import {
  normalizeIdentifier,
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
  isIpRateLimited,
} from '@/lib/services/otp-security'
import { msg91EmailService } from '@/lib/services/msg91-email.service'
import { msg91WhatsAppService } from '@/lib/services/msg91-whatsapp.service'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'

// ============================================================
// POST /api/auth/login-otp — MSG91 OTP Authentication Engine
// Supports: WhatsApp OTP & Email OTP Login
// Actions: send_otp, resend_otp, verify_otp
// Security: Enforces rate limits, 60s cooldown, brute-force
// lockout, account preservation, and blocks OTP admin escalation.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'

    // 1. IP Throttling check
    if (isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests from this network. Please wait a few minutes before trying again.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { identifier, email, phone, phone_or_email, mobile, otp, action, channel } = body
    const rawInput = String(identifier || email || phone || phone_or_email || mobile || '').trim()

    // Determine preferred delivery channel: 'whatsapp' | 'email'
    let targetChannel: 'email' | 'whatsapp' | undefined = undefined
    if (channel === 'whatsapp' || channel === 'email') {
      targetChannel = channel
    } else if (phone || mobile) {
      targetChannel = 'whatsapp'
    } else if (email) {
      targetChannel = 'email'
    }

    // 2. Validate & Normalize
    const norm = normalizeIdentifier(rawInput, targetChannel)
    if (!norm.isValid) {
      return NextResponse.json(
        { error: norm.error || 'Please enter a valid registered email address or mobile number.' },
        { status: 400 }
      )
    }

    // ─── ACTION: SEND_OTP or RESEND_OTP ─────────────────────────
    if (action === 'send_otp' || action === 'resend_otp') {
      // Check cooldown and hourly rate limits
      const eligibility = checkOtpSendEligibility(norm.normalized)
      if (!eligibility.allowed) {
        return NextResponse.json(
          {
            error: eligibility.error,
            cooldownRemaining: eligibility.cooldownRemaining || 0,
          },
          { status: 429 }
        )
      }

      // Dispatch via WhatsApp if mobile, or Email if email address
      if (norm.type === 'phone') {
        const result = await msg91WhatsAppService.sendOtp(norm.normalized)

        if (!result.success) {
          const status = result.templateNeeded ? 503 : 502
          return NextResponse.json(
            {
              error: result.message,
              templateNeeded: result.templateNeeded || false,
            },
            { status }
          )
        }

        // Record successful dispatch for rate-limiting & 60s cooldown
        recordOtpSend(norm.normalized)

        const response = NextResponse.json({
          success: true,
          message: result.message,
          type: 'whatsapp',
          display: norm.display,
          cooldownSeconds: 60,
          requestId: result.requestId,
          otpToken: result.otpToken,
        })

        if (result.otpToken) {
          response.cookies.set('drf_otp_token', result.otpToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300,
          })
        }

        return response
      } else {
        // Dispatch via MSG91 Email Service
        const result = await msg91EmailService.sendOtp(norm.normalized)

        if (!result.success) {
          return NextResponse.json({ error: result.message }, { status: 502 })
        }

        // Record successful dispatch for rate-limiting & 60s cooldown
        recordOtpSend(norm.normalized)

        const response = NextResponse.json({
          success: true,
          message: result.message,
          type: 'email',
          display: norm.display,
          cooldownSeconds: 60,
          devMode: result.devMode || false,
          otpToken: result.otpToken,
        })

        if (result.otpToken) {
          response.cookies.set('drf_otp_token', result.otpToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 300,
          })
        }

        return response
      }
    }

    // ─── ACTION: VERIFY_OTP ─────────────────────────────────────
    if (action === 'verify_otp') {
      const cleanOtp = String(otp || '').trim()
      if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 })
      }

      const otpToken = req.cookies.get('drf_otp_token')?.value || body.otpToken

      // Verify with the appropriate MSG91 channel service
      let verifyResult: { success: boolean; message: string }
      if (norm.type === 'phone') {
        verifyResult = await msg91WhatsAppService.verifyOtp(norm.normalized, cleanOtp, otpToken)
      } else {
        verifyResult = await msg91EmailService.verifyOtp(norm.normalized, cleanOtp, otpToken)
      }

      if (!verifyResult.success) {
        const failure = recordOtpFailure(norm.normalized)
        if (failure.locked) {
          return NextResponse.json(
            { error: 'Maximum verification attempts exceeded. Access is temporarily locked for 15 minutes.' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: `${verifyResult.message} (${failure.attemptsLeft} attempts remaining)` },
          { status: 400 }
        )
      }

      // Success: Reset failed attempts
      recordOtpSuccess(norm.normalized)

      // ─── USER IDENTIFICATION & ACCOUNT MAPPING ─────────────────
      await loadPersistedState()
      let targetUser: any = null

      // 1. Check persisted Admin Profile first
      if (mockDb.state.admin_profile) {
        const ap = mockDb.state.admin_profile
        if (norm.type === 'email' && ap.email && ap.email.toLowerCase() === norm.normalized.toLowerCase()) {
          targetUser = {
            id: ap.id || MOCK_USERS.admin.id,
            role: ap.role || 'admin',
            full_name: ap.full_name || MOCK_USERS.admin.full_name,
            email: ap.email,
            phone: ap.phone || MOCK_USERS.admin.phone,
          }
        } else if (norm.type === 'phone' && ap.phone) {
          const apPhoneNorm = normalizeIdentifier(ap.phone, 'whatsapp').normalized
          if (apPhoneNorm && apPhoneNorm === norm.normalized) {
            targetUser = {
              id: ap.id || MOCK_USERS.admin.id,
              role: ap.role || 'admin',
              full_name: ap.full_name || MOCK_USERS.admin.full_name,
              email: ap.email || MOCK_USERS.admin.email,
              phone: ap.phone,
            }
          }
        }
      }

      // 2. Check core MOCK_USERS (admin, doctor, trainer, coordinator, customer)
      if (!targetUser) {
        if (norm.type === 'email') {
          targetUser = Object.values(MOCK_USERS).find(
            u => u.email.toLowerCase() === norm.normalized.toLowerCase()
          ) || null
        } else {
          targetUser = Object.values(MOCK_USERS).find(u => {
            if (!u.phone) return false
            const userPhoneNorm = normalizeIdentifier(u.phone, 'whatsapp').normalized
            return userPhoneNorm === norm.normalized
          }) || null
        }
      }

      // 3. Check persisted team_members
      if (!targetUser && Array.isArray(mockDb.state.team_members)) {
        const tmMatch = mockDb.state.team_members.find((m: any) => {
          if (norm.type === 'email') {
            return m.email && m.email.toLowerCase() === norm.normalized.toLowerCase()
          }
          if (!m.phone) return false
          return normalizeIdentifier(m.phone, 'whatsapp').normalized === norm.normalized
        })
        if (tmMatch) {
          targetUser = {
            id: tmMatch.user_id || tmMatch.id,
            role: tmMatch.role || 'care_coordinator',
            full_name: tmMatch.full_name,
            email: tmMatch.email || `${norm.normalized}@users.drfitveda.com`,
            phone: tmMatch.phone || '',
          }
        }
      }

      // 4. Check persisted user_profiles
      if (!targetUser && Array.isArray(mockDb.state.user_profiles)) {
        const profileMatch = mockDb.state.user_profiles.find((p: any) => {
          if (norm.type === 'email') {
            return p.email && p.email.toLowerCase() === norm.normalized.toLowerCase()
          }
          if (!p.phone) return false
          const pPhoneNorm = normalizeIdentifier(p.phone, 'whatsapp').normalized
          return pPhoneNorm === norm.normalized
        })
        if (profileMatch) {
          targetUser = {
            id: profileMatch.id,
            role: profileMatch.role || 'customer',
            full_name: profileMatch.full_name || 'Member',
            email: profileMatch.email || (norm.type === 'email' ? norm.normalized : `${norm.normalized}@users.drfitveda.com`),
            phone: profileMatch.phone || '',
          }
        }
      }

      // 5. Auto-provision new customer if no existing account matched
      if (!targetUser) {
        const newUserId = `u-otp-${Date.now()}`
        const newEmail = norm.type === 'email' ? norm.normalized : `${norm.normalized}@users.drfitveda.com`
        const newPhone = norm.type === 'phone' ? (norm.e164Phone || '') : ''

        targetUser = {
          id: newUserId,
          role: 'customer',
          full_name: 'Customer',
          email: newEmail,
          phone: newPhone,
        }

        if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
        mockDb.state.user_profiles.push({
          id: newUserId,
          role: 'customer',
          full_name: 'Customer',
          email: newEmail,
          phone: newPhone,
          is_active: true,
          created_at: new Date().toISOString(),
        })

        if (!mockDb.state.customers) mockDb.state.customers = []
        mockDb.state.customers.push({
          id: `c-otp-${Date.now()}`,
          user_id: newUserId,
          membership_status: 'inactive',
          is_active: true,
          created_at: new Date().toISOString(),
        })

        await savePersistedState(['user_profiles', 'customers'])
      }

      // Determine appropriate landing portal (Admin, Professional, or Customer)
      let redirectTo = '/customer'
      if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(targetUser.role)) {
        redirectTo = '/admin'
      } else if ([
        'doctor',
        'trainer',
        'nutritionist',
        'yoga_doctor',
        'yoga_consultant',
        'naturopathy_doctor',
        'ayurveda_doctor',
        'physiotherapist',
        'wellness_coach',
        'doctor_lead',
        'trainer_lead',
      ].includes(targetUser.role)) {
        redirectTo = '/professional'
      }

      // Create secure user session payload
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

      // Set HttpOnly, SameSite=Lax session cookie
      response.cookies.set('drf_session', JSON.stringify(sessionPayload), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 86400 * 7, // 7 days
      })

      // Invalidate consumed OTP session cookie
      response.cookies.delete('drf_otp_token')

      return response
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OTP verification failed. Please try again.' }, { status: 500 })
  }
}
