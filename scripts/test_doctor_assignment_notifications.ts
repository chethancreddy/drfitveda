// ============================================================
// DrFitVeda — Doctor Assignment Notifications & Dashboard URL Verification Suite
// Tests:
//   1. Canonical URL resolution & Vercel preview rejection
//   2. Dual notification dispatch (Doctor + Customer) upon assignment
//   3. Customer notification template format and variable resolution
//   4. Doctor dashboard link formatting (https://drfitveda.com)
//   5. Doctor reassignment & cancellation propagation
//   6. Appointment rescheduling and cancellation notifications
//   7. Professional customer profile authorization and fallback
// ============================================================

import {
  getAppBaseUrl,
  buildProfessionalCustomerProfileUrl,
  buildLoginUrl,
  OFFICIAL_PRODUCTION_URL,
} from '../src/lib/app-url'
import {
  triggerCustomerAssignmentNotifications,
  syncCustomerAppointmentStatusNotification,
  renderWhatsAppMessagePreview,
  WHATSAPP_TEMPLATES,
  cleanDoctorDisplayName,
} from '../src/lib/services/whatsapp-notification.service'
import { mockDb, MOCK_USERS } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passedTests++
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`)
    failedTests++
  }
}

async function runTestSuite() {
  console.log('\n======================================================')
  console.log('🧪 RUNNING DRFITVEDA DOCTOR NOTIFICATIONS & URL TESTS')
  console.log('======================================================\n')

  await loadPersistedState()

  // --------------------------------------------------------------------------
  // TEST 1: URL GENERATOR — PRODUCTION DOMAIN CONSISTENCY & PREVIEW REJECTION
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Canonical App URL & Vercel Preview Rejection ---')

  const originalEnv = { ...process.env }

  // 1a. Default fallback
  delete process.env.APP_BASE_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.NEXT_PUBLIC_URL
  assert(
    getAppBaseUrl() === 'https://drfitveda.com',
    'getAppBaseUrl() defaults to https://drfitveda.com when env is empty'
  )

  // 1b. Reject ephemeral preview URLs like drfitveda-6l2fxdgda-chethan4.vercel.app
  process.env.APP_BASE_URL = 'https://drfitveda-6l2fxdgda-chethan4.vercel.app'
  process.env.NEXT_PUBLIC_APP_URL = 'https://drfitveda-6l2fxdgda-chethan4.vercel.app'
  assert(
    getAppBaseUrl() === 'https://drfitveda.com',
    'getAppBaseUrl() strictly rejects Vercel preview hash URLs and falls back to official domain'
  )

  // 1c. Official custom domain respected
  process.env.APP_BASE_URL = 'https://drfitveda.com'
  assert(
    getAppBaseUrl() === 'https://drfitveda.com',
    'getAppBaseUrl() respects valid APP_BASE_URL=https://drfitveda.com'
  )

  // 1d. buildProfessionalCustomerProfileUrl format
  const doctorUrl = buildProfessionalCustomerProfileUrl('c-otp-1793424968092')
  assert(
    doctorUrl === 'https://drfitveda.com/professional/customers/c-otp-1793424968092',
    'buildProfessionalCustomerProfileUrl creates canonical production URL without preview hashes'
  )

  // 1e. buildLoginUrl preserves redirect path
  const loginRedirectUrl = buildLoginUrl('/professional/customers/c-otp-1793424968092')
  assert(
    loginRedirectUrl.includes('/login?redirect=%2Fprofessional%2Fcustomers%2Fc-otp-1793424968092'),
    'buildLoginUrl correctly preserves and encodes return path for unauthenticated doctors'
  )

  // Restore env
  Object.assign(process.env, originalEnv)

  // --------------------------------------------------------------------------
  // TEST 2: TEMPLATE INTEGRITY & MESSAGE PREVIEWS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: WhatsApp Notification Templates & Formatting ---')

  assert(
    !!WHATSAPP_TEMPLATES.customer_doctor_assigned,
    'WHATSAPP_TEMPLATES has customer_doctor_assigned registered'
  )
  assert(
    !!WHATSAPP_TEMPLATES.customer_appointment_updated,
    'WHATSAPP_TEMPLATES has customer_appointment_updated registered'
  )
  assert(
    !!WHATSAPP_TEMPLATES.customer_appointment_cancelled,
    'WHATSAPP_TEMPLATES has customer_appointment_cancelled registered'
  )

  // Test cleanDoctorDisplayName prevents "Dr. Dr."
  assert(
    cleanDoctorDisplayName('Dr. Priya Sharma') === 'Priya Sharma',
    'cleanDoctorDisplayName("Dr. Priya Sharma") strips duplicate Dr. prefix'
  )
  assert(
    cleanDoctorDisplayName('Ananya Verma') === 'Ananya Verma',
    'cleanDoctorDisplayName("Ananya Verma") preserves clean names'
  )

  const sampleCustPreview = renderWhatsAppMessagePreview('customer_doctor_assigned', [
    'Rajesh Kumar',
    'Dr. Priya Sharma',
    '02 Nov 2026',
    '10:30 AM IST',
    'Online Video Consultation',
  ])

  assert(
    sampleCustPreview.includes('Hello Rajesh Kumar,'),
    'Customer assignment message contains recipient greeting'
  )
  assert(
    sampleCustPreview.includes('Doctor Name: Dr. Priya Sharma'),
    'Customer assignment message formats Doctor Name correctly'
  )
  assert(
    sampleCustPreview.includes('Appointment Date: 02 Nov 2026'),
    'Customer assignment message contains appointment date'
  )
  assert(
    sampleCustPreview.includes('Appointment Time: 10:30 AM IST'),
    'Customer assignment message contains appointment time with timezone'
  )
  assert(
    sampleCustPreview.includes('Consultation Type: Online Video Consultation'),
    'Customer assignment message contains consultation type'
  )
  assert(
    sampleCustPreview.includes('Your appointment is confirmed.'),
    'Customer assignment message includes confirmation statement'
  )

  // --------------------------------------------------------------------------
  // TEST 3: DUAL NOTIFICATION ON DOCTOR ASSIGNMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Dual Notification Dispatch on Doctor Assignment ---')

  // Setup test customer and doctor
  const testCustId = `c-test-qa-${Date.now()}`
  const testUserId = `u-test-qa-${Date.now()}`
  const testPhone = '+919876543210'

  if (!mockDb.state.customers) mockDb.state.customers = []
  if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
  if (!mockDb.state.professionals) mockDb.state.professionals = []
  if (!mockDb.state.appointments) mockDb.state.appointments = []

  const testCust = {
    id: testCustId,
    user_id: testUserId,
    full_name: 'Anita Desai',
    phone: testPhone,
    membership_status: 'active',
    is_active: true,
    timezone: 'Asia/Kolkata',
    created_at: new Date().toISOString(),
  }
  mockDb.state.customers.push(testCust)

  mockDb.state.user_profiles.push({
    id: testUserId,
    full_name: 'Anita Desai',
    phone: testPhone,
    role: 'customer',
  })

  // Doctor: Priya Sharma
  const testDoctor = mockDb.state.professionals.find((p: any) => p.role === 'doctor') || {
    id: 'pro-001',
    user_id: 'u-pro-001',
    full_name: 'Dr. Priya Sharma',
    phone: '+919820011223',
    role: 'doctor',
    is_active: true,
  }

  // Create an upcoming appointment for this customer & doctor
  const testApptId = `appt-test-${Date.now()}`
  const scheduledTimeIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const testAppt = {
    id: testApptId,
    customer_id: testCustId,
    professional_id: testDoctor.id,
    scheduled_at: scheduledTimeIso,
    duration_min: 45,
    status: 'scheduled',
    consultation_type: 'Ayurvedic Clinical Intake',
    meeting_url: 'https://meet.zoho.com/fitveda-live',
    created_at: new Date().toISOString(),
  }
  mockDb.state.appointments.push(testAppt)

  // Trigger assignment notification
  const assignmentResult = await triggerCustomerAssignmentNotifications({
    customerId: testCustId,
    professionalId: testDoctor.id,
    role: 'doctor',
    assignmentId: `pa-qa-${Date.now()}`,
    assignedSlot: '10:00 AM - 10:45 AM IST',
    dispatchImmediately: false,
  })

  assert(
    !!assignmentResult.created,
    'Doctor notification record created successfully'
  )
  assert(
    assignmentResult.created?.notification_type === 'doctor_customer_assigned',
    'Doctor notification has type "doctor_customer_assigned"'
  )
  assert(
    assignmentResult.created?.template_variables[6].startsWith('https://drfitveda.com/professional/customers/'),
    'Doctor profile link points strictly to https://drfitveda.com without preview hash'
  )

  assert(
    !!assignmentResult.customerNotification,
    'Customer notification record created simultaneously upon doctor assignment'
  )
  assert(
    assignmentResult.customerNotification?.notification_type === 'customer_doctor_assigned',
    'Customer notification has type "customer_doctor_assigned"'
  )
  assert(
    assignmentResult.customerNotification?.recipient_phone === testPhone,
    'Customer notification targets customer registered phone number'
  )
  assert(
    assignmentResult.customerNotification?.message_preview.includes(cleanDoctorDisplayName(testDoctor.full_name)),
    `Customer notification preview references assigned doctor name (${testDoctor.full_name})`
  )

  // --------------------------------------------------------------------------
  // TEST 4: DOCTOR REASSIGNMENT NOTIFICATION FLOW
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Doctor Reassignment Flow ---')

  const testDoctor2 = {
    id: `pro-qa-doc2-${Date.now()}`,
    user_id: `u-qa-doc2-${Date.now()}`,
    full_name: 'Dr. Vikram Malhotra',
    phone: '+919830022334',
    role: 'doctor',
    is_active: true,
  }
  mockDb.state.professionals.push(testDoctor2)

  // Reassign to Doctor 2
  const reassignResult = await triggerCustomerAssignmentNotifications({
    customerId: testCustId,
    professionalId: testDoctor2.id,
    role: 'doctor',
    assignmentId: `pa-qa-reassign-${Date.now()}`,
    previousProfessionalId: testDoctor.id,
    assignedSlot: '02:00 PM - 02:45 PM IST',
    dispatchImmediately: false,
  })

  assert(
    !!reassignResult.created && reassignResult.created.recipient_name === 'Dr. Vikram Malhotra',
    'New notification created for newly assigned Doctor 2'
  )
  assert(
    !!reassignResult.customerNotification,
    'Customer notification created for newly assigned Doctor 2'
  )
  assert(
    reassignResult.customerNotification?.message_preview.includes('Dr. Vikram Malhotra'),
    'Customer notification preview references new doctor Vikram Malhotra'
  )

  // Verify old pending notifications for Doctor 1 were cancelled
  const notifications: any[] = mockDb.state.whatsapp_notifications || []
  const oldDoctorPending = notifications.filter(
    (n: any) =>
      n.customer_id === testCustId &&
      n.recipient_user_id === testDoctor.user_id &&
      n.delivery_status === 'Pending'
  )
  assert(
    oldDoctorPending.length === 0,
    'Old doctor pending notifications cancelled on reassignment'
  )

  // --------------------------------------------------------------------------
  // TEST 5: APPOINTMENT RESCHEDULE & CANCELLATION NOTIFICATIONS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Appointment Status Change Notifications ---')

  // Rescheduled appointment
  const updatedTimeIso = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const updatedAppt = {
    ...testAppt,
    scheduled_at: updatedTimeIso,
  }

  const updateNotif = await syncCustomerAppointmentStatusNotification(
    updatedAppt,
    'updated',
    { dispatchImmediately: false }
  )

  assert(
    !!updateNotif,
    'Customer appointment updated notification generated'
  )
  assert(
    updateNotif?.notification_type === 'customer_appointment_updated',
    'Notification type is "customer_appointment_updated"'
  )
  assert(
    updateNotif?.message_preview.includes('rescheduled/updated'),
    'Notification preview reflects updated appointment schedule'
  )

  // Cancelled appointment
  const cancelNotif = await syncCustomerAppointmentStatusNotification(
    updatedAppt,
    'cancelled',
    { dispatchImmediately: false }
  )

  assert(
    !!cancelNotif,
    'Customer appointment cancelled notification generated'
  )
  assert(
    cancelNotif?.notification_type === 'customer_appointment_cancelled',
    'Notification type is "customer_appointment_cancelled"'
  )
  assert(
    cancelNotif?.message_preview.includes('has been cancelled'),
    'Notification preview reflects cancelled appointment'
  )

  // --------------------------------------------------------------------------
  // TEST 6: INDEPENDENT FAILURE TRACKING (MISSING CUSTOMER PHONE)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Independent Notification Error Tracking ---')

  const noPhoneCustId = `c-test-nophone-${Date.now()}`
  const noPhoneUserId = `u-test-nophone-${Date.now()}`
  mockDb.state.customers.push({
    id: noPhoneCustId,
    user_id: noPhoneUserId,
    full_name: 'Customer Without Phone',
    phone: '',
    membership_status: 'active',
    is_active: true,
    timezone: 'Asia/Kolkata',
    created_at: new Date().toISOString(),
  })
  mockDb.state.user_profiles.push({
    id: noPhoneUserId,
    full_name: 'Customer Without Phone',
    phone: '',
    role: 'customer',
  })

  const failureTrackingResult = await triggerCustomerAssignmentNotifications({
    customerId: noPhoneCustId,
    professionalId: testDoctor.id,
    role: 'doctor',
    assignmentId: `pa-qa-nophone-${Date.now()}`,
    assignedSlot: '11:00 AM - 12:00 PM IST',
    dispatchImmediately: false,
  })

  assert(
    !!failureTrackingResult.created && failureTrackingResult.created.delivery_status === 'Pending',
    'Doctor notification succeeds independently when customer phone is missing'
  )
  assert(
    !!failureTrackingResult.customerNotification && failureTrackingResult.customerNotification.delivery_status === 'Failed',
    'Customer notification recorded as Failed independently when phone is missing'
  )
  assert(
    failureTrackingResult.customerNotification?.permanent_failure === true,
    'Missing customer phone marked as permanent_failure (requires admin correction before retry)'
  )
  assert(
    failureTrackingResult.customerNotification?.error_details?.includes('phone number is missing'),
    'Failure details clearly state missing WhatsApp number in profile'
  )

  // --------------------------------------------------------------------------
  // TEST 7: UNASSIGNED FILTER & CARE DISPATCH INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Unassigned Filter & Care Dispatch Workflow ---')

  const unassignedCustId = `c-test-unassigned-${Date.now()}`
  const unassignedUserId = `u-test-unassigned-${Date.now()}`
  const unassignedPhone = '+919988776655'

  mockDb.state.customers.push({
    id: unassignedCustId,
    user_id: unassignedUserId,
    full_name: 'Pooja Hegde',
    phone: unassignedPhone,
    membership_status: 'active',
    is_active: true,
    timezone: 'Asia/Kolkata',
    created_at: new Date().toISOString(),
  })
  mockDb.state.user_profiles.push({
    id: unassignedUserId,
    full_name: 'Pooja Hegde',
    phone: unassignedPhone,
    role: 'customer',
  })

  // Verify customer is detected as unassigned
  const assignments = mockDb.state.professional_assignments || []
  const activeAssignedIds = new Set(
    assignments
      .filter((a: any) => a.is_active !== false && !a.is_archived && a.professional_id)
      .map((a: any) => a.customer_id)
  )
  assert(
    !activeAssignedIds.has(unassignedCustId),
    'New active customer is initially in Unassigned state'
  )

  // Simulate Care Dispatch assignment
  const dispatchAssignmentResult = await triggerCustomerAssignmentNotifications({
    customerId: unassignedCustId,
    professionalId: testDoctor.id,
    role: 'doctor',
    assignmentId: `pa-qa-dispatched-${Date.now()}`,
    assignedSlot: '09:00 AM - 10:00 AM IST',
    dispatchImmediately: false,
  })

  assert(
    !!dispatchAssignmentResult.created,
    'Doctor notification created upon dispatching unassigned customer'
  )
  assert(
    !!dispatchAssignmentResult.customerNotification && dispatchAssignmentResult.customerNotification.delivery_status === 'Pending',
    'Customer notification created upon dispatching unassigned customer'
  )
  assert(
    dispatchAssignmentResult.customerNotification?.template_name === 'drfitveda_customer_doctor_assigned',
    'Customer notification uses new drfitveda_customer_doctor_assigned template'
  )

  // Clean up extra test records
  mockDb.state.customers = mockDb.state.customers.filter(
    (c: any) => c.id !== noPhoneCustId && c.id !== unassignedCustId
  )
  mockDb.state.user_profiles = mockDb.state.user_profiles.filter(
    (u: any) => u.id !== noPhoneUserId && u.id !== unassignedUserId
  )

  // --------------------------------------------------------------------------
  // CLEANUP TEST RECORDS
  // --------------------------------------------------------------------------
  console.log('\n--- Cleanup ---')
  mockDb.state.customers = mockDb.state.customers.filter((c: any) => c.id !== testCustId)
  mockDb.state.user_profiles = mockDb.state.user_profiles.filter((u: any) => u.id !== testUserId)
  mockDb.state.professionals = mockDb.state.professionals.filter((p: any) => p.id !== testDoctor2.id)
  mockDb.state.appointments = mockDb.state.appointments.filter((a: any) => a.id !== testApptId)
  mockDb.state.whatsapp_notifications = (mockDb.state.whatsapp_notifications || []).filter(
    (n: any) => n.customer_id !== testCustId
  )
  await savePersistedState(['customers', 'user_profiles', 'professionals', 'appointments', 'whatsapp_notifications'])
  console.log('Test artifacts cleanly purged from state.')

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================')
  console.log(`TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`)
  console.log('======================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
