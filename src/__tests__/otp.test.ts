// ============================================================
// Dr Fit Veda — MSG91 OTP Integration Unit & Security Tests
// QA & Authentication Security Agent
// Covers: Phone normalization, 60s cooldowns, attempt lockouts
// ============================================================

import { describe, it, expect } from '@jest/globals'
import {
  normalizeIndianMobile,
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
  isIpRateLimited,
} from '@/lib/services/otp-security'

describe('Phone Normalization & Indian Telecom Format', () => {
  it('correctly normalizes standard 10-digit Indian numbers', () => {
    const res = normalizeIndianMobile('9876543210')
    expect(res.isValid).toBe(true)
    expect(res.msg91Mobile).toBe('919876543210')
    expect(res.e164Phone).toBe('+919876543210')
    expect(res.displayPhone).toBe('+91 98765 43210')
  })

  it('normalizes numbers with +91 prefix and spaces', () => {
    const res = normalizeIndianMobile('+91 98765 43210')
    expect(res.isValid).toBe(true)
    expect(res.msg91Mobile).toBe('919876543210')
    expect(res.e164Phone).toBe('+919876543210')
  })

  it('normalizes numbers with leading 0', () => {
    const res = normalizeIndianMobile('09876543210')
    expect(res.isValid).toBe(true)
    expect(res.msg91Mobile).toBe('919876543210')
  })

  it('rejects invalid numbers not starting with 6, 7, 8, or 9', () => {
    const res = normalizeIndianMobile('1234567890')
    expect(res.isValid).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('rejects numbers with too few or too many digits', () => {
    expect(normalizeIndianMobile('98765').isValid).toBe(false)
    expect(normalizeIndianMobile('987654321000').isValid).toBe(false)
  })

  it('rejects non-numeric inputs', () => {
    expect(normalizeIndianMobile('abcdefghij').isValid).toBe(false)
  })
})

describe('OTP Cooldown & Rate Limiting Engine', () => {
  const testMobile = '919999900001'

  it('allows first-time OTP request', () => {
    const eligibility = checkOtpSendEligibility(testMobile)
    expect(eligibility.allowed).toBe(true)
  })

  it('enforces 60-second cooldown immediately after send', () => {
    recordOtpSend(testMobile)
    const eligibility = checkOtpSendEligibility(testMobile)
    expect(eligibility.allowed).toBe(false)
    expect(eligibility.cooldownRemaining).toBeGreaterThan(0)
    expect(eligibility.error).toContain('Please wait')
  })

  it('tracks failed verification attempts and locks out after 5 failures', () => {
    const bruteForceMobile = '919999900002'

    // 4 failed attempts should reduce attempts left
    for (let i = 1; i <= 4; i++) {
      const res = recordOtpFailure(bruteForceMobile)
      expect(res.locked).toBe(false)
      expect(res.attemptsLeft).toBe(5 - i)
    }

    // 5th failed attempt should trigger lockout
    const finalAttempt = recordOtpFailure(bruteForceMobile)
    expect(finalAttempt.locked).toBe(true)
    expect(finalAttempt.attemptsLeft).toBe(0)

    // Check eligibility blocks sending for locked number
    const eligibility = checkOtpSendEligibility(bruteForceMobile)
    expect(eligibility.allowed).toBe(false)
    expect(eligibility.error).toContain('Too many failed attempts')
  })

  it('resets failed attempts upon successful verification', () => {
    const successMobile = '919999900003'
    recordOtpFailure(successMobile)
    recordOtpFailure(successMobile)

    recordOtpSuccess(successMobile)

    const nextFailure = recordOtpFailure(successMobile)
    expect(nextFailure.attemptsLeft).toBe(4) // reset back to max - 1
  })

  it('enforces IP rate limiting threshold', () => {
    const testIp = '192.168.1.100'
    for (let i = 0; i < 15; i++) {
      expect(isIpRateLimited(testIp)).toBe(false)
    }
    // 16th request triggers rate limit
    expect(isIpRateLimited(testIp)).toBe(true)
  })
})
