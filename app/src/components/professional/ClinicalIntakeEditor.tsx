'use client'

import { useState, useEffect } from 'react'

interface Props {
  customerId: string
  customerName: string
  existingRecord?: any
  onSaved?: () => void
}

export default function ClinicalIntakeEditor({
  customerId,
  customerName,
  existingRecord,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<'bms' | 'blood' | 'digestive' | 'diagnosis' | 'diet'>('bms')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form State
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

  const [blood, setBlood] = useState({
    vitamin_d3: existingRecord?.blood_reports?.vitamin_d3 ?? 21.4,
    vitamin_b12: existingRecord?.blood_reports?.vitamin_b12 ?? 240,
    hemoglobin: existingRecord?.blood_reports?.hemoglobin ?? 12.8,
    ferritin_iron: existingRecord?.blood_reports?.ferritin_iron ?? 34,
    total_cholesterol: existingRecord?.blood_reports?.total_cholesterol ?? 192,
    hdl_cholesterol: existingRecord?.blood_reports?.hdl_cholesterol ?? 54,
    ldl_cholesterol: existingRecord?.blood_reports?.ldl_cholesterol ?? 114,
    triglycerides: existingRecord?.blood_reports?.triglycerides ?? 120,
    vldl_cholesterol: existingRecord?.blood_reports?.vldl_cholesterol ?? 24,
    fasting_blood_sugar: existingRecord?.blood_reports?.fasting_blood_sugar ?? 92,
    postprandial_blood_sugar: existingRecord?.blood_reports?.postprandial_blood_sugar ?? 124,
    hba1c_pct: existingRecord?.blood_reports?.hba1c_pct ?? 5.4,
    tsh: existingRecord?.blood_reports?.tsh ?? 2.4,
    t3: existingRecord?.blood_reports?.t3 ?? 1.1,
    t4: existingRecord?.blood_reports?.t4 ?? 7.8,
    serum_creatinine: existingRecord?.blood_reports?.serum_creatinine ?? 0.8,
    uric_acid: existingRecord?.blood_reports?.uric_acid ?? 4.5,
    sgpt_alt: existingRecord?.blood_reports?.sgpt_alt ?? 22,
    sgot_ast: existingRecord?.blood_reports?.sgot_ast ?? 20,
  })

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

  const [assessment, setAssessment] = useState({
    diagnostic_summary: existingRecord?.doctor_clinical_assessment?.diagnostic_summary || 'Mild Vitamin D3 & B12 insufficiency. Good cardiovascular profile and healthy metabolic insulin sensitivity.',
    metabolic_health_grade: existingRecord?.doctor_clinical_assessment?.metabolic_health_grade || 'Grade A- (Good Health)',
    deficiency_alerts: existingRecord?.doctor_clinical_assessment?.deficiency_alerts || 'Low Vitamin D3 (21.4 ng/mL), Borderline B12 (240 pg/mL)',
    naturopathic_root_cause: existingRecord?.doctor_clinical_assessment?.naturopathic_root_cause || 'Sedentary indoor work hours; sluggish evening digestion.',
  })

  const [dietChart, setDietChart] = useState({
    morning_detox_drink: existingRecord?.prescribed_diet_chart?.morning_detox_drink || '1 glass warm water with lemon, grated ginger, and a pinch of cinnamon powder (7:00 AM)',
    breakfast: existingRecord?.prescribed_diet_chart?.breakfast || 'Sprouted moong & methi bowl with grated coconut and pomegranate + 1 cup vegetable daliya (8:30 AM)',
    mid_morning: existingRecord?.prescribed_diet_chart?.mid_morning || 'Fresh tender coconut water with 5 soaked almonds and 2 walnuts (11:00 AM)',
    lunch: existingRecord?.prescribed_diet_chart?.lunch || '2 Jowar rotis + 1 bowl seasonal vegetable curry + 1 cup sprouted dal + cucumber carrot salad (1:30 PM)',
    evening_snack: existingRecord?.prescribed_diet_chart?.evening_snack || 'Herbal Tulsi-Ginger Kadha + roasted Makhana (5:00 PM)',
    dinner: existingRecord?.prescribed_diet_chart?.dinner || 'Light bottle gourd soup + vegetable brown rice khichdi with ghee (7:30 PM)',
    bedtime_routine: existingRecord?.prescribed_diet_chart?.bedtime_routine || 'Warm turmeric cinnamon almond milk or chamomile infusion with 1/2 tsp triphala (9:45 PM)',
    food_guidelines_to_avoid: existingRecord?.prescribed_diet_chart?.food_guidelines_to_avoid || 'Refined flour (Maida), white sugar, deep fried snacks, cold carbonated drinks, meals after 8:30 PM',
    naturopathy_lifestyle_rules: existingRecord?.prescribed_diet_chart?.naturopathy_lifestyle_rules || '20 mins morning sun bath (7:30-8:30 AM); chew every bite 32 times; 10 mins Vajrasana after meals',
  })

  const [doctorNotes, setDoctorNotes] = useState(existingRecord?.doctor_notes || 'Patient motivated. Re-evaluate biomarkers in 14 days.')

  // Auto-calculate BMI
  useEffect(() => {
    if (vitals.height_cm > 0 && vitals.weight_kg > 0) {
      const hM = Number(vitals.height_cm) / 100
      const calculatedBmi = Number((Number(vitals.weight_kg) / (hM * hM)).toFixed(1))
      setVitals(v => ({ ...v, bmi: calculatedBmi }))
    }
  }, [vitals.height_cm, vitals.weight_kg])

  // Apply Condition Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'vitamin_gut') {
      setBlood(b => ({ ...b, vitamin_d3: 18.5, vitamin_b12: 190, total_cholesterol: 185, hdl_cholesterol: 52, ldl_cholesterol: 105, triglycerides: 110 }))
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
    } else if (presetName === 'weight_cholesterol') {
      setBlood(b => ({ ...b, total_cholesterol: 235, hdl_cholesterol: 42, ldl_cholesterol: 155, triglycerides: 190, fasting_blood_sugar: 104, hba1c_pct: 5.8 }))
      setAssessment({
        diagnostic_summary: 'Elevated total cholesterol & LDL with borderline triglycerides. Mild metabolic insulin resistance. Initiated targeted anti-inflammatory naturopathy & lipid-lowering plant regimen.',
        metabolic_health_grade: 'Grade C+ (Cardiometabolic Risk)',
        deficiency_alerts: 'Elevated LDL (155 mg/dL), Triglycerides (190 mg/dL), Prediabetes HbA1c (5.8%)',
        naturopathic_root_cause: 'High saturated fat intake, refined carbohydrates, lack of high-fiber soluble mucilage.',
      })
      setDietChart({
        morning_detox_drink: 'Methi (fenugreek) soaked water with crushed garlic clove on empty stomach (7:00 AM)',
        breakfast: 'Steel-cut oats with flaxseeds, chia seeds, cinnamon, and fresh papaya (8:30 AM)',
        mid_morning: 'Fresh tender coconut water or green vegetable smoothie (spinach + celery + cucumber) (11:00 AM)',
        lunch: '1 Barley-Jowar roti + large bowl raw cucumber, radish, and beetroot salad + steamed green beans and lentils (1:30 PM)',
        evening_snack: 'Cinnamon green tea + roasted unsalted chana / edamame (5:00 PM)',
        dinner: 'High-fiber vegetable minestrone soup + steamed tofu / soya chunks with boiled broccoli (7:00 PM)',
        bedtime_routine: 'Warm water with 1/2 tsp organic Triphala powder (9:30 PM)',
        food_guidelines_to_avoid: 'Refined vegetable oils, red meat, cheese, trans fats, bakery items, sugar-sweetened beverages.',
        naturopathy_lifestyle_rules: '45 mins brisk walking / trainer functional circuit; 14-hour intermittent fasting window (7 PM to 9 AM); 10 mins Kapalbhati.',
      })
    }
    setSuccessMsg(`Preset applied! Review values and click "Save & Prescribe".`)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          vitals,
          blood_reports: blood,
          digestive_and_lifestyle: digestive,
          doctor_clinical_assessment: assessment,
          prescribed_diet_chart: dietChart,
          doctor_notes: doctorNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save clinical intake')

      setSuccessMsg('✅ Clinical intake, biomarkers, and Naturopathic diet prescription saved successfully!')
      if (onSaved) onSaved()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving clinical record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-md)', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
      {/* Header & Preset Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🩺</span>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>Clinical Intake &amp; Biomarkers Suite</h2>
          </div>
          <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
            Doctor Clinical Assessment, Blood Lab Reports, BMS Vitals, and Tailored Naturopathic Diet Formulation for <strong>{customerName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="text-caption text-muted" style={{ fontWeight: 600 }}>Quick Presets:</span>
          <button type="button" onClick={() => applyPreset('vitamin_gut')} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)', fontSize: 12 }}>
            🌿 Vitamin D/B12 &amp; Gut
          </button>
          <button type="button" onClick={() => applyPreset('weight_cholesterol')} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--color-border)', fontSize: 12 }}>
            ❤️ Lipid &amp; Cholesterol
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--color-border)', marginBottom: 'var(--space-md)', overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { id: 'bms', label: '1. BMS & Vitals', icon: '📊' },
          { id: 'blood', label: '2. Blood Reports & Vitamins', icon: '🩸' },
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
              color: activeTab === t.id ? '#0d9488' : 'var(--color-text-muted)',
              fontWeight: activeTab === t.id ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              fontSize: 14,
            }}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', fontSize: 14, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-md)', fontSize: 14, fontWeight: 500 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* TAB 1: BMS & VITALS */}
        {activeTab === 'bms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                📏 Body Composition &amp; Anthropometry (BMS)
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Height (cm)</label>
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
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Current Weight (kg)</label>
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

        {/* TAB 2: BLOOD REPORTS & VITAMINS */}
        {activeTab === 'blood' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Micronutrients & Vitamins */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                💊 Vitamin &amp; Micronutrient Profile
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Vitamin D3 (25-OH) (ng/mL)</label>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Hemoglobin (g/dL)</label>
                    <span className={`badge badge-${blood.hemoglobin < 12 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.hemoglobin < 12 ? 'Low' : 'Normal'}
                    </span>
                  </div>
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
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Serum Ferritin / Iron (ng/mL)</label>
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

            {/* Lipid / Cholesterol Profile */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🫀 Lipid &amp; Cholesterol Panel
              </h3>
              <div className="grid-3" style={{ gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Total Cholesterol (mg/dL)</label>
                    <span className={`badge badge-${blood.total_cholesterol > 200 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.total_cholesterol > 200 ? 'Elevated' : 'Desirable'}
                    </span>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>HDL - Good Cholesterol (mg/dL)</label>
                    <span className={`badge badge-${blood.hdl_cholesterol < 45 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.hdl_cholesterol < 45 ? 'Low' : 'Optimal'}
                    </span>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>LDL - Bad Cholesterol (mg/dL)</label>
                    <span className={`badge badge-${blood.ldl_cholesterol > 130 ? 'error' : blood.ldl_cholesterol > 100 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.ldl_cholesterol > 130 ? 'High' : blood.ldl_cholesterol > 100 ? 'Borderline' : 'Optimal'}
                    </span>
                  </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="text-body-sm" style={{ fontWeight: 600 }}>Triglycerides (mg/dL)</label>
                    <span className={`badge badge-${blood.triglycerides > 150 ? 'warning' : 'success'}`} style={{ fontSize: 10 }}>
                      {blood.triglycerides > 150 ? 'High' : 'Normal'}
                    </span>
                  </div>
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

            {/* Metabolic & Glycemic Profile */}
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h3 className="text-label-lg" style={{ marginBottom: 12, color: '#0f172a' }}>
                🧪 Glucose &amp; Endocrine Markers
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
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>HbA1c Glycated Hemoglobin (%)</label>
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
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>TSH Thyroid Stimulating (uIU/mL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={blood.tsh}
                    onChange={e => setBlood({ ...blood, tsh: Number(e.target.value) })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                  <div className="text-caption text-muted">Normal: 0.4 - 4.0 uIU/mL</div>
                </div>
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
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Stress Triggers &amp; Lifestyle Factors</label>
                  <input
                    type="text"
                    value={digestive.stress_triggers}
                    onChange={e => setDigestive({ ...digestive, stress_triggers: e.target.value })}
                    placeholder="e.g. Desk screen time, late dinners"
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
                🩺 Doctor Clinical Diagnostic Analysis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Overall Metabolic Health Grade</label>
                  <input
                    type="text"
                    value={assessment.metabolic_health_grade}
                    onChange={e => setAssessment({ ...assessment, metabolic_health_grade: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Deficiency Alerts &amp; Critical Biomarkers</label>
                  <input
                    type="text"
                    value={assessment.deficiency_alerts}
                    onChange={e => setAssessment({ ...assessment, deficiency_alerts: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Diagnostic Summary &amp; Prognosis</label>
                  <textarea
                    rows={3}
                    value={assessment.diagnostic_summary}
                    onChange={e => setAssessment({ ...assessment, diagnostic_summary: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Naturopathic Root Cause Identification</label>
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
                  🥗 Personalized Naturopathic Daily Diet Schedule
                </h3>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Syncs to Patient Portal</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🌄 1. Morning Detox Drink (7:00 AM)</label>
                  <input
                    type="text"
                    value={dietChart.morning_detox_drink}
                    onChange={e => setDietChart({ ...dietChart, morning_detox_drink: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🍳 2. Nourishing Breakfast (8:30 AM)</label>
                  <input
                    type="text"
                    value={dietChart.breakfast}
                    onChange={e => setDietChart({ ...dietChart, breakfast: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🍏 3. Mid-Morning Vitality Snack (11:00 AM)</label>
                  <input
                    type="text"
                    value={dietChart.mid_morning}
                    onChange={e => setDietChart({ ...dietChart, mid_morning: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🥗 4. Wholesome Lunch (1:30 PM)</label>
                  <input
                    type="text"
                    value={dietChart.lunch}
                    onChange={e => setDietChart({ ...dietChart, lunch: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🫖 5. Evening Vitality &amp; Herbal Kadha (5:00 PM)</label>
                  <input
                    type="text"
                    value={dietChart.evening_snack}
                    onChange={e => setDietChart({ ...dietChart, evening_snack: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🍲 6. Light Alkaline Dinner (7:30 PM)</label>
                  <input
                    type="text"
                    value={dietChart.dinner}
                    onChange={e => setDietChart({ ...dietChart, dinner: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>🌙 7. Bedtime Ritual (9:45 PM)</label>
                  <input
                    type="text"
                    value={dietChart.bedtime_routine}
                    onChange={e => setDietChart({ ...dietChart, bedtime_routine: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#dc2626' }}>🚫 Foods Strictly to Avoid</label>
                  <input
                    type="text"
                    value={dietChart.food_guidelines_to_avoid}
                    onChange={e => setDietChart({ ...dietChart, food_guidelines_to_avoid: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #fca5a5', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4, color: '#0d9488' }}>🧘 Naturopathy Lifestyle &amp; Solar Rules</label>
                  <input
                    type="text"
                    value={dietChart.naturopathy_lifestyle_rules}
                    onChange={e => setDietChart({ ...dietChart, naturopathy_lifestyle_rules: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #5eead4', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>📝 Doctor Consultation Notes &amp; Follow-Up</label>
                  <textarea
                    rows={2}
                    value={doctorNotes}
                    onChange={e => setDoctorNotes(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Save Actions */}
        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="flex gap-xs">
            {activeTab !== 'bms' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'bms' | 'blood' | 'digestive' | 'diagnosis' | 'diet'> = ['bms', 'blood', 'digestive', 'diagnosis', 'diet']
                  const idx = tabs.indexOf(activeTab)
                  if (idx > 0) setActiveTab(tabs[idx - 1])
                }}
                className="btn btn-ghost btn-sm"
              >
                ← Previous Section
              </button>
            )}
            {activeTab !== 'diet' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'bms' | 'blood' | 'digestive' | 'diagnosis' | 'diet'> = ['bms', 'blood', 'digestive', 'diagnosis', 'diet']
                  const idx = tabs.indexOf(activeTab)
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1])
                }}
                className="btn btn-secondary btn-sm"
              >
                Next Section →
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ minWidth: 200, fontWeight: 700 }}
          >
            {saving ? 'Saving Intake & Prescribing...' : '💾 Save & Prescribe Diet Plan'}
          </button>
        </div>
      </form>
    </div>
  )
}
