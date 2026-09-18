import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/appointments/[id] — Get appointment details
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

    const { data: appointment, error } = await (supabase as any)
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_min,
        status,
        notes,
        meeting_url,
        customers (
          id,
          user_profiles ( full_name, phone )
        ),
        professionals (
          id,
          full_name,
          role,
          specialization
        ),
        consultation_notes (
          id,
          notes,
          recommendations,
          follow_up_date
        )
      `)
      .eq('id', id)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// PATCH /api/appointments/[id] — Update status and save consultation notes
// Body: {
//   status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show',
//   notes?: string,
//   recommendations?: string,
//   follow_up_date?: string
// }
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

    const body = await request.json()
    const { status, notes, recommendations, follow_up_date } = body

    // 1. Update appointment status if provided
    if (status) {
      const { error: apptErr } = await (supabase as any)
        .from('appointments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (apptErr) return NextResponse.json({ error: apptErr.message }, { status: 500 })
    }

    // 2. Upsert consultation notes if provided
    if (notes !== undefined || recommendations !== undefined) {
      const { data: existingNotes } = await (supabase as any)
        .from('consultation_notes')
        .select('id')
        .eq('appointment_id', id)
        .single()

      if (existingNotes) {
        await (supabase as any)
          .from('consultation_notes')
          .update({
            notes: notes ?? '',
            recommendations: recommendations ?? '',
            follow_up_date: follow_up_date || null
          })
          .eq('id', existingNotes.id)
      } else {
        await (supabase as any)
          .from('consultation_notes')
          .insert({
            appointment_id: id,
            notes: notes ?? '',
            recommendations: recommendations ?? '',
            follow_up_date: follow_up_date || null
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
