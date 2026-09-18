// ============================================================
// GET  /api/finance/compensation-rules — List all rule versions
// POST /api/finance/compensation-rules — Create new rule version
// TRD §9
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const svc = await createServiceRoleClient()
  const { data: profile } = await (svc as any).from('user_profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role)) return null
  return { user, svc }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const auth = await requireAdmin(supabase)
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await (auth.svc as any)
      .from('compensation_rule_versions')
      .select('id, name, effective_from, effective_to, is_active, created_at, payout_rule_components(id, component_code, component_name, role, amount_type, amount, is_active)')
      .order('effective_from', { ascending: false })
    if (error) throw new Error(error.message)

    return NextResponse.json({ rules: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const auth = await requireAdmin(supabase)
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      name: string
      effective_from: string
      effective_to?: string
      is_active?: boolean
      components?: Array<{
        component_code: string; component_name: string; role?: string
        amount_type?: string; amount: number; applicability?: string
      }>
    }

    if (!body.name || !body.effective_from) {
      return NextResponse.json({ error: 'name and effective_from are required' }, { status: 400 })
    }

    const { data: ruleVersion, error: rvErr } = await (auth.svc as any)
      .from('compensation_rule_versions')
      .insert({
        name: body.name,
        effective_from: body.effective_from,
        effective_to: body.effective_to ?? null,
        is_active: body.is_active ?? true,
        created_by: auth.user.id,
      })
      .select()
      .single()
    if (rvErr) throw new Error(rvErr.message)

    let components: unknown[] = []
    if (body.components?.length) {
      const compPayload = body.components.map(c => ({
        rule_version_id: ruleVersion.id,
        component_code: c.component_code,
        component_name: c.component_name,
        role: c.role ?? null,
        amount_type: c.amount_type ?? 'fixed',
        amount: c.amount,
        applicability: c.applicability ?? null,
        is_active: true,
      }))
      const { data: comps, error: cErr } = await (auth.svc as any)
        .from('payout_rule_components').insert(compPayload).select()
      if (cErr) throw new Error(cErr.message)
      components = comps ?? []
    }

    await (auth.svc as any).from('audit_logs').insert({
      user_id: auth.user.id,
      action: 'compensation_rule_version.created',
      table_name: 'compensation_rule_versions',
      record_id: ruleVersion.id,
      new_data: { name: body.name, effective_from: body.effective_from },
    })

    return NextResponse.json({ rule: ruleVersion, components }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
