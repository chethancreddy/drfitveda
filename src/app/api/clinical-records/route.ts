import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

function getAuthRole(req: NextRequest, user: any) {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try { role = JSON.parse(decodeURIComponent(cookie)).role } catch {
        try { role = JSON.parse(cookie).role } catch {}
      }
    }
  }
  return role
}

// GET /api/clinical-records?customer_id=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer_id')

    if (!mockDb.state.clinical_records) {
      mockDb.state.clinical_records = []
    }

    let records = mockDb.state.clinical_records
    if (customerId) {
      records = records.filter((r: any) => r.customer_id === customerId)
    }

    // Sort latest first
    records = [...records].sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())

    return NextResponse.json({
      success: true,
      clinical_records: records,
      latest_record: records[0] || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch clinical records' }, { status: 500 })
  }
}

// POST /api/clinical-records
// Saves clinical vitals/BMS, blood reports (vitamins, cholesterol, etc.), digestive analysis, and diet chart
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getAuthRole(req, user)

    if (!['doctor', 'admin', 'super_admin', 'trainer', 'nutritionist'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized. Doctor or clinical staff access required.' }, { status: 403 })
    }

    const body = await req.json()
    const {
      customer_id,
      vitals,
      blood_reports,
      digestive_and_lifestyle,
      doctor_clinical_assessment,
      prescribed_diet_chart,
      doctor_notes,
    } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    if (!mockDb.state.clinical_records) {
      mockDb.state.clinical_records = []
    }

    // Compute BMI if vitals provided
    let computedVitals = vitals ? { ...vitals } : {}
    if (computedVitals.height_cm && computedVitals.weight_kg) {
      const hM = Number(computedVitals.height_cm) / 100
      computedVitals.bmi = Number((Number(computedVitals.weight_kg) / (hM * hM)).toFixed(1))
    }

    // Find doctor info
    const profs = mockDb.state.professionals || []
    const doctor = profs.find((p: any) => p.user_id === user?.id || p.role === 'doctor')

    const newRecord = {
      id: `clin-${Date.now()}`,
      customer_id,
      doctor_id: doctor?.id || 'p0000000-0000-0000-0000-000000000001',
      doctor_name: doctor?.full_name || 'Dr. Ananya Verma',
      recorded_at: new Date().toISOString(),
      vitals: computedVitals,
      blood_reports: blood_reports || {},
      digestive_and_lifestyle: digestive_and_lifestyle || {},
      doctor_clinical_assessment: doctor_clinical_assessment || {},
      prescribed_diet_chart: prescribed_diet_chart || {},
      doctor_notes: doctor_notes || '',
    }

    // Upsert or push
    mockDb.state.clinical_records.unshift(newRecord)

    // Sync with customer_profiles in mockDb
    if (!mockDb.state.customer_profiles) mockDb.state.customer_profiles = []
    const cpIdx = mockDb.state.customer_profiles.findIndex((cp: any) => cp.customer_id === customer_id)
    if (cpIdx >= 0) {
      mockDb.state.customer_profiles[cpIdx] = {
        ...mockDb.state.customer_profiles[cpIdx],
        height_cm: computedVitals.height_cm ?? mockDb.state.customer_profiles[cpIdx].height_cm,
        weight_kg: computedVitals.weight_kg ?? mockDb.state.customer_profiles[cpIdx].weight_kg,
        bmi: computedVitals.bmi ?? mockDb.state.customer_profiles[cpIdx].bmi,
        stress_level: digestive_and_lifestyle?.stress_level ?? mockDb.state.customer_profiles[cpIdx].stress_level,
        sleep_hours: digestive_and_lifestyle?.sleep_hours ?? mockDb.state.customer_profiles[cpIdx].sleep_hours,
      }
    }

    // Sync with food_profiles in mockDb
    if (!mockDb.state.food_profiles) mockDb.state.food_profiles = []
    const fpIdx = mockDb.state.food_profiles.findIndex((fp: any) => fp.customer_id === customer_id)
    if (fpIdx >= 0) {
      mockDb.state.food_profiles[fpIdx] = {
        ...mockDb.state.food_profiles[fpIdx],
        dietary_preference: digestive_and_lifestyle?.dietary_preference ?? mockDb.state.food_profiles[fpIdx].dietary_preference,
        water_intake_liters: digestive_and_lifestyle?.water_intake_liters ?? mockDb.state.food_profiles[fpIdx].water_intake_liters,
        allergies: digestive_and_lifestyle?.food_allergies ?? mockDb.state.food_profiles[fpIdx].allergies,
      }
    }

    // Auto-update or create published plan version with the prescribed diet items
    if (prescribed_diet_chart) {
      if (!mockDb.state.plans) mockDb.state.plans = []
      let plan = mockDb.state.plans.find((p: any) => p.customer_id === customer_id)
      if (!plan) {
        plan = {
          id: `plan-${Date.now()}`,
          customer_id,
          created_by: doctor?.id || 'p0000000-0000-0000-0000-000000000001',
          created_at: new Date().toISOString(),
        }
        mockDb.state.plans.push(plan)
      }

      if (!mockDb.state.plan_versions) mockDb.state.plan_versions = []
      const existingVersions = mockDb.state.plan_versions.filter((v: any) => v.plan_id === plan.id)
      const nextVerNum = existingVersions.length + 1

      const newVersion = {
        id: `pv-${Date.now()}`,
        plan_id: plan.id,
        version_number: nextVerNum,
        status: 'published',
        change_reason: `Clinical Naturopathy Intake & Biomarker Assessment (v${nextVerNum})`,
        effective_from: new Date().toISOString().split('T')[0],
        created_by: doctor?.id || 'p0000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
      }
      mockDb.state.plan_versions.unshift(newVersion)

      if (!mockDb.state.plan_items) mockDb.state.plan_items = []
      const itemsToAdd: any[] = []

      if (prescribed_diet_chart.morning_detox_drink) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-1`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🌄 Morning Detox: ${prescribed_diet_chart.morning_detox_drink}`,
          display_order: 1,
        })
      }
      if (prescribed_diet_chart.breakfast) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-2`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🍳 Breakfast: ${prescribed_diet_chart.breakfast}`,
          display_order: 2,
        })
      }
      if (prescribed_diet_chart.mid_morning) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-3`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🍏 Mid-Morning: ${prescribed_diet_chart.mid_morning}`,
          display_order: 3,
        })
      }
      if (prescribed_diet_chart.lunch) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-4`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🥗 Lunch: ${prescribed_diet_chart.lunch}`,
          display_order: 4,
        })
      }
      if (prescribed_diet_chart.evening_snack) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-5`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🫖 Evening Vitality: ${prescribed_diet_chart.evening_snack}`,
          display_order: 5,
        })
      }
      if (prescribed_diet_chart.dinner) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-6`,
          plan_version_id: newVersion.id,
          category: 'nutrition',
          instruction: `🍲 Dinner: ${prescribed_diet_chart.dinner}`,
          display_order: 6,
        })
      }
      if (prescribed_diet_chart.bedtime_routine) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-7`,
          plan_version_id: newVersion.id,
          category: 'sleep',
          instruction: `🌙 Bedtime: ${prescribed_diet_chart.bedtime_routine}`,
          display_order: 7,
        })
      }
      if (prescribed_diet_chart.naturopathy_lifestyle_rules) {
        itemsToAdd.push({
          id: `pi-${Date.now()}-8`,
          plan_version_id: newVersion.id,
          category: 'yoga',
          instruction: `🧘 Naturopathy & Yoga Therapy: ${prescribed_diet_chart.naturopathy_lifestyle_rules}`,
          display_order: 8,
        })
      }

      mockDb.state.plan_items.push(...itemsToAdd)
    }

    return NextResponse.json({
      success: true,
      message: 'Clinical intake and diet prescription saved successfully.',
      clinical_record: newRecord,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save clinical intake' }, { status: 400 })
  }
}
