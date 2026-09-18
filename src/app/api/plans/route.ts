import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/plans — List plans with versions and items
// Query params: ?customer_id=...
// ============================================================
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let customerId = searchParams.get('customer_id')

    // If customer role or no customerId provided, check if user is customer
    if (!customerId) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customerId = cust.id
    }

    let query = (supabase as any)
      .from('plans')
      .select(`
        id,
        customer_id,
        created_at,
        customers:customer_id (
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
      .order('created_at', { ascending: false })

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plans: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/plans — Create plan or new plan version + plan items
// Body: {
//   customer_id: string,
//   plan_id?: string,
//   change_reason?: string,
//   effective_from?: string,
//   status?: 'draft' | 'published',
//   items: Array<{ category: string, instruction: string, internal_notes?: string, display_order?: number }>
// }
// ============================================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customer_id,
      plan_id: existingPlanId,
      change_reason = 'Initial plan formulation',
      effective_from = new Date().toISOString().split('T')[0],
      status = 'published',
      items = []
    } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    // 1. Find or create master plan record
    let planId = existingPlanId
    if (!planId) {
      const { data: existingMaster } = await (supabase as any)
        .from('plans')
        .select('id')
        .eq('customer_id', customer_id)
        .limit(1)
        .single()

      if (existingMaster) {
        planId = existingMaster.id
      } else {
        const { data: newPlan, error: planErr } = await (supabase as any)
          .from('plans')
          .insert({ customer_id, created_by: user.id })
          .select('id')
          .single()

        if (planErr) {
          return NextResponse.json({ error: planErr.message }, { status: 500 })
        }
        planId = newPlan.id
      }
    }

    // 2. Determine next version_number
    const { data: prevVersions } = await (supabase as any)
      .from('plan_versions')
      .select('version_number')
      .eq('plan_id', planId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersionNum = (prevVersions?.[0]?.version_number ?? 0) + 1

    // 3. If publishing, archive previous published versions
    if (status === 'published') {
      await (supabase as any)
        .from('plan_versions')
        .update({ status: 'archived' })
        .eq('plan_id', planId)
        .eq('status', 'published')
    }

    // 4. Insert new version
    const { data: newVersion, error: verErr } = await (supabase as any)
      .from('plan_versions')
      .insert({
        plan_id: planId,
        version_number: nextVersionNum,
        status,
        change_reason,
        effective_from,
        created_by: user.id,
      })
      .select('id, version_number, status')
      .single()

    if (verErr) {
      return NextResponse.json({ error: verErr.message }, { status: 500 })
    }

    // 5. Insert plan_items
    if (items.length > 0) {
      const planItemsToInsert = items.map((it: any, idx: number) => ({
        plan_version_id: newVersion.id,
        category: it.category || 'lifestyle',
        instruction: it.instruction || '',
        internal_notes: it.internal_notes || null,
        display_order: it.display_order ?? idx + 1,
      }))

      const { error: itemsErr } = await (supabase as any)
        .from('plan_items')
        .insert(planItemsToInsert)

      if (itemsErr) {
        return NextResponse.json({ error: itemsErr.message }, { status: 500 })
      }
    }

    // 6. Log audit entry
    await (supabase as any).from('audit_logs').insert({
      user_id: user.id,
      action: 'PLAN_VERSION_CREATED',
      table_name: 'plan_versions',
      record_id: newVersion.id,
      new_data: { plan_id: planId, version: nextVersionNum, status, item_count: items.length }
    })

    return NextResponse.json({
      success: true,
      plan_id: planId,
      version: newVersion,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
