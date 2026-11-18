import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { GoogleMeetService } from '@/lib/services/google-meet.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'doctor'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    const { id } = await params
    const body = await req.json()
    const { action, confirmed_scheduled_at, alternative_time, admin_notes } = body

    const appointments: any[] = mockDb.state.appointments || []
    const appt = appointments.find((a: any) => a.id === id)
    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (action === 'confirm') {
      const scheduledAt = confirmed_scheduled_at || appt.scheduled_at
      appt.status = 'scheduled'
      appt.scheduled_at = scheduledAt
      if (admin_notes) {
        appt.notes = `${appt.notes ? appt.notes + ' | ' : ''}Confirmed by Admin: ${admin_notes}`
      }

      // Generate or update Google Meet link
      if (!appt.meeting_url || appt.meeting_url.includes('placeholder')) {
        const custRecord = (mockDb.state.customers || []).find((c: any) => c.id === appt.customer_id)
        const userProfile = custRecord
          ? (mockDb.state.user_profiles || []).find((u: any) => u.id === custRecord.user_id)
          : null
        const meetRes = await GoogleMeetService.getOrCreateCustomerMeeting({
          customerId: appt.customer_id,
          customerName: userProfile?.full_name || 'Valued Patient',
          customerEmail: userProfile?.email || 'patient@drfitveda.com',
          scheduledAt,
          durationMin: appt.duration_min || 30,
        })
        appt.meeting_url = meetRes.meeting_url
        appt.meeting_id = meetRes.meeting_id
        appt.meeting_provider = 'google_meet'
      }

      // Customer Notification
      if (mockDb.state.notifications) {
        mockDb.state.notifications.push({
          id: `notif-${Date.now()}`,
          user_id: appt.customer_id,
          title: 'Priority Appointment Confirmed! 🎉',
          body: `Your priority consultation for ${new Date(scheduledAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} has been confirmed. Join via Google Meet: ${appt.meeting_url}`,
          type: 'appointment',
          action_url: '/customer/consult',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    } else if (action === 'propose_alternative') {
      appt.status = 'alternative_proposed'
      appt.alternative_time_proposed = alternative_time
      appt.notes = `${appt.notes ? appt.notes + ' | ' : ''}Proposed alternative time: ${alternative_time}. ${admin_notes || ''}`

      if (mockDb.state.notifications) {
        mockDb.state.notifications.push({
          id: `notif-${Date.now()}`,
          user_id: appt.customer_id,
          title: 'Alternative Appointment Time Proposed',
          body: `Regarding your priority consultation request, our doctor proposed an alternative time: ${alternative_time}. Please review in your portal.`,
          type: 'appointment',
          action_url: '/customer/consult',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    } else if (action === 'reject') {
      appt.status = 'rejected'
      appt.notes = `${appt.notes ? appt.notes + ' | ' : ''}Declined: ${admin_notes || 'Doctor unavailable at requested time'}`

      if (mockDb.state.notifications) {
        mockDb.state.notifications.push({
          id: `notif-${Date.now()}`,
          user_id: appt.customer_id,
          title: 'Appointment Request Update',
          body: `We could not accommodate your requested consultation slot. Reason: ${admin_notes || 'Doctor schedule full'}. Our support team will assist you with rescheduling or refund.`,
          type: 'appointment',
          action_url: '/customer/consult',
          created_at: new Date().toISOString(),
          read: false,
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Allowed: confirm, propose_alternative, reject' }, { status: 400 })
    }

    await savePersistedState(['appointments', 'notifications'])

    return NextResponse.json({
      success: true,
      appointment: appt,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error updating appointment status' }, { status: 500 })
  }
}
