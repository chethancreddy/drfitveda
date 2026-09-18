// ============================================================
// GET  /api/reviews — List reviews (doctor: assigned; customer: own; admin: all)
// POST /api/reviews — Create a new weekly review (doctor or admin)
// TRD §20
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data: profile } = await (svc as any)
      .from('user_profiles').select('role').eq('id', user.id).single()
    const role: string = profile?.role ?? ''

    const url  = new URL(req.url)
    const status = url.searchParams.get('status')
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)

    let query = (svc as any)
      .from('weekly_reviews')
      .select('id, review_date, status, adherence_notes, doctor_notes, outcome, completed_at, approved_at, next_review_date, customers:customer_id(id, user_profiles(full_name)), doctors:doctor_id(full_name), plan_versions:plan_version_id(version_number, status)')
      .order('review_date', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    if (role === 'customer') {
      const { data: cust } = await (svc as any).from('customers').select('id').eq('user_id', user.id).single()
      if (!cust) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })
      query = query.eq('customer_id', cust.id)
    } else if (!['admin', 'super_admin'].includes(role)) {
      // Professional — only own reviews
      const { data: prof } = await (svc as any).from('professionals').select('id').eq('user_id', user.id).single()
      if (!prof) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      query = query.eq('doctor_id', prof.id)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return NextResponse.json({ reviews: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = await createServiceRoleClient()
    const { data: profile } = await (svc as any).from('user_profiles').select('role').eq('id', user.id).single()
    const role: string = profile?.role ?? ''

    const allowedRoles = ['doctor', 'naturopathy_doctor', 'admin', 'super_admin']
    if (!allowedRoles.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json() as {
      customer_id: string
      doctor_id?: string
      plan_version_id?: string
      review_date?: string
      next_review_date?: string
    }
    if (!body.customer_id) return NextResponse.json({ error: 'customer_id required' }, { status: 400 })

    let doctorId = body.doctor_id
    if (!doctorId) {
      const { data: prof } = await (svc as any).from('professionals').select('id').eq('user_id', user.id).single()
      if (!prof) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 400 })
      doctorId = prof.id
    }

    const reviewDate = body.review_date ?? new Date().toISOString().split('T')[0]

    const { data, error } = await (svc as any)
      .from('weekly_reviews')
      .insert({
        customer_id: body.customer_id,
        doctor_id: doctorId,
        plan_version_id: body.plan_version_id ?? null,
        review_date: reviewDate,
        next_review_date: body.next_review_date ?? null,
        status: 'due',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ review: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
