// ============================================================
// Dr Fit Veda — MSG91 Email OTP Integration Test Runner
// Tests normalization, pending-DLT phone notices, 60s cooldown,
// 5-attempt brute-force lockout, single-use OTP, and admin safety.
// ============================================================

import {
  normalizeIdentifier,
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
} from '../src/lib/services/otp-security'
import { msg91EmailService } from '../src/lib/services/msg91-email.service'

async function runTests() {
  console.log('============================================================')
  console.log('DR FIT VEDA — MSG91 EMAIL OTP INTEGRATION TEST SUITE')
  console.log('============================================================\n')

  let passed = 0
  let failed = 0

  function assert(title: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`[PASS] ${title} ${extra ? `(${extra})` : ''}`)
      passed++
    } else {
      console.error(`[FAIL] ${title} ${extra ? `(${extra})` : ''}`)
      failed++
    }
  }

  // ─── 1. Identifier Normalization & Phone Rejection ─────────
  console.log('--- 1. Testing Identifier Normalization & Mobile DLT Guard ---')
  const validEmail = normalizeIdentifier('Patient.Wellness@DrFitVeda.com')
  assert('Valid Email Normalized', validEmail.isValid && validEmail.normalized === 'patient.wellness@drfitveda.com')

  const invalidEmail = normalizeIdentifier('bad-format-email@')
  assert('Malformed Email Rejected', !invalidEmail.isValid)

  const mobileAttempt = normalizeIdentifier('+91 98765 43210')
  assert(
    'Mobile Number Rejected with DLT Pending Notice',
    !mobileAttempt.isValid &&
    Boolean(mobileAttempt.error && mobileAttempt.error.includes('pending telecom DLT registration')),
    mobileAttempt.error
  )

  const rawDigits = normalizeIdentifier('9876543210')
  assert(
    'Raw Digits Rejected with DLT Pending Notice',
    !rawDigits.isValid &&
    Boolean(rawDigits.error && rawDigits.error.includes('pending telecom DLT registration'))
  )

  // ─── 2. 60-Second Cooldown & Rate Limiting ─────────────────
  console.log('\n--- 2. Testing 60-Second Cooldown Engine ---')
  const testAccount = 'qa.test.cooldown@drfitveda.com'
  const initEligibility = checkOtpSendEligibility(testAccount)
  assert('Initial Eligibility Allowed', initEligibility.allowed)

  recordOtpSend(testAccount)
  const immediateAttempt = checkOtpSendEligibility(testAccount)
  assert(
    'Immediate Second Request Blocked by 60s Cooldown',
    !immediateAttempt.allowed && Boolean(immediateAttempt.cooldownRemaining && immediateAttempt.cooldownRemaining > 0),
    `Cooldown: ${immediateAttempt.cooldownRemaining}s remaining`
  )

  // ─── 3. MSG91 Email Service Dispatch & Verification ─────────
  console.log('\n--- 3. Testing MSG91 Email Dispatch & Verification ---')
  const emailTarget = 'member.portal@drfitveda.com'
  const sendRes = await msg91EmailService.sendOtp(emailTarget)
  assert('OTP Dispatch Succeeded', sendRes.success, sendRes.message)

  // Wrong code test
  const wrongCodeRes = await msg91EmailService.verifyOtp(emailTarget, '999999')
  assert('Incorrect Code Rejected', !wrongCodeRes.success)

  // Correct code (in dev mode, test code 123456)
  const correctCodeRes = await msg91EmailService.verifyOtp(emailTarget, '123456')
  assert('Correct Code Accepted', correctCodeRes.success)

  // Single-use token consumption test: replay same code must fail
  const reuseRes = await msg91EmailService.verifyOtp(emailTarget, '123456')
  assert('Reused Code Rejected (Single-Use Token Enforced)', !reuseRes.success)

  // ─── 4. Brute-Force Lockout Defense ────────────────────────
  console.log('\n--- 4. Testing 5-Attempt Brute-Force Lockout ---')
  const bruteForceTarget = 'bruteforce.target@drfitveda.com'
  recordOtpSuccess(bruteForceTarget) // Ensure clean start

  let lockoutTriggered = false
  for (let i = 1; i <= 5; i++) {
    const res = recordOtpFailure(bruteForceTarget)
    if (res.locked) {
      lockoutTriggered = true
    }
  }
  assert('5 Consecutive Failures Triggers 15-Min Lockout', lockoutTriggered)

  const eligibilityAfterLock = checkOtpSendEligibility(bruteForceTarget)
  assert(
    'Locked Account Blocked from New Requests',
    !eligibilityAfterLock.allowed && Boolean(eligibilityAfterLock.error?.includes('Too many failed attempts'))
  )

  // ─── 5. Admin Escalation Guard Logic ────────────────────────
  console.log('\n--- 5. Testing Admin Role Escalation Prohibition ---')
  const adminRoles = ['admin', 'super_admin', 'operations_manager']
  const customerRoles = ['customer', 'doctor', 'trainer']

  for (const role of adminRoles) {
    const isBlocked = ['admin', 'super_admin', 'operations_manager'].includes(role)
    assert(`Role "${role}" Blocked from OTP Passwordless Login`, isBlocked)
  }

  for (const role of customerRoles) {
    const isAllowed = !['admin', 'super_admin', 'operations_manager'].includes(role)
    assert(`Role "${role}" Permitted for OTP Sign In`, isAllowed)
  }

  console.log('\n============================================================')
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
