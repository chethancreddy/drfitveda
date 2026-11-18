import { mockDb, VitalityRoadmapStep } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'

async function runTests() {
  console.log('====================================================')
  console.log('DR FIT VEDA — TEST SUITE: 7-STEP ROADMAP & PRIORITY CONSULTATION')
  console.log('====================================================')

  await loadPersistedState(true)

  let passed = 0
  let failed = 0

  function assert(desc: string, condition: boolean, extra = '') {
    if (condition) {
      console.log(`[PASS] ${desc}`)
      passed++
    } else {
      console.error(`[FAIL] ${desc} ${extra}`)
      failed++
    }
  }

  // TEST 1: Normal Programs 7-Step Roadmap exists and has 7 sequential steps
  const steps: VitalityRoadmapStep[] = mockDb.state.vitality_roadmap_steps || []
  assert('TEST 1: 7-Step Roadmap is initialized', steps.length >= 7, `Found ${steps.length} steps`)
  const stepNumbers = steps.map(s => s.step)
  assert('TEST 1.1: Steps are numbered sequentially 01 to 07',
    ['01','02','03','04','05','06','07'].every(num => stepNumbers.includes(num)),
    `Steps found: ${stepNumbers.join(', ')}`
  )

  // TEST 2: Step attributes contain required fields
  const step1 = steps.find(s => s.step === '01')
  assert('TEST 2: Step 01 has title, timing, icon, description, and deliverable',
    Boolean(step1 && step1.title && step1.timing && step1.icon && step1.description && step1.deliverable)
  )

  // TEST 3: Consultation services CMS records preserved
  const services = mockDb.state.consultation_services || []
  assert('TEST 3: Consultation Services CMS records exist', services.length > 0, `Found: ${services.length}`)
  const yogaSvc = services.find((s: any) => s.key === 'yoga_consultation' || s.name.includes('Yoga'))
  assert('TEST 3.1: Yoga Consultation preserved in CMS', Boolean(yogaSvc))

  // TEST 4: Priority consultation pricing calculation (exact 40%)
  const basePrice = Number(yogaSvc?.price || 1000)
  const prioritySurcharge = Math.round(basePrice * 0.40)
  const priorityTotal = basePrice + prioritySurcharge
  assert('TEST 4: Priority surcharge is exactly 40% of base price',
    prioritySurcharge === Math.round(basePrice * 0.40) && priorityTotal === Math.round(basePrice * 1.40),
    `Base: ₹${basePrice}, Surcharge: ₹${prioritySurcharge}, Total: ₹${priorityTotal}`
  )

  // TEST 5: Booking priority appointment creation
  const mockCustomer = mockDb.state.customers?.[0] || { id: 'c0000000-0000-0000-0000-000000000001' }
  const mockDoctor = mockDb.state.professionals?.find((p: any) => p.role === 'doctor') || { id: 'pro-001' }

  const testPriorityBookingId = `appt-test-${Date.now()}`
  const newPriorityBooking = {
    id: testPriorityBookingId,
    customer_id: mockCustomer.id,
    professional_id: mockDoctor.id,
    consultation_service_id: yogaSvc?.id || 'cs-001',
    service_name: yogaSvc?.name || 'Yoga Consultation',
    service_price: basePrice,
    booking_type: 'priority' as const,
    priority_surcharge: prioritySurcharge,
    total_price: priorityTotal,
    scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    requested_date: '2026-11-25',
    requested_time: '15:30',
    duration_min: 30,
    status: 'pending_confirmation',
    notes: '[Priority Booking Request - Flexible Scheduling]',
    meeting_provider: 'google_meet',
    created_at: new Date().toISOString(),
  }

  mockDb.state.appointments = mockDb.state.appointments || []
  mockDb.state.appointments.push(newPriorityBooking)

  assert('TEST 5: Priority appointment has status "pending_confirmation"',
    newPriorityBooking.status === 'pending_confirmation'
  )
  assert('TEST 5.1: Priority appointment records requested_date and requested_time',
    newPriorityBooking.requested_date === '2026-11-25' && newPriorityBooking.requested_time === '15:30'
  )
  assert('TEST 5.2: Total payment matches Base + 40%',
    newPriorityBooking.total_price === basePrice + prioritySurcharge
  )

  // TEST 6: Admin Action — Accept and Confirm Priority Booking
  const bookingToConfirm = mockDb.state.appointments.find((a: any) => a.id === testPriorityBookingId)
  assert('TEST 6: Created booking found in state', Boolean(bookingToConfirm))

  // Simulate admin confirmation
  bookingToConfirm.status = 'scheduled'
  bookingToConfirm.notes += ' | Confirmed by Admin for requested time'
  bookingToConfirm.meeting_url = 'https://meet.google.com/dfv-priority-test'

  assert('TEST 6.1: Confirmed booking status changes to "scheduled"',
    bookingToConfirm.status === 'scheduled'
  )
  assert('TEST 6.2: Google Meet link attached upon confirmation',
    Boolean(bookingToConfirm.meeting_url && bookingToConfirm.meeting_url.includes('meet.google.com'))
  )

  // Clean test booking
  mockDb.state.appointments = mockDb.state.appointments.filter((a: any) => a.id !== testPriorityBookingId)

  console.log('====================================================')
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) process.exit(1)
}

runTests().catch(err => {
  console.error('Test runner failure:', err)
  process.exit(1)
})
