// ============================================================
// PATCH /api/finance/payouts/[id] — Approve or mark as paid
// TRD §15: Pending → Approved → Paid
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data: profile } = await (svc as any).from('user_profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json() as { action: 'approve' | 'pay' | 'cancel'; notes?: string }
    if (!['approve', 'pay', 'cancel'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be approve, pay, or cancel' }, { status: 400 })
    }

    const { data: payout } = await (svc as any)
      .from('payouts').select('id, status').eq('id', id).single()
    if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { updated_at: now }

    if (body.action === 'approve') {
      if (payout.status !== 'pending') return NextResponse.json({ error: 'Payout is not pending' }, { status: 409 })
      patch.status = 'approved'
      patch.approved_by = user.id
      patch.approved_at = now
    } else if (body.action === 'pay') {
      if (payout.status !== 'approved') return NextResponse.json({ error: 'Payout must be approved first' }, { status: 409 })
      patch.status = 'paid'
      patch.paid_at = now
    } else if (body.action === 'cancel') {
      if (['paid'].includes(payout.status)) return NextResponse.json({ error: 'Cannot cancel a paid payout' }, { status: 409 })
      patch.status = 'cancelled'
    }
    if (body.notes) patch.notes = body.notes

    const { data: updated, error } = await (svc as any)
      .from('payouts').update(patch).eq('id', id).select().single()
    if (error) throw new Error(error.message)

    await (svc as any).from('audit_logs').insert({
      user_id: user.id,
      action: `payout.${body.action}d`,
      table_name: 'payouts',
      record_id: id,
      new_data: { status: patch.status },
    })

    return NextResponse.json({ payout: updated })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data, error } = await (svc as any)
      .from('payouts')
      .select('*, professionals:professional_id(full_name, role), customers:customer_id(user_profiles(full_name))')
      .eq('id', id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ payout: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
