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

export async function GET(req: NextRequest) {
  try {
    const customers = mockDb.state.customers || []
    const profiles = mockDb.state.customer_profiles || []
    const userProfiles = mockDb.state.user_profiles || []
    const assignments = mockDb.state.professional_assignments || []
    const professionals = mockDb.state.professionals || []
    const memberships = mockDb.state.memberships || []

    const enriched = customers.map((c: any) => {
      const userProfile = userProfiles.find((up: any) => up.id === c.user_id) || {}
      const profile = profiles.find((cp: any) => cp.customer_id === c.id) || {}
      const custAssignments = assignments.filter((pa: any) => pa.customer_id === c.id && pa.is_active)
      const assignedPros = custAssignments.map((pa: any) => {
        const pro = professionals.find((p: any) => p.id === pa.professional_id)
        return {
          id: pa.id,
          role: pa.role,
          professional_id: pa.professional_id,
          full_name: pro?.full_name || 'Assigned Professional',
        }
      })
      const plan = memberships.find((m: any) => m.id === c.membership_plan_id) || null

      return {
        ...c,
        full_name: userProfile.full_name || 'Customer',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        profile,
        assigned_professionals: assignedPros,
        plan,
      }
    })

    return NextResponse.json({ customers: enriched })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      height_cm,
      weight_kg,
      goals,
      membership_plan_id,
      google_meet_url,
      doctor_id,
      trainer_id,
      yoga_id,
    } = body

    const userId = `u-cust-${Date.now()}`
    const customerId = `c-cust-${Date.now()}`
    const profileId = `cp-${Date.now()}`

    // 1. Create user profile
    const newUserProfile = {
      id: userId,
      role: 'customer',
      full_name: full_name || 'New Customer',
      email: email || '',
      phone: phone || '',
      is_active: true,
      created_at: new Date().toISOString(),
    }
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    mockDb.state.user_profiles.push(newUserProfile)

    // 2. Automatically generate unique Zoho Meeting room for the customer
    const cleanName = (full_name || 'care').toLowerCase().replace(/[^a-z0-9]/g, '')
    const zohoMeetingKey = `fitveda-${cleanName}-${Math.floor(100 + Math.random() * 900)}`
    const defaultZohoUrl = google_meet_url || `https://meet.zoho.com/${zohoMeetingKey}`

    const newCustomer = {
      id: customerId,
      user_id: userId,
      membership_status: membership_plan_id ? 'active' : 'inactive',
      membership_plan_id: membership_plan_id || null,
      zoho_meeting_url: defaultZohoUrl,
      zoho_meeting_key: zohoMeetingKey,
      google_meet_url: defaultZohoUrl,
      meeting_url: defaultZohoUrl,
      meeting_provider: 'zoho_meeting',
      is_active: true,
      created_at: new Date().toISOString(),
    }
    if (!mockDb.state.customers) mockDb.state.customers = []
    mockDb.state.customers.push(newCustomer)

    // 3. Create customer health profile
    const newCustomerProfile = {
      id: profileId,
      customer_id: customerId,
      gender: gender || 'unspecified',
      date_of_birth: date_of_birth || '',
      height_cm: height_cm ? Number(height_cm) : null,
      weight_kg: weight_kg ? Number(weight_kg) : null,
      bmi: height_cm && weight_kg ? Number((weight_kg / ((height_cm/100)*(height_cm/100))).toFixed(1)) : null,
      goals: goals || 'Lifestyle & wellness improvement',
      created_at: new Date().toISOString(),
    }
    if (!mockDb.state.customer_profiles) mockDb.state.customer_profiles = []
    mockDb.state.customer_profiles.push(newCustomerProfile)

    // 4. Create assignments if specified
    if (!mockDb.state.professional_assignments) mockDb.state.professional_assignments = []

    if (doctor_id) {
      mockDb.state.professional_assignments.push({
        id: `pa-${Date.now()}-doc`,
        customer_id: customerId,
        professional_id: doctor_id,
        role: 'doctor',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }
    if (trainer_id) {
      mockDb.state.professional_assignments.push({
        id: `pa-${Date.now()}-trn`,
        customer_id: customerId,
        professional_id: trainer_id,
        role: 'trainer',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }
    if (yoga_id) {
      mockDb.state.professional_assignments.push({
        id: `pa-${Date.now()}-yog`,
        customer_id: customerId,
        professional_id: yoga_id,
        role: 'yoga_doctor',
        is_active: true,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ customer: newCustomer, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 400 })
  }
}
