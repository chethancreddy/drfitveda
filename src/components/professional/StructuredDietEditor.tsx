'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface MealSlot {
  slot_name: string
  timing: string
  food_items: string
  purpose: string
  portion: string
  alternatives: string
}

export interface DietPlanData {
  plan_id?: string
  customer_id: string
  customer_name?: string
  status?: 'draft' | 'published'
  version_number?: number
  target_calories_kcal: number
  dietary_type: string
  carbs_pct: number
  protein_pct: number
  fats_pct: number
  water_intake_liters: number
  fiber_target_g: number
  therapeutic_focus: string
  meals: MealSlot[]
  strict_avoidances: string
  naturopathy_lifestyle_rules: string
  doctor_internal_notes?: string
}

const DEFAULT_MEAL_SLOTS: MealSlot[] = [
  {
    slot_name: 'Early Morning Detox',
    timing: '06:30 AM - 07:15 AM',
    food_items: '1 glass warm water with freshly squeezed lemon, grated ginger, and 1 tsp soaked chia seeds',
    purpose: 'Alkalizing morning wake-up & lymphatic flush',
    portion: '250 ml warm glass',
    alternatives: 'Warm coriander seed infusion or Ash Gourd juice with lime',
  },
  {
    slot_name: 'Naturopathy Breakfast',
    timing: '08:30 AM - 09:15 AM',
    food_items: 'Sprouted Moong & Methi bowl with grated fresh coconut, pomegranate seeds + 1 cup vegetable foxtail millet daliya',
    purpose: 'High micronutrient bioavailability & sustained energy',
    portion: '1 medium bowl (180g) + 1 cup daliya',
    alternatives: '2 Fermented Ragi idlis with mint-coriander chutney',
  },
  {
    slot_name: 'Mid-Morning Vitality',
    timing: '11:00 AM - 11:30 AM',
    food_items: 'Fresh tender coconut water + 5 soaked almonds + 2 walnuts',
    purpose: 'Electrolyte balance, healthy brain fats, and thyroid support',
    portion: '1 whole coconut water (200ml) + nuts',
    alternatives: 'Fresh cold-pressed amla-cucumber juice or 1 green apple with cinnamon',
  },
  {
    slot_name: 'Therapeutic Lunch',
    timing: '01:00 PM - 02:00 PM',
    food_items: '2 Jowar-Methi rotis + 1 bowl Lauki-Moong dal + 1 cup raw Cucumber-Carrot-Beetroot salad + 1 cup fresh Chaach with roasted cumin',
    purpose: 'Core balanced nutrition, digestive gut biome support',
    portion: '2 rotis (70g) + 150g dal + 100g salad',
    alternatives: '1 bowl Vegetable Quinoa Brown Rice Khichdi with steamed greens',
  },
  {
    slot_name: 'Evening Rejuvenation',
    timing: '04:30 PM - 05:30 PM',
    food_items: 'Herbal Tulsi-Ginger-Mulethi decoction (Kadha) + 1 cup roasted Makhana with pinch of turmeric & black pepper',
    purpose: 'Immunity modulation & appetite control',
    portion: '1 cup (150ml) + 30g makhana',
    alternatives: 'Cinnamon green tea + roasted unsalted chana',
  },
  {
    slot_name: 'Light Healing Dinner',
    timing: '07:00 PM - 07:45 PM',
    food_items: 'Clear Bottle Gourd & Tomato soup + 150g steamed seasonal vegetables with tofu/paneer cubes',
    purpose: 'Light evening digestion, non-taxing liver metabolism',
    portion: '1 large soup bowl (250ml) + 150g vegetables',
    alternatives: 'Moong dal vegetable broth with steamed sweet potato',
  },
  {
    slot_name: 'Bedtime Digestive Ritual',
    timing: '09:30 PM - 10:00 PM',
    food_items: 'Warm almond milk with pure wild turmeric (Curcumin), pinch of black pepper, and 1/2 tsp Triphala',
    purpose: 'Deep sleep restorative repair & gentle overnight bowel motility',
    portion: '150 ml warm cup',
    alternatives: 'Chamomile tea with 1 tsp soaked basil (sabja) seeds',
  },
]

interface Props {
  customerId: string
  customerName: string
  customerBmi?: number
  customerWeight?: number
  customerHeight?: number
  initialPlan?: Partial<DietPlanData>
  onSaved?: (status: 'draft' | 'published') => void
}

export default function StructuredDietEditor({
  customerId,
  customerName,
  customerBmi,
  customerWeight,
  customerHeight,
  initialPlan,
  onSaved,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<'draft' | 'published'>(initialPlan?.status || 'published')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Plan State
  const [targetCalories, setTargetCalories] = useState(initialPlan?.target_calories_kcal || 1450)
  const [dietaryType, setDietaryType] = useState(initialPlan?.dietary_type || 'Pure Vegetarian')
  const [carbsPct, setCarbsPct] = useState(initialPlan?.carbs_pct || 50)
  const [proteinPct, setProteinPct] = useState(initialPlan?.protein_pct || 25)
  const [fatsPct, setFatsPct] = useState(initialPlan?.fats_pct || 25)
  const [waterIntake, setWaterIntake] = useState(initialPlan?.water_intake_liters || 3.0)
  const [fiberTarget, setFiberTarget] = useState(initialPlan?.fiber_target_g || 35)
  const [therapeuticFocus, setTherapeuticFocus] = useState(
    initialPlan?.therapeutic_focus || 'Clinical Naturopathic Nutrition Formulation'
  )

  const [meals, setMeals] = useState<MealSlot[]>(
    initialPlan?.meals && initialPlan.meals.length > 0
      ? initialPlan.meals
      : DEFAULT_MEAL_SLOTS
  )

  const [strictAvoidances, setStrictAvoidances] = useState(
    initialPlan?.strict_avoidances ||
      'Refined white sugar, Maida bakery items, ultra-processed fried foods, packaged soft drinks, high-purine late night meals'
  )

  const [naturopathyRules, setNaturopathyRules] = useState(
    initialPlan?.naturopathy_lifestyle_rules ||
      '20 mins morning sun bath (7:30-8:15 AM); chew every bite 32 times; 10 mins Vajrasana after meals; 14-hour intermittent fasting window (7:45 PM to 9:45 AM)'
  )

  const [doctorNotes, setDoctorNotes] = useState(
    initialPlan?.doctor_internal_notes || 'Patient motivated. Re-evaluate biomarkers & BMI in 14 days.'
  )

  // Template Library & Clone State
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateCondition, setNewTemplateCondition] = useState('')

  // Patients list for cloning
  const [patients, setPatients] = useState<any[]>([])
  const [patientFilter, setPatientFilter] = useState('')

  // Load Templates
  useEffect(() => {
    fetch('/api/diet-templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) setTemplates(data.templates)
      })
      .catch(() => {})
  }, [])

  // Load Patients for Clone
  const loadPatientsForClone = async () => {
    setShowCloneModal(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.customers) {
        setPatients(data.customers.filter((c: any) => c.id !== customerId))
      }
    } catch {}
  }

  // 1-Click Load Template
  const handleApplyTemplate = (tmpl: any) => {
    if (!tmpl) return
    setTargetCalories(tmpl.target_calories_kcal || 1450)
    setDietaryType(tmpl.dietary_type || 'Vegetarian')
    setCarbsPct(tmpl.carbs_pct || 50)
    setProteinPct(tmpl.protein_pct || 25)
    setFatsPct(tmpl.fats_pct || 25)
    setWaterIntake(tmpl.water_intake_liters || 3.0)
    setFiberTarget(tmpl.fiber_target_g || 35)
    setTherapeuticFocus(tmpl.name || tmpl.condition)
    if (tmpl.meals && tmpl.meals.length > 0) {
      setMeals([...tmpl.meals])
    }
    if (tmpl.strict_avoidances) setStrictAvoidances(tmpl.strict_avoidances)
    if (tmpl.naturopathy_lifestyle_rules) setNaturopathyRules(tmpl.naturopathy_lifestyle_rules)

    setShowTemplateModal(false)
    setSuccessMsg(`✓ Loaded clinical protocol: "${tmpl.name}"! You can now customize meal items or save as draft/publish.`)
  }

  // 1-Click Clone from Patient
  const handleCloneFromPatient = async (targetCustomer: any) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/clinical-records?customer_id=${targetCustomer.id}`)
      const data = await res.json()
      const record = data.latest_record

      if (record?.prescribed_diet_chart) {
        setTherapeuticFocus(`Cloned from ${targetCustomer.user_profiles?.full_name || 'Patient'} (Target Profile)`)
        if (record.prescribed_diet_chart.morning_detox_drink) {
          setMeals(prev => prev.map(m => {
            if (m.slot_name.includes('Morning Detox')) return { ...m, food_items: record.prescribed_diet_chart.morning_detox_drink }
            if (m.slot_name.includes('Breakfast')) return { ...m, food_items: record.prescribed_diet_chart.breakfast }
            if (m.slot_name.includes('Mid-Morning')) return { ...m, food_items: record.prescribed_diet_chart.mid_morning }
            if (m.slot_name.includes('Lunch')) return { ...m, food_items: record.prescribed_diet_chart.lunch }
            if (m.slot_name.includes('Evening')) return { ...m, food_items: record.prescribed_diet_chart.evening_snack }
            if (m.slot_name.includes('Dinner')) return { ...m, food_items: record.prescribed_diet_chart.dinner }
            if (m.slot_name.includes('Bedtime')) return { ...m, food_items: record.prescribed_diet_chart.bedtime_routine }
            return m
          }))
        }
        if (record.prescribed_diet_chart.food_guidelines_to_avoid) {
          setStrictAvoidances(record.prescribed_diet_chart.food_guidelines_to_avoid)
        }
        if (record.prescribed_diet_chart.naturopathy_lifestyle_rules) {
          setNaturopathyRules(record.prescribed_diet_chart.naturopathy_lifestyle_rules)
        }
        setSuccessMsg(`✓ Successfully cloned regimen from ${targetCustomer.user_profiles?.full_name || 'Patient'}!`)
      } else {
        alert('Selected patient does not have a saved regimen yet.')
      }
    } catch {
      alert('Failed to clone patient regimen.')
    } finally {
      setSaving(false)
      setShowCloneModal(false)
    }
  }

  // Save as New Template to Doctor Library
  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplateName.trim()) return

    try {
      setSaving(true)
      const res = await fetch('/api/diet-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          condition: newTemplateCondition.trim() || 'Clinical Wellness',
          target_bmi_range: customerBmi ? `${customerBmi - 2} - ${customerBmi + 2}` : 'Normal / Target',
          target_calories_kcal: targetCalories,
          dietary_type: dietaryType,
          carbs_pct: carbsPct,
          protein_pct: proteinPct,
          fats_pct: fatsPct,
          water_intake_liters: waterIntake,
          fiber_target_g: fiberTarget,
          description: therapeuticFocus,
          meals,
          strict_avoidances: strictAvoidances,
          naturopathy_lifestyle_rules: naturopathyRules,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save template')

      setTemplates([data.template, ...templates])
      setShowSaveTemplateModal(false)
      setNewTemplateName('')
      setNewTemplateCondition('')
      setSuccessMsg(`✓ Regimen saved as reusable template: "${data.template.name}" in Doctor Library!`)
    } catch (err: any) {
      alert(err.message || 'Error saving template')
    } finally {
      setSaving(false)
    }
  }

  // Update Meal Field
  const updateMeal = (index: number, field: keyof MealSlot, value: string) => {
    const updated = [...meals]
    updated[index] = { ...updated[index], [field]: value }
    setMeals(updated)
  }

  // Add Custom Meal Slot
  const addMealSlot = () => {
    setMeals([
      ...meals,
      {
        slot_name: 'Custom Nutritional Slot',
        timing: '03:00 PM - 03:30 PM',
        food_items: '',
        purpose: 'Therapeutic nutrition support',
        portion: '1 serving',
        alternatives: '',
      },
    ])
  }

  // Remove Meal Slot
  const removeMealSlot = (index: number) => {
    if (meals.length <= 1) {
      alert('Plan must have at least one meal slot.')
      return
    }
    setMeals(meals.filter((_, i) => i !== index))
  }

  // Save Handler: Supports both Draft and Publish
  const handleSavePlan = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Transform meals into structured plan_items
      const planItems = meals.map((m, idx) => ({
        category: 'nutrition',
        instruction: `🕒 ${m.slot_name} (${m.timing}): ${m.food_items} [Portion: ${m.portion}] (Alt: ${m.alternatives || 'Standard'}) - Purpose: ${m.purpose}`,
        internal_notes: JSON.stringify(m),
        display_order: idx + 1,
      }))

      // Add Lifestyle and Yoga items
      if (naturopathyRules) {
        planItems.push({
          category: 'yoga',
          instruction: `🧘 Naturopathy & Lifestyle Rules: ${naturopathyRules}`,
          internal_notes: 'lifestyle_rules',
          display_order: planItems.length + 1,
        })
      }

      if (strictAvoidances) {
        planItems.push({
          category: 'lifestyle',
          instruction: `⛔ Strict Avoidances: ${strictAvoidances}`,
          internal_notes: 'strict_avoidances',
          display_order: planItems.length + 1,
        })
      }

      // 2. Map to prescribed_diet_chart object for Clinical Records compatibility
      const dietChartObj = {
        morning_detox_drink: meals.find(m => m.slot_name.includes('Morning Detox'))?.food_items || '',
        breakfast: meals.find(m => m.slot_name.includes('Breakfast'))?.food_items || '',
        mid_morning: meals.find(m => m.slot_name.includes('Mid-Morning'))?.food_items || '',
        lunch: meals.find(m => m.slot_name.includes('Lunch'))?.food_items || '',
        evening_snack: meals.find(m => m.slot_name.includes('Evening'))?.food_items || '',
        dinner: meals.find(m => m.slot_name.includes('Dinner'))?.food_items || '',
        bedtime_routine: meals.find(m => m.slot_name.includes('Bedtime'))?.food_items || '',
        food_guidelines_to_avoid: strictAvoidances,
        naturopathy_lifestyle_rules: naturopathyRules,
      }

      // 3. Save via Clinical Records API (which syncs master plans, versions, items & notifications)
      const res = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          status: targetStatus,
          prescribed_diet_chart: dietChartObj,
          doctor_notes: doctorNotes,
          digestive_and_lifestyle: {
            dietary_preference: dietaryType.toLowerCase(),
            water_intake_liters: waterIntake,
          },
          doctor_clinical_assessment: {
            diagnostic_summary: therapeuticFocus,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save diet plan')

      setStatus(targetStatus)
      if (targetStatus === 'draft') {
        setSuccessMsg('📝 Diet Plan saved as Draft! It is stored securely and remains private to the doctor until you click "Publish".')
      } else {
        setSuccessMsg('🚀 Diet Plan successfully Published! The updated 7-stage meal schedule and hydration rules are now live on the Patient & Trainer apps.')
      }

      if (onSaved) onSaved(targetStatus)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving diet plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-lg)', background: 'white', borderRadius: 12, border: '1px solid var(--color-border)' }}>
      {/* Top Header & Fast Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🥗</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="text-headline-sm" style={{ margin: 0 }}>Structured Diet &amp; Clinical Nutrition Regimen</h2>
                <span className={`badge badge-${status === 'published' ? 'success' : 'warning'}`} style={{ fontSize: 11, padding: '4px 10px', textTransform: 'uppercase' }}>
                  {status === 'published' ? '🟢 Published' : '🟡 Draft (Private)'}
                </span>
              </div>
              <p className="text-body-sm text-muted" style={{ margin: '2px 0 0 0' }}>
                Meal-by-Meal Nutrition Matrix, Macro Breakdown &amp; Hydration Strategy for <strong>{customerName}</strong>
                {customerBmi && <span> • BMI: <strong>{customerBmi}</strong> ({customerWeight} kg, {customerHeight} cm)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Tooling Actions: Templates, Clone, Save Template */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Action A: Load Template */}
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #0d9488', color: '#0d9488', fontWeight: 600, fontSize: 13 }}
          >
            📚 Load from Template ({templates.length})
          </button>

          {/* Action B: 1-Click Clone from Patient */}
          <button
            type="button"
            onClick={loadPatientsForClone}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #6366f1', color: '#6366f1', fontWeight: 600, fontSize: 13 }}
          >
            👥 Clone from Patient (Same BMI)
          </button>

          {/* Action C: Save as New Template */}
          <button
            type="button"
            onClick={() => {
              setNewTemplateName(`${customerName}'s Protocol (${dietaryType})`)
              setNewTemplateCondition(therapeuticFocus)
              setShowSaveTemplateModal(true)
            }}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #cbd5e1', fontSize: 13 }}
          >
            💾 Save as Template
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      {/* SECTION 1: MACRONUTRIENT & ENERGY TARGETS */}
      <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
            ⚡ Daily Energy &amp; Macronutrient Targets
          </h3>
          <span className="badge badge-neutral" style={{ fontSize: 11 }}>Naturopathic Energy Ratio</span>
        </div>

        <div className="grid-4" style={{ gap: 14, marginBottom: 12 }}>
          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Total Calories (kcal/day)
            </label>
            <input
              type="number"
              value={targetCalories}
              onChange={e => setTargetCalories(Number(e.target.value))}
              className="form-input"
              style={{ width: '100%', padding: '6px 10px', fontSize: 14, fontWeight: 700, color: '#0d9488' }}
            />
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Dietary Category
            </label>
            <select
              value={dietaryType}
              onChange={e => setDietaryType(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
            >
              <option value="Pure Vegetarian">Pure Vegetarian (Plant + Dairy)</option>
              <option value="Satvik Naturopathic">Satvik Naturopathic (No Onion/Garlic)</option>
              <option value="Strict Vegan">Strict Vegan (100% Plant)</option>
              <option value="Jain Diet">Jain Diet</option>
              <option value="Eggetarian">Eggetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
            </select>
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Water Intake Target (L/day)
            </label>
            <input
              type="number"
              step="0.1"
              value={waterIntake}
              onChange={e => setWaterIntake(Number(e.target.value))}
              className="form-input"
              style={{ width: '100%', padding: '6px 10px', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Dietary Fiber Goal (g/day)
            </label>
            <input
              type="number"
              value={fiberTarget}
              onChange={e => setFiberTarget(Number(e.target.value))}
              className="form-input"
              style={{ width: '100%', padding: '6px 10px', fontSize: 14, fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Macro Split Sliders / Inputs */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
          <span className="text-caption text-muted" style={{ fontWeight: 600 }}>Macro Ratio:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="text-caption">🌾 Carbs:</span>
            <input
              type="number"
              value={carbsPct}
              onChange={e => setCarbsPct(Number(e.target.value))}
              style={{ width: 50, padding: '2px 4px', fontSize: 12, textAlign: 'center' }}
            />
            <span className="text-caption">%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="text-caption">💪 Protein:</span>
            <input
              type="number"
              value={proteinPct}
              onChange={e => setProteinPct(Number(e.target.value))}
              style={{ width: 50, padding: '2px 4px', fontSize: 12, textAlign: 'center' }}
            />
            <span className="text-caption">%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="text-caption">🥑 Healthy Fats:</span>
            <input
              type="number"
              value={fatsPct}
              onChange={e => setFatsPct(Number(e.target.value))}
              style={{ width: 50, padding: '2px 4px', fontSize: 12, textAlign: 'center' }}
            />
            <span className="text-caption">%</span>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            Total: <strong>{carbsPct + proteinPct + fatsPct}%</strong>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
            Therapeutic Goal &amp; Medical Focus
          </label>
          <input
            type="text"
            value={therapeuticFocus}
            onChange={e => setTherapeuticFocus(e.target.value)}
            placeholder="e.g. Alkaline Low-Purine Protocol for High Uric Acid &amp; Thyroid Support"
            className="form-input"
            style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
          />
        </div>
      </div>

      {/* SECTION 2: STRUCTURED MEAL-BY-MEAL SLOTS MATRIX */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a' }}>
              🍽️ Meal-by-Meal Schedule &amp; Recipe Portions ({meals.length} Slots)
            </h3>
            <p className="text-caption text-muted" style={{ margin: '2px 0 0 0' }}>
              Detailed food formulation, portion weights, therapeutic purpose, and healthy alternative swaps
            </p>
          </div>

          <button
            type="button"
            onClick={addMealSlot}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #0d9488', color: '#0d9488', fontSize: 12, fontWeight: 600 }}
          >
            + Add Meal Slot
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meals.map((m, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '12px 16px',
                background: '#fafafa',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Row Header: Slot Name, Timing & Remove */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>
                    {m.slot_name.includes('Morning Detox') ? '🌅' :
                     m.slot_name.includes('Breakfast') ? '🍳' :
                     m.slot_name.includes('Mid-Morning') ? '🍏' :
                     m.slot_name.includes('Lunch') ? '🥗' :
                     m.slot_name.includes('Evening') ? '🫖' :
                     m.slot_name.includes('Dinner') ? '🍲' :
                     m.slot_name.includes('Bedtime') ? '🌙' : '🍽️'}
                  </span>
                  <input
                    type="text"
                    value={m.slot_name}
                    onChange={e => updateMeal(idx, 'slot_name', e.target.value)}
                    style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', border: '1px solid transparent', background: 'transparent', padding: '2px 6px', borderRadius: 4 }}
                    onFocus={e => e.target.style.border = '1px solid #0d9488'}
                    onBlur={e => e.target.style.border = '1px solid transparent'}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label className="text-caption text-muted" style={{ fontWeight: 600 }}>Timing:</label>
                  <input
                    type="text"
                    value={m.timing}
                    onChange={e => updateMeal(idx, 'timing', e.target.value)}
                    placeholder="e.g. 08:30 AM - 09:15 AM"
                    style={{ padding: '3px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1', width: 150 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeMealSlot(idx)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', padding: '2px 6px', fontSize: 12 }}
                    title="Remove this slot"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Row Body: Food Items & Recipe */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                    Primary Food Recipe &amp; Items *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={m.food_items}
                    onChange={e => updateMeal(idx, 'food_items', e.target.value)}
                    placeholder="e.g. 2 Jowar-Methi rotis + 1 bowl Lauki-Moong dal + 1 cup raw Cucumber salad"
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'white' }}
                  />
                </div>

                {/* Sub-grid: Portion, Purpose, Alternatives */}
                <div className="grid-3" style={{ gap: 10 }}>
                  <div>
                    <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      ⚖️ Portion / Quantity
                    </label>
                    <input
                      type="text"
                      value={m.portion}
                      onChange={e => updateMeal(idx, 'portion', e.target.value)}
                      placeholder="e.g. 2 rotis (70g) + 150g dal"
                      className="form-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, background: 'white' }}
                    />
                  </div>

                  <div>
                    <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      💡 Therapeutic Purpose
                    </label>
                    <input
                      type="text"
                      value={m.purpose}
                      onChange={e => updateMeal(idx, 'purpose', e.target.value)}
                      placeholder="e.g. Alkalizing, liver detox, blood sugar stability"
                      className="form-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, background: 'white' }}
                    />
                  </div>

                  <div>
                    <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                      🔄 Healthy Alternatives / Swaps
                    </label>
                    <input
                      type="text"
                      value={m.alternatives}
                      onChange={e => updateMeal(idx, 'alternatives', e.target.value)}
                      placeholder="e.g. 1 bowl Quinoa Khichdi with steamed greens"
                      className="form-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12, background: 'white' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: STRICT AVOIDANCES & NATUROPATHY LIFESTYLE RULES */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 'var(--space-md)' }}>
        {/* Avoidances */}
        <div style={{ background: '#fef2f2', padding: 14, borderRadius: 8, border: '1px solid #fca5a5' }}>
          <label className="text-body-sm" style={{ fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            ⛔ Strict Foods to Avoid / Prohibitions
          </label>
          <p className="text-caption text-muted" style={{ margin: '0 0 6px 0' }}>
            List specific triggers, allergens, or high-purine/high-GI foods to avoid completely
          </p>
          <textarea
            rows={3}
            value={strictAvoidances}
            onChange={e => setStrictAvoidances(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid #fca5a5' }}
          />
        </div>

        {/* Naturopathy Lifestyle & Yoga Rules */}
        <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 8, border: '1px solid #86efac' }}>
          <label className="text-body-sm" style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            🧘 Naturopathy Lifestyle, Solar &amp; Yoga Rules
          </label>
          <p className="text-caption text-muted" style={{ margin: '0 0 6px 0' }}>
            Solar exposure, chewing guidelines, meal timing intervals, and post-meal walks
          </p>
          <textarea
            rows={3}
            value={naturopathyRules}
            onChange={e => setNaturopathyRules(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '8px 12px', fontSize: 13, background: 'white', border: '1px solid #86efac' }}
          />
        </div>
      </div>

      {/* SECTION 4: DOCTOR INTERNAL NOTES */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
          📝 Doctor Internal Notes &amp; Follow-up Plan (Private to Medical Team)
        </label>
        <textarea
          rows={2}
          value={doctorNotes}
          onChange={e => setDoctorNotes(e.target.value)}
          className="form-input"
          style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
        />
      </div>

      {/* SECTION 5: DRAFT VS PUBLISH CONTROLS */}
      <div
        style={{
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
            <span>🟡 <strong>Draft Mode:</strong> Saved privately to doctor records. Patient and trainer will NOT see until published.</span>
          ) : (
            <span>🟢 <strong>Published Mode:</strong> Active on Patient Mobile App &amp; Trainer Dashboard.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Action 1: Save Draft */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSavePlan('draft')}
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

          {/* Action 2: Publish to Client & Trainer */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSavePlan('published')}
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

      {/* MODAL 1: LOAD FROM TEMPLATE LIBRARY */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 'var(--space-lg)', borderRadius: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>📚</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Clinical Diet Template Library</h3>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowTemplateModal(false)}>✕</button>
            </div>

            <p className="text-body-sm text-muted" style={{ margin: '0 0 14px 0' }}>
              Select a clinical protocol to populate the 7-stage meal schedule, calorie targets, and avoidances with 1-click.
            </p>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '12px 16px',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>{tmpl.name}</strong>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>{tmpl.target_calories_kcal} kcal</span>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>{tmpl.dietary_type}</span>
                    </div>
                    <div className="text-caption text-muted" style={{ marginBottom: 4 }}>
                      Condition: <strong>{tmpl.condition}</strong> • Target BMI: <code>{tmpl.target_bmi_range}</code>
                    </div>
                    <div className="text-caption text-muted" style={{ lineHeight: 1.4 }}>
                      {tmpl.description}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap', fontWeight: 600 }}
                  >
                    Apply Template →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-CLICK CLONE FROM EXISTING PATIENT */}
      {showCloneModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 'var(--space-lg)', borderRadius: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>👥</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Clone Regimen from Patient</h3>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowCloneModal(false)}>✕</button>
            </div>

            <p className="text-body-sm text-muted" style={{ margin: '0 0 12px 0' }}>
              Find a patient with similar height, weight, BMI, or condition and clone their tailored regimen in 1-click.
            </p>

            <input
              type="text"
              placeholder="🔍 Search patients by name, condition, or BMI..."
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '8px 12px', marginBottom: 12 }}
            />

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patients
                .filter(p => !patientFilter || (p.user_profiles?.full_name || '').toLowerCase().includes(patientFilter.toLowerCase()))
                .map(p => {
                  const prof = p.customer_profiles?.[0] || p.customer_profiles || {}
                  return (
                    <div
                      key={p.id}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '10px 14px',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {p.user_profiles?.full_name || 'Patient'}
                        </div>
                        <div className="text-caption text-muted">
                          BMI: <strong>{prof.bmi || '—'}</strong> • Height: {prof.height_cm || '—'} cm • Weight: {prof.weight_kg || '—'} kg
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCloneFromPatient(p)}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: 600 }}
                      >
                        Clone Regimen 📋
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SAVE AS NEW TEMPLATE */}
      {showSaveTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 'var(--space-lg)', borderRadius: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>💾</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Save Regimen as Reusable Template</h3>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowSaveTemplateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveAsTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1400 kcal PCOD &amp; Thyroid Rejuvenation Protocol"
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Target Health Condition / Profile
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypothyroid / High Uric Acid / Weight Loss"
                  value={newTemplateCondition}
                  onChange={e => setNewTemplateCondition(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 12, color: '#64748b' }}>
                💡 This template will save all {meals.length} meal slots, macro splits ({targetCalories} kcal), and avoidances into your Doctor Template Library for 1-click reuse across future patients.
              </div>

              <div className="flex justify-end gap-sm" style={{ marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowSaveTemplateModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving…' : 'Save Template to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
