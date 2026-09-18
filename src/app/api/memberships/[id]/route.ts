import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!role) {
      const cookie = req.cookies.get('drf_session')?.value
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie))
          role = parsed.role
        } catch {
          try {
            const parsed = JSON.parse(cookie)
            role = parsed.role
          } catch {}
        }
      }
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    // Update in mock-db (historical records are separate payouts — untouched)
    const plans: any[] = mockDb.state.memberships ?? []
    const idx = plans.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Preserve id and created_at to avoid historical tampering
    plans[idx] = { ...plans[idx], ...body, id, created_at: plans[idx].created_at }
    return NextResponse.json({ membership: plans[idx] })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!role) {
      const cookie = req.cookies.get('drf_session')?.value
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie))
          role = parsed.role
        } catch {
          try {
            const parsed = JSON.parse(cookie)
            role = parsed.role
          } catch {}
        }
      }
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const plans: any[] = mockDb.state.memberships ?? []
    const idx = plans.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Soft-delete — preserve historical data
    plans[idx] = { ...plans[idx], is_active: false }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
