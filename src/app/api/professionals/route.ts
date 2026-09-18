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
    const pros = mockDb.state.professionals || []
    return NextResponse.json({ professionals: pros })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 })
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
    const { full_name, role: proRole, qualification, specialization, is_available, is_active, phone, email } = body

    const userId = `u-pro-${Date.now()}`
    const proId = `p0000000-0000-0000-0000-${Date.now().toString().slice(-12)}`

    // Create user profile
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    mockDb.state.user_profiles.push({
      id: userId,
      role: proRole || 'trainer',
      full_name: full_name || 'New Professional',
      phone: phone || '',
      email: email || '',
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
    })

    // Create professional record
    const newPro = {
      id: proId,
      user_id: userId,
      role: proRole || 'trainer',
      full_name: full_name || 'New Professional',
      qualification: qualification || '',
      specialization: specialization || '',
      is_available: is_available !== undefined ? is_available : true,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString(),
    }

    if (!mockDb.state.professionals) mockDb.state.professionals = []
    mockDb.state.professionals.push(newPro)

    return NextResponse.json({ professional: newPro, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create professional' }, { status: 400 })
  }
}
