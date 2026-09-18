'use client'

import { useState, useEffect } from 'react'

interface Props {
  customerId: string
  customerName: string
  existingRecord?: any
  onSaved?: (status: 'draft' | 'published') => void
}

interface CustomBiomarker {
  name: string
  value: number | string
  unit: string
  normal_range: string
  notes?: string
}

export default function ClinicalIntakeEditor({
  customerId,
  customerName,
  existingRecord,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<'bms' | 'blood' | 'digestive' | 'diagnosis' | 'diet'>('bms')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'draft' | 'published'>(existingRecord?.status || 'published')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // CMS Biomarkers list loaded from backend
  const [cmsBiomarkers, setCmsBiomarkers] = useState<any[]>([])

  // Form State - Vitals & BMS
  const [vitals, setVitals] = useState({
    height_cm: existingRecord?.vitals?.height_cm || 165,
    weight_kg: existingRecord?.vitals?.weight_kg || 62.5,
    bmi: existingRecord?.vitals?.bmi || 23.0,
    body_fat_pct: existingRecord?.vitals?.body_fat_pct || 24,
    muscle_mass_kg: existingRecord?.vitals?.muscle_mass_kg || 43,
    visceral_fat_level: existingRecord?.vitals?.visceral_fat_level || 4,
    bmr_kcal: existingRecord?.vitals?.bmr_kcal || 1380,
    blood_pressure_sys: existingRecord?.vitals?.blood_pressure_sys || 118,
    blood_pressure_dia: existingRecord?.vitals?.blood_pressure_dia || 76,
    resting_pulse_bpm: existingRecord?.vitals?.resting_pulse_bpm || 72,
    spo2_pct: existingRecord?.vitals?.spo2_pct || 99,
  })

  // Blood Biomarkers (including Uric Acid, CRP, ESR, Thyroid)
  const [blood, setBlood] = useState({
    // Uric Acid & Renal
    uric_acid: existingRecord?.blood_reports?.uric_acid ?? 4.8,
    serum_creatinine: existingRecord?.blood_reports?.serum_creatinine ?? 0.85,

    // Inflammatory Markers (CRP & ESR)
    crp: existingRecord?.blood_reports?.crp ?? 1.8,
    esr: existingRecord?.blood_reports?.esr ?? 12,

    // Thyroid Profile (TSH, T3, T4, Anti-TPO)
    tsh: existingRecord?.blood_reports?.tsh ?? 2.4,
    t3: existingRecord?.blood_reports?.t3 ?? 1.2,
    t4: existingRecord?.blood_reports?.t4 ?? 8.1,
    anti_tpo: existingRecord?.blood_reports?.anti_tpo ?? 14,

    // Vitamins & Micronutrients
    vitamin_d3: existingRecord?.blood_reports?.vitamin_d3 ?? 21.4,
    vitamin_b12: existingRecord?.blood_reports?.vitamin_b12 ?? 240,
    hemoglobin: existingRecord?.blood_reports?.hemoglobin ?? 12.8,
    ferritin_iron: existingRecord?.blood_reports?.ferritin_iron ?? 34,

    // Lipid / Cholesterol Profile
    total_cholesterol: existingRecord?.blood_reports?.total_cholesterol ?? 192,
    hdl_cholesterol: existingRecord?.blood_reports?.hdl_cholesterol ?? 54,
    ldl_cholesterol: existingRecord?.blood_reports?.ldl_cholesterol ?? 114,
    triglycerides: existingRecord?.blood_reports?.triglycerides ?? 120,
    vldl_cholesterol: existingRecord?.blood_reports?.vldl_cholesterol ?? 24,

    // Glycemic & Diabetes
    fasting_blood_sugar: existingRecord?.blood_reports?.fasting_blood_sugar ?? 92,
    postprandial_blood_sugar: existingRecord?.blood_reports?.postprandial_blood_sugar ?? 124,
    hba1c_pct: existingRecord?.blood_reports?.hba1c_pct ?? 5.4,

    // Liver Function
    sgpt_alt: existingRecord?.blood_reports?.sgpt_alt ?? 22,
    sgot_ast: existingRecord?.blood_reports?.sgot_ast ?? 20,
  })

  // Dynamic / Custom Biomarkers
  const [customBiomarkers, setCustomBiomarkers] = useState<CustomBiomarker[]>(
    existingRecord?.custom_biomarkers || []
  )

  const [newBiomarkerName, setNewBiomarkerName] = useState('')
  const [newBiomarkerVal, setNewBiomarkerVal] = useState('')
  const [newBiomarkerUnit, setNewBiomarkerUnit] = useState('')
  const [newBiomarkerRange, setNewBiomarkerRange] = useState('')

  // Digestive & Lifestyle
  const [digestive, setDigestive] = useState({
    appetite_level: existingRecord?.digestive_and_lifestyle?.appetite_level || 'moderate',
    bowel_movement: existingRecord?.digestive_and_lifestyle?.bowel_movement || 'regular',
    water_intake_liters: existingRecord?.digestive_and_lifestyle?.water_intake_liters || 2.5,
    food_allergies: existingRecord?.digestive_and_lifestyle?.food_allergies || 'None reported',
    dietary_preference: existingRecord?.digestive_and_lifestyle?.dietary_preference || 'vegetarian',
    sleep_hours: existingRecord?.digestive_and_lifestyle?.sleep_hours || 7.5,
    sleep_quality: existingRecord?.digestive_and_lifestyle?.sleep_quality || 'good',
    stress_triggers: existingRecord?.digestive_and_lifestyle?.stress_triggers || 'Work screen time',
  })

  // Doctor Clinical Assessment
  const [assessment, setAssessment] = useState({
    diagnostic_summary: existingRecord?.doctor_clinical_assessment?.diagnostic_summary || 'Mild Vitamin D3 & B12 insufficiency. Healthy Uric Acid, Thyroid (TSH 2.4) and normal inflammatory markers.',
    metabolic_health_grade: existingRecord?.doctor_clinical_assessment?.metabolic_health_grade || 'Grade A- (Good Metabolic Reserve)',
    deficiency_alerts: existingRecord?.doctor_clinical_assessment?.deficiency_alerts || 'Low Vitamin D3 (21.4 ng/mL), Borderline B12 (240 pg/mL)',
    naturopathic_root_cause: existingRecord?.doctor_clinical_assessment?.naturopathic_root_cause || 'Sedentary indoor work hours; sluggish evening digestion.',
  })

  // Prescribed Diet Chart
  const [dietChart, setDietChart] = useState({
    morning_detox_drink: existingRecord?.prescribed_diet_chart?.morning_detox_drink || '1 glass warm water with lemon, grated ginger, and a pinch of cinnamon powder (7:00 AM)',
    breakfast: existingRecord?.prescribed_diet_chart?.breakfast || 'Sprouted moong & methi bowl with grated coconut and pomegranate + 1 cup vegetable daliya (8:30 AM)',
    mid_morning: existingRecord?.prescribed_diet_chart?.mid_morning || 'Fresh tender coconut water with 5 soaked almonds and 2 walnuts (11:00 AM)',
    lunch: existingRecord?.prescribed_diet_chart?.lunch || '2 Jowar rotis + 1 bowl seasonal vegetable curry + 1 cup sprouted dal + cucumber carrot salad (1:30 PM)',
    evening_snack: existingRecord?.prescribed_diet_chart?.evening_snack || 'Herbal Tulsi-Ginger Kadha + roasted Makhana (5:00 PM)',
    dinner: existingRecord?.prescribed_diet_chart?.dinner || 'Light bottle gourd soup + vegetable brown rice khichdi with ghee (7:30 PM)',
    bedtime_routine: existingRecord?.prescribed_diet_chart?.bedtime_routine || 'Warm turmeric cinnamon almond milk or chamomile infusion with 1/2 tsp triphala (9:45 PM)',
    food_guidelines_to_avoid: existingRecord?.prescribed_diet_chart?.food_guidelines_to_avoid || 'Refined flour (Maida), white sugar, deep fried snacks, cold carbonated drinks, high-purine late dinners',
    naturopathy_lifestyle_rules: existingRecord?.prescribed_diet_chart?.naturopathy_lifestyle_rules || '20 mins morning sun bath (7:30-8:30 AM); chew every bite 32 times; 10 mins Vajrasana after meals',
  })

  const [doctorNotes, setDoctorNotes] = useState(existingRecord?.doctor_notes || 'Patient motivated. Re-evaluate biomarkers in 14 days.')

  // Fetch CMS configured biomarkers
  useEffect(() => {
    fetch('/api/cms/biomarkers')
      .then(res => res.json())
      .then(data => {
        if (data.biomarkers) setCmsBiomarkers(data.biomarkers)
      })
      .catch(() => {})
  }, [])

  // Auto-calculate BMI
  useEffect(() => {
    if (vitals.height_cm > 0 && vitals.weight_kg > 0) {
      const hM = Number(vitals.height_cm) / 100
      const calculatedBmi = Number((Number(vitals.weight_kg) / (hM * hM)).toFixed(1))
      setVitals(v => ({ ...v, bmi: calculatedBmi }))
    }
  }, [vitals.height_cm, vitals.weight_kg])

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'vitamin_gut') {
      setBlood(b => ({
        ...b,
        vitamin_d3: 18.5,
        vitamin_b12: 190,
        uric_acid: 4.6,
        crp: 1.5,
        esr: 10,
        tsh: 2.2,
        total_cholesterol: 185,
        hdl_cholesterol: 52,
        ldl_cholesterol: 105,
        triglycerides: 110
      }))
      setAssessment({
        diagnostic_summary: 'Significant Vitamin D3 & B12 deficiency with mild gut dysbiosis. Prescribed micronutrient-dense naturopathic diet, morning sun protocol, and probiotic fermentation.',
        metabolic_health_grade: 'Grade B (Micronutrient Attention Needed)',
        deficiency_alerts: 'Critical: Vitamin D3 < 20 ng/mL, Vitamin B12 < 200 pg/mL',
        naturopathic_root_cause: 'Indoor desk work, insufficient morning solar exposure, low dietary fermentation.',
      })
      setDietChart({
        morning_detox_drink: 'Warm water with freshly squeezed lemon, grated ginger, and crushed mint (7:00 AM)',
        breakfast: 'Fermented ragi idli with coconut-coriander chutney + bowl of soaked sprouted pulses (8:30 AM)',
        mid_morning: 'Fresh cold-pressed amla-ash gourd juice + soaked black raisins and chia seeds (11:00 AM)',
        lunch: '2 Multi-millet rotis (Bajra/Jowar) + bowl of moringa drumstick curry + fermented buttermilk (Chaach) with roasted cumin (1:30 PM)',
        evening_snack: 'Warm Tulsi-Mulethi herbal decoction + roasted pumpkin and sunflower seeds (5:00 PM)',
        dinner: 'Moong dal vegetable broth with steamed pumpkin and spinach + light cumin rice (7:30 PM)',
        bedtime_routine: 'Warm almond milk with pure wild turmeric (Curcumin) and nutmeg (9:45 PM)',
        food_guidelines_to_avoid: 'White refined sugar, processed dairy, fried snacks, refrigerated foods, late dinner.',
        naturopathy_lifestyle_rules: '25 mins morning sun exposure on bare skin (7:30-8:15 AM); 10 mins Nadi Shodhana Pranayama; oil pulling with cold-pressed sesame oil.',
      })
    } else if (presetName === 'uric_thyroid') {
      setBlood(b => ({
        ...b,
        uric_acid: 7.8,
        tsh: 5.6,
        t3: 0.9,
        t4: 6.2,
        crp: 3.8,
        esr: 24,
        fasting_blood_sugar: 104,
        hba1c_pct: 5.8
      }))
      setAssessment({
        diagnostic_summary: 'Elevated Uric Acid (7.8 mg/dL) and mild subclinical Hypothyroidism (TSH 5.6 uIU/mL) with elevated inflammatory markers (CRP 3.8, ESR 24). Prescribed alkaline, low-purine naturopathy protocol.',
        metabolic_health_grade: 'Grade C+ (Metabolic & Thyroid Support Required)',
        deficiency_alerts: 'High Uric Acid (> 7.2 mg/dL), High TSH (> 4.2 uIU/mL), Mild systemic inflammation.',
        naturopathic_root_cause: 'Sluggish purine excretion, sluggish thyroid thermogenesis, high late-night protein load.',
      })
      setDietChart({
        morning_detox_drink: 'Alkaline Ash Gourd (Petha) juice with 1 tsp coriander seed powder (7:00 AM)',
        breakfast: 'Warm cooked steel-cut oats with soaked walnuts, flaxseeds, and steamed apples (8:30 AM)',
        mid_morning: 'Fresh coconut water with 1 tbsp soaked sabja (basil) seeds (11:00 AM)',
        lunch: '2 Barley (Jau) rotis + large bowl raw cucumber-radish-lauki salad + yellow moong dal + steamed zucchini (1:30 PM)',
        evening_snack: 'Warm Ginger-Coriander infusion + roasted puffed rice (5:00 PM)',
        dinner: 'Light clear vegetable soup + baked sweet potato with steamed greens (7:00 PM)',
        bedtime_routine: 'Warm water with 1 tsp organic Triphala powder (9:30 PM)',
        food_guidelines_to_avoid: 'High purine foods (red lentils, spinach, tomatoes, mushrooms, red meat), refined bakery items, tea/coffee after 4 PM.',
        naturopathy_lifestyle_rules: 'Drink 3.5L structured water daily; 20 mins Sarvangasana & Ujjayi Pranayama; warm Epsom foot soak before sleep.',
      })
    }
    setSuccessMsg(`Preset applied! Review parameters and select "Save as Draft" or "Publish".`)
  }

  // Add dynamic custom biomarker
  const handleAddCustomBiomarker = () => {
    if (!newBiomarkerName || !newBiomarkerUnit) {
      alert('Please enter Parameter Name and Unit')
      return
    }
    setCustomBiomarkers([
      ...customBiomarkers,
      {
        name: newBiomarkerName.trim(),
        value: newBiomarkerVal ? Number(newBiomarkerVal) : '',
        unit: newBiomarkerUnit.trim(),
        normal_range: newBiomarkerRange.trim() || 'Custom Range',
      },
    ])
    setNewBiomarkerName('')
    setNewBiomarkerVal('')
    setNewBiomarkerUnit('')
    setNewBiomarkerRange('')
  }

  const handleRemoveCustomBiomarker = (index: number) => {
    setCustomBiomarkers(customBiomarkers.filter((_, i) => i !== index))
  }

  // Save Handler: Supports both 'draft' and 'published'
  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          status: targetStatus,
          vitals,
          blood_reports: blood,
          custom_biomarkers: customBiomarkers,
          digestive_and_lifestyle: digestive,
          doctor_clinical_assessment: assessment,
          prescribed_diet_chart: dietChart,
          doctor_notes: doctorNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save clinical intake')

      setStatus(targetStatus)
      if (targetStatus === 'draft') {
        setSuccessMsg('📝 Saved as Draft! Progress saved securely. It will NOT be pushed to the patient or trainer until you click "Publish".')
      } else {
        setSuccessMsg('🚀 Published successfully! Your Naturopathic diet prescription is now live on the Patient & Trainer dashboards.')
      }

      if (onSaved) onSaved(targetStatus)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving clinical record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-md)', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      {/* Header & Status Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🩺</span>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>Clinical Intake &amp; Biomarkers Suite</h2>
            <span
              className={`badge badge-${status === 'published' ? 'success' : 'warning'}`}
              style={{ fontSize: 12, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              {status === 'published' ? '🟢 Published (Live)' : '🟡 Draft (Private)'}
            </span>
          </div>
          <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
            Doctor Clinical Assessment, Uric Acid, CRP/ESR, Thyroid, Blood Labs, BMS Vitals, and Naturopathic Diet Formulation for <strong>{customerName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="text-caption text-muted" style={{ fontWeight: 600 }}>Presets:</span>
          <button type="button" onClick={() => applyPreset('vitamin_gut')} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)', fontSize: 12 }}>
            🌿 Vitamin D/B12 &amp; Gut
          </button>
          <button type="button" onClick={() => applyPreset('uric_thyroid')} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)', fontSize: 12 }}>
            🦋 Uric Acid &amp; Thyroid
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--color-border)', marginBottom: 'var(--space-md)', overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { id: 'bms', label: '1. BMS & Vitals', icon: '📊' },
          { id: 'blood', label: '2. Blood Reports & Lab Biomarkers', icon: '🩸' },
          { id: 'digestive', label: '3. Digestive & Lifestyle', icon: '🌿' },
          { id: 'diagnosis', label: '4. Doctor Analysis', icon: '🩺' },
          { id: 'diet', label: '5. Diet Chart Prescription', icon: '🥗' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === t.id ? '3px solid #0d9488' : '3px solid transparent',
              color: activeTab === t.id ? '#0d9488' : '#64748b',
              fontWeight: activeTab === t.id ? 700 : 500,
              cursor: 'pointer',
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 8, marginBottom: 'var(--space-md)', fontSize: 14, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 8, marginBottom: 'var(--space-md)', fontSize: 14, fontWeight: 500 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* FORM BODY */}
      <div>
        {/* TAB 1: BMS & VITALS */}
        {activeTab === 'bms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                📏 Body Composition &amp; Anthropometry (BMS)
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Height (cm) *</label>
                  <input
                    type="number"
                    value={vitals.height_cm}
                    onChange={e => setVitals({ ...vitals, height_cm: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                    required
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Current Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.weight_kg}
                    onChange={e => setVitals({ ...vitals, weight_kg: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                    required
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Calculated BMI (kg/m²)</label>
                  <div style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 700, color: '#0f172a' }}>
                    {vitals.bmi} <span className="text-caption text-muted">({vitals.bmi < 18.5 ? 'Underweight' : vitals.bmi < 25 ? 'Normal / Healthy' : vitals.bmi < 30 ? 'Overweight' : 'Obese'})</span>
                  </div>
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.body_fat_pct}
                    onChange={e => setVitals({ ...vitals, body_fat_pct: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Skeletal Muscle Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.muscle_mass_kg}
                    onChange={e => setVitals({ ...vitals, muscle_mass_kg: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Visceral Fat Level (1-12)</label>
                  <input
                    type="number"
                    value={vitals.visceral_fat_level}
                    onChange={e => setVitals({ ...vitals, visceral_fat_level: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                ❤️ Clinical Hemodynamics &amp; Vitals
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Blood Pressure - Systolic (mmHg)</label>
                  <input
                    type="number"
                    value={vitals.blood_pressure_sys}
                    onChange={e => setVitals({ ...vitals, blood_pressure_sys: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Blood Pressure - Diastolic (mmHg)</label>
                  <input
                    type="number"
                    value={vitals.blood_pressure_dia}
                    onChange={e => setVitals({ ...vitals, blood_pressure_dia: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Resting Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={vitals.resting_pulse_bpm}
                    onChange={e => setVitals({ ...vitals, resting_pulse_bpm: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Basal Metabolic Rate (BMR kcal/day)</label>
                  <input
                    type="number"
                    value={vitals.bmr_kcal}
                    onChange={e => setVitals({ ...vitals, bmr_kcal: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>SpO2 Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    value={vitals.spo2_pct}
                    onChange={e => setVitals({ ...vitals, spo2_pct: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BLOOD REPORTS & BIOMARKERS */}
        {activeTab === 'blood' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* 1. URIC ACID & RENAL PANEL */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
                  🧪 Uric Acid &amp; Renal Biomarkers
                </h3>
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>Purine Metabolism</span>
              </div>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Uric Acid Level (mg/dL) *</label>
                    <span className={`badge badge-${blood.uric_acid > 7.2 ? 'error' : blood.uric_acid < 3.5 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.uric_acid > 7.2 ? 'High (>7.2)' : blood.uric_acid < 3.5 ? 'Low (<3.5)' : 'Optimal'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.uric_acid}
                    onChange={e => setBlood({ ...blood, uric_acid: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #0d9488', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal Reference: 3.5 - 7.2 mg/dL</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Serum Creatinine (mg/dL)</label>
                    <span className={`badge badge-${blood.serum_creatinine > 1.2 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.serum_creatinine > 1.2 ? 'Elevated' : 'Normal'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={blood.serum_creatinine}
                    onChange={e => setBlood({ ...blood, serum_creatinine: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal Reference: 0.60 - 1.20 mg/dL</div>
                </div>
              </div>
            </div>

            {/* 2. CRP & ESR INFLAMMATORY PANEL */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
                  🔥 Inflammatory Markers (CRP / ESR)
                </h3>
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>Systemic Inflammation</span>
              </div>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>C-Reactive Protein - CRP (mg/L) *</label>
                    <span className={`badge badge-${blood.crp > 3.0 ? 'error' : blood.crp > 1.0 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.crp > 3.0 ? 'High (>3.0)' : blood.crp > 1.0 ? 'Moderate' : 'Low / Ideal'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.crp}
                    onChange={e => setBlood({ ...blood, crp: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #0d9488', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Low Risk: &lt; 1.0 | Elevated: &gt; 3.0 mg/L</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>ESR (Sedimentation Rate) (mm/hr) *</label>
                    <span className={`badge badge-${blood.esr > 20 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.esr > 20 ? 'Elevated' : 'Normal'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={blood.esr}
                    onChange={e => setBlood({ ...blood, esr: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #0d9488', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal Reference: 0 - 20 mm/hr</div>
                </div>
              </div>
            </div>

            {/* 3. THYROID PROFILE PANEL */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
                  🦋 Complete Thyroid Profile (TSH / T3 / T4 / Anti-TPO)
                </h3>
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>Endocrine Function</span>
              </div>
              <div className="grid-4" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>TSH (µIU/mL) *</label>
                    <span className={`badge badge-${blood.tsh > 4.2 ? 'warning' : blood.tsh < 0.4 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.tsh > 4.2 ? 'Hypo (>4.2)' : blood.tsh < 0.4 ? 'Hyper (<0.4)' : 'Euthyroid'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={blood.tsh}
                    onChange={e => setBlood({ ...blood, tsh: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #0d9488', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 0.40 - 4.20 µIU/mL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Total / Free T3 (ng/dL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={blood.t3}
                    onChange={e => setBlood({ ...blood, t3: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 0.80 - 2.00 ng/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Total / Free T4 (µg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.t4}
                    onChange={e => setBlood({ ...blood, t4: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 5.1 - 14.1 µg/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Anti-TPO Antibodies (IU/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.anti_tpo}
                    onChange={e => setBlood({ ...blood, anti_tpo: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: &lt; 35 IU/mL</div>
                </div>
              </div>
            </div>

            {/* 4. VITAMINS & MICRONUTRIENTS */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                💊 Vitamin &amp; Micronutrient Profile
              </h3>
              <div className="grid-4" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Vitamin D3 (ng/mL)</label>
                    <span className={`badge badge-${blood.vitamin_d3 < 20 ? 'error' : blood.vitamin_d3 < 30 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.vitamin_d3 < 20 ? 'Deficient' : blood.vitamin_d3 < 30 ? 'Insufficient' : 'Sufficient'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.vitamin_d3}
                    onChange={e => setBlood({ ...blood, vitamin_d3: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Optimal: 30 - 100 ng/mL</div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Vitamin B12 (pg/mL)</label>
                    <span className={`badge badge-${blood.vitamin_b12 < 200 ? 'error' : blood.vitamin_b12 < 300 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.vitamin_b12 < 200 ? 'Low' : blood.vitamin_b12 < 300 ? 'Borderline' : 'Normal'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={blood.vitamin_b12}
                    onChange={e => setBlood({ ...blood, vitamin_b12: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 300 - 900 pg/mL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.hemoglobin}
                    onChange={e => setBlood({ ...blood, hemoglobin: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 12.0 - 16.0 g/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Serum Ferritin (ng/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.ferritin_iron}
                    onChange={e => setBlood({ ...blood, ferritin_iron: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 20 - 200 ng/mL</div>
                </div>
              </div>
            </div>

            {/* 5. LIPID & CHOLESTEROL PANEL */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🫀 Lipid &amp; Cholesterol Panel
              </h3>
              <div className="grid-4" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Total Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    value={blood.total_cholesterol}
                    onChange={e => setBlood({ ...blood, total_cholesterol: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Desirable: &lt; 200 mg/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>HDL Good Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    value={blood.hdl_cholesterol}
                    onChange={e => setBlood({ ...blood, hdl_cholesterol: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Optimal: &gt; 50 mg/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>LDL Bad Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    value={blood.ldl_cholesterol}
                    onChange={e => setBlood({ ...blood, ldl_cholesterol: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Optimal: &lt; 100 mg/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Triglycerides (mg/dL)</label>
                  <input
                    type="number"
                    value={blood.triglycerides}
                    onChange={e => setBlood({ ...blood, triglycerides: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: &lt; 150 mg/dL</div>
                </div>
              </div>
            </div>

            {/* 6. GLUCOSE & METABOLIC */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🧪 Glycemic &amp; Liver Markers
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Fasting Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={blood.fasting_blood_sugar}
                    onChange={e => setBlood({ ...blood, fasting_blood_sugar: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 70 - 99 mg/dL</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>HbA1c Glycated Hb (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.hba1c_pct}
                    onChange={e => setBlood({ ...blood, hba1c_pct: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: &lt; 5.7% | Prediabetes: 5.7-6.4%</div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>SGPT / ALT (U/L)</label>
                  <input
                    type="number"
                    value={blood.sgpt_alt}
                    onChange={e => setBlood({ ...blood, sgpt_alt: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: &lt; 45 U/L</div>
                </div>
              </div>
            </div>

            {/* 7. CUSTOM / DYNAMIC BIOMARKERS (CMS-EXPANDABLE) */}
            <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 8, border: '1px solid #6ee7b7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 className="text-label-lg" style={{ margin: 0, color: '#065f46' }}>
                    ✨ Custom &amp; CMS Configured Biomarkers
                  </h3>
                  <p className="text-caption text-muted" style={{ margin: '2px 0 0 0' }}>
                    Add extra lab parameters dynamically or configure globally from Admin CMS
                  </p>
                </div>
              </div>

              {/* Existing Custom Biomarkers */}
              {customBiomarkers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {customBiomarkers.map((cb, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <div>
                        <strong>{cb.name}</strong>: {cb.value} {cb.unit}{' '}
                        <span className="text-caption text-muted">({cb.normal_range})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomBiomarker(idx)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444', padding: '2px 6px', fontSize: 12 }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Biomarker Row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 2, minWidth: 140 }}>
                  <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Parameter Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Homocysteine / Cortisol"
                    value={newBiomarkerName}
                    onChange={e => setNewBiomarkerName(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 90 }}>
                  <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Value</label>
                  <input
                    type="text"
                    placeholder="e.g. 12.4"
                    value={newBiomarkerVal}
                    onChange={e => setNewBiomarkerVal(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. µmol/L"
                    value={newBiomarkerUnit}
                    onChange={e => setNewBiomarkerUnit(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 2, minWidth: 130 }}>
                  <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>Reference Range</label>
                  <input
                    type="text"
                    placeholder="e.g. < 15 µmol/L"
                    value={newBiomarkerRange}
                    onChange={e => setNewBiomarkerRange(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomBiomarker}
                  className="btn btn-primary btn-sm"
                  style={{ height: 34 }}
                >
                  + Add Parameter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIGESTIVE & LIFESTYLE */}
        {activeTab === 'digestive' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🌿 Digestive Agni &amp; Gut Health Assessment
              </h3>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Primary Dietary Preference</label>
                  <select
                    value={digestive.dietary_preference}
                    onChange={e => setDigestive({ ...digestive, dietary_preference: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  >
                    <option value="vegetarian">Pure Vegetarian (Plant + Dairy)</option>
                    <option value="vegan">Strict Vegan (100% Plant-Based)</option>
                    <option value="satvik">Satvik Naturopathic (No Onion/Garlic)</option>
                    <option value="jain">Jain Diet</option>
                    <option value="eggetarian">Eggetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Bowel Movement Consistency</label>
                  <select
                    value={digestive.bowel_movement}
                    onChange={e => setDigestive({ ...digestive, bowel_movement: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  >
                    <option value="regular">Regular (Daily morning, easy evacuation)</option>
                    <option value="constipated">Constipated / Sluggish (Hard stools, incomplete)</option>
                    <option value="loose">Loose / Frequent / Hyper-motility</option>
                    <option value="irregular">Irregular / Bloating &amp; Gas</option>
                  </select>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Daily Water Intake (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={digestive.water_intake_liters}
                    onChange={e => setDigestive({ ...digestive, water_intake_liters: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Known Allergies &amp; Sensitivities</label>
                  <input
                    type="text"
                    value={digestive.food_allergies}
                    onChange={e => setDigestive({ ...digestive, food_allergies: e.target.value })}
                    placeholder="e.g. Mild lactose sensitivity, peanut allergy"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Average Sleep (Hours/Night)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={digestive.sleep_hours}
                    onChange={e => setDigestive({ ...digestive, sleep_hours: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Primary Stress Triggers</label>
                  <input
                    type="text"
                    value={digestive.stress_triggers}
                    onChange={e => setDigestive({ ...digestive, stress_triggers: e.target.value })}
                    placeholder="e.g. Long screen work, late dinner"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOCTOR ANALYSIS */}
        {activeTab === 'diagnosis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🩺 Clinical Diagnosis &amp; Naturopathic Root Cause Analysis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Overall Diagnostic Summary *</label>
                  <textarea
                    rows={3}
                    value={assessment.diagnostic_summary}
                    onChange={e => setAssessment({ ...assessment, diagnostic_summary: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div className="grid-2" style={{ gap: 16 }}>
                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Metabolic Health Grade</label>
                    <select
                      value={assessment.metabolic_health_grade}
                      onChange={e => setAssessment({ ...assessment, metabolic_health_grade: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                    >
                      <option value="Grade A+ (Optimal Vitality)">Grade A+ (Optimal Vitality)</option>
                      <option value="Grade A- (Good Health)">Grade A- (Good Health)</option>
                      <option value="Grade B (Micronutrient Attention Needed)">Grade B (Micronutrient Attention Needed)</option>
                      <option value="Grade C+ (Metabolic & Thyroid Support Required)">Grade C+ (Metabolic & Thyroid Support Required)</option>
                      <option value="Grade D (Critical Naturopathic Intervention)">Grade D (Critical Naturopathic Intervention)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Active Deficiency / Risk Alerts</label>
                    <input
                      type="text"
                      value={assessment.deficiency_alerts}
                      onChange={e => setAssessment({ ...assessment, deficiency_alerts: e.target.value })}
                      className="form-input"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Naturopathic Root Cause Hypothesis</label>
                  <textarea
                    rows={2}
                    value={assessment.naturopathic_root_cause}
                    onChange={e => setAssessment({ ...assessment, naturopathic_root_cause: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DIET CHART PRESCRIPTION */}
        {activeTab === 'diet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
                  🥗 7-Stage Naturopathic Daily Meal Prescription
                </h3>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Meal-by-Meal Schedule</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🌄 1. Morning Detox Drink (Empty Stomach - 7:00 AM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.morning_detox_drink}
                    onChange={e => setDietChart({ ...dietChart, morning_detox_drink: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🍳 2. Breakfast (8:30 AM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.breakfast}
                    onChange={e => setDietChart({ ...dietChart, breakfast: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🍏 3. Mid-Morning Vitality (11:00 AM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.mid_morning}
                    onChange={e => setDietChart({ ...dietChart, mid_morning: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🥗 4. Lunch (Main Healing Meal - 1:30 PM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.lunch}
                    onChange={e => setDietChart({ ...dietChart, lunch: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🫖 5. Evening Snack &amp; Herbal Decoction (5:00 PM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.evening_snack}
                    onChange={e => setDietChart({ ...dietChart, evening_snack: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🍲 6. Light Dinner (7:30 PM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.dinner}
                    onChange={e => setDietChart({ ...dietChart, dinner: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    🌙 7. Bedtime Digestive Ritual (9:45 PM)
                  </label>
                  <input
                    type="text"
                    value={dietChart.bedtime_routine}
                    onChange={e => setDietChart({ ...dietChart, bedtime_routine: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#dc2626' }}>
                    ⛔ Strict Foods to Avoid / Prohibitions
                  </label>
                  <textarea
                    rows={2}
                    value={dietChart.food_guidelines_to_avoid}
                    onChange={e => setDietChart({ ...dietChart, food_guidelines_to_avoid: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#0d9488' }}>
                    🧘 Naturopathy Lifestyle, Solar &amp; Yoga Therapy Rules
                  </label>
                  <textarea
                    rows={2}
                    value={dietChart.naturopathy_lifestyle_rules}
                    onChange={e => setDietChart({ ...dietChart, naturopathy_lifestyle_rules: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #6ee7b7', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Clinical Notes */}
      <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
        <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
          📝 Internal Doctor Notes &amp; Follow-up Instructions
        </label>
        <textarea
          rows={2}
          value={doctorNotes}
          onChange={e => setDoctorNotes(e.target.value)}
          className="form-input"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
        />
      </div>

      {/* DUAL ACTION BUTTONS: DRAFT VS PUBLISH */}
      <div
        style={{
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="text-caption text-muted">
          {status === 'draft' ? (
            <span>🟡 <strong>Current Mode: Draft</strong> (Only visible to doctor. Patient and trainer will not see until published.)</span>
          ) : (
            <span>🟢 <strong>Current Mode: Published</strong> (Live on Patient &amp; Trainer dashboards.)</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Action 1: Save Draft */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="btn btn-ghost"
            style={{
              border: '1px solid #cbd5e1',
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: 14,
              color: '#475569',
              background: '#f8fafc',
            }}
          >
            {saving && status === 'draft' ? 'Saving Draft…' : '📝 Save as Draft'}
          </button>

          {/* Action 2: Publish */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            {saving && status === 'published' ? 'Publishing…' : '🚀 Publish to Client & Trainer'}
          </button>
        </div>
      </div>
    </div>
  )
}
