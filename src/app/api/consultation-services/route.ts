import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role
    const isAdmin = role === 'admin' || role === 'super_admin'

    const { data, error } = await (supabase as any)
      .from('consultation_services')
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && data?.length) {
      const services = isAdmin ? data : data.filter((s: any) => s.is_active)
      return NextResponse.json({ consultation_services: services })
    }

    let services: any[] = mockDb.state.consultation_services ?? []
    if (!isAdmin) services = services.filter((s: any) => s.is_active)
    services = [...services].sort((a, b) => a.display_order - b.display_order)
    return NextResponse.json({ consultation_services: services })
  } catch {
    const services = (mockDb.state.consultation_services ?? []).filter((s: any) => s.is_active)
    return NextResponse.json({ consultation_services: services })
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
    const newService = {
      id: `cs-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    }
    if (!mockDb.state.consultation_services) mockDb.state.consultation_services = []
    mockDb.state.consultation_services.push(newService)
    return NextResponse.json({ consultation_service: newService }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
