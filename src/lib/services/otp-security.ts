// ============================================================
// Dr Fit Veda — OTP Security & Rate Limiting Engine
// Enforces Indian phone normalization, 60s cooldowns,
// request rate limits, and brute-force attempt lockout.
// ============================================================

export interface NormalizedPhone {
  isValid: boolean
  raw: string
  /** Normalized format for MSG91: e.g. 919876543210 */
  msg91Mobile: string
  /** E.164 format for Database storage: e.g. +919876543210 */
  e164Phone: string
  /** Human readable format: e.g. +91 98765 43210 */
  displayPhone: string
  error?: string
}

export interface NormalizedIdentifier {
  isValid: boolean
  type: 'email' | 'phone'
  raw: string
  /** Normalized key used for lookup & rate limiting: e.g. "priya@gmail.com" or "919876543210" */
  normalized: string
  /** Clean human-readable display */
  display: string
  /** Present if type is phone */
  e164Phone?: string
  error?: string
}

/**
 * Normalizes input for Email or WhatsApp OTP flows.
 * Supports explicit channel targeting ('email' | 'whatsapp').
 * When channel is omitted, defaults to 'email' preserving DLT notice for SMS attempts.
 */
export function normalizeIdentifier(input: string, channel: 'email' | 'whatsapp' = 'email'): NormalizedIdentifier {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      type: channel === 'whatsapp' ? 'phone' : 'email',
      raw: '',
      normalized: '',
      display: '',
      error: channel === 'whatsapp' 
        ? 'Please enter your registered mobile number with country code.' 
        : 'Please enter your registered email address.',
    }
  }

  const trimmed = input.trim()

  // 1. Channel explicitly specified as WhatsApp
  if (channel === 'whatsapp') {
    if (trimmed.includes('@')) {
      return {
        isValid: false,
        type: 'phone',
        raw: trimmed,
        normalized: '',
        display: '',
        error: 'Please enter your mobile number with country code for WhatsApp OTP login.',
      }
    }
    const phoneNorm = normalizeMobile(trimmed)
    if (!phoneNorm.isValid) {
      return {
        isValid: false,
        type: 'phone',
        raw: trimmed,
        normalized: '',
        display: '',
        error: phoneNorm.error || 'Please enter a valid mobile number with country code.',
      }
    }
    return {
      isValid: true,
      type: 'phone',
      raw: trimmed,
      normalized: phoneNorm.msg91Mobile,
      display: phoneNorm.displayPhone,
      e164Phone: phoneNorm.e164Phone,
    }
  }

  // 2. Channel specified as Email (or default)
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      return {
        isValid: false,
        type: 'email',
        raw: trimmed,
        normalized: '',
        display: '',
        error: 'Please enter a valid email address (e.g. name@domain.com).',
      }
    }
    const cleanEmail = trimmed.toLowerCase()
    return {
      isValid: true,
      type: 'email',
      raw: trimmed,
      normalized: cleanEmail,
      display: cleanEmail,
    }
  }

  // Mobile entered under Email channel: inform user that SMS OTP is paused pending DLT registration
  return {
    isValid: false,
    type: 'phone',
    raw: trimmed,
    normalized: '',
    display: '',
    error: 'SMS OTP is currently paused pending telecom DLT registration. Please sign in using WhatsApp OTP, your registered email address, or your password.',
  }
}

/**
 * Normalizes and validates Indian or international mobile numbers with country code.
 * Accepts: 9876543210, +919876543210, +91 98765 43210, 09876543210, +1 415 555 2671, etc.
 */
export function normalizeMobile(input: string): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      raw: '',
      msg91Mobile: '',
      e164Phone: '',
      displayPhone: '',
      error: 'Please enter a valid mobile number with country code.',
    }
  }

  // Clean all spaces, dashes, parentheses
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, '')

  // First, check Indian number formats
  const indianCheck = normalizeIndianMobile(input)
  if (indianCheck.isValid) {
    return indianCheck
  }

  // International number with leading + (10 to 15 digits as per E.164)
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1).replace(/\D/g, '')
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return {
        isValid: true,
        raw: input,
        msg91Mobile: digitsOnly,
        e164Phone: `+${digitsOnly}`,
        displayPhone: `+${digitsOnly}`,
      }
    }
  }

  // International number without +, but 11-15 digits
  const rawDigits = cleaned.replace(/\D/g, '')
  if (rawDigits.length >= 11 && rawDigits.length <= 15) {
    return {
      isValid: true,
      raw: input,
      msg91Mobile: rawDigits,
      e164Phone: `+${rawDigits}`,
      displayPhone: `+${rawDigits}`,
    }
  }

  return {
    isValid: false,
    raw: input,
    msg91Mobile: '',
    e164Phone: '',
    displayPhone: '',
    error: 'Please enter a valid mobile number with country code (e.g. +91 98765 43210).',
  }
}

/**
 * Normalizes and validates an Indian mobile number.
 * Accepts: 9876543210, +919876543210, 919876543210, 09876543210, etc.
 */
export function normalizeIndianMobile(input: string): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      raw: '',
      msg91Mobile: '',
      e164Phone: '',
      displayPhone: '',
      error: 'Please enter a valid mobile number.',
    }
  }

  // Strip all non-digit characters except leading plus
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '')

  // Remove leading + or 0
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1)
  }

  // Validate 10-digit Indian mobile (starts with 6, 7, 8, or 9)
  const indianMobileRegex = /^[6-9]\d{9}$/
  if (!indianMobileRegex.test(cleaned)) {
    return {
      isValid: false,
      raw: input,
      msg91Mobile: '',
      e164Phone: '',
      displayPhone: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 98765 43210).',
    }
  }

  const msg91Mobile = `91${cleaned}`
  const e164Phone = `+91${cleaned}`
  const displayPhone = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`

  return {
    isValid: true,
    raw: input,
    msg91Mobile,
    e164Phone,
    displayPhone,
  }
}

// ─── Rate Limiting & Cooldown Memory Store ───────────────────
interface PhoneState {
  lastSentAt: number
  sendCountInHour: number
  firstSendInWindow: number
  failedAttempts: number
  lockedUntil: number
}

const phoneStore = new Map<string, PhoneState>()
const ipStore = new Map<string, { count: number; windowStart: number }>()

const COOLDOWN_SECONDS = 60
const MAX_SENDS_PER_HOUR = 10
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const MAX_IP_REQUESTS_PER_HOUR = 20

/**
 * Checks if a mobile number is eligible to request an OTP.
 */
export function checkOtpSendEligibility(msg91Mobile: string): {
  allowed: boolean
  error?: string
  cooldownRemaining?: number
} {
  const now = Date.now()
  const state = phoneStore.get(msg91Mobile)

  if (!state) {
    return { allowed: true }
  }

  // 1. Check account lockout
  if (state.lockedUntil > now) {
    const minutesLeft = Math.ceil((state.lockedUntil - now) / 60000)
    return {
      allowed: false,
      error: `Too many failed attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
    }
  }

  // 2. Check 60-second cooldown
  const timeSinceLast = Math.floor((now - state.lastSentAt) / 1000)
  if (timeSinceLast < COOLDOWN_SECONDS) {
    const remaining = COOLDOWN_SECONDS - timeSinceLast
    return {
      allowed: false,
      error: `Please wait ${remaining} seconds before requesting a new OTP.`,
      cooldownRemaining: remaining,
    }
  }

  // 3. Check hourly quota
  if (now - state.firstSendInWindow < 60 * 60 * 1000) {
    if (state.sendCountInHour >= MAX_SENDS_PER_HOUR) {
      const resetMinutes = Math.ceil((state.firstSendInWindow + 60 * 60 * 1000 - now) / 60000)
      return {
        allowed: false,
        error: `Maximum OTP requests exceeded for this number. Please wait ${resetMinutes} minutes.`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Records an OTP send event for a mobile number.
 */
export function recordOtpSend(msg91Mobile: string) {
  const now = Date.now()
  const state = phoneStore.get(msg91Mobile)

  if (!state || now - state.firstSendInWindow >= 60 * 60 * 1000) {
    phoneStore.set(msg91Mobile, {
      lastSentAt: now,
      sendCountInHour: 1,
      firstSendInWindow: now,
      failedAttempts: 0,
      lockedUntil: 0,
    })
  } else {
    state.lastSentAt = now
    state.sendCountInHour += 1
  }
}

/**
 * Records a failed verification attempt.
 */
export function recordOtpFailure(msg91Mobile: string): { attemptsLeft: number; locked: boolean } {
  const now = Date.now()
  let state = phoneStore.get(msg91Mobile)

  if (!state) {
    state = {
      lastSentAt: now,
      sendCountInHour: 1,
      firstSendInWindow: now,
      failedAttempts: 1,
      lockedUntil: 0,
    }
    phoneStore.set(msg91Mobile, state)
  } else {
    state.failedAttempts += 1
  }

  if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000
    return { attemptsLeft: 0, locked: true }
  }

  return {
    attemptsLeft: MAX_FAILED_ATTEMPTS - state.failedAttempts,
    locked: false,
  }
}

/**
 * Resets the failed attempts upon successful OTP verification.
 */
export function recordOtpSuccess(msg91Mobile: string) {
  const state = phoneStore.get(msg91Mobile)
  if (state) {
    state.failedAttempts = 0
    state.lockedUntil = 0
  }
}

/**
 * Clears OTP state / rate limit for a specific number.
 */
export function clearOtpLimit(msg91Mobile: string) {
  phoneStore.delete(msg91Mobile)
}

/**
 * Enforces IP-based rate limiting.
 */
export function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = ipStore.get(ip)

  if (!record || now - record.windowStart >= 60 * 60 * 1000) {
    ipStore.set(ip, { count: 1, windowStart: now })
    return false
  }

  record.count += 1
  return record.count > MAX_IP_REQUESTS_PER_HOUR
}
