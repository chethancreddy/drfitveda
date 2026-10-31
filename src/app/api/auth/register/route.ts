import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import {
  resolveAccountByIdentifier,
  normalizePhoneForMatch,
  getDashboardForRole,
} from '@/lib/auth-resolver'

// ============================================================
// POST /api/auth/register — Patient / Customer Sign Up API
// Mandatory Fields:
//   1. first_name (required text)
//   2. last_name (required text)
//   3. date_of_birth (required past date)
//   4. gender (required dropdown: Male | Female | Others)
//   5. email (required valid email)
//   6. phone (required valid phone)
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
      first_name,
      last_name,
      date_of_birth,
      gender,
      email,
      phone,
      country_code,
    } = body

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
        // Enforce strict past date constraint
        const now = new Date()
        // Compare date portion only (midnight)
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
        fieldErrors.gender = 'Invalid gender selected. Options are exactly: Male, Female, Others.'
      } else {
        matchedGender = match
      }
    }

    // ─── 5. EMAIL ID VALIDATION ─────────────────────────────────
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!cleanEmail) {
      fieldErrors.email = 'Email ID is required.'
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      fieldErrors.email = 'Please enter a valid Email ID (e.g. name@example.com).'
    }

    // ─── 6. PHONE NUMBER VALIDATION ─────────────────────────────
    const rawPhone = typeof phone === 'string' ? phone.trim() : ''
    const rawCode = typeof country_code === 'string' && country_code.trim() ? country_code.trim() : '+91'
    let fullPhoneWithCode = rawPhone
    let canonicalDigits = ''

    if (!rawPhone) {
      fieldErrors.phone = 'Phone Number is required.'
    } else {
      if (!fullPhoneWithCode.startsWith('+')) {
        fullPhoneWithCode = `${rawCode.startsWith('+') ? rawCode : `+${rawCode}`}${rawPhone.replace(/\D/g, '')}`
      }

      canonicalDigits = normalizePhoneForMatch(fullPhoneWithCode)
      const numericDigits = fullPhoneWithCode.replace(/\D/g, '')

      if (numericDigits.length < 8 || numericDigits.length > 15) {
        fieldErrors.phone = 'Please enter a valid phone number (8 to 15 digits).'
      } else if (fullPhoneWithCode.startsWith('+91') || (numericDigits.length === 12 && numericDigits.startsWith('91'))) {
        // India specific validation
        const localTenDigits = numericDigits.slice(-10)
        if (!/^[6-9]\d{9}$/.test(localTenDigits)) {
          fieldErrors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
        }
      }
    }

    // Return all field errors if any field failed basic validation
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          error: 'Please fix the errors in the registration form.',
          fieldErrors,
        },
        { status: 400 }
      )
    }

    // ─── 7. DUPLICATE REGISTRATION CHECKS ───────────────────────
    // Prevent duplicate registrations using an existing email or phone number

    // A. Check duplicate Email
    const existingByEmail = resolveAccountByIdentifier(cleanEmail)
    const emailInProfiles = Array.isArray(mockDb.state.user_profiles) &&
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

    // B. Check duplicate Phone Number
    const existingByPhone = resolveAccountByIdentifier(canonicalDigits)
    const phoneInProfiles = Array.isArray(mockDb.state.user_profiles) &&
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

    // ─── 8. PERSISTENCE IN DATABASE & SYSTEM STATE ──────────────
    const timestamp = Date.now()
    const userId = `u-reg-${timestamp}`
    const customerId = `c-reg-${timestamp}`
    const profileId = `cp-reg-${timestamp}`
    const fullName = `${cleanFirstName} ${cleanLastName}`

    // Ensure collections exist in state
    if (!Array.isArray(mockDb.state.user_profiles)) mockDb.state.user_profiles = []
    if (!Array.isArray(mockDb.state.customers)) mockDb.state.customers = []
    if (!Array.isArray(mockDb.state.customer_profiles)) mockDb.state.customer_profiles = []

    // 1. User Profile record
    const newUserProfile = {
      id: userId,
      role: 'customer',
      first_name: cleanFirstName,
      last_name: cleanLastName,
      full_name: fullName,
      date_of_birth: formattedDob,
      gender: matchedGender,
      email: cleanEmail,
      phone: fullPhoneWithCode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockDb.state.user_profiles.push(newUserProfile)

    // 2. Customer record (with unique Zoho Meeting room generated)
    const cleanNameSafe = fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'patient'
    const zohoMeetingKey = `fitveda-${cleanNameSafe}-${Math.floor(100 + Math.random() * 900)}`
    const defaultZohoUrl = `https://meet.zoho.com/${zohoMeetingKey}`

    const newCustomer = {
      id: customerId,
      user_id: userId,
      membership_status: 'inactive',
      membership_plan_id: null,
      zoho_meeting_url: defaultZohoUrl,
      zoho_meeting_key: zohoMeetingKey,
      google_meet_url: defaultZohoUrl,
      meeting_url: defaultZohoUrl,
      meeting_provider: 'zoho_meeting',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockDb.state.customers.push(newCustomer)

    // 3. Customer Detailed Profile record
    const newCustomerProfile = {
      id: profileId,
      customer_id: customerId,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      date_of_birth: formattedDob,
      gender: matchedGender,
      goals: 'Lifestyle & wellness improvement',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockDb.state.customer_profiles.push(newCustomerProfile)

    // Persist all 3 tables durably across sessions & devices via Supabase
    await savePersistedState(['user_profiles', 'customers', 'customer_profiles'])

    // ─── 9. SESSION CREATION & AUTO-AUTHENTICATION ───────────────
    const sessionPayload = {
      user_id: userId,
      email: cleanEmail,
      role: 'customer',
      full_name: fullName,
    }

    const redirectTo = getDashboardForRole('customer') // '/customer'

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful! Welcome to Dr Fit Veda.',
      user: {
        id: userId,
        customer_id: customerId,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        full_name: fullName,
        date_of_birth: formattedDob,
        gender: matchedGender,
        email: cleanEmail,
        phone: fullPhoneWithCode,
        role: 'customer',
      },
      redirectTo,
    })

    // Issue secure 7-day session cookie
    response.cookies.set('drf_session', JSON.stringify(sessionPayload), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 7,
    })

    return response
  } catch (err: any) {
    console.error('[API /api/auth/register] Registration failure:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed due to a server error. Please try again.' },
      { status: 500 }
    )
  }
}

