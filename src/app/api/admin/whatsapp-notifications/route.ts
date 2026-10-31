import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'
import {
  WHATSAPP_TEMPLATES,
  adminRetryFailedNotification,
  runWhatsAppReminderScheduler,
  type WhatsAppNotificationRecord,
} from '@/lib/services/whatsapp-notification.service'
import { msg91WhatsAppService } from '@/lib/services/msg91-whatsapp.service'

function getRole(req: NextRequest, user: any): string {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try {
        role = JSON.parse(decodeURIComponent(cookie)).role
      } catch {
        try {
          role = JSON.parse(cookie).role
        } catch {}
      }
    }
  }
  return String(role || '')
}

function isAuthorizedAdmin(role: string): boolean {
  return ['admin', 'super_admin', 'operations_manager', 'care_coordinator'].includes(role)
}

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = getRole(req, user)

    if (!isAuthorizedAdmin(role)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const dateFilter = searchParams.get('date') || ''
    const typeFilter = searchParams.get('type') || ''
    const statusFilter = searchParams.get('status') || ''
    const recipientQuery = (searchParams.get('recipient') || '').toLowerCase().trim()
    const includeLiveTemplates = searchParams.get('templates') === '1'

    const allRecords: WhatsAppNotificationRecord[] = Array.isArray(mockDb.state.whatsapp_notifications)
      ? mockDb.state.whatsapp_notifications
      : []

    // Compute overall summary metrics across all records
    const stats = {
      totalNotifications: allRecords.length,
      totalSent: allRecords.filter(r => r.delivery_status === 'Sent' || r.delivery_status === 'Delivered').length,
      pendingCount: allRecords.filter(r => r.delivery_status === 'Pending' || r.delivery_status === 'Processing').length,
      sentProviderAcceptedCount: allRecords.filter(r => r.delivery_status === 'Sent').length,
      deliveredCount: allRecords.filter(r => r.delivery_status === 'Delivered').length,
      failedCount: allRecords.filter(r => r.delivery_status === 'Failed').length,
      cancelledCount: allRecords.filter(r => r.delivery_status === 'Cancelled').length,
      customerSessionReminders: allRecords.filter(r => r.notification_type === 'customer_session_reminder').length,
      trainerSessionReminders: allRecords.filter(r => r.notification_type === 'trainer_session_reminder').length,
      doctorAssignmentAlerts: allRecords.filter(r => r.notification_type === 'doctor_customer_assigned').length,
      trainerAssignmentAlerts: allRecords.filter(r => r.notification_type === 'trainer_customer_assigned').length,
    }

    // Apply filters
    const filtered = allRecords.filter(r => {
      if (typeFilter && r.notification_type !== typeFilter) return false
      if (statusFilter && r.delivery_status.toLowerCase() !== statusFilter.toLowerCase()) return false
      if (dateFilter) {
        const recordDate = (r.scheduled_for || r.created_at || '').slice(0, 10)
        const createdDate = (r.created_at || '').slice(0, 10)
        if (recordDate !== dateFilter && createdDate !== dateFilter) return false
      }
      if (recipientQuery) {
        const hay = `${r.recipient_name} ${r.recipient_phone} ${r.recipient_role} ${r.customer_name}`.toLowerCase()
        if (!hay.includes(recipientQuery)) return false
      }
      return true
    })

    let liveTemplates: any[] = []
    if (includeLiveTemplates) {
      liveTemplates = await msg91WhatsAppService.getTemplatesStatus()
    }

    const schedulerRuns = Array.isArray(mockDb.state.whatsapp_scheduler_runs)
      ? mockDb.state.whatsapp_scheduler_runs.slice(0, 15)
      : []

    return NextResponse.json({
      stats,
      notifications: filtered,
      configuredTemplates: WHATSAPP_TEMPLATES,
      liveTemplates,
      schedulerRuns,
      providerConfig: msg91WhatsAppService.getConfigurationStatus(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch WhatsApp notifications' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = getRole(req, user)

    if (!isAuthorizedAdmin(role)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { action, notificationId } = body

    if (action === 'retry') {
      if (!notificationId) {
        return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
      }
      const res = await adminRetryFailedNotification(notificationId)
      if (!res.success && !res.notification) {
        return NextResponse.json({ error: res.error || 'Retry rejected' }, { status: 400 })
      }
      return NextResponse.json({
        success: res.success,
        notification: res.notification,
        error: res.error,
      })
    }

    if (action === 'run_scheduler') {
      const summary = await runWhatsAppReminderScheduler()
      return NextResponse.json({
        success: true,
        summary,
      })
    }

    return NextResponse.json(
      { error: 'Unsupported action. Historical notification records cannot be edited or arbitrarily resent.' },
      { status: 400 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process notification action' },
      { status: 500 }
    )
  }
}

