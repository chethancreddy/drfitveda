import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

const DEFAULT_BIOMARKERS = [
  { id: 'bm-uric-acid', name: 'Uric Acid Level', code: 'uric_acid', category: 'Metabolic & Renal', unit: 'mg/dL', normal_range: '3.5 - 7.2 mg/dL', min: 3.5, max: 7.2, description: 'Gout, purine breakdown, joint health', is_active: true },
  { id: 'bm-crp', name: 'C-Reactive Protein (CRP)', code: 'crp', category: 'Inflammatory Markers', unit: 'mg/L', normal_range: '< 3.0 mg/L', min: 0, max: 3.0, description: 'Systemic inflammation & cardiovascular risk', is_active: true },
  { id: 'bm-esr', name: 'ESR (Erythrocyte Sedimentation Rate)', code: 'esr', category: 'Inflammatory Markers', unit: 'mm/hr', normal_range: '0 - 20 mm/hr', min: 0, max: 20, description: 'Chronic inflammation and autoimmune tracking', is_active: true },
  { id: 'bm-tsh', name: 'Thyroid Stimulating Hormone (TSH)', code: 'tsh', category: 'Thyroid Profile', unit: 'µIU/mL', normal_range: '0.4 - 4.2 µIU/mL', min: 0.4, max: 4.2, description: 'Pituitary-thyroid axis regulator', is_active: true },
  { id: 'bm-t3', name: 'Total / Free T3 (Triiodothyronine)', code: 't3', category: 'Thyroid Profile', unit: 'ng/dL', normal_range: '0.8 - 2.0 ng/dL', min: 0.8, max: 2.0, description: 'Active metabolic thyroid hormone', is_active: true },
  { id: 'bm-t4', name: 'Total / Free T4 (Thyroxine)', code: 't4', category: 'Thyroid Profile', unit: 'µg/dL', normal_range: '5.1 - 14.1 µg/dL', min: 5.1, max: 14.1, description: 'Circulating thyroid hormone reserve', is_active: true },
  { id: 'bm-anti-tpo', name: 'Anti-TPO Antibodies', code: 'anti_tpo', category: 'Thyroid Profile', unit: 'IU/mL', normal_range: '< 35 IU/mL', min: 0, max: 35, description: 'Autoimmune thyroiditis (Hashimoto) screening', is_active: true },
  { id: 'bm-vit-d3', name: 'Vitamin D3 (25-OH Cholecalciferol)', code: 'vitamin_d3', category: 'Vitamins & Micronutrients', unit: 'ng/mL', normal_range: '30 - 100 ng/mL', min: 30, max: 100, description: 'Immune health, calcium homeostasis, bone density', is_active: true },
  { id: 'bm-vit-b12', name: 'Vitamin B12 (Cobalamin)', code: 'vitamin_b12', category: 'Vitamins & Micronutrients', unit: 'pg/mL', normal_range: '211 - 911 pg/mL', min: 211, max: 911, description: 'Nerve sheath synthesis, RBC creation, energy', is_active: true },
  { id: 'bm-cholesterol', name: 'Total Cholesterol', code: 'total_cholesterol', category: 'Lipid & Cardiac', unit: 'mg/dL', normal_range: '< 200 mg/dL', min: 100, max: 200, description: 'Cardiovascular lipid risk factor', is_active: true },
  { id: 'bm-hdl', name: 'HDL (Protective Good Cholesterol)', code: 'hdl_cholesterol', category: 'Lipid & Cardiac', unit: 'mg/dL', normal_range: '> 40 mg/dL', min: 40, max: 80, description: 'Reverse cholesterol transport scavenger', is_active: true },
  { id: 'bm-ldl', name: 'LDL (Bad Cholesterol)', code: 'ldl_cholesterol', category: 'Lipid & Cardiac', unit: 'mg/dL', normal_range: '< 100 mg/dL', min: 50, max: 100, description: 'Atherogenic particle density', is_active: true },
  { id: 'bm-triglycerides', name: 'Triglycerides', code: 'triglycerides', category: 'Lipid & Cardiac', unit: 'mg/dL', normal_range: '< 150 mg/dL', min: 50, max: 150, description: 'Blood triglycerides level', is_active: true },
  { id: 'bm-hba1c', name: 'HbA1c (Glycated Hemoglobin)', code: 'hba1c_pct', category: 'Metabolic & Glycemic', unit: '%', normal_range: '< 5.7 %', min: 4.0, max: 5.7, description: '90-day average blood glucose level', is_active: true },
  { id: 'bm-fbs', name: 'Fasting Blood Sugar (FBS)', code: 'fasting_blood_sugar', category: 'Metabolic & Glycemic', unit: 'mg/dL', normal_range: '70 - 99 mg/dL', min: 70, max: 99, description: 'Morning basal blood glucose level', is_active: true },
  { id: 'bm-creatinine', name: 'Serum Creatinine', code: 'serum_creatinine', category: 'Metabolic & Renal', unit: 'mg/dL', normal_range: '0.6 - 1.2 mg/dL', min: 0.6, max: 1.2, description: 'Kidney filtration biomarker', is_active: true },
  { id: 'bm-sgpt', name: 'SGPT / ALT', code: 'sgpt_alt', category: 'Liver Function', unit: 'U/L', normal_range: '< 45 U/L', min: 5, max: 45, description: 'Liver cellular integrity', is_active: true },
  { id: 'bm-sgot', name: 'SGOT / AST', code: 'sgot_ast', category: 'Liver Function', unit: 'U/L', normal_range: '< 40 U/L', min: 5, max: 40, description: 'Hepatic & muscle enzyme', is_active: true },
]

export async function GET() {
  try {
    if (!mockDb.state.clinical_biomarkers || mockDb.state.clinical_biomarkers.length === 0) {
      mockDb.state.clinical_biomarkers = DEFAULT_BIOMARKERS
    }
    return NextResponse.json({
      success: true,
      biomarkers: mockDb.state.clinical_biomarkers,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch biomarkers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user as any)?.user_metadata?.role || (user as any)?.role

    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized: CMS management requires Admin access only.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, code, category, unit, normal_range, min, max, description, is_active } = body

    if (!name || !unit) {
      return NextResponse.json({ error: 'Name and Unit are required' }, { status: 400 })
    }

    if (!mockDb.state.clinical_biomarkers) {
      mockDb.state.clinical_biomarkers = DEFAULT_BIOMARKERS
    }

    const generatedCode = code || name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const existingIdx = mockDb.state.clinical_biomarkers.findIndex((b: any) => b.code === generatedCode || (b.id && b.id === body.id))

    if (existingIdx >= 0) {
      mockDb.state.clinical_biomarkers[existingIdx] = {
        ...mockDb.state.clinical_biomarkers[existingIdx],
        name,
        category: category || mockDb.state.clinical_biomarkers[existingIdx].category,
        unit,
        normal_range: normal_range || mockDb.state.clinical_biomarkers[existingIdx].normal_range,
        min: min !== undefined ? Number(min) : mockDb.state.clinical_biomarkers[existingIdx].min,
        max: max !== undefined ? Number(max) : mockDb.state.clinical_biomarkers[existingIdx].max,
        description: description || mockDb.state.clinical_biomarkers[existingIdx].description,
        is_active: is_active !== undefined ? is_active : true,
      }
      return NextResponse.json({
        success: true,
        message: 'Biomarker updated successfully',
        biomarker: mockDb.state.clinical_biomarkers[existingIdx],
      })
    }

    const newBiomarker = {
      id: `bm-${Date.now()}`,
      name,
      code: generatedCode,
      category: category || 'General Lab Biomarkers',
      unit,
      normal_range: normal_range || `${min || 0} - ${max || 100} ${unit}`,
      min: min !== undefined ? Number(min) : 0,
      max: max !== undefined ? Number(max) : 100,
      description: description || 'Custom clinical biomarker parameter',
      is_active: is_active !== undefined ? is_active : true,
      is_custom: true,
    }

    mockDb.state.clinical_biomarkers.push(newBiomarker)

    return NextResponse.json({
      success: true,
      message: 'New clinical biomarker parameter added to CMS and Doctor intake',
      biomarker: newBiomarker,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error saving biomarker' }, { status: 400 })
  }
}
