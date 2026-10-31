// ============================================================
// Dr Fit Veda — Automated WhatsApp Notification & Reminder Engine
// Workflows:
//   1. Customer Session Reminder (15 minutes before scheduled session)
//   2. Trainer Session Reminder (15 minutes before scheduled session)
//   3. Doctor Notification — New Customer Assigned
//   4. Trainer Notification — New Customer Assigned
// Powered by the existing MSG91 WhatsApp Integration (17111240135)
// ============================================================

import { mockDb, MOCK_USERS } from '../mock-db'
import { loadPersistedState, savePersistedState } from '../persistent-store'
import { msg91WhatsAppService } from './msg91-whatsapp.service'
import { normalizeIdentifier } from './otp-security'
import {
  getAppBaseUrl,
  buildProfessionalCustomerProfileUrl,
  buildCustomerAppointmentUrl,
} from '@/lib/app-url'

export type WhatsAppNotificationType =
  | 'customer_session_reminder'
  | 'trainer_session_reminder'
  | 'doctor_customer_assigned'
  | 'trainer_customer_assigned'
  | 'customer_doctor_assigned'
  | 'customer_appointment_updated'
  | 'customer_appointment_cancelled'

export type WhatsAppDeliveryStatus =
  | 'Pending'
  | 'Processing'
  | 'Sent'
  | 'Delivered'
  | 'Failed'
  | 'Cancelled'

export interface WhatsAppNotificationRecord {
  id: string
  idempotency_key: string
  notification_type: WhatsAppNotificationType
  template_name: string
  recipient_user_id: string
  recipient_name: string
  recipient_role: string
  recipient_phone: string
  customer_id: string
  customer_name: string
  session_id: string | null
  assignment_id: string | null
  scheduled_for: string
  session_scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  provider_message_id: string | null
  delivery_status: WhatsAppDeliveryStatus
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  permanent_failure: boolean
  error_details: string | null
  message_preview: string
  template_variables: string[]
  timezone: string
  created_at: string
  updated_at: string
}

export const WHATSAPP_TEMPLATES: Record<
  WhatsAppNotificationType,
  {
    name: string
    templateId: string
    msg91TemplateId: number
    category: 'UTILITY'
    variableCount: number
  }
> = {
  customer_session_reminder: {
    name: 'drfitveda_customer_session_reminder',
    templateId: '1789133458873620',
    msg91TemplateId: 591020,
    category: 'UTILITY',
    variableCount: 6,
  },
  trainer_session_reminder: {
    name: 'drfitveda_trainer_session_reminder',
    templateId: '3405596222945675',
    msg91TemplateId: 591021,
    category: 'UTILITY',
    variableCount: 7,
  },
  doctor_customer_assigned: {
    name: 'drfitveda_doctor_customer_assigned',
    templateId: '1855077042334465',
    msg91TemplateId: 591022,
    category: 'UTILITY',
    variableCount: 7,
  },
  trainer_customer_assigned: {
    name: 'drfitveda_trainer_customer_assigned',
    templateId: '4476604995937191',
    msg91TemplateId: 591023,
    category: 'UTILITY',
    variableCount: 7,
  },
  customer_doctor_assigned: {
    name: 'drfitveda_customer_doctor_assigned',
    templateId: '1641564591042581',
    msg91TemplateId: 591413,
    category: 'UTILITY',
    variableCount: 5,
  },
  customer_appointment_updated: {
    name: 'drfitveda_customer_appointment_updated',
    templateId: '1855077042334467',
    msg91TemplateId: 591025,
    category: 'UTILITY',
    variableCount: 5,
  },
  customer_appointment_cancelled: {
    name: 'drfitveda_customer_appointment_cancelled',
    templateId: '1855077042334468',
    msg91TemplateId: 591026,
    category: 'UTILITY',
    variableCount: 4,
  },
}

const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/**
 * Formats an ISO timestamp into readable Date and Time strings in the target IANA timezone.
 */
export function formatDateTimeInTimeZone(
  isoDateString: string | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE
): { dateStr: string; timeStr: string; tzLabel: string } {
  const safeTz = (() => {
    try {
      Intl.DateTimeFormat('en-IN', { timeZone })
      return timeZone
    } catch {
      return DEFAULT_TIMEZONE
    }
  })()

  const tzLabel =
    safeTz === 'Asia/Kolkata' || safeTz === 'Asia/Calcutta'
      ? 'IST'
      : safeTz === 'UTC'
        ? 'UTC'
        : safeTz.split('/').pop()?.replace(/_/g, ' ') || safeTz

  if (!isoDateString) {
    return { dateStr: 'To Be Scheduled', timeStr: 'Flexible Slot', tzLabel }
  }

  const parsed = new Date(isoDateString)
  if (isNaN(parsed.getTime())) {
    return { dateStr: String(isoDateString), timeStr: 'Scheduled Slot', tzLabel }
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: safeTz,
  })
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: safeTz,
  })

  return {
    dateStr: dateFormatter.format(parsed),
    timeStr: `${timeFormatter.format(parsed)} ${tzLabel}`,
    tzLabel,
  }
}

/**
 * Strips leading "Dr." or "Dr " from a doctor's name so "Hello Dr. [Doctor Name]" never renders "Hello Dr. Dr. Name".
 */
export function cleanDoctorDisplayName(fullName: string): string {
  return String(fullName || 'Doctor')
    .trim()
    .replace(/^dr\.?\s+/i, '')
    .trim() || 'Doctor'
}

/**
 * Ensures the doctor's name is prefixed with "Dr." exactly once.
 * E.g., "Priya Sharma" -> "Dr. Priya Sharma", "Dr. Priya Sharma" -> "Dr. Priya Sharma"
 */
export function formatDoctorDisplayNameWithTitle(fullName: string): string {
  const trimmed = String(fullName || 'Doctor').trim()
  if (/^dr\.?\s+/i.test(trimmed)) {
    return trimmed.replace(/^dr\.?\s+/i, 'Dr. ')
  }
  return `Dr. ${trimmed}`
}

/**
 * Builds the exact rendered message preview for audit & verification (never includes sensitive medical records).
 */
export function renderWhatsAppMessagePreview(
  type: WhatsAppNotificationType,
  vars: string[]
): string {
  switch (type) {
    case 'customer_session_reminder': {
      const [customerName, sessionType, date, time, professionalName, meetingLink] = vars
      return [
        `Hello ${customerName},`,
        ``,
        `Your DrFitVeda session is scheduled to start in 15 minutes!`,
        ``,
        `**Session Details:**`,
        `- Session: ${sessionType}`,
        `- Date: ${date}`,
        `- Time: ${time}`,
        `- Trainer/Doctor: ${professionalName}`,
        `- Meeting Link: ${meetingLink}`,
        ``,
        `Please be ready and join on time.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'trainer_session_reminder': {
      const [trainerName, customerName, customerPhone, sessionType, date, time, meetingLink] = vars
      return [
        `Hello ${trainerName},`,
        ``,
        `Reminder: Your DrFitVeda session will start in 15 minutes.`,
        ``,
        `**Session Details:**`,
        `- Customer Name: ${customerName}`,
        `- Customer Contact: ${customerPhone}`,
        `- Session Type: ${sessionType}`,
        `- Date: ${date}`,
        `- Time: ${time}`,
        `- Meeting Link: ${meetingLink}`,
        ``,
        `Please log in to your DrFitVeda trainer dashboard and be ready for the session.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'doctor_customer_assigned': {
      const [doctorName, customerName, customerPhone, assignmentDate, consultationDate, consultationTime, profileLink] = vars
      return [
        `Hello Dr. ${doctorName},`,
        ``,
        `A new customer has been onboarded and assigned to you on DrFitVeda.`,
        ``,
        `**Customer Details:**`,
        `- Customer Name: ${customerName}`,
        `- Phone Number: ${customerPhone}`,
        `- Assignment Date: ${assignmentDate}`,
        `- Assigned Consultation Date: ${consultationDate}`,
        `- Consultation Time: ${consultationTime}`,
        `- Customer Profile: ${profileLink}`,
        ``,
        `Please log in to your DrFitVeda doctor dashboard and review the customer's profile.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'trainer_customer_assigned': {
      const [trainerName, customerName, customerPhone, assignmentDate, sessionDate, sessionTime, profileLink] = vars
      return [
        `Hello ${trainerName},`,
        ``,
        `A new customer has been assigned to you on DrFitVeda.`,
        ``,
        `**Customer Details:**`,
        `- Customer Name: ${customerName}`,
        `- Phone Number: ${customerPhone}`,
        `- Assignment Date: ${assignmentDate}`,
        `- First Session Date: ${sessionDate}`,
        `- First Session Time: ${sessionTime}`,
        ``,
        `Please log in to your DrFitVeda trainer dashboard to review the customer's profile and training requirements.`,
        ``,
        `Customer Profile: ${profileLink}`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'customer_doctor_assigned': {
      const [customerName, doctorName, appointmentDate, appointmentTime, consultationType] = vars
      return [
        `Hello ${customerName},`,
        ``,
        `Good news! Your doctor has been successfully assigned on DrFitVeda.`,
        ``,
        `**Your Appointment Details:**`,
        ``,
        `Doctor Name: ${doctorName}`,
        ``,
        `Appointment Date: ${appointmentDate}`,
        ``,
        `Appointment Time: ${appointmentTime}`,
        ``,
        `Consultation Type: ${consultationType}`,
        ``,
        `Your appointment is confirmed.`,
        ``,
        `Please log in to your DrFitVeda account to view your appointment details and access further instructions.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'customer_appointment_updated': {
      const [customerName, doctorName, appointmentDate, appointmentTime, consultationType] = vars
      return [
        `Hello ${customerName},`,
        ``,
        `Your DrFitVeda appointment has been rescheduled/updated.`,
        ``,
        `**Updated Appointment Details:**`,
        ``,
        `- Doctor Name: Dr. ${doctorName}`,
        `- Appointment Date: ${appointmentDate}`,
        `- Appointment Time: ${appointmentTime}`,
        `- Consultation Type: ${consultationType}`,
        ``,
        `Please log in to your DrFitVeda account to review your appointment details.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }

    case 'customer_appointment_cancelled': {
      const [customerName, doctorName, appointmentDate, appointmentTime] = vars
      return [
        `Hello ${customerName},`,
        ``,
        `Your DrFitVeda appointment with Dr. ${doctorName} scheduled for ${appointmentDate} at ${appointmentTime} has been cancelled.`,
        ``,
        `If you have any questions or would like to reschedule, please contact support or log in to your DrFitVeda dashboard.`,
        ``,
        `Thank you,`,
        `Team DrFitVeda`,
      ].join('\n')
    }
  }
}

/**
 * Calculates exponential backoff delay in milliseconds for retry attempt `retryCount` (1-based).
 * Retry 1 -> 1 min, Retry 2 -> 4 min, Retry 3 -> 16 min.
 */
export function computeBackoffDelayMs(retryCount: number): number {
  const baseMs = 60 * 1000 // 1 minute
  return baseMs * Math.pow(4, Math.max(0, retryCount - 1))
}

function getNotificationsArray(): WhatsAppNotificationRecord[] {
  if (!Array.isArray(mockDb.state.whatsapp_notifications)) {
    mockDb.state.whatsapp_notifications = []
  }
  return mockDb.state.whatsapp_notifications
}

async function resolveCustomerDetails(customerId: string): Promise<{
  customer: any | null
  userProfile: any | null
  fullName: string
  phone: string
  meetingLink: string
  timezone: string
}> {
  const customers: any[] = mockDb.state.customers || []
  const userProfiles: any[] = mockDb.state.user_profiles || []
  let customer = customers.find((c: any) => c.id === customerId) || null
  let userProfile = customer
    ? userProfiles.find((u: any) => u.id === customer.user_id) || null
    : null

  // If customer or userProfile or phone is missing, query Supabase for production records
  if (!customer || !userProfile || !userProfile.phone) {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const supabase = await createServerSupabaseClient()
      const { data: dbCust } = await (supabase as any)
        .from('customers')
        .select(`
          id,
          user_id,
          membership_status,
          is_active,
          google_meet_url,
          zoho_meeting_url,
          user_profiles ( id, full_name, phone, timezone )
        `)
        .eq('id', customerId)
        .single()

      if (dbCust) {
        const up = dbCust.user_profiles || {}
        customer = {
          id: dbCust.id,
          user_id: dbCust.user_id,
          full_name: up.full_name || 'Customer',
          phone: up.phone || '',
          membership_status: dbCust.membership_status || 'active',
          is_active: dbCust.is_active !== false,
          timezone: up.timezone || DEFAULT_TIMEZONE,
          google_meet_url: dbCust.google_meet_url,
          zoho_meeting_url: dbCust.zoho_meeting_url,
        }
        userProfile = {
          id: dbCust.user_id,
          full_name: up.full_name || 'Customer',
          phone: up.phone || '',
          timezone: up.timezone || DEFAULT_TIMEZONE,
        }

        const cIdx = customers.findIndex((c: any) => c.id === customerId)
        if (cIdx >= 0) {
          customers[cIdx] = { ...customers[cIdx], ...customer }
        } else {
          customers.push(customer)
        }
        const uIdx = userProfiles.findIndex((u: any) => u.id === customer.user_id)
        if (uIdx >= 0) {
          userProfiles[uIdx] = { ...userProfiles[uIdx], ...userProfile }
        } else {
          userProfiles.push(userProfile)
        }
      }
    } catch {}
  }

  const fullName = userProfile?.full_name || customer?.full_name || 'Customer'
  const phone = userProfile?.phone || customer?.phone || ''
  const meetingLink =
    customer?.zoho_meeting_url ||
    customer?.google_meet_url ||
    customer?.meeting_url ||
    'https://meet.zoho.com/drfitveda-live'
  const timezone = customer?.timezone || userProfile?.timezone || DEFAULT_TIMEZONE

  return { customer, userProfile, fullName, phone, meetingLink, timezone }
}

async function resolveProfessionalDetails(professionalId: string): Promise<{
  professional: any | null
  userProfile: any | null
  userId: string
  fullName: string
  role: string
  phone: string
  timezone: string
}> {
  const professionals: any[] = mockDb.state.professionals || []
  const userProfiles: any[] = mockDb.state.user_profiles || []
  let professional =
    professionals.find((p: any) => p.id === professionalId || p.user_id === professionalId) || null
  let userProfile = professional
    ? userProfiles.find((u: any) => u.id === professional.user_id) || null
    : null

  if (!professional || !professional.phone) {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server')
      const supabase = await createServerSupabaseClient()
      const { data: dbPro } = await (supabase as any)
        .from('professionals')
        .select(`
          id,
          user_id,
          full_name,
          role,
          phone,
          is_active,
          timezone,
          user_profiles ( id, full_name, phone, timezone )
        `)
        .eq('id', professionalId)
        .single()

      if (dbPro) {
        const up = dbPro.user_profiles || {}
        professional = {
          id: dbPro.id,
          user_id: dbPro.user_id,
          full_name: dbPro.full_name || up.full_name || 'Specialist',
          role: dbPro.role || 'doctor',
          phone: dbPro.phone || up.phone || '',
          is_active: dbPro.is_active !== false,
          timezone: dbPro.timezone || up.timezone || DEFAULT_TIMEZONE,
        }
        userProfile = {
          id: dbPro.user_id,
          full_name: professional.full_name,
          phone: professional.phone,
          role: professional.role,
          timezone: professional.timezone,
        }
        const pIdx = professionals.findIndex((p: any) => p.id === professionalId)
        if (pIdx >= 0) {
          professionals[pIdx] = { ...professionals[pIdx], ...professional }
        } else {
          professionals.push(professional)
        }
      }
    } catch {}
  }

  const userId = professional?.user_id || userProfile?.id || professionalId
  const fullName = professional?.full_name || userProfile?.full_name || 'Specialist'
  const role = professional?.role || userProfile?.role || 'doctor'
  const phone = professional?.phone || userProfile?.phone || ''
  const timezone = professional?.timezone || userProfile?.timezone || DEFAULT_TIMEZONE

  return { professional, userProfile, userId, fullName, role, phone, timezone }
}

function isDoctorLikeRole(role: string): boolean {
  const r = String(role || '').toLowerCase()
  return (
    r === 'doctor' ||
    r === 'naturopathy_doctor' ||
    r === 'ayurveda_doctor' ||
    r === 'yoga_doctor' ||
    r === 'doctor_lead'
  )
}

function isTrainerLikeRole(role: string): boolean {
  const r = String(role || '').toLowerCase()
  return r === 'trainer' || r === 'trainer_lead' || r === 'physiotherapist' || r === 'yoga_consultant'
}

/**
 * Alerts administrators in the in-app notification center when WhatsApp delivery repeatedly fails.
 */
async function alertAdminsOnRepeatedFailure(record: WhatsAppNotificationRecord, reason: string) {
  if (!Array.isArray(mockDb.state.notifications)) {
    mockDb.state.notifications = []
  }
  const adminUserId = MOCK_USERS.admin.id
  mockDb.state.notifications.unshift({
    id: `notif-wa-fail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: adminUserId,
    title: `WhatsApp Alert Failed: ${record.notification_type.replace(/_/g, ' ')}`,
    body: `Delivery to ${record.recipient_name} (${record.recipient_phone || 'no phone'}) failed after ${record.retry_count} attempt(s): ${reason}`,
    type: 'system_alert',
    is_read: false,
    action_url: '/admin/notifications',
    created_at: new Date().toISOString(),
  })
}

/**
 * Dispatches a single WhatsAppNotificationRecord through MSG91 and updates its status, retry count, and timestamps.
 */
export async function dispatchWhatsAppNotificationRecord(
  record: WhatsAppNotificationRecord,
  options?: { isRetry?: boolean; persistImmediately?: boolean }
): Promise<WhatsAppNotificationRecord> {
  const nowIso = new Date().toISOString()

  // Prevent sending if already Sent, Delivered, or Cancelled
  if (
    record.delivery_status === 'Sent' ||
    record.delivery_status === 'Delivered' ||
    record.delivery_status === 'Cancelled'
  ) {
    return record
  }

  // Mark Processing
  record.delivery_status = 'Processing'
  record.updated_at = nowIso

  if (options?.isRetry) {
    record.retry_count = (record.retry_count || 0) + 1
  }

  // Validate phone number
  const phoneNorm = normalizeIdentifier(record.recipient_phone || '', 'whatsapp')
  if (!phoneNorm.isValid || !phoneNorm.normalized) {
    record.delivery_status = 'Failed'
    record.permanent_failure = true
    record.next_retry_at = null
    record.error_details =
      phoneNorm.error || `Permanent failure: Invalid or missing WhatsApp number (${record.recipient_phone || 'empty'}).`
    record.updated_at = new Date().toISOString()
    await alertAdminsOnRepeatedFailure(record, record.error_details)
    if (options?.persistImmediately !== false) {
      await savePersistedState(['whatsapp_notifications', 'notifications'])
    }
    return record
  }

  // Normalize stored phone to E.164 display
  record.recipient_phone = phoneNorm.e164Phone || `+${phoneNorm.normalized}`

  // Call MSG91 WhatsApp Outbound Template API
  const sendRes = await msg91WhatsAppService.sendTemplateMessage({
    toMobile: phoneNorm.normalized,
    templateName: record.template_name,
    bodyVariables: record.template_variables,
  })

  const afterIso = new Date().toISOString()
  record.updated_at = afterIso

  if (sendRes.success && sendRes.providerAccepted) {
    // Distinguish Provider Acceptance ('Sent') from Confirmed Delivery ('Delivered')
    record.delivery_status = 'Sent'
    record.sent_at = afterIso
    record.provider_message_id = sendRes.requestId || `msg91-${Date.now()}`
    record.error_details = null
    record.next_retry_at = null
    record.permanent_failure = false
  } else {
    record.delivery_status = 'Failed'
    record.error_details = sendRes.message || 'MSG91 provider rejected or failed to process request.'

    if (sendRes.permanentFailure) {
      record.permanent_failure = true
      record.next_retry_at = null
      await alertAdminsOnRepeatedFailure(record, record.error_details)
    } else {
      const nextRetryAttempt = (record.retry_count || 0) + 1
      if (nextRetryAttempt <= (record.max_retries || 3)) {
        const delayMs = computeBackoffDelayMs(nextRetryAttempt)
        record.next_retry_at = new Date(Date.now() + delayMs).toISOString()
      } else {
        record.next_retry_at = null
        await alertAdminsOnRepeatedFailure(
          record,
          `Max retries (${record.max_retries}) exhausted. Last error: ${record.error_details}`
        )
      }
    }
  }

  if (options?.persistImmediately !== false) {
    await savePersistedState(['whatsapp_notifications', 'notifications'])
  }

  return record
}

/**
 * Triggers immediate Doctor or Trainer WhatsApp notifications when a customer is onboarded or assigned/reassigned.
 * In addition, whenever a Doctor is assigned, ALSO dispatches the Customer WhatsApp confirmation notification.
 * Must be called AFTER the database assignment save succeeds.
 */
export async function triggerCustomerAssignmentNotifications(params: {
  customerId: string
  professionalId: string
  role?: string
  assignmentId?: string
  assignedSlot?: string
  previousProfessionalId?: string | null
  timezone?: string
  dispatchImmediately?: boolean
}): Promise<{
  created: WhatsAppNotificationRecord | null
  customerNotification?: WhatsAppNotificationRecord | null
  cancelledCount: number
  skippedDuplicate: boolean
}> {
  await loadPersistedState()
  const notifications = getNotificationsArray()

  const { customer, fullName: customerName, phone: customerPhone, timezone: custTz } =
    await resolveCustomerDetails(params.customerId)

  // Requirement: Do not send notification if onboarding is incomplete or customer is missing/inactive
  if (!customer || customer.is_active === false || !customerName || customerName === 'Customer') {
    return { created: null, cancelledCount: 0, skippedDuplicate: false }
  }

  const proInfo = await resolveProfessionalDetails(params.professionalId)
  if (!proInfo.professional || proInfo.professional.is_active === false) {
    return { created: null, cancelledCount: 0, skippedDuplicate: false }
  }

  const effectiveRole = params.role || proInfo.role
  const isDoc = isDoctorLikeRole(effectiveRole)
  const isTrn = isTrainerLikeRole(effectiveRole)

  if (!isDoc && !isTrn) {
    return { created: null, cancelledCount: 0, skippedDuplicate: false }
  }

  const notificationType: WhatsAppNotificationType = isDoc
    ? 'doctor_customer_assigned'
    : 'trainer_customer_assigned'

  let cancelledCount = 0

  // If reassigned from a previous doctor/trainer, cancel any unsent Pending notifications for the old professional
  // and update/cancel any Pending session reminders for the old trainer on this customer's upcoming sessions.
  if (params.previousProfessionalId && params.previousProfessionalId !== params.professionalId) {
    const oldProInfo = await resolveProfessionalDetails(params.previousProfessionalId)
    for (const n of notifications) {
      if (
        n.customer_id === params.customerId &&
        (n.recipient_user_id === oldProInfo.userId || n.recipient_user_id === params.previousProfessionalId) &&
        n.delivery_status === 'Pending'
      ) {
        n.delivery_status = 'Cancelled'
        n.error_details = `Cancelled due to customer reassignment to ${proInfo.fullName}.`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }

      // Also cancel any unsent customer confirmation for the old doctor
      if (
        isDoc &&
        n.customer_id === params.customerId &&
        n.notification_type === 'customer_doctor_assigned' &&
        n.delivery_status === 'Pending'
      ) {
        n.delivery_status = 'Cancelled'
        n.error_details = `Superseded by doctor reassignment to Dr. ${cleanDoctorDisplayName(proInfo.fullName)}.`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }
    }

    // If trainer was reassigned, also update upcoming scheduled training_sessions for this customer to the new trainer
    // and resync their 15m trainer session reminders so the old trainer never receives future session reminders!
    if (isTrn && Array.isArray(mockDb.state.training_sessions)) {
      for (const ts of mockDb.state.training_sessions) {
        if (
          ts.customer_id === params.customerId &&
          ts.trainer_id === params.previousProfessionalId &&
          ts.status === 'scheduled'
        ) {
          ts.trainer_id = params.professionalId
          ts.updated_at = new Date().toISOString()
          await syncSessionRemindersForTrainingSession(ts, { persist: false })
        }
      }
    }
  }

  // Also cancel any other Pending assignment notification of the same type for this customer to a DIFFERENT professional
  for (const n of notifications) {
    if (
      n.customer_id === params.customerId &&
      n.notification_type === notificationType &&
      n.recipient_user_id !== proInfo.userId &&
      n.delivery_status === 'Pending'
    ) {
      n.delivery_status = 'Cancelled'
      n.error_details = `Superseded by reassignment to ${proInfo.fullName}.`
      n.updated_at = new Date().toISOString()
      cancelledCount++
    }
  }

  // Idempotency key: prevent duplicate assignment notifications for the same (customer_id, professional_user_id, notification_type)
  // unless a reassignment happened after the previous one was superseded.
  const idempotencyKey = `${notificationType}:${params.customerId}:${proInfo.userId}:${params.assignmentId || 'direct'}`
  const existingSameAssignment = notifications.find(
    n =>
      n.idempotency_key === idempotencyKey ||
      (n.notification_type === notificationType &&
        n.customer_id === params.customerId &&
        n.recipient_user_id === proInfo.userId &&
        (n.delivery_status === 'Pending' || n.delivery_status === 'Processing' || n.delivery_status === 'Sent' || n.delivery_status === 'Delivered'))
  )

  if (existingSameAssignment) {
    if (cancelledCount > 0) {
      await savePersistedState(['whatsapp_notifications', 'training_sessions'])
    }
    return { created: null, cancelledCount, skippedDuplicate: true }
  }

  const tz = params.timezone || proInfo.timezone || custTz || DEFAULT_TIMEZONE
  const nowIso = new Date().toISOString()
  const { dateStr: assignmentDate } = formatDateTimeInTimeZone(nowIso, tz)

  // Determine consultation or first session date/time
  let sessionDate = assignmentDate
  let sessionTime = params.assignedSlot || '07:00 AM - 08:00 AM IST'
  let sessionScheduledAt: string | null = null
  let upcomingApptRef: any = null
  let consultationType = 'Online Video (Zoho Meeting)'

  if (isDoc) {
    const appts: any[] = mockDb.state.appointments || []
    const upcomingAppt = appts
      .filter(
        a =>
          a.customer_id === params.customerId &&
          (a.professional_id === params.professionalId || a.professional_id === proInfo.professional?.id) &&
          (a.status === 'scheduled' || a.status === 'confirmed') &&
          a.scheduled_at
      )
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

    upcomingApptRef = upcomingAppt
    if (upcomingAppt?.consultation_type || upcomingAppt?.service_name) {
      consultationType = upcomingAppt.consultation_type || upcomingAppt.service_name
    }

    if (upcomingAppt?.scheduled_at) {
      sessionScheduledAt = upcomingAppt.scheduled_at
      const formatted = formatDateTimeInTimeZone(upcomingAppt.scheduled_at, tz)
      sessionDate = formatted.dateStr
      sessionTime = formatted.timeStr
    } else if (params.assignedSlot) {
      sessionTime = params.assignedSlot
    }
  } else {
    const sessions: any[] = mockDb.state.training_sessions || []
    const upcomingSession = sessions
      .filter(
        s =>
          s.customer_id === params.customerId &&
          (s.trainer_id === params.professionalId || s.trainer_id === proInfo.professional?.id) &&
          (s.status === 'scheduled' || s.status === 'confirmed') &&
          s.scheduled_at
      )
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

    if (upcomingSession?.scheduled_at) {
      sessionScheduledAt = upcomingSession.scheduled_at
      const formatted = formatDateTimeInTimeZone(upcomingSession.scheduled_at, tz)
      sessionDate = formatted.dateStr
      sessionTime = formatted.timeStr
    } else if (params.assignedSlot) {
      sessionTime = params.assignedSlot
    }
  }

  // Authoritative production profile URL (never ephemeral preview hashes)
  const secureProfileLink = buildProfessionalCustomerProfileUrl(params.customerId)
  const displayCustomerPhone = customerPhone || 'Not Provided'

  const templateVars: string[] = isDoc
    ? [
        cleanDoctorDisplayName(proInfo.fullName),
        customerName,
        displayCustomerPhone,
        assignmentDate,
        sessionDate,
        sessionTime,
        secureProfileLink,
      ]
    : [
        proInfo.fullName,
        customerName,
        displayCustomerPhone,
        assignmentDate,
        sessionDate,
        sessionTime,
        secureProfileLink,
      ]

  const templateMeta = WHATSAPP_TEMPLATES[notificationType]
  const record: WhatsAppNotificationRecord = {
    id: `wn-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    idempotency_key: idempotencyKey,
    notification_type: notificationType,
    template_name: templateMeta.name,
    recipient_user_id: proInfo.userId,
    recipient_name: proInfo.fullName,
    recipient_role: effectiveRole,
    recipient_phone: proInfo.phone || '',
    customer_id: params.customerId,
    customer_name: customerName,
    session_id: upcomingApptRef?.id || null,
    assignment_id: params.assignmentId || null,
    scheduled_for: nowIso,
    session_scheduled_at: sessionScheduledAt,
    sent_at: null,
    delivered_at: null,
    provider_message_id: null,
    delivery_status: 'Pending',
    retry_count: 0,
    max_retries: 3,
    next_retry_at: null,
    permanent_failure: false,
    error_details: null,
    message_preview: renderWhatsAppMessagePreview(notificationType, templateVars),
    template_variables: templateVars,
    timezone: tz,
    created_at: nowIso,
    updated_at: nowIso,
  }

  notifications.unshift(record)

  // ------------------------------------------------------------------------
  // CUSTOMER NOTIFICATION: Dispatched simultaneously when a doctor is assigned!
  // Uses dedicated template: drfitveda_customer_doctor_assigned
  // Variables: {{1}} Customer Name, {{2}} Doctor Name, {{3}} Appt Date, {{4}} Appt Time, {{5}} Consult Type
  // ------------------------------------------------------------------------
  let customerNotificationRecord: WhatsAppNotificationRecord | null = null
  if (isDoc) {
    const custUserId = customer.user_id || customer.id || params.customerId
    const custIdempotencyKey = `customer_doctor_assigned:${params.customerId}:${proInfo.userId}:${params.assignmentId || 'direct'}`

    const doctorDisplayWithTitle = formatDoctorDisplayNameWithTitle(proInfo.fullName)
    const custTemplateVars = [
      customerName,
      doctorDisplayWithTitle,
      sessionDate,
      sessionTime,
      consultationType,
    ]

    const cleanDigits = String(customerPhone || '').replace(/\D/g, '')
    const hasValidPhone = cleanDigits.length >= 10

    customerNotificationRecord = {
      id: `wn-cust-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotency_key: custIdempotencyKey,
      notification_type: 'customer_doctor_assigned',
      template_name: WHATSAPP_TEMPLATES.customer_doctor_assigned.name,
      recipient_user_id: custUserId,
      recipient_name: customerName,
      recipient_role: 'customer',
      recipient_phone: customerPhone || '',
      customer_id: params.customerId,
      customer_name: customerName,
      session_id: upcomingApptRef?.id || null,
      assignment_id: params.assignmentId || null,
      scheduled_for: nowIso,
      session_scheduled_at: sessionScheduledAt,
      sent_at: null,
      delivered_at: null,
      provider_message_id: null,
      delivery_status: hasValidPhone ? 'Pending' : 'Failed',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      permanent_failure: !hasValidPhone,
      error_details: hasValidPhone
        ? null
        : `Customer registered WhatsApp phone number is missing or invalid in profile (${customerPhone || 'empty'}).`,
      message_preview: renderWhatsAppMessagePreview('customer_doctor_assigned', custTemplateVars),
      template_variables: custTemplateVars,
      timezone: tz,
      created_at: nowIso,
      updated_at: nowIso,
    }

    notifications.unshift(customerNotificationRecord)

    if (params.dispatchImmediately !== false && hasValidPhone) {
      await dispatchWhatsAppNotificationRecord(customerNotificationRecord, { persistImmediately: false })
    }
  }

  if (params.dispatchImmediately !== false) {
    await dispatchWhatsAppNotificationRecord(record, { persistImmediately: false })
  }

  await savePersistedState(['whatsapp_notifications', 'training_sessions', 'notifications'])
  return {
    created: record,
    customerNotification: customerNotificationRecord,
    cancelledCount,
    skippedDuplicate: false,
  }
}

/**
 * Triggers automated WhatsApp notification to customer when their consultation appointment
 * is rescheduled/updated or cancelled.
 */
export async function syncCustomerAppointmentStatusNotification(
  appointment: any,
  action: 'updated' | 'cancelled',
  options?: { persist?: boolean; timezone?: string; dispatchImmediately?: boolean }
): Promise<WhatsAppNotificationRecord | null> {
  if (!appointment || !appointment.id) return null
  if (options?.persist !== false) {
    await loadPersistedState()
  }

  const notifications = getNotificationsArray()
  const customerId = appointment.customer_id
  const professionalId = appointment.professional_id
  if (!customerId || !professionalId) return null

  const custInfo = await resolveCustomerDetails(customerId)
  if (!custInfo.customer || !custInfo.phone) {
    return null
  }

  const proInfo = await resolveProfessionalDetails(professionalId)
  const tz = options?.timezone || custInfo.timezone || DEFAULT_TIMEZONE
  const nowIso = new Date().toISOString()
  const formatted = formatDateTimeInTimeZone(appointment.scheduled_at, tz)
  const doctorName = cleanDoctorDisplayName(proInfo.fullName)
  const consultationType =
    appointment.consultation_type ||
    appointment.service_name ||
    'Online Video (Zoho Meeting)'

  if (action === 'updated') {
    const templateVars = [
      custInfo.fullName,
      doctorName,
      formatted.dateStr,
      formatted.timeStr,
      consultationType,
    ]
    const idempotencyKey = `customer_appointment_updated:${appointment.id}:${appointment.scheduled_at || nowIso}`

    const existing = notifications.find(n => n.idempotency_key === idempotencyKey)
    if (existing) return existing

    const record: WhatsAppNotificationRecord = {
      id: `wn-upd-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotency_key: idempotencyKey,
      notification_type: 'customer_appointment_updated',
      template_name: WHATSAPP_TEMPLATES.customer_appointment_updated.name,
      recipient_user_id: custInfo.userProfile?.id || custInfo.customer.user_id || customerId,
      recipient_name: custInfo.fullName,
      recipient_role: 'customer',
      recipient_phone: custInfo.phone,
      customer_id: customerId,
      customer_name: custInfo.fullName,
      session_id: appointment.id,
      assignment_id: null,
      scheduled_for: nowIso,
      session_scheduled_at: appointment.scheduled_at,
      sent_at: null,
      delivered_at: null,
      provider_message_id: null,
      delivery_status: 'Pending',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      permanent_failure: false,
      error_details: null,
      message_preview: renderWhatsAppMessagePreview('customer_appointment_updated', templateVars),
      template_variables: templateVars,
      timezone: tz,
      created_at: nowIso,
      updated_at: nowIso,
    }

    notifications.unshift(record)
    if (options?.dispatchImmediately !== false) {
      await dispatchWhatsAppNotificationRecord(record, { persistImmediately: false })
    }
    if (options?.persist !== false) {
      await savePersistedState(['whatsapp_notifications', 'notifications'])
    }
    return record
  } else if (action === 'cancelled') {
    const templateVars = [
      custInfo.fullName,
      doctorName,
      formatted.dateStr,
      formatted.timeStr,
    ]
    const idempotencyKey = `customer_appointment_cancelled:${appointment.id}:${Date.now()}`

    const record: WhatsAppNotificationRecord = {
      id: `wn-can-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotency_key: idempotencyKey,
      notification_type: 'customer_appointment_cancelled',
      template_name: WHATSAPP_TEMPLATES.customer_appointment_cancelled.name,
      recipient_user_id: custInfo.userProfile?.id || custInfo.customer.user_id || customerId,
      recipient_name: custInfo.fullName,
      recipient_role: 'customer',
      recipient_phone: custInfo.phone,
      customer_id: customerId,
      customer_name: custInfo.fullName,
      session_id: appointment.id,
      assignment_id: null,
      scheduled_for: nowIso,
      session_scheduled_at: appointment.scheduled_at,
      sent_at: null,
      delivered_at: null,
      provider_message_id: null,
      delivery_status: 'Pending',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      permanent_failure: false,
      error_details: null,
      message_preview: renderWhatsAppMessagePreview('customer_appointment_cancelled', templateVars),
      template_variables: templateVars,
      timezone: tz,
      created_at: nowIso,
      updated_at: nowIso,
    }

    notifications.unshift(record)
    if (options?.dispatchImmediately !== false) {
      await dispatchWhatsAppNotificationRecord(record, { persistImmediately: false })
    }
    if (options?.persist !== false) {
      await savePersistedState(['whatsapp_notifications', 'notifications'])
    }
    return record
  }

  return null
}

/**
 * Synchronizes 15-minute-before session reminders for a consultation appointment (`appointments` table).
 * - Creates Pending reminders for customer (and trainer/professional) at `scheduled_at - 15m`.
 * - If rescheduled, cancels old Pending reminders and creates new ones.
 * - If cancelled/completed/no_show, cancels any Pending reminders.
 */
export async function syncSessionRemindersForAppointment(
  appointment: any,
  options?: { persist?: boolean; timezone?: string }
): Promise<{
  scheduled: WhatsAppNotificationRecord[]
  cancelledCount: number
}> {
  if (!appointment || !appointment.id) return { scheduled: [], cancelledCount: 0 }
  if (options?.persist !== false) {
    await loadPersistedState()
  }

  const notifications = getNotificationsArray()
  let cancelledCount = 0

  const isConfirmed = appointment.status === 'scheduled' || appointment.status === 'confirmed'

  // If cancelled, completed, or no_show -> cancel all Pending reminders for this appointment
  if (!isConfirmed || !appointment.scheduled_at) {
    for (const n of notifications) {
      if (n.session_id === appointment.id && n.delivery_status === 'Pending') {
        n.delivery_status = 'Cancelled'
        n.error_details = `Session status changed to "${appointment.status || 'unscheduled'}".`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }
    }
    if (options?.persist !== false && cancelledCount > 0) {
      await savePersistedState('whatsapp_notifications')
    }
    return { scheduled: [], cancelledCount }
  }

  const scheduledAtMs = new Date(appointment.scheduled_at).getTime()
  if (isNaN(scheduledAtMs)) {
    return { scheduled: [], cancelledCount: 0 }
  }

  const scheduledAtIso = new Date(scheduledAtMs).toISOString()
  const reminderTimeIso = new Date(scheduledAtMs - 15 * 60 * 1000).toISOString()

  const custInfo = await resolveCustomerDetails(appointment.customer_id)
  const proInfo = await resolveProfessionalDetails(appointment.professional_id)
  const tz = options?.timezone || custInfo.timezone || proInfo.timezone || DEFAULT_TIMEZONE

  // Cancel any Pending reminders for this session whose scheduled_at or recipient changed (rescheduled or reassigned)
  for (const n of notifications) {
    if (n.session_id === appointment.id && n.delivery_status === 'Pending') {
      const sameTime =
        n.session_scheduled_at &&
        new Date(n.session_scheduled_at).getTime() === scheduledAtMs
      const validRecipient =
        (n.notification_type === 'customer_session_reminder' &&
          n.recipient_user_id === (custInfo.userProfile?.id || appointment.customer_id)) ||
        (n.notification_type === 'trainer_session_reminder' &&
          n.recipient_user_id === proInfo.userId)

      if (!sameTime || !validRecipient) {
        n.delivery_status = 'Cancelled'
        n.error_details = !sameTime
          ? `Session rescheduled to ${scheduledAtIso}. Old reminder cancelled.`
          : `Session reassigned to ${proInfo.fullName}. Old reminder cancelled.`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }
    }
  }

  const { dateStr, timeStr } = formatDateTimeInTimeZone(scheduledAtIso, tz)
  const sessionType = isTrainerLikeRole(proInfo.role)
    ? 'Live Personal Training Session'
    : 'Doctor Wellness Consultation'
  const meetingLink =
    appointment.meeting_url || custInfo.meetingLink || 'https://meet.zoho.com/drfitveda-live'
  const nowIso = new Date().toISOString()

  const scheduled: WhatsAppNotificationRecord[] = []

  // 1. Customer 15m Reminder
  const custRecipientId = custInfo.userProfile?.id || appointment.customer_id
  const custIdempotencyKey = `customer_session_reminder:${appointment.id}:${scheduledAtIso}:${custRecipientId}`
  const existingCustReminder = notifications.find(
    n => n.idempotency_key === custIdempotencyKey && n.delivery_status !== 'Cancelled'
  )

  if (!existingCustReminder && custInfo.customer && custInfo.customer.is_active !== false) {
    const custVars = [
      custInfo.fullName,
      sessionType,
      dateStr,
      timeStr,
      proInfo.fullName,
      meetingLink,
    ]
    const custRecord: WhatsAppNotificationRecord = {
      id: `wn-cust-rem-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotency_key: custIdempotencyKey,
      notification_type: 'customer_session_reminder',
      template_name: WHATSAPP_TEMPLATES.customer_session_reminder.name,
      recipient_user_id: custRecipientId,
      recipient_name: custInfo.fullName,
      recipient_role: 'customer',
      recipient_phone: custInfo.phone,
      customer_id: appointment.customer_id,
      customer_name: custInfo.fullName,
      session_id: appointment.id,
      assignment_id: null,
      scheduled_for: reminderTimeIso,
      session_scheduled_at: scheduledAtIso,
      sent_at: null,
      delivered_at: null,
      provider_message_id: null,
      delivery_status: 'Pending',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      permanent_failure: false,
      error_details: null,
      message_preview: renderWhatsAppMessagePreview('customer_session_reminder', custVars),
      template_variables: custVars,
      timezone: tz,
      created_at: nowIso,
      updated_at: nowIso,
    }
    notifications.unshift(custRecord)
    scheduled.push(custRecord)
  }

  // 2. Trainer 15m Reminder (if the appointment is with a trainer)
  if (isTrainerLikeRole(proInfo.role) && proInfo.professional && proInfo.professional.is_active !== false) {
    const trnIdempotencyKey = `trainer_session_reminder:${appointment.id}:${scheduledAtIso}:${proInfo.userId}`
    const existingTrnReminder = notifications.find(
      n => n.idempotency_key === trnIdempotencyKey && n.delivery_status !== 'Cancelled'
    )
    if (!existingTrnReminder) {
      const trnVars = [
        proInfo.fullName,
        custInfo.fullName,
        custInfo.phone || 'Not Provided',
        sessionType,
        dateStr,
        timeStr,
        meetingLink,
      ]
      const trnRecord: WhatsAppNotificationRecord = {
        id: `wn-trn-rem-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotency_key: trnIdempotencyKey,
        notification_type: 'trainer_session_reminder',
        template_name: WHATSAPP_TEMPLATES.trainer_session_reminder.name,
        recipient_user_id: proInfo.userId,
        recipient_name: proInfo.fullName,
        recipient_role: proInfo.role,
        recipient_phone: proInfo.phone,
        customer_id: appointment.customer_id,
        customer_name: custInfo.fullName,
        session_id: appointment.id,
        assignment_id: null,
        scheduled_for: reminderTimeIso,
        session_scheduled_at: scheduledAtIso,
        sent_at: null,
        delivered_at: null,
        provider_message_id: null,
        delivery_status: 'Pending',
        retry_count: 0,
        max_retries: 3,
        next_retry_at: null,
        permanent_failure: false,
        error_details: null,
        message_preview: renderWhatsAppMessagePreview('trainer_session_reminder', trnVars),
        template_variables: trnVars,
        timezone: tz,
        created_at: nowIso,
        updated_at: nowIso,
      }
      notifications.unshift(trnRecord)
      scheduled.push(trnRecord)
    }
  }

  if (options?.persist !== false && (scheduled.length > 0 || cancelledCount > 0)) {
    await savePersistedState('whatsapp_notifications')
  }

  return { scheduled, cancelledCount }
}

/**
 * Synchronizes 15-minute-before session reminders for a live training session (`training_sessions` table).
 * Creates BOTH a Customer Session Reminder and a Trainer Session Reminder for `scheduled_at - 15m`.
 */
export async function syncSessionRemindersForTrainingSession(
  session: any,
  options?: { persist?: boolean; timezone?: string }
): Promise<{
  scheduled: WhatsAppNotificationRecord[]
  cancelledCount: number
}> {
  if (!session || !session.id) return { scheduled: [], cancelledCount: 0 }
  if (options?.persist !== false) {
    await loadPersistedState()
  }

  const notifications = getNotificationsArray()
  let cancelledCount = 0

  const isConfirmed = session.status === 'scheduled' || session.status === 'confirmed'

  if (!isConfirmed || !session.scheduled_at) {
    for (const n of notifications) {
      if (n.session_id === session.id && n.delivery_status === 'Pending') {
        n.delivery_status = 'Cancelled'
        n.error_details = `Training session status changed to "${session.status || 'unscheduled'}".`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }
    }
    if (options?.persist !== false && cancelledCount > 0) {
      await savePersistedState('whatsapp_notifications')
    }
    return { scheduled: [], cancelledCount }
  }

  const scheduledAtMs = new Date(session.scheduled_at).getTime()
  if (isNaN(scheduledAtMs)) {
    return { scheduled: [], cancelledCount: 0 }
  }

  const scheduledAtIso = new Date(scheduledAtMs).toISOString()
  const reminderTimeIso = new Date(scheduledAtMs - 15 * 60 * 1000).toISOString()

  const custInfo = await resolveCustomerDetails(session.customer_id)

  // Determine the currently assigned active trainer for this customer (or session.trainer_id)
  const activeTrainerAssignment = (mockDb.state.professional_assignments || []).find(
    (pa: any) =>
      pa.customer_id === session.customer_id &&
      pa.is_active !== false &&
      isTrainerLikeRole(pa.role)
  )
  const effectiveTrainerId = activeTrainerAssignment?.professional_id || session.trainer_id
  const trnInfo = await resolveProfessionalDetails(effectiveTrainerId)
  const tz = options?.timezone || custInfo.timezone || trnInfo.timezone || DEFAULT_TIMEZONE

  // Cancel any Pending reminders for this training session whose time or trainer changed
  const custRecipientId = custInfo.userProfile?.id || session.customer_id
  for (const n of notifications) {
    if (n.session_id === session.id && n.delivery_status === 'Pending') {
      const sameTime =
        n.session_scheduled_at &&
        new Date(n.session_scheduled_at).getTime() === scheduledAtMs
      const validRecipient =
        (n.notification_type === 'customer_session_reminder' &&
          n.recipient_user_id === custRecipientId) ||
        (n.notification_type === 'trainer_session_reminder' &&
          n.recipient_user_id === trnInfo.userId)

      if (!sameTime || !validRecipient) {
        n.delivery_status = 'Cancelled'
        n.error_details = !sameTime
          ? `Training session rescheduled to ${scheduledAtIso}. Old reminder cancelled.`
          : `Trainer reassigned to ${trnInfo.fullName}. Old reminder cancelled.`
        n.updated_at = new Date().toISOString()
        cancelledCount++
      }
    }
  }

  const { dateStr, timeStr } = formatDateTimeInTimeZone(scheduledAtIso, tz)
  const sessionType = session.session_type || 'Live 1-on-1 Personal Training'
  const meetingLink =
    session.meeting_url || custInfo.meetingLink || 'https://meet.zoho.com/drfitveda-live'
  const nowIso = new Date().toISOString()

  const scheduled: WhatsAppNotificationRecord[] = []

  // 1. Customer 15m Session Reminder
  const custIdempotencyKey = `customer_session_reminder:${session.id}:${scheduledAtIso}:${custRecipientId}`
  const existingCustReminder = notifications.find(
    n => n.idempotency_key === custIdempotencyKey && n.delivery_status !== 'Cancelled'
  )

  if (!existingCustReminder && custInfo.customer && custInfo.customer.is_active !== false) {
    const custVars = [
      custInfo.fullName,
      sessionType,
      dateStr,
      timeStr,
      trnInfo.fullName,
      meetingLink,
    ]
    const custRecord: WhatsAppNotificationRecord = {
      id: `wn-cust-ts-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotency_key: custIdempotencyKey,
      notification_type: 'customer_session_reminder',
      template_name: WHATSAPP_TEMPLATES.customer_session_reminder.name,
      recipient_user_id: custRecipientId,
      recipient_name: custInfo.fullName,
      recipient_role: 'customer',
      recipient_phone: custInfo.phone,
      customer_id: session.customer_id,
      customer_name: custInfo.fullName,
      session_id: session.id,
      assignment_id: null,
      scheduled_for: reminderTimeIso,
      session_scheduled_at: scheduledAtIso,
      sent_at: null,
      delivered_at: null,
      provider_message_id: null,
      delivery_status: 'Pending',
      retry_count: 0,
      max_retries: 3,
      next_retry_at: null,
      permanent_failure: false,
      error_details: null,
      message_preview: renderWhatsAppMessagePreview('customer_session_reminder', custVars),
      template_variables: custVars,
      timezone: tz,
      created_at: nowIso,
      updated_at: nowIso,
    }
    notifications.unshift(custRecord)
    scheduled.push(custRecord)
  }

  // 2. Trainer 15m Session Reminder
  if (trnInfo.professional && trnInfo.professional.is_active !== false) {
    const trnIdempotencyKey = `trainer_session_reminder:${session.id}:${scheduledAtIso}:${trnInfo.userId}`
    const existingTrnReminder = notifications.find(
      n => n.idempotency_key === trnIdempotencyKey && n.delivery_status !== 'Cancelled'
    )
    if (!existingTrnReminder) {
      const trnVars = [
        trnInfo.fullName,
        custInfo.fullName,
        custInfo.phone || 'Not Provided',
        sessionType,
        dateStr,
        timeStr,
        meetingLink,
      ]
      const trnRecord: WhatsAppNotificationRecord = {
        id: `wn-trn-ts-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        idempotency_key: trnIdempotencyKey,
        notification_type: 'trainer_session_reminder',
        template_name: WHATSAPP_TEMPLATES.trainer_session_reminder.name,
        recipient_user_id: trnInfo.userId,
        recipient_name: trnInfo.fullName,
        recipient_role: trnInfo.role || 'trainer',
        recipient_phone: trnInfo.phone,
        customer_id: session.customer_id,
        customer_name: custInfo.fullName,
        session_id: session.id,
        assignment_id: null,
        scheduled_for: reminderTimeIso,
        session_scheduled_at: scheduledAtIso,
        sent_at: null,
        delivered_at: null,
        provider_message_id: null,
        delivery_status: 'Pending',
        retry_count: 0,
        max_retries: 3,
        next_retry_at: null,
        permanent_failure: false,
        error_details: null,
        message_preview: renderWhatsAppMessagePreview('trainer_session_reminder', trnVars),
        template_variables: trnVars,
        timezone: tz,
        created_at: nowIso,
        updated_at: nowIso,
      }
      notifications.unshift(trnRecord)
      scheduled.push(trnRecord)
    }
  }

  if (options?.persist !== false && (scheduled.length > 0 || cancelledCount > 0)) {
    await savePersistedState('whatsapp_notifications')
  }

  return { scheduled, cancelledCount }
}

/**
 * Idempotent Background Scheduler for 15-Minute Session Reminders & Failed Notification Retries.
 * Can be invoked by Vercel Cron (`/api/cron/whatsapp-reminders`), internal API triggers, or tests.
 */
let schedulerLock = false

export async function runWhatsAppReminderScheduler(options?: {
  now?: Date
  forceSyncSessions?: boolean
}): Promise<{
  runId: string
  executedAt: string
  scannedSessions: number
  newlyScheduledCount: number
  dispatchedCount: number
  retriedCount: number
  cancelledCount: number
  failedCount: number
  skippedDuplicateOrNotDue: number
}> {
  const now = options?.now || new Date()
  const nowMs = now.getTime()
  const runId = `sched-${nowMs}-${Math.floor(100 + Math.random() * 900)}`

  if (schedulerLock) {
    return {
      runId,
      executedAt: now.toISOString(),
      scannedSessions: 0,
      newlyScheduledCount: 0,
      dispatchedCount: 0,
      retriedCount: 0,
      cancelledCount: 0,
      failedCount: 0,
      skippedDuplicateOrNotDue: 0,
    }
  }

  schedulerLock = true
  try {
    await loadPersistedState(true)

    let scannedSessions = 0
    let newlyScheduledCount = 0
    let dispatchedCount = 0
    let retriedCount = 0
    let cancelledCount = 0
    let failedCount = 0
    let skippedDuplicateOrNotDue = 0

    // 1. Sync reminders for all upcoming appointments & training_sessions starting within the next 24 hours
    const appointments: any[] = mockDb.state.appointments || []
    for (const appt of appointments) {
      scannedSessions++
      const syncRes = await syncSessionRemindersForAppointment(appt, { persist: false })
      newlyScheduledCount += syncRes.scheduled.length
      cancelledCount += syncRes.cancelledCount
    }

    const trainingSessions: any[] = mockDb.state.training_sessions || []
    for (const ts of trainingSessions) {
      scannedSessions++
      const syncRes = await syncSessionRemindersForTrainingSession(ts, { persist: false })
      newlyScheduledCount += syncRes.scheduled.length
      cancelledCount += syncRes.cancelledCount
    }

    const notifications = getNotificationsArray()

    // 2. Process all due 'Pending' session reminders & assignment notifications
    for (const record of notifications) {
      if (record.delivery_status === 'Pending') {
        // For session reminders, verify the underlying session is STILL confirmed and not cancelled/rescheduled
        if (record.session_id) {
          const appt = appointments.find(a => a.id === record.session_id)
          const ts = trainingSessions.find(s => s.id === record.session_id)
          const sessionObj = appt || ts

          if (!sessionObj || (sessionObj.status !== 'scheduled' && sessionObj.status !== 'confirmed')) {
            record.delivery_status = 'Cancelled'
            record.error_details = 'Cancelled before send: Session is no longer active/scheduled.'
            record.updated_at = now.toISOString()
            cancelledCount++
            continue
          }

          if (
            record.session_scheduled_at &&
            new Date(sessionObj.scheduled_at).getTime() !== new Date(record.session_scheduled_at).getTime()
          ) {
            record.delivery_status = 'Cancelled'
            record.error_details = 'Cancelled before send: Session was rescheduled.'
            record.updated_at = now.toISOString()
            cancelledCount++
            continue
          }

          // Check if the session is within the 15-minute reminder window:
          // scheduled_for <= now AND session hasn't already ended/passed more than 5 minutes ago
          const scheduledForMs = new Date(record.scheduled_for).getTime()
          const sessionStartMs = new Date(sessionObj.scheduled_at).getTime()
          const minutesUntilStart = (sessionStartMs - nowMs) / (60 * 1000)

          // Window: due when scheduledForMs <= nowMs + 60s (i.e. <= 15m before start) and session is still upcoming (minutesUntilStart >= -2)
          if (nowMs + 60 * 1000 < scheduledForMs) {
            skippedDuplicateOrNotDue++
            continue
          }

          if (minutesUntilStart < -5) {
            record.delivery_status = 'Cancelled'
            record.error_details = 'Expired: Session start time already passed before reminder window.'
            record.updated_at = now.toISOString()
            cancelledCount++
            continue
          }
        } else {
          // Non-session notification (e.g. assignment alert): check scheduled_for <= now
          const scheduledForMs = new Date(record.scheduled_for).getTime()
          if (nowMs < scheduledForMs) {
            skippedDuplicateOrNotDue++
            continue
          }
        }

        // Dispatch notification via MSG91
        const updated = await dispatchWhatsAppNotificationRecord(record, {
          isRetry: false,
          persistImmediately: false,
        })
        if (updated.delivery_status === 'Sent' || updated.delivery_status === 'Delivered') {
          dispatchedCount++
        } else if (updated.delivery_status === 'Failed') {
          failedCount++
        }
      } else if (
        record.delivery_status === 'Failed' &&
        !record.permanent_failure &&
        record.retry_count < (record.max_retries || 3) &&
        record.next_retry_at
      ) {
        // 3. Process automatic exponential backoff retries for transient provider failures
        const nextRetryMs = new Date(record.next_retry_at).getTime()
        if (nowMs >= nextRetryMs) {
          // If session reminder, ensure session hasn't been cancelled or already passed
          if (record.session_id) {
            const appt = appointments.find(a => a.id === record.session_id)
            const ts = trainingSessions.find(s => s.id === record.session_id)
            const sessionObj = appt || ts
            if (!sessionObj || (sessionObj.status !== 'scheduled' && sessionObj.status !== 'confirmed')) {
              record.delivery_status = 'Cancelled'
              record.next_retry_at = null
              record.error_details = 'Retry aborted: Session was cancelled.'
              record.updated_at = now.toISOString()
              cancelledCount++
              continue
            }
          }

          const updated = await dispatchWhatsAppNotificationRecord(record, {
            isRetry: true,
            persistImmediately: false,
          })
          retriedCount++
          if (updated.delivery_status === 'Sent' || updated.delivery_status === 'Delivered') {
            dispatchedCount++
          } else {
            failedCount++
          }
        }
      }
    }

    // Record scheduler execution run for monitoring
    if (!Array.isArray(mockDb.state.whatsapp_scheduler_runs)) {
      mockDb.state.whatsapp_scheduler_runs = []
    }
    const runSummary = {
      runId,
      executedAt: now.toISOString(),
      scannedSessions,
      newlyScheduledCount,
      dispatchedCount,
      retriedCount,
      cancelledCount,
      failedCount,
      skippedDuplicateOrNotDue,
    }
    mockDb.state.whatsapp_scheduler_runs.unshift(runSummary)
    if (mockDb.state.whatsapp_scheduler_runs.length > 50) {
      mockDb.state.whatsapp_scheduler_runs = mockDb.state.whatsapp_scheduler_runs.slice(0, 50)
    }

    await savePersistedState([
      'whatsapp_notifications',
      'whatsapp_scheduler_runs',
      'notifications',
    ])

    return runSummary
  } finally {
    schedulerLock = false
  }
}

/**
 * Safely retries an eligible Failed notification from the Admin Portal.
 * Enforces immutability of already Sent or Delivered notifications.
 */
export async function adminRetryFailedNotification(notificationId: string): Promise<{
  success: boolean
  notification?: WhatsAppNotificationRecord
  error?: string
}> {
  await loadPersistedState(true)
  const notifications = getNotificationsArray()
  const record = notifications.find(n => n.id === notificationId)

  if (!record) {
    return { success: false, error: 'Notification record not found.' }
  }

  if (record.delivery_status === 'Sent' || record.delivery_status === 'Delivered') {
    return {
      success: false,
      error: `Cannot resend a notification that is already "${record.delivery_status}". Historical delivery records are immutable.`,
    }
  }

  if (record.delivery_status === 'Cancelled') {
    return {
      success: false,
      error: 'Cannot retry a cancelled notification.',
    }
  }

  // Reset permanent_failure if admin fixed the phone number in profile
  if (record.recipient_role === 'customer') {
    const custInfo = await resolveCustomerDetails(record.customer_id)
    if (custInfo.phone) record.recipient_phone = custInfo.phone
  } else {
    const proInfo = await resolveProfessionalDetails(record.recipient_user_id)
    if (proInfo.phone) record.recipient_phone = proInfo.phone
  }

  record.permanent_failure = false
  const updated = await dispatchWhatsAppNotificationRecord(record, {
    isRetry: true,
    persistImmediately: true,
  })

  return {
    success: updated.delivery_status === 'Sent' || updated.delivery_status === 'Delivered',
    notification: updated,
    error: updated.delivery_status === 'Failed' ? updated.error_details || 'Retry failed' : undefined,
  }
}

/**
 * Updates notification status when a MSG91 delivery receipt webhook arrives.
 */
export async function handleMsg91DeliveryWebhook(payload: {
  requestId?: string
  notificationId?: string
  status: 'delivered' | 'failed' | 'read' | 'sent'
  errorReason?: string
}): Promise<{ updated: boolean; record?: WhatsAppNotificationRecord }> {
  await loadPersistedState(true)
  const notifications = getNotificationsArray()
  const record = notifications.find(
    n =>
      (payload.notificationId && n.id === payload.notificationId) ||
      (payload.requestId && n.provider_message_id === payload.requestId)
  )

  if (!record) return { updated: false }

  const nowIso = new Date().toISOString()
  if (payload.status === 'delivered' || payload.status === 'read') {
    record.delivery_status = 'Delivered'
    record.delivered_at = nowIso
    record.error_details = null
    record.updated_at = nowIso
  } else if (payload.status === 'failed') {
    record.delivery_status = 'Failed'
    record.error_details = payload.errorReason || 'Provider delivery receipt reported failure.'
    record.updated_at = nowIso
    await alertAdminsOnRepeatedFailure(record, record.error_details)
  }

  await savePersistedState(['whatsapp_notifications', 'notifications'])
  return { updated: true, record }
}

