import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role
    const isAdmin = role === 'admin' || role === 'super_admin'

    // Try Supabase first; fall through to mock-db on error
    const { data, error } = await (supabase as any)
      .from('memberships')
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && data?.length) {
      const plans = isAdmin ? data : data.filter((m: any) => m.is_active)
      return NextResponse.json({ memberships: plans })
    }

    // Fallback: in-memory mock-db
    let plans: any[] = mockDb.state.memberships ?? []
    if (!isAdmin) plans = plans.filter((m: any) => m.is_active)
    plans = [...plans].sort((a, b) => a.display_order - b.display_order)
    return NextResponse.json({ memberships: plans })
  } catch {
    const plans = (mockDb.state.memberships ?? []).filter((m: any) => m.is_active)
    return NextResponse.json({ memberships: plans })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!['admin', 'super_admin'].includes(role)) {
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
    return NextResponse.json({ membership: newPlan }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
