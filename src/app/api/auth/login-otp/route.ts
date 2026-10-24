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

        return NextResponse.json({
          success: true,
          message: result.message,
          type: 'whatsapp',
          display: norm.display,
          cooldownSeconds: 60,
          requestId: result.requestId,
        })
      } else {
        // Dispatch via MSG91 Email Service
        const result = await msg91EmailService.sendOtp(norm.normalized)

        if (!result.success) {
          return NextResponse.json({ error: result.message }, { status: 502 })
        }

        // Record successful dispatch for rate-limiting & 60s cooldown
        recordOtpSend(norm.normalized)

        return NextResponse.json({
          success: true,
          message: result.message,
          type: 'email',
          display: norm.display,
          cooldownSeconds: 60,
          devMode: result.devMode || false,
        })
      }
    }

    // ─── ACTION: VERIFY_OTP ─────────────────────────────────────
    if (action === 'verify_otp') {
      const cleanOtp = String(otp || '').trim()
      if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 })
      }

      // Verify with the appropriate MSG91 channel service
      let verifyResult: { success: boolean; message: string }
      if (norm.type === 'phone') {
        verifyResult = await msg91WhatsAppService.verifyOtp(norm.normalized, cleanOtp)
      } else {
        verifyResult = await msg91EmailService.verifyOtp(norm.normalized, cleanOtp)
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
      let targetUser: any = null
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

      if (!isPlaceholder) {
        try {
          const svc = await createServiceRoleClient()

          if (norm.type === 'email') {
            // Search user_profiles / auth by email
            const { data: profile } = await (svc as any)
              .from('user_profiles')
              .select('id, role, full_name, phone, is_active')
              .ilike('email', norm.normalized)
              .single()

            if (profile) {
              targetUser = {
                id: profile.id,
                role: profile.role,
                full_name: profile.full_name || 'Member',
                email: norm.normalized,
                phone: profile.phone || '',
              }
            }
          } else {
            // Search user_profiles by phone (checking e164, normalized, and display)
            const phoneQueries = [
              norm.e164Phone,
              norm.normalized,
              norm.display,
              norm.e164Phone ? norm.e164Phone.replace('+', '') : '',
            ].filter(Boolean)

            const { data: profile } = await (svc as any)
              .from('user_profiles')
              .select('id, role, full_name, phone, is_active')
              .or(phoneQueries.map(p => `phone.eq.${p}`).join(','))
              .single()

            if (profile) {
              targetUser = {
                id: profile.id,
                role: profile.role,
                full_name: profile.full_name || 'Member',
                email: `${norm.normalized}@users.drfitveda.com`,
                phone: profile.phone,
              }
            }
          }

          // If no existing account found, provision a new customer
          if (!targetUser) {
            const newUserId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `u-${Date.now()}`
            const userEmail = norm.type === 'email' ? norm.normalized : `${norm.normalized}@users.drfitveda.com`
            const userPhone = norm.type === 'phone' ? norm.e164Phone : null

            await (svc as any).from('user_profiles').insert({
              id: newUserId,
              role: 'customer',
              full_name: 'Customer',
              phone: userPhone,
              is_active: true,
            })

            await (svc as any).from('customers').insert({
              user_id: newUserId,
              membership_status: 'inactive',
              is_active: true,
            })

            targetUser = {
              id: newUserId,
              role: 'customer',
              full_name: 'Customer',
              email: userEmail,
              phone: userPhone || '',
            }
          }
        } catch {
          // If error during DB query, fallback to mock user matching
        }
      }

      // Local / Mock fallback lookup
      if (!targetUser) {
        if (norm.type === 'email') {
          targetUser = Object.values(MOCK_USERS).find(u => u.email.toLowerCase() === norm.normalized)
        } else {
          targetUser = Object.values(MOCK_USERS).find(u => {
            if (!u.phone) return false
            const userPhoneNorm = normalizeIdentifier(u.phone, 'whatsapp').normalized
            return userPhoneNorm === norm.normalized
          })
        }

        // Search mockDb user_profiles
        if (!targetUser && mockDb.state.user_profiles) {
          const profileMatch = mockDb.state.user_profiles.find((p: any) => {
            if (norm.type === 'email') {
              return p.email && p.email.toLowerCase() === norm.normalized
            }
            if (!p.phone) return false
            const pPhoneNorm = normalizeIdentifier(p.phone, 'whatsapp').normalized
            return pPhoneNorm === norm.normalized
          })
          if (profileMatch) {
            targetUser = {
              id: profileMatch.id,
              role: profileMatch.role,
              full_name: profileMatch.full_name,
              email: norm.type === 'email' ? norm.normalized : `${norm.normalized}@users.drfitveda.com`,
              phone: profileMatch.phone,
            }
          }
        }

        // New customer default if no user matched
        if (!targetUser) {
          const newUserId = `u-otp-${Date.now()}`
          targetUser = {
            id: newUserId,
            role: 'customer',
            full_name: 'Customer',
            email: norm.type === 'email' ? norm.normalized : `${norm.normalized}@users.drfitveda.com`,
            phone: norm.type === 'phone' ? (norm.e164Phone || '') : '',
          }
          if (mockDb.state.user_profiles) {
            mockDb.state.user_profiles.push({
              id: newUserId,
              role: 'customer',
              full_name: 'Customer',
              email: targetUser.email,
              phone: targetUser.phone,
              is_active: true,
            })
          }
        }
      }

      // ─── CRITICAL SECURITY CHECK: ADMIN ESCALATION PROHIBITION ──
      // Requirement: Do not allow WhatsApp or Email OTP verification alone to grant administrative privileges.
      if (['admin', 'super_admin', 'operations_manager'].includes(targetUser.role)) {
        return NextResponse.json(
          {
            error: 'Administrative accounts require password authentication. Please use the "User ID & Password" tab to sign in.',
            requiresPasswordAuth: true,
          },
          { status: 403 }
        )
      }

      // Determine appropriate landing portal
      let redirectTo = '/customer'
      if (['doctor', 'trainer', 'nutritionist', 'yoga_doctor', 'naturopathy_doctor'].includes(targetUser.role)) {
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

      return response
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'OTP verification failed. Please try again.' }, { status: 500 })
  }
}
