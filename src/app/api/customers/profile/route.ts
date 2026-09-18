import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/customers/profile — Get full health & food profile
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

    if (!customerId) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customerId = cust.id
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const { data: customer } = await (supabase as any)
      .from('customers')
      .select(`
        id,
        user_id,
        membership_status,
        customer_profiles (
          id, date_of_birth, gender, height_cm, weight_kg, bmi,
          occupation, work_schedule, sleep_hours, activity_level,
          exercise_history, stress_level, lifestyle_notes, goals
        ),
        food_profiles (
          id, dietary_preference, meal_timing, typical_meals, snacks,
          preferences, dislikes, eating_out_freq, water_intake_liters,
          restrictions, allergies
        )
      `)
      .eq('id', customerId)
      .single()

    const { data: userProfile } = await (supabase as any)
      .from('user_profiles')
      .select('full_name, phone, avatar_url')
      .eq('id', customer?.user_id ?? user.id)
      .single()

    return NextResponse.json({
      customer,
      userProfile,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// PATCH /api/customers/profile — Update health & food profile
// ============================================================
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      phone,
      date_of_birth,
      gender,
      height_cm,
      weight_kg,
      occupation,
      sleep_hours,
      activity_level,
      stress_level,
      lifestyle_notes,
      goals,
      dietary_preference,
      allergies,
      water_intake_liters,
    } = body

    // 1. Get customer record
    let { data: customer } = await (supabase as any)
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      const { data: newCust, error: custErr } = await (supabase as any)
        .from('customers')
        .insert({ user_id: user.id, membership_status: 'inactive' })
        .select('id')
        .single()
      if (custErr) throw custErr
      customer = newCust
    }

    // 2. Update user_profiles
    if (full_name || phone) {
      await (supabase as any)
        .from('user_profiles')
        .update({
          ...(full_name ? { full_name } : {}),
          ...(phone ? { phone } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    // 3. Upsert customer_profiles
    const profilePayload: any = {
      customer_id: customer.id,
      updated_at: new Date().toISOString(),
    }
    if (date_of_birth !== undefined) profilePayload.date_of_birth = date_of_birth || null
    if (gender !== undefined) profilePayload.gender = gender || null
    if (height_cm !== undefined) profilePayload.height_cm = height_cm ? parseFloat(height_cm) : null
    if (weight_kg !== undefined) profilePayload.weight_kg = weight_kg ? parseFloat(weight_kg) : null
    if (occupation !== undefined) profilePayload.occupation = occupation
    if (sleep_hours !== undefined) profilePayload.sleep_hours = sleep_hours ? parseFloat(sleep_hours) : null
    if (activity_level !== undefined) profilePayload.activity_level = activity_level
    if (stress_level !== undefined) profilePayload.stress_level = stress_level ? parseInt(stress_level) : null
    if (lifestyle_notes !== undefined) profilePayload.lifestyle_notes = lifestyle_notes
    if (goals !== undefined) profilePayload.goals = goals

    const { error: profErr } = await (supabase as any)
      .from('customer_profiles')
      .upsert(profilePayload, { onConflict: 'customer_id' })

    if (profErr) throw profErr

    // 4. Upsert food_profiles
    const foodPayload: any = {
      customer_id: customer.id,
      updated_at: new Date().toISOString(),
    }
    if (dietary_preference !== undefined) foodPayload.dietary_preference = dietary_preference || null
    if (allergies !== undefined) foodPayload.allergies = allergies
    if (water_intake_liters !== undefined) foodPayload.water_intake_liters = water_intake_liters ? parseFloat(water_intake_liters) : null

    const { error: foodErr } = await (supabase as any)
      .from('food_profiles')
      .upsert(foodPayload, { onConflict: 'customer_id' })

    if (foodErr) throw foodErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
