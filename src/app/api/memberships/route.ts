import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'

export async function GET() {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role
    const isAdmin = ['admin', 'super_admin', 'operations_manager'].includes(role)

    let plans: any[] = mockDb.state.memberships ?? []
    if (!isAdmin) plans = plans.filter((m: any) => m.is_active)
    plans = [...plans].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    return NextResponse.json({ memberships: plans })
  } catch {
    const plans = (mockDb.state.memberships ?? []).filter((m: any) => m.is_active)
    return NextResponse.json({ memberships: plans })
  }
}

export async function POST(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    let role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!role) {
      const cookie = req.cookies.get('drf_session')?.value
      if (cookie) {
        try { role = JSON.parse(decodeURIComponent(cookie)).role } catch {}
      }
    }
    if (!['admin', 'super_admin', 'operations_manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const newPlan = {
      id: `mbr-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    }
    if (!mockDb.state.memberships) mockDb.state.memberships = []
    mockDb.state.memberships.push(newPlan)
    await savePersistedState('memberships')
    return NextResponse.json({ membership: newPlan }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
