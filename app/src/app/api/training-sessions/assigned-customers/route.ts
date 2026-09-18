// ============================================================
// GET /api/training-sessions/assigned-customers
// Returns active customers assigned to the authenticated trainer.
// Used by /professional/training/new form.
// ============================================================
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data: prof } = await (svc as any)
      .from('professionals').select('id').eq('user_id', user.id).single()
    if (!prof) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: assignments } = await (svc as any)
      .from('professional_assignments')
      .select('customer_id, customers:customer_id(id, user_profiles(full_name))')
      .eq('professional_id', prof.id)
      .eq('is_active', true)

    const customers = ((assignments as { customer_id: string; customers: { id: string; user_profiles: { full_name: string | null } | null } | null }[] | null) ?? [])
      .map(a => ({
        id: a.customer_id,
        name: a.customers?.user_profiles?.full_name ?? a.customer_id,
      }))
      .filter(c => c.name)

    return NextResponse.json({ customers })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
