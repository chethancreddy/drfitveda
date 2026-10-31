import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { syncSessionRemindersForAppointment } from '@/lib/services/whatsapp-notification.service'

// ============================================================
// GET /api/appointments — List appointments
// ============================================================
export async function GET(request: Request) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerIdParam = searchParams.get('customer_id')
    const professionalIdParam = searchParams.get('professional_id')

    // Find current user's customer or professional record if exists
    const { data: cust } = await (supabase as any)
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { data: prof } = await (supabase as any)
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let query = (supabase as any)
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        duration_min,
        status,
        notes,
        meeting_url,
        consultation_service_id,
        service_name,
        service_price,
        service_currency,
        consultation_type,
        created_at,
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
      .order('scheduled_at', { ascending: true })

    if (customerIdParam) {
      query = query.eq('customer_id', customerIdParam)
    } else if (cust) {
      query = query.eq('customer_id', cust.id)
    }

    if (professionalIdParam) {
      query = query.eq('professional_id', professionalIdParam)
    } else if (prof) {
      query = query.eq('professional_id', prof.id)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointments: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/appointments — Book appointment / consultation
// Body: {
//   customer_id?: string,
//   professional_id?: string,
//   scheduled_at: string,
//   duration_min?: number,
//   notes?: string,
//   meeting_url?: string
// }
// ============================================================
export async function POST(request: Request) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    let {
      customer_id,
      professional_id,
      consultation_service_id,
      consultation_type,
      scheduled_at,
      duration_min = 30,
      notes = '',
      meeting_url = 'https://meeting.zoho.com/join?key=drf-veda-live'
    } = body

    if (!scheduled_at) {
      return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 })
    }

    // Validate & snapshot consultation service if consultation_service_id is provided
    let serviceSnapshot: Record<string, any> = {}
    if (consultation_service_id) {
      const svc = (mockDb.state.consultation_services as any[])?.find(
        (s: any) => s.id === consultation_service_id || s.key === consultation_service_id
      )
      if (!svc) {
        return NextResponse.json({ error: 'Consultation service not found' }, { status: 404 })
      }
      if (svc.is_active === false || svc.is_archived === true) {
        return NextResponse.json(
          { error: 'Selected consultation service is currently inactive and cannot be booked' },
          { status: 400 }
        )
      }
      duration_min = Number(svc.duration_min || duration_min || 30)
      serviceSnapshot = {
        consultation_service_id: svc.id,
        service_key: svc.key,
        service_name: svc.name,
        service_category: svc.category,
        service_price: Number(svc.price),
        service_currency: svc.currency || 'INR',
        consultation_type: svc.consultation_type || consultation_type || 'Online Video (Zoho Meeting)',
      }
      if (!notes && svc.name) {
        notes = `Consultation service: ${svc.name}`
      }
    } else if (consultation_type) {
      serviceSnapshot = {
        consultation_type,
      }
    }

    // Resolve customer_id if not provided
    if (!customer_id) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customer_id = cust.id
    }

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id could not be determined' }, { status: 400 })
    }

    // Verify customer is active and eligible for booking
    const customerRecord = (mockDb.state.customers || []).find((c: any) => c.id === customer_id)
    if (customerRecord) {
      if (customerRecord.is_active === false || customerRecord.is_archived === true) {
        return NextResponse.json(
          { error: 'Customer account is inactive and cannot create new bookings or access membership benefits.' },
          { status: 403 }
        )
      }
      // If booking a membership-included consultation (no paid standalone consultation_service_id), require active membership
      if (!consultation_service_id && customerRecord.membership_status !== 'active') {
        return NextResponse.json(
          { error: 'Active membership is required to book membership-included consultations.' },
          { status: 403 }
        )
      }
    }

    // If professional_id not provided, find active assignment
    if (!professional_id) {
      const { data: assignment } = await (supabase as any)
        .from('professional_assignments')
        .select('professional_id')
        .eq('customer_id', customer_id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (assignment) {
        professional_id = assignment.professional_id
      } else {
        // Fallback: pick any active doctor
        const { data: anyDoctor } = await (supabase as any)
          .from('professionals')
          .select('id')
          .eq('is_available', true)
          .limit(1)
          .single()
        if (anyDoctor) professional_id = anyDoctor.id
      }
    }

    if (!professional_id) {
      return NextResponse.json({ error: 'professional_id is required' }, { status: 400 })
    }

    const { data: appt, error } = await (supabase as any)
      .from('appointments')
      .insert({
        customer_id,
        professional_id,
        scheduled_at,
        duration_min,
        status: 'scheduled',
        notes,
        meeting_url,
        ...serviceSnapshot,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await savePersistedState('appointments')

    // Create notification for customer
    await (supabase as any).from('notifications').insert({
      user_id: user.id,
      title: 'Consultation Scheduled',
      body: `Your consultation is scheduled for ${new Date(scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      type: 'appointment',
      action_url: '/customer/consult'
    })

    // Schedule automated 15-minute WhatsApp session reminder(s)
    const reminderRes = await syncSessionRemindersForAppointment(appt)

    return NextResponse.json({
      success: true,
      appointment: appt,
      scheduledReminders: reminderRes.scheduled,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
