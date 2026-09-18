// ============================================================
// GET  /api/admin/training-retention-config
// PATCH /api/admin/training-retention-config
// Admin reads / updates retention policy.
// TRD §47.7
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const svc = await createServiceRoleClient()
  const { data: profile } = await (svc as any)
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role)) return null
  return { user, svc }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const auth = await requireAdmin(supabase)
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await (auth.svc as any)
      .from('training_retention_config')
      .select('*')
      .eq('config_key', 'default_retention_policy')
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ config: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const auth = await requireAdmin(supabase)
    if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as { retention_mode?: string; grace_period_hours?: number | null }
    const allowed = ['immediate', 'grace_period']
    if (body.retention_mode && !allowed.includes(body.retention_mode)) {
      return NextResponse.json({ error: 'Invalid retention_mode' }, { status: 400 })
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: auth.user.id }
    if (body.retention_mode   !== undefined) patch.retention_mode    = body.retention_mode
    if (body.grace_period_hours !== undefined) patch.grace_period_hours = body.grace_period_hours

    const { data, error } = await (auth.svc as any)
      .from('training_retention_config')
      .update(patch)
      .eq('config_key', 'default_retention_policy')
      .select()
      .single()
    if (error) throw new Error(error.message)

    await (auth.svc as any).from('audit_logs').insert({
      user_id: auth.user.id,
      action: 'training_retention_config.updated',
      table_name: 'training_retention_config',
      new_data: patch,
    })

    return NextResponse.json({ config: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
