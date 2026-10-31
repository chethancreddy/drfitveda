import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { triggerCustomerAssignmentNotifications } from '@/lib/services/whatsapp-notification.service'

function getRole(req: NextRequest, user: any) {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try { role = JSON.parse(decodeURIComponent(cookie)).role } catch {
        try { role = JSON.parse(cookie).role } catch {}
      }
    }
  }
  return role
}

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const assignments = mockDb.state.professional_assignments || []
    const customers = mockDb.state.customers || []
    const userProfiles = mockDb.state.user_profiles || []
    const professionals = mockDb.state.professionals || []
    const teamMembers = mockDb.state.team_members || []

    const enriched = assignments.map((a: any) => {
      const cust = customers.find((c: any) => c.id === a.customer_id)
      const userProfile = cust ? userProfiles.find((up: any) => up.id === cust.user_id) : null
      const pro = professionals.find((p: any) => p.id === a.professional_id)
      const coordinator = teamMembers.find((t: any) => t.id === a.assigned_by_coordinator_id)

      return {
        ...a,
        customer_name: userProfile?.full_name || a.customer_id,
        customer_phone: userProfile?.phone || '',
        customer_meet_url: cust?.google_meet_url || (cust as any)?.zoho_meeting_url || 'https://meeting.zoho.com/join?key=fit-veda-priya',
        professional_name: pro?.full_name || 'Assigned Professional',
        professional_role: pro?.role || a.role,
        professional_slots: pro?.working_slots || [],
        assigned_by_name: coordinator?.full_name || a.assigned_by_name || 'Operations Dispatch',
        assigned_slot: a.assigned_slot || 'Flexible',
        is_unassigned: false,
      }
    })

    // Active assigned customer IDs
    const assignedCustomerIds = new Set(
      assignments
        .filter((a: any) => a.is_active !== false && !a.is_archived && a.professional_id)
        .map((a: any) => a.customer_id)
    )

    // Unassigned active customers genuinely awaiting care dispatch
    const unassigned = customers
      .filter((c: any) => !c.is_archived && c.is_active !== false && !assignedCustomerIds.has(c.id))
      .map((c: any) => {
        const userProfile = userProfiles.find((u: any) => u.id === c.user_id)
        return {
          id: `unassigned-${c.id}`,
          customer_id: c.id,
          customer_name: userProfile?.full_name || c.full_name || 'Customer',
          customer_phone: userProfile?.phone || c.phone || '',
          customer_email: userProfile?.email || c.email || '',
          customer_meet_url: c.google_meet_url || (c as any)?.zoho_meeting_url || '',
          membership_status: c.membership_status || 'active',
          professional_id: '',
          professional_name: 'Unassigned (Awaiting Care Match)',
          professional_role: 'Pending Assignment',
          role: 'doctor',
          assigned_slot: 'Awaiting Slot Dispatch',
          assigned_by_name: 'Care Coordinator Needed',
          is_active: false,
          is_archived: false,
          is_unassigned: true,
          status: 'unassigned',
          created_at: c.created_at || new Date().toISOString(),
        }
      })

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') // 'all' | 'assigned' | 'unassigned'

    let result = enriched
    if (filter === 'unassigned') {
      result = unassigned
    } else if (filter === 'assigned') {
      result = enriched
    }

    return NextResponse.json({
      assignments: enriched,
      unassigned,
      all: [...enriched, ...unassigned],
      stats: {
        total: enriched.length + unassigned.length,
        assigned: enriched.filter((a: any) => !a.is_archived && a.is_active).length,
        unassigned: unassigned.length,
        active: enriched.filter((a: any) => !a.is_archived && a.is_active).length,
        inactive: enriched.filter((a: any) => !a.is_archived && !a.is_active).length,
        archived: enriched.filter((a: any) => a.is_archived).length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff or Admin role required.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      customer_id,
      professional_id,
      role: proRole,
      assigned_slot,
      assigned_by_coordinator_id,
      assigned_by_name,
      notes,
      is_active,
      appointment_date,
      consultation_type,
    } = body

    if (!customer_id || !professional_id) {
      return NextResponse.json({ error: 'Customer and Professional are required' }, { status: 400 })
    }

    const newAssignment = {
      id: `pa-${Date.now()}`,
      customer_id,
      professional_id,
      role: proRole || 'doctor',
      assigned_slot: assigned_slot || '07:00 AM - 08:00 AM',
      assigned_by_coordinator_id: assigned_by_coordinator_id || 'tm-001',
      assigned_by_name: assigned_by_name || 'Care Coordinator',
      notes: notes || '',
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
    }

    if (!mockDb.state.professional_assignments) mockDb.state.professional_assignments = []

    // If appointment_date is specified, create or link confirmed appointment
    let confirmedAppt = null
    if (appointment_date) {
      if (!mockDb.state.appointments) mockDb.state.appointments = []
      const scheduledIso = new Date(`${appointment_date}T09:00:00Z`).toISOString()
      confirmedAppt = {
        id: `appt-${Date.now()}`,
        customer_id,
        professional_id,
        scheduled_at: scheduledIso,
        duration_min: 45,
        status: 'scheduled',
        notes: notes || 'Assigned via Care Dispatch',
        consultation_type: consultation_type || 'Doctor Video Consultation (Zoho Meeting)',
        created_at: new Date().toISOString(),
      }
      mockDb.state.appointments.push(confirmedAppt)
      await savePersistedState('appointments')
    }

    // Check if there is an existing active assignment for this customer & role category to handle reassignment cleanly
    const targetRole = proRole || 'doctor'
    let previousProfessionalId: string | null = null
    for (const existing of mockDb.state.professional_assignments) {
      if (
        existing.customer_id === customer_id &&
        existing.role === targetRole &&
        existing.is_active !== false &&
        existing.professional_id !== professional_id
      ) {
        previousProfessionalId = existing.professional_id
        existing.is_active = false
        existing.updated_at = new Date().toISOString()
      }
    }

    mockDb.state.professional_assignments.push(newAssignment)
    await savePersistedState('professional_assignments')

    let whatsappNotification = null
    let customerNotification = null
    if (newAssignment.is_active !== false) {
      const notifRes = await triggerCustomerAssignmentNotifications({
        customerId: customer_id,
        professionalId: professional_id,
        role: newAssignment.role,
        assignmentId: newAssignment.id,
        assignedSlot: newAssignment.assigned_slot,
        previousProfessionalId,
      })
      whatsappNotification = notifRes.created
      customerNotification = notifRes.customerNotification
    }

    return NextResponse.json(
      {
        assignment: newAssignment,
        appointment: confirmedAppt,
        whatsappNotification,
        customerNotification,
        success: true,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 400 })
  }
}
