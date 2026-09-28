import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb, MOCK_USERS } from '@/lib/mock-db'

const DEFAULT_ADMIN_PROFILE = {
  id: 'u0000000-0000-0000-0000-000000000004',
  full_name: 'Rajesh Kumar',
  email: 'admin@drfitveda.com',
  phone: '+91 98765 43213',
  designation: 'Super Administrator',
  role: 'super_admin',
  avatar_url: '',
  created_at: '2024-01-01T00:00:00.000Z',
}

function getAdminSession(req: NextRequest, user: any) {
  let sessionData: any = null
  const cookie = req.cookies.get('drf_session')?.value
  if (cookie) {
    try { sessionData = JSON.parse(decodeURIComponent(cookie)) } catch {
      try { sessionData = JSON.parse(cookie) } catch {}
    }
  }
  if (!sessionData && user) {
    sessionData = {
      user_id: user.id,
      email: user.email,
      role: (user as any)?.user_metadata?.role || (user as any)?.role || 'admin',
      full_name: (user as any)?.user_metadata?.full_name || 'Admin',
    }
  }
  return sessionData
}

export async function GET(req: NextRequest) {
  try {
    if (!mockDb.state.admin_profile) {
      mockDb.state.admin_profile = { ...DEFAULT_ADMIN_PROFILE }
    }

    // Return the profile
    return NextResponse.json({
      profile: mockDb.state.admin_profile,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch admin profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const session = getAdminSession(req, user)

    if (!session || !['admin', 'super_admin', 'operations_manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { full_name, email, phone, designation, password, avatar_url } = body

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    if (!mockDb.state.admin_profile) {
      mockDb.state.admin_profile = { ...DEFAULT_ADMIN_PROFILE }
    }

    const updatedProfile = {
      ...mockDb.state.admin_profile,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : mockDb.state.admin_profile.phone,
      designation: designation ? designation.trim() : (mockDb.state.admin_profile.designation || 'Super Administrator'),
      avatar_url: avatar_url !== undefined ? avatar_url : mockDb.state.admin_profile.avatar_url,
      updated_at: new Date().toISOString(),
    }

    if (password && password.trim().length >= 6) {
      updatedProfile.password = password.trim()
      if (MOCK_USERS.admin) {
        MOCK_USERS.admin.password = password.trim()
      }
    }

    // Save to mockDb admin_profile
    mockDb.state.admin_profile = updatedProfile

    // Also update MOCK_USERS.admin
    if (MOCK_USERS.admin) {
      MOCK_USERS.admin.full_name = updatedProfile.full_name
      MOCK_USERS.admin.email = updatedProfile.email
      MOCK_USERS.admin.phone = updatedProfile.phone
    }

    // Update in user_profiles array
    if (mockDb.state.user_profiles) {
      const idx = mockDb.state.user_profiles.findIndex((up: any) =>
        up.id === updatedProfile.id || up.role === 'admin' || up.role === 'super_admin'
      )
      if (idx !== -1) {
        mockDb.state.user_profiles[idx] = {
          ...mockDb.state.user_profiles[idx],
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
          email: updatedProfile.email,
        }
      }
    }

    // Create updated session payload
    const newSessionPayload = {
      user_id: session.user_id || updatedProfile.id,
      email: updatedProfile.email,
      role: session.role || 'super_admin',
      full_name: updatedProfile.full_name,
      designation: updatedProfile.designation,
    }

    const response = NextResponse.json({
      profile: updatedProfile,
      success: true,
      message: 'Superadmin profile updated successfully',
    })

    // Set updated session cookie
    response.cookies.set('drf_session', JSON.stringify(newSessionPayload), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Failed to update admin profile' }, { status: 500 })
  }
}
