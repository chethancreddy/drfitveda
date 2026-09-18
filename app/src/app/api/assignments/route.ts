import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

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

export async function GET() {
  try {
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
        customer_meet_url: cust?.google_meet_url || 'https://meet.google.com/fit-veda-priya',
        professional_name: pro?.full_name || 'Assigned Professional',
        professional_role: pro?.role || a.role,
        professional_slots: pro?.working_slots || [],
        assigned_by_name: coordinator?.full_name || a.assigned_by_name || 'Operations Dispatch',
        assigned_slot: a.assigned_slot || 'Flexible',
      }
    })

    return NextResponse.json({ assignments: enriched })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
    mockDb.state.professional_assignments.push(newAssignment)

    return NextResponse.json({ assignment: newAssignment, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 400 })
  }
}
