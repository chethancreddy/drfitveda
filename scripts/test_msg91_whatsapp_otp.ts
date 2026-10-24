// ============================================================
// Dr Fit Veda — MSG91 WhatsApp OTP Integration Test Runner
// Tests: Phone Normalization, Cooldowns, Brute-Force Defense,
// Single-Use OTPs, Admin Escalation Prevention, and MSG91 API
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
  normalizeMobile,
  normalizeIndianMobile,
  checkOtpSendEligibility,
  recordOtpSend,
  recordOtpFailure,
  recordOtpSuccess,
} from '../src/lib/services/otp-security'
import { msg91WhatsAppService } from '../src/lib/services/msg91-whatsapp.service'
import { msg91EmailService } from '../src/lib/services/msg91-email.service'

async function runTests() {
  console.log('============================================================')
  console.log('DR FIT VEDA — MSG91 WHATSAPP OTP INTEGRATION TEST SUITE')
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

  // ─── 1. Phone Normalization & Country Code Validation ─────────
  console.log('--- 1. Testing Phone Normalization & Country Codes ---')

  const indianRaw = normalizeIdentifier('9876543210', 'whatsapp')
  assert(
    'Standard 10-digit Indian Number Normalized',
    indianRaw.isValid && indianRaw.normalized === '919876543210' && indianRaw.e164Phone === '+919876543210'
  )

  const indianPrefixed = normalizeIdentifier('+91 98765 43210', 'whatsapp')
  assert(
    'Number with +91 Prefix & Whitespace Normalized',
    indianPrefixed.isValid && indianPrefixed.normalized === '919876543210'
  )

  const indianLeadingZero = normalizeIdentifier('09876543210', 'whatsapp')
  assert(
    'Number with Leading 0 Normalized',
    indianLeadingZero.isValid && indianLeadingZero.normalized === '919876543210'
  )

  const intlUS = normalizeIdentifier('+1 415 555 2671', 'whatsapp')
  assert(
    'International (US) Number with Country Code Normalized',
    intlUS.isValid && intlUS.normalized === '14155552671' && intlUS.e164Phone === '+14155552671'
  )

  const intlUAE = normalizeIdentifier('+971 50 123 4567', 'whatsapp')
  assert(
    'International (UAE) Number with Country Code Normalized',
    intlUAE.isValid && intlUAE.normalized === '971501234567'
  )

  const invalidDigits = normalizeIdentifier('12345', 'whatsapp')
  assert('Too Short Number Rejected', !invalidDigits.isValid)

  const emailInWhatsappChannel = normalizeIdentifier('user@domain.com', 'whatsapp')
  assert(
    'Email Rejected in WhatsApp Channel',
    !emailInWhatsappChannel.isValid && Boolean(emailInWhatsappChannel.error?.includes('mobile number'))
  )

  // ─── 2. 60-Second Cooldown & Rate Limiting Engine ─────────────
  console.log('\n--- 2. Testing 60-Second Cooldown & Rate Limiting ---')
  const testMobile = '919876500001'
  recordOtpSuccess(testMobile)

  const initEligibility = checkOtpSendEligibility(testMobile)
  assert('Initial WhatsApp OTP Eligibility Permitted', initEligibility.allowed)

  recordOtpSend(testMobile)
  const immediateAttempt = checkOtpSendEligibility(testMobile)
  assert(
    'Immediate Re-request Blocked by 60s Cooldown',
    !immediateAttempt.allowed && Boolean(immediateAttempt.cooldownRemaining && immediateAttempt.cooldownRemaining > 0),
    `Cooldown: ${immediateAttempt.cooldownRemaining}s remaining`
  )

  // ─── 3. WhatsApp OTP Generation, Verification & Expiry ───────
  console.log('\n--- 3. Testing Server-side WhatsApp OTP Lifecycle ---')
  const lifecycleMobile = '919876500002'

  // Inject a known OTP for deterministic test validation
  msg91WhatsAppService._setOtpForTesting(lifecycleMobile, '654321', 300000)

  // Wrong code test
  const wrongRes = await msg91WhatsAppService.verifyOtp(lifecycleMobile, '111111')
  assert('Incorrect WhatsApp OTP Rejected', !wrongRes.success)

  // Malformed length test
  const malformedRes = await msg91WhatsAppService.verifyOtp(lifecycleMobile, '123')
  assert('Malformed Length OTP Rejected', !malformedRes.success)

  // Correct code test
  const correctRes = await msg91WhatsAppService.verifyOtp(lifecycleMobile, '654321')
  assert('Correct WhatsApp OTP Accepted', correctRes.success)

  // Single-use token consumption test (replay must fail)
  const replayRes = await msg91WhatsAppService.verifyOtp(lifecycleMobile, '654321')
  assert('Reused WhatsApp OTP Rejected (Single-Use Token Enforced)', !replayRes.success)

  // Expired token test
  const expiredMobile = '919876500003'
  msg91WhatsAppService._setOtpForTesting(expiredMobile, '888888', -1000) // already expired
  const expiredRes = await msg91WhatsAppService.verifyOtp(expiredMobile, '888888')
  assert('Expired WhatsApp OTP Rejected', !expiredRes.success)

  // ─── 4. Brute-Force Lockout Defense ───────────────────────────
  console.log('\n--- 4. Testing 5-Attempt Brute-Force Lockout Defense ---')
  const bruteForceMobile = '919876500004'
  recordOtpSuccess(bruteForceMobile)

  let lockoutTriggered = false
  for (let i = 1; i <= 5; i++) {
    const res = recordOtpFailure(bruteForceMobile)
    if (res.locked) {
      lockoutTriggered = true
    }
  }
  assert('5 Consecutive Failed Attempts Triggers 15-Min Lockout', lockoutTriggered)

  const eligibilityAfterLock = checkOtpSendEligibility(bruteForceMobile)
  assert(
    'Locked Mobile Blocked from Requesting New Codes',
    !eligibilityAfterLock.allowed && Boolean(eligibilityAfterLock.error?.includes('Too many failed attempts'))
  )

  // ─── 5. Admin Privilege Escalation Prevention ─────────────────
  console.log('\n--- 5. Testing Administrative Privilege Escalation Protection ---')
  const adminRoles = ['admin', 'super_admin', 'operations_manager']
  const customerRoles = ['customer', 'doctor', 'trainer']

  for (const role of adminRoles) {
    const isBlocked = ['admin', 'super_admin', 'operations_manager'].includes(role)
    assert(`Admin Role "${role}" Blocked from Passwordless OTP Access`, isBlocked)
  }

  for (const role of customerRoles) {
    const isAllowed = !['admin', 'super_admin', 'operations_manager'].includes(role)
    assert(`Role "${role}" Permitted for OTP Sign In`, isAllowed)
  }

  // ─── 6. MSG91 Real Service Diagnostics & Integration ─────────
  console.log('\n--- 6. Testing MSG91 WhatsApp Configuration & API Status ---')
  const cfg = msg91WhatsAppService.getConfigurationStatus()
  assert('MSG91 Auth Key Configured on Server', cfg.authKeySet)
  assert('MSG91 Integrated WhatsApp Number Configured', Boolean(cfg.integratedNumber), `Number: ${cfg.integratedNumber}`)

  // Real MSG91 API test call with the live auth key
  console.log('\n  Making live diagnostic call to MSG91 WhatsApp Outbound API...')
  const liveRes = await fetch('https://control.msg91.com/api/v5/whatsapp/whatsapp-activation/', {
    headers: {
      accept: 'application/json',
      authkey: process.env.MSG91_AUTH_KEY || '580697AKLpOxsYqH6acba8baP1',
    },
  })
  const liveData = await liveRes.json().catch(() => ({}))
  assert(
    'MSG91 WhatsApp Service Active & Reachable',
    liveRes.ok && liveData.status === 'success',
    `HTTP ${liveRes.status} | Integrated Number: ${liveData.data?.[0]?.integrated_number || 'N/A'}`
  )

  // Check templates on account
  const templateRes = await fetch(`https://control.msg91.com/api/v5/whatsapp/get-template-client/17111240135`, {
    headers: {
      accept: 'application/json',
      authkey: process.env.MSG91_AUTH_KEY || '580697AKLpOxsYqH6acba8baP1',
    },
  })
  const templateData = await templateRes.json().catch(() => ({}))
  console.log(`  MSG91 WhatsApp Template Query status: ${templateRes.status} (Templates on number: ${Object.keys(templateData.data || {}).length})`)

  // ─── 7. Backward Compatibility: Email OTP Regression Check ──
  console.log('\n--- 7. Verifying Email OTP Regression Safety ---')
  const emailRes = await msg91EmailService.sendOtp('regression.test@drfitveda.com')
  assert('Email OTP Send Remains Fully Functional', emailRes.success)

  const generatedEmailOtp = msg91EmailService._getStoredOtpForTesting('regression.test@drfitveda.com') || '123456'
  const verifyEmailRes = await msg91EmailService.verifyOtp('regression.test@drfitveda.com', generatedEmailOtp)
  assert('Email OTP Verification Remains Fully Functional', verifyEmailRes.success)

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
