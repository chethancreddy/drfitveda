import { NextResponse } from 'next/server'
import { MOCK_USERS } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'
import { resolveAccountByIdentifier, getDashboardForRole } from '@/lib/auth-resolver'

// ============================================================
// POST /api/auth/demo-login — Login with User ID / Email / Phone and Password
// Body: { role?: string, email?: string, identifier?: string, user_id?: string, password?: string }
// ============================================================
export async function POST(request: Request) {
  try {
    await loadPersistedState()
    const body = await request.json()
    const { role, email, identifier, user_id, password } = body

    const searchKey = String(identifier || email || user_id || '').trim()
    let targetUser: any = null

    if (searchKey) {
      targetUser = resolveAccountByIdentifier(searchKey)
    } else if (role && MOCK_USERS[role]) {
      targetUser = resolveAccountByIdentifier(MOCK_USERS[role].id) || MOCK_USERS[role]
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

    // Determine target redirect based on authoritative role
    const redirectTo = getDashboardForRole(targetUser.role)

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
