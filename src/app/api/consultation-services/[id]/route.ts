import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = await params

    const services: any[] = mockDb.state.consultation_services ?? []
    const idx = services.findIndex((s: any) => s.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    services[idx] = { ...services[idx], ...body, id, created_at: services[idx].created_at }
    return NextResponse.json({ consultation_service: services[idx] })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
