import { NextResponse } from 'next/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

// ============================================================
// POST /api/auth/demo-login — Login with User ID / Email / Phone and Password
// Body: { role?: string, email?: string, identifier?: string, user_id?: string, password?: string }
// ============================================================
export async function POST(request: Request) {
  try {
    await loadPersistedState()
    const body = await request.json()
    const { role, email, identifier, user_id, password } = body

    const searchKey = (identifier || email || user_id || '').toLowerCase().trim()
    let targetUser: any = null

    // 1. Check persisted admin_profile first if searchKey matches
    if (searchKey && mockDb.state.admin_profile) {
      const ap = mockDb.state.admin_profile
      if (
        ap.email?.toLowerCase() === searchKey ||
        ap.id?.toLowerCase() === searchKey ||
        (ap.phone && ap.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, ''))
      ) {
        targetUser = {
          id: ap.id || MOCK_USERS.admin.id,
          email: ap.email || MOCK_USERS.admin.email,
          role: ap.role || 'admin',
          full_name: ap.full_name || MOCK_USERS.admin.full_name,
          phone: ap.phone || MOCK_USERS.admin.phone,
          password: ap.password || MOCK_USERS.admin.password,
        }
      }
    }

    // 2. Direct role selection (only when no explicit identifier was entered)
    if (!targetUser && !searchKey && role && MOCK_USERS[role]) {
      targetUser = MOCK_USERS[role]
    }

    // 3. Search in MOCK_USERS
    if (!targetUser && searchKey) {
      targetUser = Object.values(MOCK_USERS).find(u =>
        u.email.toLowerCase() === searchKey ||
        u.id.toLowerCase() === searchKey ||
        u.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, '')
      )
    }

    // 4. Search in team_members
    if (!targetUser && searchKey && mockDb.state.team_members) {
      const teamMatch = mockDb.state.team_members.find((tm: any) =>
        tm.email?.toLowerCase() === searchKey ||
        tm.id?.toLowerCase() === searchKey ||
        (tm.phone && tm.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, ''))
      )
      if (teamMatch) {
        targetUser = {
          id: teamMatch.user_id || teamMatch.id,
          email: teamMatch.email,
          role: teamMatch.role || 'care_coordinator',
          full_name: teamMatch.full_name,
          phone: teamMatch.phone,
          password: teamMatch.password || 'coordinator123',
        }
      }
    }

    // 5. Search in user_profiles
    if (!targetUser && searchKey && mockDb.state.user_profiles) {
      const profMatch = mockDb.state.user_profiles.find((p: any) =>
        p.id?.toLowerCase() === searchKey ||
        p.email?.toLowerCase() === searchKey ||
        (p.phone && p.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, ''))
      )
      if (profMatch) {
        targetUser = {
          id: profMatch.id,
          email: profMatch.email || `${profMatch.role}@drfitveda.com`,
          role: profMatch.role,
          full_name: profMatch.full_name,
          phone: profMatch.phone,
          password: profMatch.password,
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Invalid User ID / Email or account not found.' },
        { status: 401 }
      )
    }

    // Verify password when logging in with credentials
    if (password !== undefined && targetUser.password && password !== targetUser.password) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials and try again.' },
        { status: 401 }
      )
    }

    // Determine target redirect
    let redirectTo = '/customer'
    if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(targetUser.role)) {
      redirectTo = '/admin'
    } else if ([
      'doctor',
      'trainer',
      'nutritionist',
      'yoga_doctor',
      'yoga_consultant',
      'naturopathy_doctor',
      'ayurveda_doctor',
      'physiotherapist',
      'wellness_coach',
      'doctor_lead',
      'trainer_lead',
    ].includes(targetUser.role)) {
      redirectTo = '/professional'
    }

    const sessionPayload = {
      user_id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      full_name: targetUser.full_name,
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sessionPayload,
      redirectTo,
    })

    response.cookies.set('drf_session', JSON.stringify(sessionPayload), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400 * 7, // 7 days
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 })
  }
}
