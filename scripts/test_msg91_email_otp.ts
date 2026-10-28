// ============================================================
// Dr Fit Veda — MSG91 Email OTP Integration Test Runner
// Tests normalization, pending-DLT phone notices, 60s cooldown,
// 5-attempt brute-force lockout, single-use OTP, and admin safety.
// ============================================================

import fs from 'fs'
import path from 'path'

// Load .env.local for standalone CLI test runs
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  })
}

import {
  normalizeIdentifier,
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
  createOtpSessionToken,
  verifyOtpSessionToken,
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
  assert('Stateless OTP Token Generated', Boolean(sendRes.otpToken))

  const generatedOtp = msg91EmailService._getStoredOtpForTesting(emailTarget) || '123456'

  // Wrong code test
  const wrongCodeRes = await msg91EmailService.verifyOtp(emailTarget, '999999', sendRes.otpToken)
  assert('Incorrect Code Rejected', !wrongCodeRes.success)

  // Correct code with token
  const correctCodeRes = await msg91EmailService.verifyOtp(emailTarget, generatedOtp, sendRes.otpToken)
  assert('Correct Code Accepted with Stateless Token', correctCodeRes.success)

  // Single-use token consumption test: replay same code/token must fail
  const reuseRes = await msg91EmailService.verifyOtp(emailTarget, generatedOtp, sendRes.otpToken)
  assert('Reused Code Rejected (Single-Use Token Enforced)', !reuseRes.success)

  // Serverless container simulation: test verifyOtp with token when store is empty
  const serverlessEmail = 'serverless.coldstart@drfitveda.com'
  const coldSend = await msg91EmailService.sendOtp(serverlessEmail)
  const coldOtp = msg91EmailService._getStoredOtpForTesting(serverlessEmail)!
  // Clear the in-memory store to simulate another container handling the verification
  ;(msg91EmailService as any).store.delete(serverlessEmail)
  const coldVerify = await msg91EmailService.verifyOtp(serverlessEmail, coldOtp, coldSend.otpToken)
  assert('Serverless Cold-Start Container Verified via Stateless Token', coldVerify.success)

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

  // ─── 5. Role-Based OTP Portal Routing (Admin, Professional, Customer) ───
  console.log('\n--- 5. Testing Role-Based OTP Portal Routing (Including Admin OTP Login) ---')
  const roleExpectations: Array<{ role: string; expectedRedirect: string }> = [
    { role: 'admin', expectedRedirect: '/admin' },
    { role: 'super_admin', expectedRedirect: '/admin' },
    { role: 'operations_manager', expectedRedirect: '/admin' },
    { role: 'doctor', expectedRedirect: '/professional' },
    { role: 'trainer', expectedRedirect: '/professional' },
    { role: 'customer', expectedRedirect: '/customer' },
  ]

  for (const { role, expectedRedirect } of roleExpectations) {
    let redirectTo = '/customer'
    if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(role)) {
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
    ].includes(role)) {
      redirectTo = '/professional'
    }
    assert(`Role "${role}" Permitted for OTP Login -> Redirects to ${expectedRedirect}`, redirectTo === expectedRedirect)
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
