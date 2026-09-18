// ============================================================
// PATCH /api/reviews/[id] — Complete or approve a weekly review
// TRD §20 — completing creates service_event + payout (₹199)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { FinancialAllocationService } from '@/lib/services/financial.service'

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
    const role: string = profile?.role ?? ''

    const doctorRoles = ['doctor', 'naturopathy_doctor']
    const adminRoles  = ['admin', 'super_admin']
    const isDoctor = doctorRoles.includes(role)
    const isAdmin  = adminRoles.includes(role)
    if (!isDoctor && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch the review
    const { data: review, error: rErr } = await (svc as any)
      .from('weekly_reviews')
      .select('id, status, doctor_id, customer_id, plan_version_id')
      .eq('id', id)
      .single()
    if (rErr || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    // Doctor can only update their own reviews
    if (isDoctor && !isAdmin) {
      const { data: prof } = await (svc as any).from('professionals').select('id').eq('user_id', user.id).single()
      if (!prof || review.doctor_id !== prof.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json() as {
      action: 'complete' | 'approve'
      adherence_notes?: string
      doctor_notes?: string
      outcome?: string
      new_plan_version_id?: string
      next_review_date?: string
    }

    if (!['complete', 'approve'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be complete or approve' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { updated_at: now }

    if (body.action === 'complete') {
      if (review.status !== 'due' && review.status !== 'in_progress') {
        return NextResponse.json({ error: 'Review is not in a completable state' }, { status: 409 })
      }
      patch.status = 'completed'
      patch.completed_at = now
      if (body.adherence_notes !== undefined) patch.adherence_notes = body.adherence_notes
      if (body.doctor_notes    !== undefined) patch.doctor_notes    = body.doctor_notes
      if (body.outcome         !== undefined) patch.outcome         = body.outcome
      if (body.new_plan_version_id !== undefined) patch.new_plan_version_id = body.new_plan_version_id
      if (body.next_review_date    !== undefined) patch.next_review_date    = body.next_review_date
    } else {
      if (review.status !== 'completed') {
        return NextResponse.json({ error: 'Review must be completed before approval' }, { status: 409 })
      }
      patch.status = 'approved'
      patch.approved_at = now
      patch.approved_by = user.id
    }

    const { data: updated, error: uErr } = await (svc as any)
      .from('weekly_reviews').update(patch).eq('id', id).select().single()
    if (uErr) throw new Error(uErr.message)

    // On approval: create service_event + payout (₹199)
    if (body.action === 'approve') {
      try {
        const ruleVersion = await FinancialAllocationService.getActiveRuleVersion()

        // Create service event
        const { data: evt } = await (svc as any).from('service_events').insert({
          event_type: 'weekly_doctor_review_completed',
          customer_id: review.customer_id,
          professional_id: review.doctor_id,
          rule_version_id: ruleVersion.id,
          notes: `Weekly review ${id} approved`,
        }).select().single()

        // Get weekly review payout component
        const components = await FinancialAllocationService.getPayoutComponents(ruleVersion.id)
        const weeklyComp = components.find(c => c.component_code === 'weekly_review')
        if (weeklyComp && evt) {
          await (svc as any).from('payouts').insert({
            professional_id: review.doctor_id,
            customer_id: review.customer_id,
            service_event_id: evt.id,
            payout_type: weeklyComp.component_code,
            amount: weeklyComp.amount,
            currency: 'INR',
            rule_version_id: ruleVersion.id,
            service_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            notes: `Auto-created from weekly review ${id}`,
          })
        }
      } catch (finErr) {
        // Financial errors are non-fatal — log but don't fail the review approval
        console.error('Finance error on review approval:', finErr)
      }

      // Audit log
      await (svc as any).from('audit_logs').insert({
        user_id: user.id,
        action: 'weekly_review.approved',
        table_name: 'weekly_reviews',
        record_id: id,
        new_data: { status: 'approved' },
      })
    }

    return NextResponse.json({ review: updated })
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
      .from('weekly_reviews')
      .select('*, customers:customer_id(id, user_profiles(full_name)), doctors:doctor_id(id, full_name), plan_versions:plan_version_id(version_number, plan_items(category, instruction, display_order))')
      .eq('id', id)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ review: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
