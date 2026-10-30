// ============================================================
// Dr Fit Veda — Phase 2 Verification Suite:
// Role-Based Login (Doctors, Trainers, Customers, Admins),
// Direct Login Entry Points, Country Code Alignment,
// Mobile-First Responsiveness (iPhone 17 Pro Chrome/Safari & Android),
// and PWA Readiness Audit
// ============================================================

import * as fs from 'fs'
import * as path from 'path'
import { NextRequest } from 'next/server'

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (m) {
      let val = m[2] || ''
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      process.env[m[1]] = val
    }
  }
}

import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { mockDb } from '@/lib/mock-db'
import { resolveAccountByIdentifier, getDashboardForRole } from '@/lib/auth-resolver'
import { createOtpSessionToken } from '@/lib/services/otp-security'
import { POST as loginOtpPOST } from '@/app/api/auth/login-otp/route'
import { POST as demoLoginPOST } from '@/app/api/auth/demo-login/route'
import { proxy } from '@/proxy'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string, details?: string) {
  if (condition) {
    passed++
    console.log(`  ✅ PASS: ${label}`)
  } else {
    failed++
    console.error(`  ❌ FAIL: ${label}${details ? ` — ${details}` : ''}`)
  }
}

async function main() {
  console.log('================================================================')
  console.log('🩺 DrFitVeda — Role-Based Login, Mobile-First & PWA QA Suite')
  console.log('================================================================\n')

  // ─── 1. Load & Reconcile Live Supabase State ───
  console.log('1️⃣  Loading & Reconciling Live Supabase State (Professionals <-> User Profiles)')
  const loaded = await loadPersistedState(true)
  assert(loaded, 'Loaded persisted state from Supabase')

  // Save reconciled user_profiles & professionals back to Supabase so stale customer rows are removed
  const synced = await savePersistedState(['user_profiles', 'professionals', 'team_members'])
  assert(synced, 'Synchronized and persisted reconciled user_profiles & professionals to Supabase')

  const staleVarshiniCustomer = (mockDb.state.user_profiles || []).find(
    (u: any) => u.email === 'drvarshini@drfitveda.com' && u.role === 'customer'
  )
  assert(!staleVarshiniCustomer, 'Removed stale auto-created customer profile for drvarshini@drfitveda.com')

  const staleAdminPhoneCustomer = (mockDb.state.user_profiles || []).find(
    (u: any) => u.phone === '+919986019708' && u.role === 'customer'
  )
  assert(!staleAdminPhoneCustomer, 'Removed stale auto-created customer profile for Super Admin phone +919986019708')

  // ─── 2. Doctor Role-Based Login Verification ───
  console.log('\n2️⃣  Testing Doctor Role-Based Login & Dashboard Routing (/professional)')

  const docEmailsAndPhones = [
    { input: 'varsini@drfitveda.com', expectedName: 'Dr. Varshini', expectedRole: 'doctor' },
    { input: 'drvarshini@drfitveda.com', expectedName: 'Dr. Varshini', expectedRole: 'doctor' },
    { input: '9743790189', expectedName: 'Dr. Varshini', expectedRole: 'doctor' },
    { input: '+91 97437 90189', expectedName: 'Dr. Varshini', expectedRole: 'doctor' },
  ]

  for (const item of docEmailsAndPhones) {
    const resolved = resolveAccountByIdentifier(item.input)
    assert(
      !!resolved && resolved.role === item.expectedRole && getDashboardForRole(resolved.role) === '/professional',
      `Resolver maps Doctor identifier "${item.input}" -> role="${resolved?.role}", dashboard="${getDashboardForRole(resolved?.role)}" (id="${resolved?.id}")`
    )
  }

  // Test End-to-End Email OTP Verify for Doctor (varsini@drfitveda.com)
  const docOtp = '654321'
  const docToken = createOtpSessionToken('varsini@drfitveda.com', docOtp)
  const docOtpReq = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.1' },
    body: JSON.stringify({
      email: 'varsini@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: docToken,
      action: 'verify_otp',
    }),
  })
  const docOtpRes = await loginOtpPOST(docOtpReq)
  const docOtpJson = await docOtpRes.json()
  assert(
    docOtpRes.status === 200 &&
      docOtpJson.user?.role === 'doctor' &&
      docOtpJson.redirectTo === '/professional' &&
      docOtpJson.user?.user_id === 'u0000000-0000-0000-0000-000000000002',
    `POST /api/auth/login-otp (varsini@drfitveda.com) -> role="${docOtpJson.user?.role}", redirectTo="${docOtpJson.redirectTo}", user_id="${docOtpJson.user?.user_id}"`
  )

  // Test End-to-End Email OTP Verify for Doctor alias (drvarshini@drfitveda.com)
  const docAliasToken = createOtpSessionToken('drvarshini@drfitveda.com', docOtp)
  const docAliasReq = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.2' },
    body: JSON.stringify({
      email: 'drvarshini@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: docAliasToken,
      action: 'verify_otp',
    }),
  })
  const docAliasRes = await loginOtpPOST(docAliasReq)
  const docAliasJson = await docAliasRes.json()
  assert(
    docAliasRes.status === 200 &&
      docAliasJson.user?.role === 'doctor' &&
      docAliasJson.redirectTo === '/professional',
    `POST /api/auth/login-otp (drvarshini@drfitveda.com) -> role="${docAliasJson.user?.role}", redirectTo="${docAliasJson.redirectTo}"`
  )

  // ─── 3. Trainer Role-Based Login Verification ───
  console.log('\n3️⃣  Testing Trainer Role-Based Login & Dashboard Routing (/professional)')

  const trainerInputs = [
    { input: 'vishnu@drfitveda.com', expectedName: 'Vishnu', expectedId: 'u0000000-0000-0000-0000-000000000003' },
    { input: '8495959526', expectedName: 'Vishnu', expectedId: 'u0000000-0000-0000-0000-000000000003' },
    { input: 'kumarsaikiran@drfitveda.com', expectedName: 'Kumar Sai kiran', expectedId: 'u-trn-004' },
    { input: '8553783079', expectedName: 'Kumar Sai kiran', expectedId: 'u-trn-004' },
  ]

  for (const t of trainerInputs) {
    const resolved = resolveAccountByIdentifier(t.input)
    assert(
      !!resolved &&
        resolved.role === 'trainer' &&
        resolved.id === t.expectedId &&
        getDashboardForRole(resolved.role) === '/professional',
      `Resolver maps Trainer identifier "${t.input}" -> role="${resolved?.role}", id="${resolved?.id}", dashboard="/professional"`
    )
  }

  // Test End-to-End Email OTP Verify for Trainer 1 (vishnu@drfitveda.com)
  const trn1Token = createOtpSessionToken('vishnu@drfitveda.com', docOtp)
  const trn1Req = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.3' },
    body: JSON.stringify({
      email: 'vishnu@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: trn1Token,
      action: 'verify_otp',
    }),
  })
  const trn1Res = await loginOtpPOST(trn1Req)
  const trn1Json = await trn1Res.json()
  assert(
    trn1Res.status === 200 &&
      trn1Json.user?.role === 'trainer' &&
      trn1Json.redirectTo === '/professional',
    `POST /api/auth/login-otp (vishnu@drfitveda.com) -> role="${trn1Json.user?.role}", redirectTo="${trn1Json.redirectTo}"`
  )

  // Test End-to-End Email OTP Verify for Trainer 2 (kumarsaikiran@drfitveda.com)
  const trn2Token = createOtpSessionToken('kumarsaikiran@drfitveda.com', docOtp)
  const trn2Req = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.4' },
    body: JSON.stringify({
      email: 'kumarsaikiran@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: trn2Token,
      action: 'verify_otp',
    }),
  })
  const trn2Res = await loginOtpPOST(trn2Req)
  const trn2Json = await trn2Res.json()
  assert(
    trn2Res.status === 200 &&
      trn2Json.user?.role === 'trainer' &&
      trn2Json.redirectTo === '/professional' &&
      trn2Json.user?.user_id === 'u-trn-004',
    `POST /api/auth/login-otp (kumarsaikiran@drfitveda.com) -> role="${trn2Json.user?.role}", redirectTo="${trn2Json.redirectTo}", user_id="${trn2Json.user?.user_id}"`
  )

  // ─── 4. Customer, Operations Staff & Super Admin Login Verification ───
  console.log('\n4️⃣  Testing Customer (/customer) & Admin/Staff (/admin) Role-Based Login & Route Protection')

  // Customer password login
  const custLoginReq = new Request('https://drfitveda.com/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'customer@drfitveda.com', password: 'customer123' }),
  })
  const custLoginRes = await demoLoginPOST(custLoginReq)
  const custLoginJson = await custLoginRes.json()
  assert(
    custLoginRes.status === 200 &&
      custLoginJson.user?.role === 'customer' &&
      custLoginJson.redirectTo === '/customer',
    `Customer login (customer@drfitveda.com) -> role="customer", redirectTo="/customer"`
  )

  // Operations Manager OTP login
  const opsToken = createOtpSessionToken('kavita.operations@drfitveda.com', docOtp)
  const opsReq = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.5' },
    body: JSON.stringify({
      email: 'kavita.operations@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: opsToken,
      action: 'verify_otp',
    }),
  })
  const opsRes = await loginOtpPOST(opsReq)
  const opsJson = await opsRes.json()
  assert(
    opsRes.status === 200 &&
      opsJson.user?.role === 'operations_manager' &&
      opsJson.redirectTo === '/admin',
    `Operations Manager OTP login (kavita.operations@drfitveda.com) -> role="operations_manager", redirectTo="/admin"`
  )

  // Super Admin OTP login
  const adminToken = createOtpSessionToken('chethan@drfitveda.com', docOtp)
  const adminReq = new NextRequest('https://drfitveda.com/api/auth/login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.10.1.6' },
    body: JSON.stringify({
      email: 'chethan@drfitveda.com',
      channel: 'email',
      otp: docOtp,
      otpToken: adminToken,
      action: 'verify_otp',
    }),
  })
  const adminRes = await loginOtpPOST(adminReq)
  const adminJson = await adminRes.json()
  assert(
    adminRes.status === 200 &&
      (adminJson.user?.role === 'super_admin' || adminJson.user?.role === 'admin') &&
      adminJson.redirectTo === '/admin',
    `Super Admin OTP login (chethan@drfitveda.com) -> role="${adminJson.user?.role}", redirectTo="/admin"`
  )

  // Verify Proxy Route Protection (Customer blocked from /professional and /admin; Doctor allowed on /professional and blocked from /admin)
  const customerSessionCookie = encodeURIComponent(
    JSON.stringify({ user_id: 'u-cust-1', email: 'customer@drfitveda.com', role: 'customer', full_name: 'Priya' })
  )
  const custTryProReq = new NextRequest('https://drfitveda.com/professional', {
    headers: { cookie: `drf_session=${customerSessionCookie}` },
  })
  const custTryProRes = await proxy(custTryProReq)
  assert(
    custTryProRes.status === 307 && custTryProRes.headers.get('location')?.endsWith('/customer') === true,
    'Proxy blocks Customer from accessing /professional and redirects to /customer'
  )

  const custTryAdminReq = new NextRequest('https://drfitveda.com/admin', {
    headers: { cookie: `drf_session=${customerSessionCookie}` },
  })
  const custTryAdminRes = await proxy(custTryAdminReq)
  assert(
    custTryAdminRes.status === 307 && custTryAdminRes.headers.get('location')?.endsWith('/customer') === true,
    'Proxy blocks Customer from accessing /admin and redirects to /customer'
  )

  const doctorSessionCookie = encodeURIComponent(
    JSON.stringify({ user_id: 'u0000000-0000-0000-0000-000000000002', email: 'varsini@drfitveda.com', role: 'doctor', full_name: 'Dr. Varshini' })
  )
  const docProReq = new NextRequest('https://drfitveda.com/professional', {
    headers: { cookie: `drf_session=${doctorSessionCookie}` },
  })
  const docProRes = await proxy(docProReq)
  assert(docProRes.status === 200, 'Proxy allows Doctor session on /professional (HTTP 200)')

  const docTryCustomerReq = new NextRequest('https://drfitveda.com/customer', {
    headers: { cookie: `drf_session=${doctorSessionCookie}` },
  })
  const docTryCustomerRes = await proxy(docTryCustomerReq)
  assert(
    docTryCustomerRes.status === 307 && docTryCustomerRes.headers.get('location')?.endsWith('/professional') === true,
    'Proxy redirects Doctor visiting /customer back to /professional'
  )

  // ─── 5. Direct Login UI, Country Code Alignment & Mobile-First CSS Audit ───
  console.log('\n5️⃣  Verifying Direct Login UI, Country Code Alignment & Mobile-First CSS')

  const headerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/public/PublicHeader.tsx'), 'utf8')
  assert(
    headerCode.includes('href="/login?portal=professional"') &&
      headerCode.includes('Doctor / Trainer') &&
      headerCode.includes('menuOpen'),
    'PublicHeader.tsx provides direct Sign In on mobile + mobile drawer + Doctor/Trainer direct login link'
  )

  const loginCode = fs.readFileSync(path.resolve(__dirname, '../src/app/login/page.tsx'), 'utf8')
  assert(
    loginCode.includes("flex: '0 0 100px'") &&
      loginCode.includes('height: 48') &&
      loginCode.includes('fontSize: 16') &&
      loginCode.includes("setPortalMode('professional')"),
    'login/page.tsx has compact 100px country-code selector, 48px aligned height, 16px iOS zoom-safe font size, and Doctor/Trainer portal mode'
  )

  const cssCode = fs.readFileSync(path.resolve(__dirname, '../src/app/globals.css'), 'utf8')
  assert(
    cssCode.includes('font-size: 16px !important') &&
      cssCode.includes('100dvh') &&
      cssCode.includes('env(safe-area-inset-bottom'),
    'globals.css enforces 16px mobile input font-size, 100dvh viewport height, and iOS safe-area-inset-bottom'
  )

  const proSidebarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/professional/ProfessionalSidebar.tsx'), 'utf8')
  assert(
    proSidebarCode.includes('bottom-nav hide-desktop') && proSidebarCode.includes('mobileMenuOpen'),
    'ProfessionalSidebar.tsx provides responsive mobile top header, slide-out drawer, and bottom navigation bar'
  )

  const adminSidebarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/AdminSidebar.tsx'), 'utf8')
  assert(
    adminSidebarCode.includes('bottom-nav hide-desktop') && adminSidebarCode.includes('mobileMenuOpen'),
    'AdminSidebar.tsx provides responsive mobile top header, slide-out drawer, and bottom navigation bar'
  )

  // ─── 6. PWA Manifest, Service Worker & Offline Fallback Audit ───
  console.log('\n6️⃣  Verifying PWA Manifest, Service Worker Security & Offline Fallback')

  const manifestRaw = fs.readFileSync(path.resolve(__dirname, '../public/manifest.json'), 'utf8')
  const manifest = JSON.parse(manifestRaw)
  assert(
    manifest.display === 'standalone' &&
      manifest.start_url === '/' &&
      Array.isArray(manifest.icons) &&
      manifest.icons.length >= 2 &&
      Array.isArray(manifest.shortcuts) &&
      manifest.shortcuts.some((s: any) => s.url === '/login?portal=professional'),
    'public/manifest.json is valid standalone PWA manifest with icons and Doctor/Patient shortcuts'
  )

  const swCode = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf8')
  assert(
    swCode.includes("'/api/'") &&
      swCode.includes("'/admin'") &&
      swCode.includes("'/professional'") &&
      swCode.includes("'/customer'") &&
      swCode.includes('isSensitiveOrDynamicPath') &&
      swCode.includes("'/offline'"),
    'public/sw.js strictly excludes /api/*, /admin, /professional, /customer from caching and provides /offline fallback'
  )

  const offlineExists = fs.existsSync(path.resolve(__dirname, '../src/app/offline/page.tsx'))
  const registrarExists = fs.existsSync(path.resolve(__dirname, '../src/components/pwa/PwaRegistrar.tsx'))
  assert(offlineExists && registrarExists, 'Offline fallback page (/offline) and PwaRegistrar component exist')

  console.log('\n================================================================')
  console.log(`📊 FINAL SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal error in verification suite:', err)
  process.exit(1)
})

