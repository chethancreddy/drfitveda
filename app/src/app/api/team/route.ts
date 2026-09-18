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

// GET /api/team — List all operations staff, care coordinators, managers, and executives
export async function GET(req: NextRequest) {
  try {
    const defaultTeam = [
      {
        id: 'tm-001',
        user_id: 'u-team-001',
        full_name: 'Kavita Rao',
        email: 'kavita.operations@drfitveda.com',
        phone: '+91 98111 22334',
        role: 'operations_manager',
        department: 'Care Operations & Scheduling',
        shift: 'Morning (07:00 AM - 03:00 PM)',
        assigned_region: 'National / All India',
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'tm-002',
        user_id: 'u-team-002',
        full_name: 'Arjun Nambiar',
        email: 'arjun.coordinator@drfitveda.com',
        phone: '+91 98222 33445',
        role: 'care_coordinator',
        department: 'Patient Onboarding & Slot Dispatch',
        shift: 'General (09:00 AM - 06:00 PM)',
        assigned_region: 'South & West Zones',
        is_active: true,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'tm-003',
        user_id: 'u-team-003',
        full_name: 'Neha Kapoor',
        email: 'neha.support@drfitveda.com',
        phone: '+91 98333 44556',
        role: 'staff',
        department: 'Customer Success & Follow-ups',
        shift: 'Evening (01:00 PM - 09:00 PM)',
        assigned_region: 'North & East Zones',
        is_active: true,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ]

    if (!mockDb.state.team_members || mockDb.state.team_members.length === 0) {
      mockDb.state.team_members = [...defaultTeam]
    } else {
      // Ensure default members exist alongside dynamically added members
      for (const dt of defaultTeam) {
        if (!mockDb.state.team_members.some((m: any) => m.id === dt.id)) {
          mockDb.state.team_members.unshift(dt)
        }
      }
    }

    return NextResponse.json({
      success: true,
      team_members: mockDb.state.team_members,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch team members' }, { status: 500 })
  }
}

// POST /api/team — Admin creates new staff / executive / operations manager
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)

    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Manager role required.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      full_name,
      email,
      phone,
      role: memberRole,
      department,
      shift,
      assigned_region,
    } = body

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }

    if (!mockDb.state.team_members) {
      mockDb.state.team_members = []
    }

    const newMember = {
      id: `tm-${Date.now()}`,
      user_id: `u-team-${Date.now()}`,
      full_name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      role: memberRole || 'care_coordinator',
      department: department || 'Care Operations & Dispatch',
      shift: shift || 'General (09:00 AM - 06:00 PM)',
      assigned_region: assigned_region || 'National',
      is_active: true,
      created_at: new Date().toISOString(),
    }

    mockDb.state.team_members.push(newMember)

    // Also register in user_profiles
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    mockDb.state.user_profiles.push({
      id: newMember.user_id,
      role: newMember.role,
      full_name: newMember.full_name,
      phone: newMember.phone,
      is_active: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Staff / Manager created successfully',
      member: newMember,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create team member' }, { status: 400 })
  }
}
