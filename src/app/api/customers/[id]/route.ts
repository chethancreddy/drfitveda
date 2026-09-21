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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const customers = mockDb.state.customers || []
    const customer = customers.find((c: any) => c.id === id || c.user_id === id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const userProfiles = mockDb.state.user_profiles || []
    const profiles = mockDb.state.customer_profiles || []
    const foodProfiles = mockDb.state.food_profiles || []
    const assignments = mockDb.state.professional_assignments || []
    const professionals = mockDb.state.professionals || []
    const memberships = mockDb.state.memberships || []
    const trainingSessions = mockDb.state.training_sessions || []

    const userProfile = userProfiles.find((up: any) => up.id === customer.user_id) || {}
    const profile = profiles.find((cp: any) => cp.customer_id === customer.id) || {}
    const foodProfile = foodProfiles.find((fp: any) => fp.customer_id === customer.id) || {}
    const plan = memberships.find((m: any) => m.id === customer.membership_plan_id) || null

    const custAssignments = assignments
      .filter((pa: any) => pa.customer_id === customer.id && pa.is_active)
      .map((pa: any) => {
        const pro = professionals.find((p: any) => p.id === pa.professional_id)
        return {
          id: pa.id,
          role: pa.role,
          professional_id: pa.professional_id,
          full_name: pro?.full_name || 'Professional',
          qualification: pro?.qualification || '',
          specialization: pro?.specialization || '',
        }
      })

    const sessions = trainingSessions
      .filter((s: any) => s.customer_id === customer.id)
      .map((s: any) => {
        const trn = professionals.find((p: any) => p.id === s.trainer_id)
        return {
          ...s,
          trainer_name: trn?.full_name || 'Trainer',
        }
      })

    return NextResponse.json({
      customer: {
        ...customer,
        full_name: userProfile.full_name || 'Customer',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        profile,
        food_profile: foodProfile,
        plan,
        assignments: custAssignments,
        sessions,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const customers = mockDb.state.customers || []
    const idx = customers.findIndex((c: any) => c.id === id || c.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const customer = customers[idx]
    const newMeetingUrl = body.zoho_meeting_url || body.google_meet_url || body.meeting_url

    // Update customer fields (including dedicated zoho_meeting_url and membership_status)
    customers[idx] = {
      ...customer,
      membership_status: body.membership_status !== undefined ? body.membership_status : customer.membership_status,
      membership_plan_id: body.membership_plan_id !== undefined ? body.membership_plan_id : customer.membership_plan_id,
      zoho_meeting_url: newMeetingUrl !== undefined ? newMeetingUrl : (customer.zoho_meeting_url || customer.google_meet_url),
      google_meet_url: newMeetingUrl !== undefined ? newMeetingUrl : (customer.google_meet_url || customer.zoho_meeting_url),
      meeting_url: newMeetingUrl !== undefined ? newMeetingUrl : (customer.meeting_url || customer.zoho_meeting_url || customer.google_meet_url),
      meeting_provider: newMeetingUrl?.includes('zoho.com') ? 'zoho_meeting' : (customer.meeting_provider || 'zoho_meeting'),
      is_active: body.is_active !== undefined ? body.is_active : customer.is_active,
      updated_at: new Date().toISOString(),
    }

    // Update user profile full_name, email, phone if provided
    if (body.full_name || body.email || body.phone) {
      const userProfiles = mockDb.state.user_profiles || []
      const uIdx = userProfiles.findIndex((up: any) => up.id === customer.user_id)
      if (uIdx !== -1) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          full_name: body.full_name || userProfiles[uIdx].full_name,
          email: body.email !== undefined ? body.email : userProfiles[uIdx].email,
          phone: body.phone !== undefined ? body.phone : userProfiles[uIdx].phone,
        }
      }
    }

    // Update customer profile if provided
    if (body.profile) {
      const profiles = mockDb.state.customer_profiles || []
      const pIdx = profiles.findIndex((cp: any) => cp.customer_id === customer.id)
      if (pIdx !== -1) {
        profiles[pIdx] = {
          ...profiles[pIdx],
          ...body.profile,
          bmi: body.profile.height_cm && body.profile.weight_kg 
            ? Number((body.profile.weight_kg / ((body.profile.height_cm/100)*(body.profile.height_cm/100))).toFixed(1))
            : profiles[pIdx].bmi,
        }
      }
    }

    return NextResponse.json({ customer: customers[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 400 })
  }
}
