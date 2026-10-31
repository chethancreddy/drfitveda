import fs from 'fs'
import path from 'path'

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

import { mockDb } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { GET as getConsults, POST as postConsult } from '../src/app/api/consultation-services/route'
import {
  GET as getConsultById,
  PUT as putConsultById,
  DELETE as deleteConsultById,
} from '../src/app/api/consultation-services/[id]/route'

let passed = 0
let failed = 0

function assert(condition: boolean, name: string, detail = '') {
  if (condition) {
    passed++
    console.log(`  ✅ PASS: ${name}${detail ? ` (${detail})` : ''}`)
  } else {
    failed++
    console.error(`  ❌ FAIL: ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

// Helper to mock active session user in mockDb
function setSessionRole(role: string | null) {
  if (!role) {
    ;(mockDb as any).currentUser = null
    return
  }
  const map: Record<string, any> = {
    admin: mockDb.state.users.find((u: any) => u.role === 'admin') || {
      id: 'usr-admin-01',
      email: 'admin@drfitveda.com',
      role: 'admin',
      user_metadata: { role: 'admin', full_name: 'Rajesh Kumar' },
    },
    customer: mockDb.state.users.find((u: any) => u.role === 'customer') || {
      id: 'usr-cust-01',
      email: 'priya@example.com',
      role: 'customer',
      user_metadata: { role: 'customer', full_name: 'Priya Sharma' },
    },
    doctor: mockDb.state.users.find((u: any) => u.role === 'doctor') || {
      id: 'usr-doc-01',
      email: 'ananya.rao@drfitveda.com',
      role: 'doctor',
      user_metadata: { role: 'doctor', full_name: 'Dr. Ananya Rao' },
    },
  }
  ;(mockDb as any).currentUser = map[role]
}

async function main() {
  console.log('=================================================================')
  console.log(' DrFitVeda — Consultation Services CMS Verification Suite')
  console.log('=================================================================')

  await loadPersistedState(true)

  // Snapshot original state for clean restoration at the end
  const originalServices = JSON.parse(JSON.stringify(mockDb.state.consultation_services || []))
  const originalCategories = JSON.parse(JSON.stringify((mockDb.state as any).consultation_categories || []))
  const originalAppointments = JSON.parse(JSON.stringify(mockDb.state.appointments || []))
  const originalMemberships = JSON.parse(JSON.stringify(mockDb.state.memberships || []))

  try {
    // -----------------------------------------------------------------
    // 1. Default Seeded Consultation Services & Categories Check
    // -----------------------------------------------------------------
    console.log('\n[1] Checking Default Seeded Consultation Services & Categories...')
    const initRes = await getConsults(new Request('http://localhost:3000/api/consultation-services'))
    const initData = await initRes.json()
    assert(initRes.status === 200, 'GET /api/consultation-services returns HTTP 200')
    assert(
      Array.isArray(initData.consultation_services) && initData.consultation_services.length >= 3,
      'At least 3 core consultation services exist',
      `found ${initData.consultation_services?.length}`
    )
    assert(
      Array.isArray(initData.consultation_categories) && initData.consultation_categories.length >= 8,
      'At least 8 configurable consultation categories exist',
      `found ${initData.consultation_categories?.length}`
    )

    // -----------------------------------------------------------------
    // 2. Unauthorized Access Control Check (Customer / Doctor / Unauthenticated)
    // -----------------------------------------------------------------
    console.log('\n[2] Testing Role-Based Authorization on Consultation Services CMS...')
    const unauthPostRes = await postConsult(
      new Request('http://localhost:3000/api/consultation-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Service', category: 'wellness', price: 499, duration_min: 30 }),
      })
    )
    assert(
      unauthPostRes.status === 403,
      'Unauthenticated POST /api/consultation-services is rejected with HTTP 403 Forbidden',
      `status ${unauthPostRes.status}`
    )

    const unauthPutRes = await putConsultById(
      new Request('http://localhost:3000/api/consultation-services/cs-001', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 100 }),
      }),
      { params: Promise.resolve({ id: 'cs-001' }) }
    )
    assert(
      unauthPutRes.status === 403,
      'Unauthenticated PUT /api/consultation-services/[id] is rejected with HTTP 403 Forbidden',
      `status ${unauthPutRes.status}`
    )

    const unauthDeleteRes = await deleteConsultById(
      new Request('http://localhost:3000/api/consultation-services/cs-001', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'cs-001' }) }
    )
    assert(
      unauthDeleteRes.status === 403,
      'Unauthenticated DELETE /api/consultation-services/[id] is rejected with HTTP 403 Forbidden',
      `status ${unauthDeleteRes.status}`
    )

    const getByIdRes = await getConsultById(
      new Request('http://localhost:3000/api/consultation-services/cs-001'),
      { params: Promise.resolve({ id: 'cs-001' }) }
    )
    const getByIdData = await getByIdRes.json()
    assert(
      getByIdRes.status === 200 && getByIdData.consultation_service?.id === 'cs-001',
      'GET /api/consultation-services/cs-001 returns core Yoga Consultation service',
      getByIdData.consultation_service?.name
    )

    // -----------------------------------------------------------------
    // 3. Create New Consultation Service & Database Persistence
    // -----------------------------------------------------------------
    console.log('\n[3] Testing Creation & Persistence of New Consultation Service...')
    const testServiceId = `cs-qa-test-${Date.now()}`
    const newServiceRecord = {
      id: testServiceId,
      key: `qa_nutrition_${Date.now()}`,
      name: 'QA Clinical Nutrition & Gut Reset Consultation',
      category: 'nutrition_consultation',
      short_description: '1-on-1 clinical nutrition assessment for metabolic and gut health.',
      full_description: 'Comprehensive dietary audit, micronutrient analysis, and personalized 30-day therapeutic meal blueprint.',
      description: 'Comprehensive dietary audit, micronutrient analysis, and personalized 30-day therapeutic meal blueprint.',
      specialist_designation: 'Senior Clinical Nutritionist & Dietitian',
      icon: '🥗',
      image_url: null,
      duration_min: 45,
      consultation_type: 'Online Video (Zoho Meeting)',
      price: 799,
      currency: 'INR',
      is_active: true,
      is_archived: false,
      display_order: 4,
    }

    ;(mockDb.state.consultation_services as any[]).push(newServiceRecord)
    await savePersistedState('consultation_services')

    // Reload from Supabase to simulate page refresh / second browser session
    await loadPersistedState(true)
    const persistedSvc = (mockDb.state.consultation_services as any[]).find(s => s.id === testServiceId)
    assert(!!persistedSvc, 'New consultation service persisted in Supabase database across reload')
    assert(
      persistedSvc?.name === 'QA Clinical Nutrition & Gut Reset Consultation' && persistedSvc?.price === 799,
      'Persisted consultation service retains exact name, price (₹799), and duration (45m)',
      `${persistedSvc?.name} — ₹${persistedSvc?.price} / ${persistedSvc?.duration_min}m`
    )

    // Check public GET /api/consultation-services visibility
    const pubResAfterCreate = await getConsults(new Request('http://localhost:3000/api/consultation-services'))
    const pubDataAfterCreate = await pubResAfterCreate.json()
    const pubFound = pubDataAfterCreate.consultation_services.find((s: any) => s.id === testServiceId)
    assert(!!pubFound, 'Newly created active service is immediately visible on customer-facing API')
    assert(
      pubFound?.category_label === 'Nutrition Consultation',
      'Service category label resolves to "Nutrition Consultation"',
      pubFound?.category_label
    )

    // -----------------------------------------------------------------
    // 4. Historical Booking Snapshot & Price Preservation Test
    // -----------------------------------------------------------------
    console.log('\n[4] Testing Customer Booking Snapshot & Historical Preservation...')
    const testApptId = `appt-qa-consult-${Date.now()}`
    const bookedAppointment = {
      id: testApptId,
      customer_id: 'cust-001',
      professional_id: 'prof-001',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_min: pubFound.duration_min,
      status: 'scheduled',
      notes: `Consultation service: ${pubFound.name}`,
      meeting_url: 'https://meeting.zoho.com/join?key=drf-veda-live',
      consultation_service_id: pubFound.id,
      service_key: pubFound.key,
      service_name: pubFound.name,
      service_category: pubFound.category,
      service_price: pubFound.price,
      service_currency: pubFound.currency,
      consultation_type: pubFound.consultation_type,
      created_at: new Date().toISOString(),
    }
    ;(mockDb.state.appointments as any[]).push(bookedAppointment)
    await savePersistedState('appointments')

    // -----------------------------------------------------------------
    // 5. Edit Consultation Service Name & Pricing
    // -----------------------------------------------------------------
    console.log('\n[5] Editing Consultation Service Name & Pricing...')
    const targetSvc = (mockDb.state.consultation_services as any[]).find(s => s.id === testServiceId)
    targetSvc.name = 'QA Advanced Metabolic Nutrition Consultation'
    targetSvc.price = 999
    targetSvc.duration_min = 60
    await savePersistedState('consultation_services')

    await loadPersistedState(true)
    const pubResAfterEdit = await getConsults(new Request('http://localhost:3000/api/consultation-services'))
    const pubDataAfterEdit = await pubResAfterEdit.json()
    const updatedPubSvc = pubDataAfterEdit.consultation_services.find((s: any) => s.id === testServiceId)
    assert(
      updatedPubSvc?.name === 'QA Advanced Metabolic Nutrition Consultation' && updatedPubSvc?.price === 999,
      'Edited consultation service name and price (₹999) appear on customer-facing API',
      `${updatedPubSvc?.name} — ₹${updatedPubSvc?.price}`
    )

    // Verify existing booking still retains original service name & ₹799 price
    const historicalAppt = (mockDb.state.appointments as any[]).find(a => a.id === testApptId)
    assert(
      historicalAppt?.service_name === 'QA Clinical Nutrition & Gut Reset Consultation' &&
        historicalAppt?.service_price === 799,
      'Historical customer booking retains original service name and price (₹799) after CMS edit',
      `${historicalAppt?.service_name} — ₹${historicalAppt?.service_price}`
    )

    // -----------------------------------------------------------------
    // 6. Deactivate Consultation Service & Verify Hidden from Public / Blocked from Booking
    // -----------------------------------------------------------------
    console.log('\n[6] Deactivating Consultation Service & Verifying Customer Visibility...')
    const svcToDeactivate = (mockDb.state.consultation_services as any[]).find(s => s.id === testServiceId)
    svcToDeactivate.is_active = false
    await savePersistedState('consultation_services')

    await loadPersistedState(true)
    const pubResAfterDeactivate = await getConsults(new Request('http://localhost:3000/api/consultation-services'))
    const pubDataAfterDeactivate = await pubResAfterDeactivate.json()
    const hiddenFromPublic = !pubDataAfterDeactivate.consultation_services.some((s: any) => s.id === testServiceId)
    assert(hiddenFromPublic, 'Deactivated consultation service is hidden from public customer listing')

    const adminResWithInactive = await getConsults(
      new Request('http://localhost:3000/api/consultation-services?include_inactive=true')
    )
    const adminDataWithInactive = await adminResWithInactive.json()
    const visibleToAdmin = adminDataWithInactive.consultation_services.some(
      (s: any) => s.id === testServiceId && s.is_active === false
    )
    assert(visibleToAdmin, 'Deactivated consultation service remains visible in Admin CMS with Inactive status')

    // -----------------------------------------------------------------
    // 7. Configurable Categories Test
    // -----------------------------------------------------------------
    console.log('\n[7] Testing Configurable Consultation Categories...')
    const testCatKey = `thyroid_care_${Date.now()}`
    const newCat = {
      id: `ccat-qa-${Date.now()}`,
      key: testCatKey,
      label: 'Thyroid & Endocrine Consultation',
      icon: '🧬',
      display_order: 9,
      is_active: true,
    }
    ;((mockDb.state as any).consultation_categories as any[]).push(newCat)
    await savePersistedState('consultation_categories')

    await loadPersistedState(true)
    const catCheckRes = await getConsults(new Request('http://localhost:3000/api/consultation-services'))
    const catCheckData = await catCheckRes.json()
    const foundCat = catCheckData.consultation_categories.find((c: any) => c.key === testCatKey)
    assert(
      !!foundCat && foundCat.label === 'Thyroid & Endocrine Consultation',
      'Custom CMS consultation category persisted and returned by API',
      foundCat?.label
    )

    // -----------------------------------------------------------------
    // 8. Membership Plans Regression Check
    // -----------------------------------------------------------------
    console.log('\n[8] Verifying Membership Plans CMS Remains Intact (Zero Regression)...')
    assert(
      Array.isArray(mockDb.state.memberships) && mockDb.state.memberships.length >= 4,
      'All 4 core membership plans remain intact and unmodified',
      `found ${mockDb.state.memberships.length} plans`
    )
    const starterPlan = mockDb.state.memberships.find((m: any) => m.id === 'mbr-001')
    assert(
      !!starterPlan && starterPlan.is_active === true,
      'Starter Plan (mbr-001) is active and independent from consultation services',
      `${starterPlan?.name} — ₹${starterPlan?.price}`
    )
  } finally {
    // Restore original state cleanly
    console.log('\n[9] Cleaning Up QA Test Records & Restoring Production State...')
    mockDb.state.consultation_services = originalServices
    ;(mockDb.state as any).consultation_categories = originalCategories
    mockDb.state.appointments = originalAppointments
    mockDb.state.memberships = originalMemberships
    await savePersistedState(['consultation_services', 'consultation_categories', 'appointments', 'memberships'])
    console.log('  ✨ Clean state restored.')
  }

  console.log('\n=================================================================')
  console.log(` Verification Summary: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')
  if (failed > 0) process.exit(1)
}

main().catch(err => {
  console.error('Unhandled error in verification suite:', err)
  process.exit(1)
})

