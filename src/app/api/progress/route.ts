// ============================================================
// POST /api/progress — Customer or professional logs progress record
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      customer_id?: string
      recorded_date?: string
      weight_kg?: number
      height_cm?: number
      notes?: string
      measurements?: Record<string, unknown>
    }

    // If customer_id not given, resolve from auth
    let customerId = body.customer_id
    if (!customerId) {
      const { data: cust } = await (supabase as any)
        .from('customers').select('id').eq('user_id', user.id).single()
      if (!cust) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })
      customerId = cust.id
    }

    const recordedDate = body.recorded_date ?? new Date().toISOString().split('T')[0]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from('progress_records')
      .insert({
        customer_id: customerId,
        recorded_by: user.id,
        recorded_date: recordedDate,
        weight_kg: body.weight_kg ?? null,
        height_cm: body.height_cm ?? null,
        notes: body.notes ?? null,
        measurements: body.measurements ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ record: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: customer } = await (supabase as any)
      .from('customers').select('id').eq('user_id', user.id).single()
    if (!customer) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 100)

    const { data, error } = await (supabase as any)
      .from('progress_records')
      .select('*')
      .eq('customer_id', customer.id)
      .order('recorded_date', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)

    return NextResponse.json({ records: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
