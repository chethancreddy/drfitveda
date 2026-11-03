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
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { resolveAccountByIdentifier, getDashboardForRole, normalizePhoneForMatch } from '@/lib/auth-resolver'

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
    const { identifier, email, phone, phone_or_email, mobile, otp, action, channel, country_code } = body
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

    // 2. Validate & Normalize (with international calling code support)
    const norm = normalizeIdentifier(rawInput, targetChannel, country_code)
    if (!norm.isValid) {
      return NextResponse.json(
        { error: norm.error || 'Please enter a valid registered email address or mobile number.' },
        { status: 400 }
      )
    }

    // ─── ACCOUNT REGISTRATION VALIDATION ─────────────────────────
    // Only registered users can sign in. Unregistered identifiers are blocked
    // from initiating or verifying OTP logins.
    await loadPersistedState()
    const existingAccount = resolveAccountByIdentifier(norm.normalized)

    // Check if account has been deactivated or archived
    if (existingAccount) {
      const uProfiles = mockDb.state.user_profiles || []
      const matchedDeactivated = uProfiles.find(
        (up: any) => up.id === existingAccount.id && (up.is_active === false || up.is_archived === true)
      )
      if (matchedDeactivated) {
        return NextResponse.json(
          { error: 'This account has been deactivated or removed. Please contact DrFitVeda administration.' },
          { status: 403 }
        )
      }
    } else {
      // Identifier is NOT registered
      // Check if there is an uncompleted pending registration
      const pendingRegs = Array.isArray(mockDb.state.pending_registrations) ? mockDb.state.pending_registrations : []
      const pending = pendingRegs.find((p: any) => {
        if (norm.type === 'phone') {
          return p.canonical_phone === norm.normalized || normalizePhoneForMatch(p.phone) === norm.normalized
        }
        return p.email?.toLowerCase() === norm.normalized.toLowerCase()
      })

      if (pending) {
        return NextResponse.json(
          {
            error: 'Your account registration is pending verification. Please complete verification on the signup page.',
            code: 'PENDING_VERIFICATION',
            pendingVerification: true,
            registrationId: pending.id,
          },
          { status: 403 }
        )
      }

      const notRegisteredMsg =
        norm.type === 'phone'
          ? 'Your mobile number is not registered with DrFitVeda. Please create an account to continue.'
          : 'Your email address is not registered with DrFitVeda. Please create an account to continue.'

      return NextResponse.json(
        {
          error: notRegisteredMsg,
          code: 'NOT_REGISTERED',
          notRegistered: true,
        },
        { status: 404 }
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

      // Block login if user profile or customer record has been deactivated or archived
      const uProfiles = mockDb.state.user_profiles || []
      const allCustomers = mockDb.state.customers || []
      const matchedDeactivatedProfile = uProfiles.find((up: any) => {
        const emailMatch = norm.type === 'email' && up.email?.toLowerCase() === norm.normalized.toLowerCase()
        const phoneMatch =
          norm.type === 'phone' &&
          up.phone &&
          (up.phone.replace(/\D/g, '') === norm.normalized ||
            up.phone.replace(/\D/g, '').endsWith(norm.normalized.slice(-10)))
        return (emailMatch || phoneMatch) && (up.is_active === false || up.is_archived === true)
      })

      const matchedDeactivatedCustomer = allCustomers.find((c: any) => {
        const up = uProfiles.find((u: any) => u.id === c.user_id)
        const emailMatch =
          norm.type === 'email' &&
          (c.email?.toLowerCase() === norm.normalized.toLowerCase() ||
            up?.email?.toLowerCase() === norm.normalized.toLowerCase())
        const phoneMatch =
          norm.type === 'phone' &&
          ((c.phone &&
            (c.phone.replace(/\D/g, '') === norm.normalized ||
              c.phone.replace(/\D/g, '').endsWith(norm.normalized.slice(-10)))) ||
            (up?.phone &&
              (up.phone.replace(/\D/g, '') === norm.normalized ||
                up.phone.replace(/\D/g, '').endsWith(norm.normalized.slice(-10)))))
        return (emailMatch || phoneMatch) && (c.is_active === false || c.is_archived === true)
      })

      if (matchedDeactivatedProfile || matchedDeactivatedCustomer) {
        return NextResponse.json(
          { error: 'This account has been deactivated or removed. Please contact DrFitVeda administration.' },
          { status: 403 }
        )
      }

      let targetUser: any = resolveAccountByIdentifier(norm.normalized)

      // Only registered customers can sign in. Do NOT auto-provision unregistered accounts.
      if (!targetUser) {
        const notRegisteredMsg =
          norm.type === 'phone'
            ? 'Your mobile number is not registered with DrFitVeda. Please create an account to continue.'
            : 'Your email address is not registered with DrFitVeda. Please create an account to continue.'

        return NextResponse.json(
          {
            error: notRegisteredMsg,
            code: 'NOT_REGISTERED',
            notRegistered: true,
          },
          { status: 404 }
        )
      } else if (targetUser.source === 'professionals') {
        // Persist reconciled user_profiles so the professional's profile stays in sync in Supabase
        await savePersistedState(['user_profiles', 'professionals'])
      }

      // Determine appropriate landing portal (Admin -> /admin, Doctor/Trainer -> /professional, Customer -> /customer)
      const redirectTo = getDashboardForRole(targetUser.role)

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
