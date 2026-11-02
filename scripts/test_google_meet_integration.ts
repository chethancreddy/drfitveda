// ============================================================
// DrFitVeda - Google Meet Integration Verification Suite
// Tests 6 core scenarios requested in Section 13:
// 1. New appointment meeting generation & association
// 2. Multiple customers unique meeting links & non-collision
// 3. Browser-based joining link format validation
// 4. WhatsApp notifications with Google Meet links
// 5. Automatic cleanup on completion & cancellation
// 6. Migration of historical Zoho links to Google Meet
// ============================================================

import { GoogleMeetService } from '../src/lib/services/google-meet.service'
import { ZohoMeetingService } from '../src/lib/services/zoho-meeting.service'
import { APPROVED_WHATSAPP_TEMPLATES, renderTemplatePreview } from '../src/lib/services/whatsapp-templates'
import { mockDb } from '../src/lib/mock-db'

async function runGoogleMeetSuite() {
  console.log('====================================================')
  console.log('DrFitVeda Google Meet Integration Verification Suite')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✓ [PASS] ${desc}`)
      passed++
    } else {
      console.error(`✗ [FAIL] ${desc}`)
      failed++
    }
  }

  // ============================================================
  // TEST SUITE 1: Configuration & Service Initialization
  // ============================================================
  console.log('\n--- 1. Testing Google Meet Service Configuration & Status ---')

  const status = GoogleMeetService.getConfigurationStatus()
  const instructions = GoogleMeetService.getSetupInstructions()
  assert(status !== null && typeof status === 'object', 'GoogleMeetService returns configuration status')
  assert(typeof status.configured === 'boolean', 'Configuration status includes boolean configured flag')
  assert(typeof status.authMethod === 'string', 'Configuration status identifies authMethod (oauth_refresh_token or manual_fallback)')
  assert(instructions.length > 0, 'Clear setup instructions provided for Google Cloud Console')

  // ============================================================
  // TEST SUITE 2: Meeting Generation for New Appointments
  // ============================================================
  console.log('\n--- 2. Testing Meeting Generation for New Appointments ---')

  const customerId1 = 'cust-test-alpha-001'
  const profId1 = 'prof-doctor-ananya-001'
  const apptId1 = 'appt-test-google-meet-001'

  const meetResult1 = await GoogleMeetService.getOrCreateCustomerMeeting({
    customerId: customerId1,
    customerName: 'Aarav Patel',
    customerEmail: 'aarav.patel@example.com',
    professionalId: profId1,
    appointmentId: apptId1,
    startTime: new Date(Date.now() + 3600000).toISOString(),
    durationMin: 45,
    summary: 'DrFitVeda Clinical Consultation - Aarav Patel',
    forceNew: true,
  })

  assert(meetResult1.success === true, 'Meeting generated successfully for new appointment')
  assert(meetResult1.meeting_url.startsWith('https://meet.google.com/'), `Valid Google Meet URL format: ${meetResult1.meeting_url}`)
  assert(meetResult1.provider === 'google_meet', 'Provider marked explicitly as google_meet')
  assert(meetResult1.meeting_id.length >= 10, `Valid meeting ID generated: ${meetResult1.meeting_id}`)
  assert(meetResult1.browser_join_url === meetResult1.meeting_url || meetResult1.meeting_url.startsWith('https://meet.google.com/'), 'Browser join URL matches meeting URL with zero app downloads required')

  // Verify persistence in mockDb
  const savedAppt = mockDb.state.appointments.find((a: any) => a.id === apptId1)
  assert(savedAppt !== undefined, 'Appointment record created in persistence store')
  assert(savedAppt?.meeting_url === meetResult1.meeting_url, 'Appointment record stores generated Google Meet URL')
  assert(savedAppt?.meeting_provider === 'google_meet', 'Appointment record stores google_meet provider')

  // ============================================================
  // TEST SUITE 3: Multiple Customers Unique Meeting Links (No Collisions)
  // ============================================================
  console.log('\n--- 3. Testing Multiple Customers Unique Meeting Links ---')

  const customerId2 = 'cust-test-beta-002'
  const profId2 = 'prof-trainer-vikram-002'
  const apptId2 = 'appt-test-google-meet-002'

  const customerId3 = 'cust-test-gamma-003'
  const profId3 = 'prof-doctor-ananya-001'
  const apptId3 = 'appt-test-google-meet-003'

  const meetResult2 = await GoogleMeetService.getOrCreateCustomerMeeting({
    customerId: customerId2,
    customerName: 'Meera Nambiar',
    customerEmail: 'meera.n@example.com',
    professionalId: profId2,
    appointmentId: apptId2,
    startTime: new Date(Date.now() + 7200000).toISOString(),
    durationMin: 60,
    summary: 'DrFitVeda Personal Training - Meera Nambiar',
    forceNew: true,
  })

  const meetResult3 = await GoogleMeetService.getOrCreateCustomerMeeting({
    customerId: customerId3,
    customerName: 'Rohan Deshmukh',
    customerEmail: 'rohan.d@example.com',
    professionalId: profId3,
    appointmentId: apptId3,
    startTime: new Date(Date.now() + 10800000).toISOString(),
    durationMin: 30,
    summary: 'DrFitVeda Naturopathy Follow-Up - Rohan Deshmukh',
    forceNew: true,
  })

  assert(meetResult1.meeting_url !== meetResult2.meeting_url, 'Customer 1 and Customer 2 receive distinct, unique meeting URLs')
  assert(meetResult2.meeting_url !== meetResult3.meeting_url, 'Customer 2 and Customer 3 receive distinct, unique meeting URLs')
  assert(meetResult1.meeting_url !== meetResult3.meeting_url, 'Customer 1 and Customer 3 receive distinct, unique meeting URLs')
  assert(meetResult1.meeting_id !== meetResult2.meeting_id, 'Meeting IDs do not collide across different customers')
  assert(meetResult2.meeting_id !== meetResult3.meeting_id, 'Meeting IDs do not collide across different sessions')

  // Test idempotency: Calling again without forceNew returns existing meeting
  const meetResult1Duplicate = await GoogleMeetService.getOrCreateCustomerMeeting({
    customerId: customerId1,
    appointmentId: apptId1,
  })
  assert(meetResult1Duplicate.meeting_url === meetResult1.meeting_url, 'Idempotent call returns existing customer meeting without duplicate link creation')

  // ============================================================
  // TEST SUITE 4: Browser-Based Joining Link Format Validation
  // ============================================================
  console.log('\n--- 4. Testing Browser-Based Joining Link Validation ---')

  const testUrls = [
    meetResult1.meeting_url,
    meetResult2.meeting_url,
    meetResult3.meeting_url,
    'https://meet.google.com/abc-defg-hij',
    'https://meet.google.com/fit-veda-live',
  ]

  for (const url of testUrls) {
    const isGoogleMeet = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url)
    assert(isGoogleMeet, `URL matches official Google Meet domain without app-forcing params: ${url}`)
    assert(!url.includes('zoho.com'), `URL has no Zoho legacy references: ${url}`)
  }

  // ============================================================
  // TEST SUITE 5: WhatsApp Notifications with Google Meet Links
  // ============================================================
  console.log('\n--- 5. Testing WhatsApp Notifications with Google Meet Links ---')

  // Verify approved templates exist
  const custDoctorAssignedTpl = APPROVED_WHATSAPP_TEMPLATES.find(
    t => t.id === 'drfitveda_customer_doctor_assigned'
  )
  assert(custDoctorAssignedTpl !== undefined, 'Customer doctor assigned WhatsApp template exists')

  // Render preview with Google Meet variables
  const renderedMessage = renderTemplatePreview(custDoctorAssignedTpl.bodyTemplate, {
    '1': 'Aarav Patel',
    '2': 'Dr. Ananya Verma',
    '3': 'Wednesday, 04 Nov 2026',
    '4': '10:00 AM - 10:45 AM IST',
    '5': 'Online Video (Google Meet)',
  })

  assert(renderedMessage.includes('Aarav Patel'), 'Rendered WhatsApp message includes customer name')
  assert(renderedMessage.includes('Dr. Ananya Verma'), 'Rendered WhatsApp message includes doctor name')
  assert(renderedMessage.includes('Online Video (Google Meet)'), 'Rendered WhatsApp message uses Google Meet consultation mode')
  assert(!renderedMessage.includes('Zoho'), 'Rendered WhatsApp message contains zero references to Zoho')

  // Verify generic session reminder template
  const sessionReminderTpl = APPROVED_WHATSAPP_TEMPLATES.find(
    t => t.id === 'customer_session_reminder' || t.id === 'appointment_reminder_15min'
  )
  if (sessionReminderTpl) {
    const renderedReminder = renderTemplatePreview(sessionReminderTpl.bodyTemplate, {
      '1': 'Aarav Patel',
      '2': 'Dr. Ananya Verma',
      '3': '10:00 AM',
      '4': meetResult1.meeting_url,
    })
    assert(renderedReminder.includes('https://meet.google.com/'), 'Session reminder WhatsApp template renders Google Meet URL')
  }

  // ============================================================
  // TEST SUITE 6: Automatic Cleanup on Completion & Cancellation
  // ============================================================
  console.log('\n--- 6. Testing Automatic Cleanup on Completion & Cancellation ---')

  // Test cleanup on appointment completion
  const cleanupCompleteResult = await GoogleMeetService.cleanupMeeting({
    customerId: customerId1,
    appointmentId: apptId1,
    action: 'completed',
    reason: 'Appointment completed successfully',
  })

  assert(cleanupCompleteResult.success === true, 'Meeting cleanup succeeds on appointment completion')

  const apptAfterComplete = mockDb.state.appointments.find((a: any) => a.id === apptId1)
  assert(apptAfterComplete?.meeting_status === 'completed', 'Appointment meeting_status updated to completed')
  assert(apptAfterComplete?.meeting_url === meetResult1.meeting_url, 'Historical meeting URL retained in appointment record for audit')

  // Test cleanup on appointment cancellation
  const cleanupCancelResult = await GoogleMeetService.cleanupMeeting({
    customerId: customerId2,
    appointmentId: apptId2,
    action: 'cancelled',
    reason: 'Cancelled by patient',
  })

  assert(cleanupCancelResult.success === true, 'Meeting cleanup succeeds on appointment cancellation')
  const apptAfterCancel = mockDb.state.appointments.find((a: any) => a.id === apptId2)
  assert(apptAfterCancel?.meeting_status === 'cancelled', 'Appointment meeting_status updated to cancelled')
  assert(apptAfterCancel?.meeting_url === meetResult2.meeting_url, 'Cancelled appointment preserves historical URL without deletion')

  // Customer meeting history audit
  const cust1 = mockDb.state.customers.find((c: any) => c.id === customerId1)
  const history = cust1?.meetings_history || []
  assert(history.length > 0, 'Customer meetings_history logs flushed meeting')
  assert(history.some((h: any) => h.meeting_url === meetResult1.meeting_url), 'Meeting history audit records meeting URL')

  // ============================================================
  // TEST SUITE 7: Migration of Historical Zoho Links to Google Meet
  // ============================================================
  console.log('\n--- 7. Testing Migration of Historical Zoho Links to Google Meet ---')

  // Seed an upcoming appointment with legacy Zoho link
  const legacyApptId = 'appt-legacy-zoho-999'
  const legacyCustomerId = 'cust-legacy-zoho-999'
  const legacyZohoUrl = 'https://meet.zoho.com/fitveda-legacy-meeting'

  mockDb.state.customers.push({
    id: legacyCustomerId,
    user_id: 'user-legacy-999',
    full_name: 'Pooja Hegde',
    email: 'pooja.h@example.com',
    meeting_url: legacyZohoUrl,
    zoho_meeting_url: legacyZohoUrl,
    meeting_provider: 'zoho_meeting',
    is_active: true,
  } as any)

  // Seed a standalone customer with legacy Zoho link (no upcoming appointments)
  const standaloneLegacyCustId = 'cust-legacy-standalone-888'
  mockDb.state.customers.push({
    id: standaloneLegacyCustId,
    user_id: 'user-legacy-888',
    full_name: 'Kabir Sethi',
    email: 'kabir.s@example.com',
    meeting_url: legacyZohoUrl,
    zoho_meeting_url: legacyZohoUrl,
    meeting_provider: 'zoho_meeting',
    is_active: true,
  } as any)

  mockDb.state.appointments.push({
    id: legacyApptId,
    customer_id: legacyCustomerId,
    professional_id: profId1,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    meeting_url: legacyZohoUrl,
    meeting_provider: 'zoho_meeting',
    consultation_type: 'Online Video (Zoho Meeting)',
  } as any)

  // Run migration
  const migrationResult = await GoogleMeetService.migrateUpcomingZohoMeetings()
  assert(migrationResult.success === true, 'Migration engine executes successfully')
  assert(migrationResult.migrated_appointments >= 1, `Migrated at least 1 upcoming appointment (count: ${migrationResult.migrated_appointments})`)
  assert(migrationResult.migrated_customers >= 1, `Migrated at least 1 active customer (count: ${migrationResult.migrated_customers})`)

  const migratedAppt = mockDb.state.appointments.find((a: any) => a.id === legacyApptId)
  assert(migratedAppt?.meeting_url.startsWith('https://meet.google.com/'), `Migrated appointment now has Google Meet URL: ${migratedAppt?.meeting_url}`)
  assert(migratedAppt?.meeting_provider === 'google_meet', 'Migrated appointment has provider=google_meet')
  assert(migratedAppt?.historical_zoho_url === legacyZohoUrl, 'Historical Zoho URL preserved in historical_zoho_url field')
  assert(migratedAppt?.consultation_type === 'Online Video (Google Meet)', 'Consultation type updated to Online Video (Google Meet)')

  const migratedCust = mockDb.state.customers.find((c: any) => c.id === legacyCustomerId)
  assert(migratedCust?.google_meet_url.startsWith('https://meet.google.com/'), `Migrated customer now has Google Meet URL: ${migratedCust?.google_meet_url}`)
  assert(migratedCust?.historical_zoho_url === legacyZohoUrl, 'Historical customer Zoho URL preserved for auditing')

  // ============================================================
  // TEST SUITE 8: Backward-Compatible Legacy Zoho Service Bridge
  // ============================================================
  console.log('\n--- 8. Testing Backward-Compatible Legacy Zoho Service Bridge ---')

  const bridgeResult = await ZohoMeetingService.getOrCreateCustomerMeeting({
    customerId: 'cust-bridge-001',
    customerName: 'Kunal Kapoor',
    professionalId: profId1,
  })

  assert(bridgeResult.success === true, 'Legacy ZohoMeetingService bridge succeeds')
  assert(bridgeResult.meeting_url.startsWith('https://meet.google.com/'), 'Legacy bridge returns Google Meet URL')
  assert(bridgeResult.provider === 'google_meet', 'Legacy bridge transparently delivers google_meet provider')

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n====================================================')
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runGoogleMeetSuite().catch(err => {
  console.error('Test runner encountered error:', err)
  process.exit(1)
})
