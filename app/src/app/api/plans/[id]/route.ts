import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/plans/[id] — Get single plan or plan_version with items
// ============================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try fetching as plan_version first
    const { data: version } = await (supabase as any)
      .from('plan_versions')
      .select(`
        id,
        plan_id,
        version_number,
        status,
        change_reason,
        effective_from,
        created_at,
        plans (
          id,
          customer_id,
          customers (
            id,
            user_profiles ( full_name )
          )
        ),
        plan_items (
          id,
          category,
          instruction,
          internal_notes,
          display_order
        )
      `)
      .eq('id', id)
      .single()

    if (version) {
      return NextResponse.json({ version })
    }

    // Otherwise fetch as plan master
    const { data: plan, error } = await (supabase as any)
      .from('plans')
      .select(`
        id,
        customer_id,
        customers (
          id,
          user_profiles ( full_name )
        ),
        plan_versions (
          id,
          version_number,
          status,
          change_reason,
          effective_from,
          created_at,
          plan_items (
            id,
            category,
            instruction,
            internal_notes,
            display_order
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// PATCH /api/plans/[id] — Update status of a plan_version (e.g. publish or archive)
// Body: { status: 'published' | 'archived' | 'draft' }
// ============================================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    if (!['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // If publishing, get the plan_id to archive other versions
    if (status === 'published') {
      const { data: currentVersion } = await (supabase as any)
        .from('plan_versions')
        .select('plan_id')
        .eq('id', id)
        .single()

      if (currentVersion?.plan_id) {
        await (supabase as any)
          .from('plan_versions')
          .update({ status: 'archived' })
          .eq('plan_id', currentVersion.plan_id)
          .eq('status', 'published')
      }
    }

    const { data: updated, error } = await (supabase as any)
      .from('plan_versions')
      .update({ status })
      .eq('id', id)
      .select('id, version_number, status')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, version: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
