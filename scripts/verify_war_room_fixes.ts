// ============================================================
// Dr Fit Veda — War Room Independent Verification Suite
// Tests:
// 1. Durable Supabase Persistence across Cold Starts (DEF-001, DEF-002)
// 2. Email OTP & WhatsApp OTP Stateless Verification (DEF-005)
// 3. Admin Login via Email OTP & WhatsApp OTP -> /admin (DEF-006, DEF-007)
// 4. No Hardcoded MSG91 API Keys in Source Code (DEF-008)
// 5. Password Verification & Wildcard Block in demo-login (DEF-009)
// 6. OTP Verification Required in reset-password (DEF-010)
// 7. Unauthenticated CMS Mutation Blocked (DEF-013)
// ============================================================

import fs from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'

// Load .env.local
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

import { mockDb } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { msg91EmailService } from '../src/lib/services/msg91-email.service'
import { msg91WhatsAppService } from '../src/lib/services/msg91-whatsapp.service'
import { createOtpSessionToken, recordOtpSuccess } from '../src/lib/services/otp-security'
import { POST as loginOtpPost } from '../src/app/api/auth/login-otp/route'
import { POST as demoLoginPost } from '../src/app/api/auth/demo-login/route'
import { POST as resetPasswordPost } from '../src/app/api/auth/reset-password/route'
import { POST as biomarkersPost } from '../src/app/api/cms/biomarkers/route'

async function main() {
  console.log('============================================================')
  console.log('DR FIT VEDA — WAR ROOM INDEPENDENT VERIFICATION SUITE')
  console.log('============================================================\n')

  let passed = 0
  let failed = 0

  function assert(name: string, cond: boolean, detail?: string) {
    if (cond) {
      console.log(`[PASS] ${name}${detail ? ` (${detail})` : ''}`)
      passed++
    } else {
      console.error(`[FAIL] ${name}${detail ? ` (${detail})` : ''}`)
      failed++
    }
  }

  // ─── TEST 1: Durable Supabase Persistence Across Cold Starts ───
  console.log('--- 1. Testing Durable Supabase Persistence Across Cold Starts ---')
  await loadPersistedState(true)
  const originalTagline = mockDb.state.settings.tagline
  const originalStarterPrice = mockDb.state.memberships[0].price

  const testTagline = `Verified Durable Tagline ${Date.now()}`
  const testPrice = 10499

  mockDb.state.settings.tagline = testTagline
  mockDb.state.memberships[0].price = testPrice
  const savedOk = await savePersistedState(['settings', 'memberships'])
  assert('savePersistedState() wrote to Supabase website_settings', savedOk)

  // Simulate Vercel serverless cold start (wipes globalThis memory)
  mockDb.reset()
  assert(
    'Cold start reset in-memory state back to default',
    mockDb.state.settings.tagline !== testTagline && mockDb.state.memberships[0].price === 9999
  )

  // Now reload from Supabase as a new Lambda instance would
  const loadedOk = await loadPersistedState(true)
  assert('loadPersistedState() fetched state from Supabase after cold start', loadedOk)
  assert(
    'Persisted Settings Tagline survived cold start',
    mockDb.state.settings.tagline === testTagline,
    `Got: "${mockDb.state.settings.tagline}"`
  )
  assert(
    'Persisted Membership Price survived cold start',
    mockDb.state.memberships[0].price === testPrice,
    `Got: ₹${mockDb.state.memberships[0].price}`
  )

  // Restore clean baseline in Supabase
  mockDb.state.settings.tagline = originalTagline
  mockDb.state.memberships[0].price = originalStarterPrice
  await savePersistedState(['settings', 'memberships'])
  console.log('  [CLEANUP] Restored baseline settings & memberships in Supabase.\n')

  // ─── TEST 2: Admin Login via Email OTP & WhatsApp OTP ─────────
  console.log('--- 2. Testing Admin Login via Email OTP & WhatsApp OTP ---')
  const adminEmail = 'admin@drfitveda.com'
  recordOtpSuccess(adminEmail)
  const adminEmailToken = createOtpSessionToken(adminEmail, '654321')

  const emailOtpReq = new NextRequest('http://localhost:3000/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      channel: 'email',
      otp: '654321',
      otpToken: adminEmailToken,
      action: 'verify_otp',
    }),
  })
  const emailOtpRes = await loginOtpPost(emailOtpReq)
  const emailOtpData = await emailOtpRes.json()
  assert(
    'Admin Email OTP Login Succeeded (HTTP 200)',
    emailOtpRes.status === 200 && emailOtpData.success === true,
    `Status: ${emailOtpRes.status}, Role: ${emailOtpData.user?.role}, Redirect: ${emailOtpData.redirectTo}`
  )
  assert(
    'Admin Email OTP Grants Admin Role & Redirects to /admin',
    emailOtpData.user?.role === 'admin' && emailOtpData.redirectTo === '/admin'
  )

  // Admin WhatsApp OTP (+91 98765 43213 -> normalized 919876543213)
  const adminMobileNorm = '919876543213'
  recordOtpSuccess(adminMobileNorm)
  const adminWaToken = createOtpSessionToken(adminMobileNorm, '777888')
  msg91WhatsAppService._setOtpForTesting(adminMobileNorm, '777888')

  const waOtpReq = new NextRequest('http://localhost:3000/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+91 98765 43213',
      channel: 'whatsapp',
      otp: '777888',
      otpToken: adminWaToken,
      action: 'verify_otp',
    }),
  })
  const waOtpRes = await loginOtpPost(waOtpReq)
  const waOtpData = await waOtpRes.json()
  assert(
    'Admin WhatsApp OTP Login Succeeded (HTTP 200)',
    waOtpRes.status === 200 && waOtpData.success === true,
    `Status: ${waOtpRes.status}, Role: ${waOtpData.user?.role}, Redirect: ${waOtpData.redirectTo}`
  )
  assert(
    'Admin WhatsApp OTP Grants Admin Role & Redirects to /admin',
    waOtpData.user?.role === 'admin' && waOtpData.redirectTo === '/admin'
  )

  // Doctor Email OTP
  const docEmail = 'doctor@drfitveda.com'
  recordOtpSuccess(docEmail)
  const docToken = createOtpSessionToken(docEmail, '112233')
  const docReq = new NextRequest('http://localhost:3000/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: docEmail,
      channel: 'email',
      otp: '112233',
      otpToken: docToken,
      action: 'verify_otp',
    }),
  })
  const docRes = await loginOtpPost(docReq)
  const docData = await docRes.json()
  assert(
    'Doctor Email OTP Login Redirects to /professional',
    docRes.status === 200 && docData.user?.role === 'doctor' && docData.redirectTo === '/professional'
  )

  // ─── TEST 3: Auth & Security Hardening (DEF-008, DEF-009, DEF-010, DEF-013) ───
  console.log('\n--- 3. Testing Auth & Security Hardening ---')

  // Check no hardcoded MSG91 key in src/
  const filesToScan = [
    path.resolve(__dirname, '../src/lib/services/msg91-email.service.ts'),
    path.resolve(__dirname, '../src/lib/services/msg91-whatsapp.service.ts'),
    path.resolve(__dirname, '../src/lib/services/otp-security.ts'),
  ]
  const envKey = process.env.MSG91_AUTH_KEY || '580697'
  const hasHardcodedKey = filesToScan.some(f => fs.readFileSync(f, 'utf-8').includes(envKey))
  assert('No Hardcoded MSG91 API Key in Source Files (DEF-008)', !hasHardcodedKey)

  // Wrong password rejected on demo-login
  const wrongPwRes = await demoLoginPost(
    new Request('http://localhost:3000/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@drfitveda.com', password: 'wrongpassword' }),
    })
  )
  assert('demo-login Rejects Wrong Admin Password with HTTP 401 (DEF-009)', wrongPwRes.status === 401)

  // Unknown "hacker-admin" identifier rejected on demo-login
  const unknownAdminRes = await demoLoginPost(
    new Request('http://localhost:3000/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'hacker-admin@evil.com', password: '123' }),
    })
  )
  assert('demo-login Rejects Unknown "admin" Substring Identifier with HTTP 401 (DEF-009)', unknownAdminRes.status === 401)

  // Valid password accepted on demo-login
  const validPwRes = await demoLoginPost(
    new Request('http://localhost:3000/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@drfitveda.com', password: 'admin123' }),
    })
  )
  assert('demo-login Accepts Valid Admin Credentials with HTTP 200', validPwRes.status === 200)

  // Password reset without OTP rejected
  const unverifiedResetRes = await resetPasswordPost(
    new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@drfitveda.com',
        new_password: 'hackedpassword123',
        action: 'reset_password',
      }),
    })
  )
  assert('reset-password Rejects Unverified Password Reset with HTTP 400 (DEF-010)', unverifiedResetRes.status === 400)

  // Unauthenticated CMS Biomarker POST rejected
  const unauthBiomarkerRes = await biomarkersPost(
    new NextRequest('http://localhost:3000/api/cms/biomarkers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Marker', unit: 'mg/dL' }),
    })
  )
  assert('CMS Biomarkers Rejects Unauthenticated POST with HTTP 403 (DEF-013)', unauthBiomarkerRes.status === 403)

  console.log('\n============================================================')
  console.log(`WAR ROOM VERIFICATION TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal verification error:', err)
  process.exit(1)
})
