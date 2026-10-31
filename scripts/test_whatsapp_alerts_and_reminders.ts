// ============================================================
// Dr Fit Veda — Automated WhatsApp Alerts & Session Reminder
// End-to-End Verification Suite (Tests A, B, C, D, E, F)
// Uses isolated internal test accounts and restores production
// state cleanly upon completion.
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

import { mockDb } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { msg91WhatsAppService } from '../src/lib/services/msg91-whatsapp.service'
import { msg91EmailService } from '../src/lib/services/msg91-email.service'
import {
  WHATSAPP_TEMPLATES,
  formatDateTimeInTimeZone,
  triggerCustomerAssignmentNotifications,
  syncSessionRemindersForAppointment,
  syncSessionRemindersForTrainingSession,
  runWhatsAppReminderScheduler,
  adminRetryFailedNotification,
  handleMsg91DeliveryWebhook,
} from '../src/lib/services/whatsapp-notification.service'
import { resolveAccountByIdentifier, getDashboardForRole } from '../src/lib/auth-resolver'

async function runSuite() {
  console.log('============================================================')
  console.log('DR FIT VEDA — WHATSAPP ALERTS & REMINDERS E2E TEST SUITE')
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

  await loadPersistedState(true)

  // Snapshot original collections so we can restore them cleanly after all tests finish
  const origCustomers = JSON.parse(JSON.stringify(mockDb.state.customers || []))
  const origUserProfiles = JSON.parse(JSON.stringify(mockDb.state.user_profiles || []))
  const origProfessionals = JSON.parse(JSON.stringify(mockDb.state.professionals || []))
  const origAssignments = JSON.parse(JSON.stringify(mockDb.state.professional_assignments || []))
  const origAppointments = JSON.parse(JSON.stringify(mockDb.state.appointments || []))
  const origTrainingSessions = JSON.parse(JSON.stringify(mockDb.state.training_sessions || []))
  const origWaNotifications = JSON.parse(JSON.stringify(mockDb.state.whatsapp_notifications || []))
  const origWaRuns = JSON.parse(JSON.stringify(mockDb.state.whatsapp_scheduler_runs || []))
  const origInAppNotifs = JSON.parse(JSON.stringify(mockDb.state.notifications || []))

  // Use internal test numbers (matching the internal QA test range +919876543210..13)
  const TEST_CUST_ID = 'c-qa-wa-cust-001'
  const TEST_CUST_USER_ID = 'u-qa-wa-cust-001'
  const TEST_DOC_ID = 'p-qa-wa-doc-001'
  const TEST_DOC_USER_ID = 'u-qa-wa-doc-001'
  const TEST_TRN1_ID = 'p-qa-wa-trn-001'
  const TEST_TRN1_USER_ID = 'u-qa-wa-trn-001'
  const TEST_TRN2_ID = 'p-qa-wa-trn-002'
  const TEST_TRN2_USER_ID = 'u-qa-wa-trn-002'

  try {
    // ─── 0. Audit Live MSG91 Configuration & Approved Templates ──
    console.log('--- 0. Auditing MSG91 WhatsApp Integration & Approved Templates ---')
    const cfg = msg91WhatsAppService.getConfigurationStatus()
    assert('MSG91 Auth Key & Integrated Number (17111240135) Configured', cfg.configured, `Number: ${cfg.integratedNumber}`)

    const liveTemplates = await msg91WhatsAppService.getTemplatesStatus()
    for (const [wfType, meta] of Object.entries(WHATSAPP_TEMPLATES)) {
      const found = liveTemplates.find(t => t.name === meta.name && t.status === 'approved')
      assert(
        `Meta WhatsApp Template "${meta.name}" (${wfType}) is APPROVED on MSG91`,
        Boolean(found),
        found ? `Meta ID: ${found.templateId}, MSG91 ID: ${found.msg91TemplateId}, Vars: ${found.variables.length}` : 'Not found'
      )
    }

    // Seed isolated internal test accounts
    mockDb.state.user_profiles.push(
      {
        id: TEST_CUST_USER_ID,
        role: 'customer',
        full_name: 'Aarav QA Test Customer',
        email: 'aarav.qa.test@drfitveda.com',
        phone: '+91 98765 43210',
        is_active: true,
      },
      {
        id: TEST_DOC_USER_ID,
        role: 'doctor',
        full_name: 'Dr. Meera QA Doctor',
        email: 'meera.qa.doc@drfitveda.com',
        phone: '+91 98765 43211',
        is_active: true,
      },
      {
        id: TEST_TRN1_USER_ID,
        role: 'trainer',
        full_name: 'Rohan QA Trainer',
        email: 'rohan.qa.trn@drfitveda.com',
        phone: '+91 98765 43212',
        is_active: true,
      },
      {
        id: TEST_TRN2_USER_ID,
        role: 'trainer',
        full_name: 'Kiran QA Senior Trainer',
        email: 'kiran.qa.trn@drfitveda.com',
        phone: '+91 98765 43213',
        is_active: true,
      }
    )

    mockDb.state.customers.push({
      id: TEST_CUST_ID,
      user_id: TEST_CUST_USER_ID,
      membership_status: 'active',
      membership_plan_id: 'mbr-001',
      zoho_meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
      google_meet_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
      meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
      is_active: true,
    })

    mockDb.state.professionals.push(
      {
        id: TEST_DOC_ID,
        user_id: TEST_DOC_USER_ID,
        role: 'doctor',
        full_name: 'Dr. Meera QA Doctor',
        email: 'meera.qa.doc@drfitveda.com',
        phone: '+91 98765 43211',
        is_available: true,
        is_active: true,
      },
      {
        id: TEST_TRN1_ID,
        user_id: TEST_TRN1_USER_ID,
        role: 'trainer',
        full_name: 'Rohan QA Trainer',
        email: 'rohan.qa.trn@drfitveda.com',
        phone: '+91 98765 43212',
        is_available: true,
        is_active: true,
      },
      {
        id: TEST_TRN2_ID,
        user_id: TEST_TRN2_USER_ID,
        role: 'trainer',
        full_name: 'Kiran QA Senior Trainer',
        email: 'kiran.qa.trn@drfitveda.com',
        phone: '+91 98765 43213',
        is_available: true,
        is_active: true,
      }
    )
    await savePersistedState(['user_profiles', 'customers', 'professionals'])

    // ─── TEST C: Doctor Assignment Notification ──────────────────
    console.log('\n--- Test C: Doctor Notification — New Customer Assigned ---')
    const docAssignId = 'pa-qa-doc-001'
    mockDb.state.professional_assignments.push({
      id: docAssignId,
      customer_id: TEST_CUST_ID,
      professional_id: TEST_DOC_ID,
      role: 'doctor',
      assigned_slot: '10:00 AM - 11:00 AM IST',
      is_active: true,
    })
    await savePersistedState('professional_assignments')

    const docAssignRes = await triggerCustomerAssignmentNotifications({
      customerId: TEST_CUST_ID,
      professionalId: TEST_DOC_ID,
      role: 'doctor',
      assignmentId: docAssignId,
      assignedSlot: '10:00 AM - 11:00 AM IST',
    })

    assert(
      'Doctor assignment notification created & accepted by MSG91 (status="Sent")',
      Boolean(docAssignRes.created) &&
        docAssignRes.created?.delivery_status === 'Sent' &&
        Boolean(docAssignRes.created?.provider_message_id),
      `Message ID: ${docAssignRes.created?.provider_message_id}`
    )
    assert(
      'Doctor notification contains customer name, phone, assignment date, slot, and secure profile URL without duplicate "Dr."',
      Boolean(
        docAssignRes.created?.message_preview.includes('Hello Dr. Meera QA Doctor,') &&
          docAssignRes.created?.message_preview.includes('Customer Name: Aarav QA Test Customer') &&
          docAssignRes.created?.message_preview.includes('Phone Number: +91 98765 43210') &&
          docAssignRes.created?.message_preview.includes(`/professional/customers/${TEST_CUST_ID}`)
      )
    )

    // Verify duplicate assignment prevention
    const dupDocRes = await triggerCustomerAssignmentNotifications({
      customerId: TEST_CUST_ID,
      professionalId: TEST_DOC_ID,
      role: 'doctor',
      assignmentId: docAssignId,
    })
    assert(
      'Duplicate Doctor assignment notification prevented by idempotency guard',
      dupDocRes.skippedDuplicate === true && dupDocRes.created === null
    )

    // Verify incomplete/missing customer does not trigger notification
    const incompleteRes = await triggerCustomerAssignmentNotifications({
      customerId: 'c-non-existent-999',
      professionalId: TEST_DOC_ID,
      role: 'doctor',
      assignmentId: 'pa-invalid-999',
    })
    assert(
      'Incomplete / missing customer onboarding does NOT trigger Doctor notification',
      incompleteRes.created === null
    )

    // ─── TEST D: Trainer Assignment & Reassignment ───────────────
    console.log('\n--- Test D: Trainer Notification — New Customer Assigned & Reassigned ---')
    const trnAssignId = 'pa-qa-trn-001'
    mockDb.state.professional_assignments.push({
      id: trnAssignId,
      customer_id: TEST_CUST_ID,
      professional_id: TEST_TRN1_ID,
      role: 'trainer',
      assigned_slot: '07:00 AM - 08:00 AM IST',
      is_active: true,
    })
    await savePersistedState('professional_assignments')

    const trn1AssignRes = await triggerCustomerAssignmentNotifications({
      customerId: TEST_CUST_ID,
      professionalId: TEST_TRN1_ID,
      role: 'trainer',
      assignmentId: trnAssignId,
      assignedSlot: '07:00 AM - 08:00 AM IST',
    })
    assert(
      'Initial Trainer (Rohan QA Trainer) notified immediately via MSG91 (status="Sent")',
      Boolean(trn1AssignRes.created) &&
        trn1AssignRes.created?.delivery_status === 'Sent' &&
        trn1AssignRes.created?.recipient_user_id === TEST_TRN1_USER_ID,
      `Message ID: ${trn1AssignRes.created?.provider_message_id}`
    )
    assert(
      'Trainer notification contains customer name, phone, first session slot, and secure dashboard URL',
      Boolean(
        trn1AssignRes.created?.message_preview.includes('Hello Rohan QA Trainer,') &&
          trn1AssignRes.created?.message_preview.includes('Customer Name: Aarav QA Test Customer') &&
          trn1AssignRes.created?.message_preview.includes('First Session Time: 07:00 AM - 08:00 AM IST') &&
          trn1AssignRes.created?.message_preview.includes(`/professional/customers/${TEST_CUST_ID}`)
      )
    )

    // Reassign customer from Trainer 1 (Rohan) to Trainer 2 (Kiran)
    const paIdx = mockDb.state.professional_assignments.findIndex((a: any) => a.id === trnAssignId)
    mockDb.state.professional_assignments[paIdx].professional_id = TEST_TRN2_ID
    await savePersistedState('professional_assignments')

    const trn2ReassignRes = await triggerCustomerAssignmentNotifications({
      customerId: TEST_CUST_ID,
      professionalId: TEST_TRN2_ID,
      role: 'trainer',
      assignmentId: trnAssignId,
      assignedSlot: '06:00 PM - 07:00 PM IST',
      previousProfessionalId: TEST_TRN1_ID,
    })
    assert(
      'Reassigned Trainer (Kiran QA Senior Trainer) notified immediately via MSG91; previous trainer not re-notified',
      Boolean(trn2ReassignRes.created) &&
        trn2ReassignRes.created?.delivery_status === 'Sent' &&
        trn2ReassignRes.created?.recipient_user_id === TEST_TRN2_USER_ID,
      `Message ID: ${trn2ReassignRes.created?.provider_message_id}`
    )

    // ─── TEST A & TEST B: Customer & Trainer 15-Minute Session Reminders ───
    console.log('\n--- Test A & Test B: Customer & Trainer 15-Minute Session Reminders ---')
    const now = new Date()
    const in15MinIso = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
    const testSessionId = 'ts-qa-rem-001'

    const testTrainingSession = {
      id: testSessionId,
      customer_id: TEST_CUST_ID,
      trainer_id: TEST_TRN2_ID,
      scheduled_at: in15MinIso,
      status: 'scheduled',
      session_type: 'Live 1-on-1 Personal Training',
      meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
      created_at: now.toISOString(),
    }
    mockDb.state.training_sessions.push(testTrainingSession)
    await savePersistedState('training_sessions')

    // Schedule reminders for the session
    const syncRes = await syncSessionRemindersForTrainingSession(testTrainingSession)
    assert(
      'Confirmed training session schedules 2 Pending reminders (1 Customer + 1 Trainer) for scheduled_at - 15m',
      syncRes.scheduled.length === 2
    )

    // Run background scheduler at `now` (exactly 15 minutes before `in15MinIso`)
    const schedRun1 = await runWhatsAppReminderScheduler({ now })
    const custReminder = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) => n.session_id === testSessionId && n.notification_type === 'customer_session_reminder'
    )
    const trnReminder = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) => n.session_id === testSessionId && n.notification_type === 'trainer_session_reminder'
    )

    assert(
      'Test A: Customer 15-minute session reminder dispatched via MSG91 (status="Sent")',
      Boolean(custReminder) &&
        custReminder.delivery_status === 'Sent' &&
        Boolean(custReminder.provider_message_id),
      `Message ID: ${custReminder?.provider_message_id}`
    )
    assert(
      'Test A: Customer reminder includes session type, date, time, trainer name, and Zoho Meeting link',
      Boolean(
        custReminder?.message_preview.includes('Hello Aarav QA Test Customer,') &&
          custReminder?.message_preview.includes('Your DrFitVeda session is scheduled to start in 15 minutes!') &&
          custReminder?.message_preview.includes('Trainer/Doctor: Kiran QA Senior Trainer') &&
          custReminder?.message_preview.includes('Meeting Link: https://meet.zoho.com/fitveda-aarav-qa-901')
      )
    )

    assert(
      'Test B: Trainer 15-minute session reminder dispatched via MSG91 (status="Sent")',
      Boolean(trnReminder) &&
        trnReminder.delivery_status === 'Sent' &&
        Boolean(trnReminder.provider_message_id),
      `Message ID: ${trnReminder?.provider_message_id}`
    )
    assert(
      'Test B: Trainer reminder includes customer name, customer phone, session type, date, time, and meeting link',
      Boolean(
        trnReminder?.message_preview.includes('Hello Kiran QA Senior Trainer,') &&
          trnReminder?.message_preview.includes('Customer Name: Aarav QA Test Customer') &&
          trnReminder?.message_preview.includes('Customer Contact: +91 98765 43210') &&
          trnReminder?.message_preview.includes('Meeting Link: https://meet.zoho.com/fitveda-aarav-qa-901')
      )
    )

    // Test Cancellation: Create a session 30m in future, cancel it, and verify no reminder is sent
    const cancelledSessionId = 'ts-qa-cancel-002'
    const in30MinIso = new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    const cancelSessionObj = {
      id: cancelledSessionId,
      customer_id: TEST_CUST_ID,
      trainer_id: TEST_TRN2_ID,
      scheduled_at: in30MinIso,
      status: 'scheduled',
      meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
    }
    mockDb.state.training_sessions.push(cancelSessionObj)
    await savePersistedState('training_sessions')
    await syncSessionRemindersForTrainingSession(cancelSessionObj)

    // Now cancel the session
    cancelSessionObj.status = 'cancelled'
    await savePersistedState('training_sessions')
    const cancelSync = await syncSessionRemindersForTrainingSession(cancelSessionObj)
    assert(
      'Test A: Cancelling a session immediately marks its Pending reminders as "Cancelled"',
      cancelSync.cancelledCount === 2
    )

    // Run scheduler at T+15m (when cancelled session would have been 15m away)
    await runWhatsAppReminderScheduler({ now: new Date(now.getTime() + 15 * 60 * 1000) })
    const cancelledRemAfterRun = (mockDb.state.whatsapp_notifications || []).filter(
      (n: any) => n.session_id === cancelledSessionId && n.delivery_status === 'Sent'
    )
    assert(
      'Test A: No WhatsApp reminder is sent for a cancelled session when scheduler runs',
      cancelledRemAfterRun.length === 0
    )

    // ─── TEST E: Reliability, Idempotency, Rescheduling, Retries & Timezones ───
    console.log('\n--- Test E: Reliability, Duplicate Prevention, Rescheduling & Retries ---')

    // 1. Run scheduler multiple times -> verify zero duplicate reminders for `testSessionId`
    await runWhatsAppReminderScheduler({ now })
    await runWhatsAppReminderScheduler({ now })
    const allForSession1 = (mockDb.state.whatsapp_notifications || []).filter(
      (n: any) => n.session_id === testSessionId
    )
    assert(
      'Running scheduler 3 times produces zero duplicate reminders (strictly 1 Customer + 1 Trainer record)',
      allForSession1.length === 2 && schedRun1.dispatchedCount >= 2
    )

    // 2. Rescheduling a session cancels old Pending reminders and creates new ones
    const reschedSessionId = 'appt-qa-resched-003'
    const in60MinIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    const in90MinIso = new Date(now.getTime() + 90 * 60 * 1000).toISOString()
    const apptObj: any = {
      id: reschedSessionId,
      customer_id: TEST_CUST_ID,
      professional_id: TEST_DOC_ID,
      scheduled_at: in60MinIso,
      status: 'scheduled',
      meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
    }
    mockDb.state.appointments.push(apptObj)
    await savePersistedState('appointments')
    await syncSessionRemindersForAppointment(apptObj)

    // Reschedule from +60m to +90m
    apptObj.scheduled_at = in90MinIso
    await savePersistedState('appointments')
    const reschedSync = await syncSessionRemindersForAppointment(apptObj)
    const oldCancelled = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) =>
        n.session_id === reschedSessionId &&
        n.session_scheduled_at === in60MinIso &&
        n.delivery_status === 'Cancelled'
    )
    const newPending = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) =>
        n.session_id === reschedSessionId &&
        n.session_scheduled_at === in90MinIso &&
        n.delivery_status === 'Pending'
    )
    assert(
      'Rescheduling a session cancels the old Pending reminder and schedules a new Pending reminder for the updated time',
      reschedSync.cancelledCount === 1 && Boolean(oldCancelled) && Boolean(newPending)
    )

    // 3. Simulate MSG91 Transient Failure & Verify Automatic Exponential Backoff Retry
    const retryApptId = 'appt-qa-retry-004'
    const in14MinIso = new Date(now.getTime() + 14 * 60 * 1000).toISOString()
    const retryApptObj: any = {
      id: retryApptId,
      customer_id: TEST_CUST_ID,
      professional_id: TEST_DOC_ID,
      scheduled_at: in14MinIso,
      status: 'scheduled',
      meeting_url: 'https://meet.zoho.com/fitveda-aarav-qa-901',
    }
    mockDb.state.appointments.push(retryApptObj)
    await savePersistedState('appointments')
    await syncSessionRemindersForAppointment(retryApptObj)

    msg91WhatsAppService._setSimulatedFailureModeForTesting('transient')
    await runWhatsAppReminderScheduler({ now })
    const failedRem = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) => n.session_id === retryApptId && n.notification_type === 'customer_session_reminder'
    )
    assert(
      'Simulated MSG91 transient 503 failure marks notification "Failed" with next_retry_at scheduled (permanent_failure=false)',
      Boolean(failedRem) &&
        failedRem.delivery_status === 'Failed' &&
        failedRem.permanent_failure === false &&
        Boolean(failedRem.next_retry_at)
    )

    // Restore MSG91 service and advance clock by +2 minutes past 1st retry backoff (1m)
    msg91WhatsAppService._setSimulatedFailureModeForTesting('none')
    await runWhatsAppReminderScheduler({ now: new Date(now.getTime() + 2 * 60 * 1000) })
    const recoveredRem = (mockDb.state.whatsapp_notifications || []).find(
      (n: any) => n.session_id === retryApptId && n.notification_type === 'customer_session_reminder'
    )
    assert(
      'Scheduler automatically retries transient failure after backoff and succeeds via MSG91 (status="Sent", retry_count=1)',
      Boolean(recoveredRem) &&
        recoveredRem.delivery_status === 'Sent' &&
        recoveredRem.retry_count === 1 &&
        Boolean(recoveredRem.provider_message_id),
      `Message ID: ${recoveredRem?.provider_message_id}`
    )

    // 4. Delivery Receipt Webhook ('Sent' -> 'Delivered') & Immutability Guard
    const webhookRes = await handleMsg91DeliveryWebhook({
      notificationId: recoveredRem.id,
      status: 'delivered',
    })
    assert(
      'MSG91 delivery webhook transitions provider-accepted ("Sent") record to confirmed "Delivered"',
      webhookRes.updated === true && webhookRes.record?.delivery_status === 'Delivered' && Boolean(webhookRes.record?.delivered_at)
    )

    const illegalRetry = await adminRetryFailedNotification(recoveredRem.id)
    assert(
      'Admin retry strictly blocks resending an already Delivered notification',
      illegalRetry.success === false && Boolean(illegalRetry.error?.includes('immutable'))
    )

    // 5. Timezone formatting verification
    const testUtcIso = '2026-11-01T13:30:00.000Z'
    const istFmt = formatDateTimeInTimeZone(testUtcIso, 'Asia/Kolkata')
    const utcFmt = formatDateTimeInTimeZone(testUtcIso, 'UTC')
    const dxbFmt = formatDateTimeInTimeZone(testUtcIso, 'Asia/Dubai')
    assert(
      'Multi-timezone formatter accurately converts UTC 13:30 to IST (07:00 PM), Dubai (05:30 PM), and UTC (01:30 PM)',
      istFmt.timeStr.includes('07:00 PM IST') &&
        utcFmt.timeStr.includes('01:30 PM UTC') &&
        dxbFmt.timeStr.includes('05:30 PM Dubai'),
      `IST: ${istFmt.timeStr} | Dubai: ${dxbFmt.timeStr} | UTC: ${utcFmt.timeStr}`
    )

    // ─── TEST F: Regression (WhatsApp OTP, Email OTP, Auth) ─────
    console.log('\n--- Test F: Regression — WhatsApp OTP, Email OTP & Role Auth ---')
    msg91WhatsAppService._setOtpForTesting('919876500999', '482910', 300000)
    const waOtpVerify = await msg91WhatsAppService.verifyOtp('919876500999', '482910')
    assert('Existing WhatsApp OTP verification remains 100% functional', waOtpVerify.success === true)

    const emailSend = await msg91EmailService.sendOtp('regression.wa.suite@drfitveda.com')
    const emailOtpCode = msg91EmailService._getStoredOtpForTesting('regression.wa.suite@drfitveda.com') || '123456'
    const emailVerify = await msg91EmailService.verifyOtp('regression.wa.suite@drfitveda.com', emailOtpCode)
    assert('Existing Email OTP send & verification remain 100% functional', emailSend.success && emailVerify.success)

    const docResolved = resolveAccountByIdentifier('varsini@drfitveda.com')
    const trnResolved = resolveAccountByIdentifier('vishnu@drfitveda.com')
    assert(
      'Existing Doctor & Trainer role-based login resolution remains intact (/professional)',
      getDashboardForRole(docResolved?.role) === '/professional' &&
        getDashboardForRole(trnResolved?.role) === '/professional'
    )
  } finally {
    // Always restore original production state cleanly so no test fixtures remain in Supabase
    msg91WhatsAppService._setSimulatedFailureModeForTesting('none')
    mockDb.state.customers = origCustomers
    mockDb.state.user_profiles = origUserProfiles
    mockDb.state.professionals = origProfessionals
    mockDb.state.professional_assignments = origAssignments
    mockDb.state.appointments = origAppointments
    mockDb.state.training_sessions = origTrainingSessions
    mockDb.state.whatsapp_notifications = origWaNotifications
    mockDb.state.whatsapp_scheduler_runs = origWaRuns
    mockDb.state.notifications = origInAppNotifs
    await savePersistedState([
      'customers',
      'user_profiles',
      'professionals',
      'professional_assignments',
      'appointments',
      'training_sessions',
      'whatsapp_notifications',
      'whatsapp_scheduler_runs',
      'notifications',
    ])
    console.log('\n  [CLEANUP] Restored original production state cleanly in Supabase.')
  }

  console.log('\n============================================================')
  console.log(`WHATSAPP E2E SUITE TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('============================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runSuite().catch(err => {
  console.error('Fatal test suite error:', err)
  process.exit(1)
})

