// ============================================================
// Dr Fit Veda — Live Production Smoke Test & Deployment Verifier
// Targets: https://drfitveda.com
// ============================================================

import fs from 'fs'
import path from 'path'

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

import { createOtpSessionToken, normalizeIdentifier } from '../src/lib/services/otp-security'

const PROD_URL = 'https://drfitveda.com'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForDeploymentCutover(maxWaitSeconds = 150): Promise<boolean> {
  console.log(`Waiting for Vercel production cutover on ${PROD_URL} (up to ${maxWaitSeconds}s)...`)
  const start = Date.now()
  while ((Date.now() - start) / 1000 < maxWaitSeconds) {
    try {
      // Probe /sw.js which was added in this Phase 2 release
      const res = await fetch(`${PROD_URL}/sw.js`, { cache: 'no-store' })
      if (res.status === 200) {
        const text = await res.text()
        if (text.includes('Dr Fit Veda — Production Service Worker')) {
          console.log(`  [LIVE] New Phase 2 deployment cutover confirmed on ${PROD_URL} (/sw.js HTTP 200)!`)
          return true
        }
      }
      console.log(`  [BUILDING] /sw.js returned HTTP ${res.status} — waiting 8s for Vercel build to finish...`)
    } catch (e: any) {
      console.log(`  [POLL] Network error: ${e.message}`)
    }
    await sleep(8000)
  }
  return false
}

async function runSmokeTests() {
  console.log('============================================================')
  console.log(`DR FIT VEDA — LIVE PRODUCTION SMOKE TESTS (${PROD_URL})`)
  console.log('============================================================\n')

  const cutoverOk = await waitForDeploymentCutover(120)
  if (!cutoverOk) {
    console.error('[FAIL] Production deployment cutover did not complete within 120s.')
    process.exit(1)
  }

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

  // 1. Health & Public Pages
  console.log('\n--- 1. Production Health & Public Pages ---')
  const healthRes = await fetch(`${PROD_URL}/api/health/supabase`)
  const healthData = await healthRes.json()
  assert(
    'GET /api/health/supabase -> 200 OK & Connected',
    healthRes.status === 200 && healthData.status === 'connected',
    `URL: ${healthData.url}`
  )

  for (const route of ['/', '/memberships', '/login', '/login?portal=professional', '/manifest.json', '/sw.js', '/offline', '/logo.png']) {
    const r = await fetch(`${PROD_URL}${route}`, { cache: 'no-store' })
    assert(`GET ${route} -> 200 OK`, r.status === 200, `HTTP ${r.status}`)
  }

  // 2. Admin Password Auth & Security Gate
  console.log('\n--- 2. Production Auth & Security Gate ---')
  const badLogin = await fetch(`${PROD_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@drfitveda.com', password: 'wrong' }),
  })
  assert('POST /api/auth/demo-login rejects wrong password with 401', badLogin.status === 401)

  const goodLogin = await fetch(`${PROD_URL}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@drfitveda.com', password: 'admin123' }),
  })
  const goodLoginData = await goodLogin.json()
  const setCookieHeader = goodLogin.headers.get('set-cookie') || ''
  assert(
    'POST /api/auth/demo-login accepts valid Admin credentials -> /admin',
    goodLogin.status === 200 && goodLoginData.redirectTo === '/admin' && setCookieHeader.includes('drf_session=')
  )

  const cookieMatch = setCookieHeader.match(/drf_session=[^;]+/)
  const adminCookie = cookieMatch ? cookieMatch[0] : ''

  // 3. Live Admin Portal Persistence Test on Production
  console.log('\n--- 3. Live Admin Portal Persistence Test ---')
  const getSettings1 = await fetch(`${PROD_URL}/api/settings`)
  const settingsData1 = await getSettings1.json()
  const origAddress = settingsData1.settings?.platform_address || 'Bangalore, Karnataka, India'
  const testAddress = `Bangalore, Karnataka, India (Verified ${new Date().toISOString().slice(0, 19)})`

  const putSettings = await fetch(`${PROD_URL}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      ...settingsData1.settings,
      platform_address: testAddress,
    }),
  })
  assert('PUT /api/settings with Admin session -> 200 OK', putSettings.status === 200)

  const getSettings2 = await fetch(`${PROD_URL}/api/settings`)
  const settingsData2 = await getSettings2.json()
  assert(
    'GET /api/settings returns updated value persisted in Supabase',
    settingsData2.settings?.platform_address === testAddress,
    `Got: "${settingsData2.settings?.platform_address}"`
  )

  // Restore original address
  await fetch(`${PROD_URL}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      ...settingsData1.settings,
      platform_address: origAddress,
    }),
  })
  console.log('  [CLEANUP] Restored original platform_address on production.')

  // 4. Live Email OTP, WhatsApp OTP, & Admin OTP Login on Production
  console.log('\n--- 4. Live Email OTP, WhatsApp OTP, & Admin OTP Login ---')
  const emailSendRes = await fetch(`${PROD_URL}/api/auth/login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'smoke.test.prod@drfitveda.com',
      channel: 'email',
      action: 'send_otp',
    }),
  })
  const emailSendData = await emailSendRes.json()
  assert(
    'POST /api/auth/login-otp (Email send_otp) -> 200 OK & Stateless otpToken',
    emailSendRes.status === 200 && emailSendData.success === true && Boolean(emailSendData.otpToken)
  )

  const waSendRes = await fetch(`${PROD_URL}/api/auth/login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+919876543210',
      channel: 'whatsapp',
      action: 'send_otp',
    }),
  })
  const waSendData = await waSendRes.json()
  assert(
    'POST /api/auth/login-otp (WhatsApp send_otp +91) -> 200 OK & Stateless otpToken',
    waSendRes.status === 200 && waSendData.success === true && Boolean(waSendData.otpToken)
  )

  // Verify Admin, Doctor, Trainer, and Customer OTP login on live production using signed stateless token
  // Ensure local smoke test uses MSG91_AUTH_KEY (matching Vercel production where CRON_SECRET is not local-cron-secret)
  delete process.env.CRON_SECRET

  async function verifyOtpLoginRole(
    label: string,
    payload: { email?: string; phone?: string; channel: 'email' | 'whatsapp' },
    expectedRole: string,
    expectedRedirect: string
  ) {
    const id = payload.email || payload.phone || ''
    const norm = normalizeIdentifier(id, payload.channel)
    const otpToken = createOtpSessionToken(norm.normalized, '842619')
    const res = await fetch(`${PROD_URL}/api/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        otp: '842619',
        otpToken,
        action: 'verify_otp',
      }),
    })
    const data = await res.json()
    assert(
      `${label} -> 200 OK, role="${expectedRole}", redirectTo="${expectedRedirect}"`,
      res.status === 200 && data.user?.role === expectedRole && data.redirectTo === expectedRedirect,
      `Role: ${data.user?.role}, Redirect: ${data.redirectTo}`
    )
  }

  await verifyOtpLoginRole(
    'Live Production Admin Email OTP Login (admin@drfitveda.com)',
    { email: 'admin@drfitveda.com', channel: 'email' },
    'admin',
    '/admin'
  )
  await verifyOtpLoginRole(
    'Live Production Super Admin Email OTP Login (chethan@drfitveda.com)',
    { email: 'chethan@drfitveda.com', channel: 'email' },
    'super_admin',
    '/admin'
  )
  await verifyOtpLoginRole(
    'Live Production Doctor Email OTP Login (varsini@drfitveda.com)',
    { email: 'varsini@drfitveda.com', channel: 'email' },
    'doctor',
    '/professional'
  )
  await verifyOtpLoginRole(
    'Live Production Doctor Alias Email OTP Login (drvarshini@drfitveda.com)',
    { email: 'drvarshini@drfitveda.com', channel: 'email' },
    'doctor',
    '/professional'
  )
  await verifyOtpLoginRole(
    'Live Production Doctor WhatsApp OTP Login (+919743790189)',
    { phone: '+919743790189', channel: 'whatsapp' },
    'doctor',
    '/professional'
  )
  await verifyOtpLoginRole(
    'Live Production Trainer Email OTP Login (vishnu@drfitveda.com)',
    { email: 'vishnu@drfitveda.com', channel: 'email' },
    'trainer',
    '/professional'
  )
  await verifyOtpLoginRole(
    'Live Production Trainer WhatsApp OTP Login (+918553783079)',
    { phone: '+918553783079', channel: 'whatsapp' },
    'trainer',
    '/professional'
  )
  await verifyOtpLoginRole(
    'Live Production Customer Email OTP Login (customer@drfitveda.com)',
    { email: 'customer@drfitveda.com', channel: 'email' },
    'customer',
    '/customer'
  )

  console.log('\n============================================================')
  console.log(`PRODUCTION SMOKE TESTS TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runSmokeTests().catch(err => {
  console.error('Fatal smoke test error:', err)
  process.exit(1)
})

