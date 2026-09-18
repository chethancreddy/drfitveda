import { NextResponse } from 'next/server'
import { MOCK_USERS, mockDb } from '@/lib/mock-db'

// ============================================================
// POST /api/auth/demo-login — Login with User ID / Email / Phone and Password
// Body: { role?: string, email?: string, identifier?: string, user_id?: string, password?: string }
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, email, identifier, user_id, password } = body

    const searchKey = (identifier || email || user_id || '').toLowerCase().trim()
    let targetUser: any = null

    // 1. Direct role selection
    if (role && MOCK_USERS[role]) {
      targetUser = MOCK_USERS[role]
    }

    // 2. Search in MOCK_USERS
    if (!targetUser && searchKey) {
      targetUser = Object.values(MOCK_USERS).find(u =>
        u.email.toLowerCase() === searchKey ||
        u.id.toLowerCase() === searchKey ||
        u.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, '')
      )
    }

    // 3. Search in team_members
    if (!targetUser && searchKey && mockDb.state.team_members) {
      const teamMatch = mockDb.state.team_members.find((tm: any) =>
        tm.email.toLowerCase() === searchKey ||
        tm.id.toLowerCase() === searchKey ||
        tm.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, '')
      )
      if (teamMatch) {
        targetUser = {
          id: teamMatch.user_id || teamMatch.id,
          email: teamMatch.email,
          role: teamMatch.role || 'care_coordinator',
          full_name: teamMatch.full_name,
          phone: teamMatch.phone,
        }
      }
    }

    // 4. Search in user_profiles
    if (!targetUser && searchKey && mockDb.state.user_profiles) {
      const profMatch = mockDb.state.user_profiles.find((p: any) =>
        p.id.toLowerCase() === searchKey ||
        (p.phone && p.phone.replace(/\s+/g, '') === searchKey.replace(/\s+/g, ''))
      )
      if (profMatch) {
        targetUser = {
          id: profMatch.id,
          email: `${profMatch.role}@drfitveda.com`,
          role: profMatch.role,
          full_name: profMatch.full_name,
          phone: profMatch.phone,
        }
      }
    }

    // 5. Fallback if not found
    if (!targetUser) {
      if (searchKey.includes('admin')) targetUser = MOCK_USERS.admin
      else if (searchKey.includes('doc')) targetUser = MOCK_USERS.doctor
      else if (searchKey.includes('train')) targetUser = MOCK_USERS.trainer
      else targetUser = MOCK_USERS.customer
    }

    // Determine target redirect
    let redirectTo = '/customer'
    if (['admin', 'super_admin', 'operations_manager', 'care_coordinator', 'staff'].includes(targetUser.role)) {
      redirectTo = '/admin'
    } else if (['doctor', 'trainer', 'nutritionist', 'yoga_doctor', 'doctor_lead', 'trainer_lead'].includes(targetUser.role)) {
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
