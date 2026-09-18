// ============================================================
// GET  /api/check-ins      — Customer: last 30 days of check-ins
// POST /api/check-ins      — Customer: upsert today's check-in
// TRD §19 — single compact save, server-side validation
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['yes', 'partial', 'no', 'skip', null]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: customer } = await (supabase as any)
      .from('customers').select('id').eq('user_id', user.id).single()
    if (!customer) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })

    const url = new URL(req.url)
    const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const to   = url.searchParams.get('to')   ?? new Date().toISOString().split('T')[0]

    const { data, error } = await (supabase as any)
      .from('daily_check_ins')
      .select('*')
      .eq('customer_id', customer.id)
      .gte('check_in_date', from)
      .lte('check_in_date', to)
      .order('check_in_date', { ascending: false })
    if (error) throw new Error(error.message)

    return NextResponse.json({ check_ins: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: customer } = await (supabase as any)
      .from('customers').select('id').eq('user_id', user.id).single()
    if (!customer) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })

    const body = await req.json() as {
      date?: string
      workout_status?: string; diet_status?: string; yoga_status?: string
      water_status?: string; other_status?: string
      energy?: number; mood?: number; note?: string
      plan_version_id?: string
    }

    // Validate date
    const checkInDate = body.date ?? new Date().toISOString().split('T')[0]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Validate statuses
    const statusFields = ['workout_status', 'diet_status', 'yoga_status', 'water_status', 'other_status'] as const
    for (const field of statusFields) {
      const val = body[field]
      if (val !== undefined && !VALID_STATUSES.includes(val ?? null)) {
        return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 })
      }
    }

    // Validate energy/mood
    if (body.energy !== undefined && (body.energy < 1 || body.energy > 5)) {
      return NextResponse.json({ error: 'energy must be 1-5' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {
      customer_id: customer.id,
      check_in_date: checkInDate,
      note: body.note ?? null,
      energy_level: body.energy ?? null,
      mood_level: body.mood ?? null,
      plan_version_id: body.plan_version_id ?? null,
    }
    for (const f of statusFields) {
      payload[f] = body[f] ?? null
    }

    const { data, error } = await (supabase as any)
      .from('daily_check_ins')
      .upsert(payload, { onConflict: 'customer_id,check_in_date' })
      .select()
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ check_in: data })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
