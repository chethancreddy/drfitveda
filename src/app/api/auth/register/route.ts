import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import {
  resolveAccountByIdentifier,
  normalizePhoneForMatch,
  getDashboardForRole,
} from '@/lib/auth-resolver'
import { validateInternationalPhone } from '@/lib/country-codes'
import { GoogleMeetService } from '@/lib/services/google-meet.service'
import { msg91EmailService } from '@/lib/services/msg91-email.service'
import { msg91WhatsAppService } from '@/lib/services/msg91-whatsapp.service'
import {
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
} from '@/lib/services/otp-security'

// ============================================================
// POST /api/auth/register — Patient / Customer Sign Up API
// Supports:
//   - Action: 'initiate' (Validate 6 mandatory fields, check duplicates, create pending registration, dispatch email & WhatsApp OTP)
//   - Action: 'verify_otp' (Verify Email or WhatsApp OTP, activate account when verified, issue session)
//   - Action: 'resend_otp' (Resend Email or WhatsApp OTP with cooldown)
// ============================================================

export const ALLOWED_GENDERS = ['Male', 'Female', 'Others'] as const
export type AllowedGender = (typeof ALLOWED_GENDERS)[number]

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export async function POST(req: NextRequest) {
  try {
    await loadPersistedState()

    const body = await req.json().catch(() => ({}))
    const {
      action,
      registrationId,
      type,
      otp,
      otpToken,
      first_name,
      last_name,
      date_of_birth,
      gender,
      email,
      phone,
      country_code,
    } = body

    // ─── ACTION: RESEND_OTP FOR PENDING REGISTRATION ────────────
    if (action === 'resend_otp') {
      const pendingRegs = Array.isArray(mockDb.state.pending_registrations) ? mockDb.state.pending_registrations : []
      const pending = pendingRegs.find((p: any) => p.id === registrationId)

      if (!pending) {
        return NextResponse.json(
          { error: 'Registration session expired or not found. Please restart signup.', code: 'SESSION_EXPIRED' },
          { status: 404 }
        )
      }

      const targetType = type === 'email' ? 'email' : 'whatsapp'
      const targetIdentifier = targetType === 'email' ? pending.email : pending.canonical_phone

      const eligibility = checkOtpSendEligibility(targetIdentifier)
      if (!eligibility.allowed) {
        return NextResponse.json(
          { error: eligibility.error, cooldownRemaining: eligibility.cooldownRemaining || 0 },
          { status: 429 }
        )
      }

      if (targetType === 'whatsapp') {
        const sendRes = await msg91WhatsAppService.sendOtp(pending.canonical_phone)
        if (!sendRes.success) {
          return NextResponse.json({ error: sendRes.message }, { status: 502 })
        }
        recordOtpSend(pending.canonical_phone)
        return NextResponse.json({
          success: true,
          message: `Fresh verification code dispatched to WhatsApp (${pending.phone}).`,
          type: 'whatsapp',
          cooldownSeconds: 60,
          otpToken: sendRes.otpToken,
        })
      } else {
        const sendRes = await msg91EmailService.sendOtp(pending.email)
        if (!sendRes.success) {
          return NextResponse.json({ error: sendRes.message }, { status: 502 })
        }
        recordOtpSend(pending.email)
        return NextResponse.json({
          success: true,
          message: `Fresh verification code dispatched to ${pending.email}.`,
          type: 'email',
          cooldownSeconds: 60,
          otpToken: sendRes.otpToken,
        })
      }
    }

    // ─── ACTION: VERIFY_OTP FOR PENDING REGISTRATION ────────────
    if (action === 'verify_otp') {
      const pendingRegs = Array.isArray(mockDb.state.pending_registrations) ? mockDb.state.pending_registrations : []
      const pendingIndex = pendingRegs.findIndex((p: any) => p.id === registrationId)

      if (pendingIndex === -1) {
        return NextResponse.json(
          { error: 'Registration session expired or not found. Please sign up again.', code: 'SESSION_EXPIRED' },
          { status: 404 }
        )
      }

      const pending = pendingRegs[pendingIndex]
      const cleanOtp = String(otp || '').trim()

      if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return NextResponse.json({ error: 'Please enter the 6-digit verification code.' }, { status: 400 })
      }

      const targetType = type === 'email' ? 'email' : 'whatsapp'
      const targetIdentifier = targetType === 'email' ? pending.email : pending.canonical_phone

      let verifyRes: { success: boolean; message: string }
      if (targetType === 'whatsapp') {
        verifyRes = await msg91WhatsAppService.verifyOtp(pending.canonical_phone, cleanOtp, otpToken)
      } else {
        verifyRes = await msg91EmailService.verifyOtp(pending.email, cleanOtp, otpToken)
      }

      if (!verifyRes.success) {
        const failure = recordOtpFailure(targetIdentifier)
        if (failure.locked) {
          return NextResponse.json(
            { error: 'Maximum attempts exceeded. Verification temporarily locked for 15 minutes.' },
            { status: 429 }
          )
        }
        return NextResponse.json(
          { error: `${verifyRes.message} (${failure.attemptsLeft} attempts remaining)` },
          { status: 400 }
        )
      }

      // Record verification success
      recordOtpSuccess(targetIdentifier)
      if (targetType === 'whatsapp') {
        pending.phone_verified = true
      } else {
        pending.email_verified = true
      }

      // Check if both or required channel verified -> Activate Account
      const isVerified = pending.phone_verified || pending.email_verified

      if (isVerified) {
        const timestamp = Date.now()
        const userId = `u-reg-${timestamp}`
        const customerId = `c-reg-${timestamp}`
        const profileId = `cp-reg-${timestamp}`
        const fullName = `${pending.first_name} ${pending.last_name}`

        if (!Array.isArray(mockDb.state.user_profiles)) mockDb.state.user_profiles = []
        if (!Array.isArray(mockDb.state.customers)) mockDb.state.customers = []
        if (!Array.isArray(mockDb.state.customer_profiles)) mockDb.state.customer_profiles = []

        // 1. User Profile record
        const newUserProfile = {
          id: userId,
          role: 'customer',
          first_name: pending.first_name,
          last_name: pending.last_name,
          full_name: fullName,
          date_of_birth: pending.date_of_birth,
          gender: pending.gender,
          email: pending.email,
          phone: pending.phone,
          is_active: true,
          email_verified: Boolean(pending.email_verified),
          phone_verified: Boolean(pending.phone_verified),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockDb.state.user_profiles.push(newUserProfile)

        // 2. Customer record (with unique Google Meet room generated)
        const cleanNameSafe = fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patient'
        const meetCode = GoogleMeetService.generateStandardMeetCode(`${cleanNameSafe}${Date.now()}`)
        const defaultMeetUrl = `https://meet.google.com/${meetCode}`

        const newCustomer = {
          id: customerId,
          user_id: userId,
          membership_status: 'inactive',
          membership_plan_id: null,
          google_meet_url: defaultMeetUrl,
          meeting_url: defaultMeetUrl,
          meeting_id: `gm-${meetCode}`,
          meeting_provider: 'google_meet',
          google_meet_created_at: new Date().toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockDb.state.customers.push(newCustomer)

        // 3. Customer Detailed Profile record
        const newCustomerProfile = {
          id: profileId,
          customer_id: customerId,
          first_name: pending.first_name,
          last_name: pending.last_name,
          date_of_birth: pending.date_of_birth,
          gender: pending.gender,
          goals: 'Lifestyle & wellness improvement',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockDb.state.customer_profiles.push(newCustomerProfile)

        // Remove from pending_registrations
        mockDb.state.pending_registrations.splice(pendingIndex, 1)

        await savePersistedState(['user_profiles', 'customers', 'customer_profiles', 'pending_registrations'])

        // Issue 7-day session cookie
        const sessionPayload = {
          user_id: userId,
          email: pending.email,
          role: 'customer',
          full_name: fullName,
        }

        const response = NextResponse.json({
          success: true,
          verified: true,
          accountActivated: true,
          message: 'Account verified and activated successfully! Welcome to Dr Fit Veda.',
          user: sessionPayload,
          redirectTo: '/customer?welcome=true',
        })

        response.cookies.set('drf_session', JSON.stringify(sessionPayload), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 86400 * 7,
        })

        return response
      }

      // One channel verified, waiting on second
      await savePersistedState(['pending_registrations'])
      return NextResponse.json({
        success: true,
        verified: true,
        accountActivated: false,
        email_verified: pending.email_verified,
        phone_verified: pending.phone_verified,
        message: `${targetType === 'whatsapp' ? 'WhatsApp phone' : 'Email'} verified successfully!`,
      })
    }

    // ─── ACTION: INITIATE SIGNUP (DEFAULT) ──────────────────────
    const fieldErrors: Record<string, string> = {}

    // ─── 1. FIRST NAME VALIDATION ───────────────────────────────
    const cleanFirstName = typeof first_name === 'string' ? first_name.trim() : ''
    if (!cleanFirstName) {
      fieldErrors.first_name = 'First Name is required.'
    } else if (cleanFirstName.length < 2) {
      fieldErrors.first_name = 'First Name must be at least 2 characters.'
    } else if (cleanFirstName.length > 60) {
      fieldErrors.first_name = 'First Name cannot exceed 60 characters.'
    }

    // ─── 2. LAST NAME VALIDATION ────────────────────────────────
    const cleanLastName = typeof last_name === 'string' ? last_name.trim() : ''
    if (!cleanLastName) {
      fieldErrors.last_name = 'Last Name is required.'
    } else if (cleanLastName.length < 1) {
      fieldErrors.last_name = 'Last Name must be at least 1 character.'
    } else if (cleanLastName.length > 60) {
      fieldErrors.last_name = 'Last Name cannot exceed 60 characters.'
    }

    // ─── 3. DATE OF BIRTH VALIDATION ────────────────────────────
    const rawDob = typeof date_of_birth === 'string' ? date_of_birth.trim() : ''
    let parsedDob: Date | null = null
    let formattedDob = ''

    if (!rawDob) {
      fieldErrors.date_of_birth = 'Date of Birth is required.'
    } else {
      parsedDob = new Date(rawDob)
      if (isNaN(parsedDob.getTime())) {
        fieldErrors.date_of_birth = 'Please enter a valid Date of Birth (YYYY-MM-DD).'
      } else {
        const now = new Date()
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        if (parsedDob.getTime() > todayMidnight.getTime()) {
          fieldErrors.date_of_birth = 'Date of Birth must be a valid past date. Future dates are not allowed.'
        } else if (parsedDob.getFullYear() < 1900) {
          fieldErrors.date_of_birth = 'Please enter a valid Date of Birth (year 1900 or later).'
        } else {
          formattedDob = parsedDob.toISOString().split('T')[0]
        }
      }
    }

    // ─── 4. GENDER VALIDATION ───────────────────────────────────
    const cleanGender = typeof gender === 'string' ? gender.trim() : ''
    let matchedGender: AllowedGender | null = null

    if (!cleanGender) {
      fieldErrors.gender = 'Gender is required. Please select Male, Female, or Others.'
    } else {
      const match = ALLOWED_GENDERS.find(
        g => g.toLowerCase() === cleanGender.toLowerCase()
      )
      if (!match) {
        fieldErrors.gender = 'Gender must be exactly Male, Female, or Others.'
      } else {
        matchedGender = match
      }
    }

    // ─── 5. EMAIL VALIDATION ────────────────────────────────────
    const rawEmail = typeof email === 'string' ? email.trim() : ''
    const cleanEmail = rawEmail.toLowerCase()

    if (!cleanEmail) {
      fieldErrors.email = 'Email ID is required.'
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      fieldErrors.email = 'Please enter a valid email address (e.g. name@domain.com).'
    }

    // ─── 6. PHONE NUMBER VALIDATION ─────────────────────────────
    const rawPhone = typeof phone === 'string' ? phone.trim() : ''
    const rawCountryCode = typeof country_code === 'string' ? country_code.trim() : '+91'
    let fullPhoneWithCode = ''
    let canonicalDigits = ''
    let cleanCountryCode = rawCountryCode

    if (!rawPhone) {
      fieldErrors.phone = 'Phone Number is required.'
    } else {
      const phoneValidation = validateInternationalPhone(rawCountryCode, rawPhone)
      if (!phoneValidation.isValid) {
        fieldErrors.phone = phoneValidation.error || 'Please enter a valid mobile number.'
      } else {
        fullPhoneWithCode = phoneValidation.e164Phone
        cleanCountryCode = phoneValidation.cleanDialCode
        canonicalDigits = phoneValidation.msg91Mobile
      }
    }

    // If any validation errors exist, reject immediately
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: 'Please fill in all mandatory fields with valid information.',
          fieldErrors,
        },
        { status: 400 }
      )
    }

    // ─── 7. PREVENT DUPLICATE REGISTRATIONS ──────────────────────
    const existingByEmail = resolveAccountByIdentifier(cleanEmail)
    const emailInProfiles =
      Array.isArray(mockDb.state.user_profiles) &&
      mockDb.state.user_profiles.some(
        (u: any) => u.email && u.email.trim().toLowerCase() === cleanEmail && u.is_active !== false
      )

    if (existingByEmail || emailInProfiles) {
      return NextResponse.json(
        {
          error: 'An account with this Email ID already exists. Please sign in instead.',
          fieldErrors: {
            email: 'An account with this Email ID already exists.',
          },
          code: 'DUPLICATE_EMAIL',
        },
        { status: 409 }
      )
    }

    const existingByPhone = resolveAccountByIdentifier(canonicalDigits)
    const phoneInProfiles =
      Array.isArray(mockDb.state.user_profiles) &&
      mockDb.state.user_profiles.some(
        (u: any) => u.phone && normalizePhoneForMatch(u.phone) === canonicalDigits && u.is_active !== false
      )

    if (existingByPhone || phoneInProfiles) {
      return NextResponse.json(
        {
          error: 'An account with this Phone Number already exists. Please sign in instead.',
          fieldErrors: {
            phone: 'An account with this Phone Number already exists.',
          },
          code: 'DUPLICATE_PHONE',
        },
        { status: 409 }
      )
    }

    // ─── 8. CREATE PENDING VERIFICATION RECORD ───────────────────
    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    if (!Array.isArray(mockDb.state.pending_registrations)) {
      mockDb.state.pending_registrations = []
    }

    // Remove any older uncompleted pending registration with matching email/phone
    mockDb.state.pending_registrations = mockDb.state.pending_registrations.filter(
      (p: any) => p.email !== cleanEmail && p.canonical_phone !== canonicalDigits
    )

    const pendingRecord = {
      id: regId,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: `${cleanFirstName} ${cleanLastName}`,
      date_of_birth: formattedDob,
      gender: matchedGender,
      email: cleanEmail,
      phone: fullPhoneWithCode,
      canonical_phone: canonicalDigits,
      country_code: cleanCountryCode,
      email_verified: false,
      phone_verified: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
    mockDb.state.pending_registrations.push(pendingRecord)
    await savePersistedState(['pending_registrations'])

    // ─── 9. DISPATCH OTP CHALLENGES (EMAIL & WHATSAPP) ───────────
    let emailSent = false
    let whatsappSent = false
    let whatsappToken: string | undefined = undefined
    let emailToken: string | undefined = undefined

    try {
      const emailRes = await msg91EmailService.sendOtp(cleanEmail)
      emailSent = emailRes.success
      emailToken = emailRes.otpToken
      if (emailSent) recordOtpSend(cleanEmail)
    } catch (err: any) {
      console.warn('[Register] Email OTP dispatch warning:', err?.message)
    }

    try {
      const waRes = await msg91WhatsAppService.sendOtp(canonicalDigits)
      whatsappSent = waRes.success
      whatsappToken = waRes.otpToken
      if (whatsappSent) recordOtpSend(canonicalDigits)
    } catch (err: any) {
      console.warn('[Register] WhatsApp OTP dispatch warning:', err?.message)
    }

    return NextResponse.json({
      success: true,
      pendingVerification: true,
      registrationId: regId,
      email: cleanEmail,
      phone: fullPhoneWithCode,
      emailSent,
      whatsappSent,
      emailOtpToken: emailToken,
      whatsappOtpToken: whatsappToken,
      message: 'Verification codes have been dispatched to your Email and WhatsApp. Please enter the code below to activate your account.',
    })
  } catch (err: any) {
    console.error('[API /api/auth/register] Registration failure:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    )
  }
}
