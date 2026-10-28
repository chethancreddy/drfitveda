import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params

    const services: any[] = mockDb.state.consultation_services ?? []
    const idx = services.findIndex((s: any) => s.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    services[idx] = { ...services[idx], ...body, id, created_at: services[idx].created_at }
    await savePersistedState('consultation_services')
    return NextResponse.json({ consultation_service: services[idx] })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
