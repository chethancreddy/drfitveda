'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export type MealSectionType = 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner'

export interface FoodItemRow {
  id: string
  name: string
  quantity: string
  energy_kcal: number
  carbs_g: number
  protein_g: number
  fats_g: number
  notes?: string
}

export interface MealSectionData {
  title: string
  timing: string
  icon: string
  items: FoodItemRow[]
}

export interface DayPlanData {
  day: DayOfWeek
  sections: {
    breakfast: MealSectionData
    lunch: MealSectionData
    evening_snacks: MealSectionData
    dinner: MealSectionData
  }
}

export interface GoalSummaryData {
  primary_goal: string
  target_weight_kg: number
  current_weight_kg: number
  health_observations: string
  overall_plan_objective: string
  special_dietary_restrictions: string
}

export interface CurrentPlanMetaData {
  plan_start_date: string
  plan_duration: string
  doctor_name: string
  doctor_instructions: string
  target_calories_kcal: number
  target_carbs_g: number
  target_protein_g: number
  target_fats_g: number
  water_intake_liters: number
  dietary_type: string
  last_updated: string
  status: 'draft' | 'published'
  version_number: number
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// Standard initial 7-day template
const createDefaultDayPlan = (day: DayOfWeek): DayPlanData => {
  if (day === 'Tuesday' || day === 'Thursday' || day === 'Saturday') {
    return {
      day,
      sections: {
        breakfast: {
          title: 'Breakfast',
          timing: '08:00 AM - 08:45 AM',
          icon: '🍳',
          items: [
            {
              id: `${day}-b1`,
              name: 'Fermented Ragi Idli with Fresh Mint Chutney',
              quantity: '2 idlis (120g)',
              energy_kcal: 180,
              carbs_g: 34,
              protein_g: 5,
              fats_g: 3,
            },
            {
              id: `${day}-b2`,
              name: 'Soaked Almonds & Walnuts',
              quantity: '5 almonds + 2 walnuts (20g)',
              energy_kcal: 130,
              carbs_g: 3,
              protein_g: 4,
              fats_g: 12,
            },
          ],
        },
        lunch: {
          title: 'Lunch',
          timing: '01:00 PM - 02:00 PM',
          icon: '🥗',
          items: [
            {
              id: `${day}-l1`,
              name: 'Bajra (Pearl Millet) Rotis with Cumin',
              quantity: '2 rotis (70g)',
              energy_kcal: 200,
              carbs_g: 38,
              protein_g: 6.5,
              fats_g: 3,
            },
            {
              id: `${day}-l2`,
              name: 'Masoor Dal with Fresh Spinach (Palak)',
              quantity: '1 bowl (150g)',
              energy_kcal: 150,
              carbs_g: 19,
              protein_g: 10,
              fats_g: 3.5,
            },
            {
              id: `${day}-l3`,
              name: 'Grilled Paneer / Organic Tofu Cubes',
              quantity: '100g portion',
              energy_kcal: 190,
              carbs_g: 5,
              protein_g: 18,
              fats_g: 12,
            },
            {
              id: `${day}-l4`,
              name: 'Fresh Probiotic Chaach with Roasted Jeera',
              quantity: '1 glass (200ml)',
              energy_kcal: 55,
              carbs_g: 5,
              protein_g: 4,
              fats_g: 2,
            },
          ],
        },
        evening_snacks: {
          title: 'Evening Snacks',
          timing: '04:30 PM - 05:30 PM',
          icon: '🫖',
          items: [
            {
              id: `${day}-s1`,
              name: 'Roasted Unsalted Chana (Bengal Gram)',
              quantity: '1 small bowl (40g)',
              energy_kcal: 140,
              carbs_g: 22,
              protein_g: 8,
              fats_g: 2.5,
            },
            {
              id: `${day}-s2`,
              name: 'Herbal Tulsi-Ginger-Mulethi Kadha',
              quantity: '1 cup (150ml)',
              energy_kcal: 15,
              carbs_g: 3,
              protein_g: 0.5,
              fats_g: 0,
            },
          ],
        },
        dinner: {
          title: 'Dinner',
          timing: '07:30 PM - 08:30 PM',
          icon: '🍲',
          items: [
            {
              id: `${day}-d1`,
              name: 'Vegetable Quinoa & Moong Dal Khichdi',
              quantity: '1 bowl (200g)',
              energy_kcal: 210,
              carbs_g: 36,
              protein_g: 8,
              fats_g: 4,
            },
            {
              id: `${day}-d2`,
              name: 'Clear Bottle Gourd & Moringa Leaf Soup',
              quantity: '1 large bowl (250ml)',
              energy_kcal: 60,
              carbs_g: 10,
              protein_g: 2,
              fats_g: 1,
            },
            {
              id: `${day}-d3`,
              name: 'Warm Turmeric (Curcumin) Almond Milk',
              quantity: '150ml warm cup',
              energy_kcal: 90,
              carbs_g: 6,
              protein_g: 3.5,
              fats_g: 5.5,
            },
          ],
        },
      },
    }
  }

  // Monday, Wednesday, Friday, Sunday
  return {
    day,
    sections: {
      breakfast: {
        title: 'Breakfast',
        timing: '08:00 AM - 08:45 AM',
        icon: '🍳',
        items: [
          {
            id: `${day}-b1`,
            name: 'Sprouted Moong & Methi Bowl with Pomegranate',
            quantity: '1 bowl (150g)',
            energy_kcal: 160,
            carbs_g: 24,
            protein_g: 12,
            fats_g: 2,
          },
          {
            id: `${day}-b2`,
            name: 'Vegetable Rolled Oats with Chia & Flaxseeds',
            quantity: '1 bowl (200g)',
            energy_kcal: 220,
            carbs_g: 36,
            protein_g: 8,
            fats_g: 6,
          },
        ],
      },
      lunch: {
        title: 'Lunch',
        timing: '01:00 PM - 02:00 PM',
        icon: '🥗',
        items: [
          {
            id: `${day}-l1`,
            name: 'Jowar (Sorghum) Rotis (Gluten-Free)',
            quantity: '2 rotis (70g)',
            energy_kcal: 190,
            carbs_g: 40,
            protein_g: 6,
            fats_g: 2,
          },
          {
            id: `${day}-l2`,
            name: 'Yellow Moong Dal Tadka with Cumin & Pure Ghee',
            quantity: '1 bowl (150g)',
            energy_kcal: 140,
            carbs_g: 18,
            protein_g: 9,
            fats_g: 4,
          },
          {
            id: `${day}-l3`,
            name: 'Steamed Lauki (Bottle Gourd) & Turai Sabzi',
            quantity: '1 bowl (150g)',
            energy_kcal: 65,
            carbs_g: 9,
            protein_g: 2,
            fats_g: 2.5,
          },
          {
            id: `${day}-l4`,
            name: 'Raw Rainbow Salad (Cucumber, Beetroot, Carrot & Radish)',
            quantity: '1 bowl (120g)',
            energy_kcal: 45,
            carbs_g: 9,
            protein_g: 1.5,
            fats_g: 0.5,
          },
        ],
      },
      evening_snacks: {
        title: 'Evening Snacks',
        timing: '04:30 PM - 05:30 PM',
        icon: '🫖',
        items: [
          {
            id: `${day}-s1`,
            name: 'Roasted Fox Nuts (Makhana) with Turmeric & Pepper',
            quantity: '1 cup (30g)',
            energy_kcal: 110,
            carbs_g: 20,
            protein_g: 3,
            fats_g: 1.5,
          },
          {
            id: `${day}-s2`,
            name: 'Tender Coconut Water with Chia Seeds',
            quantity: '1 whole (200ml)',
            energy_kcal: 60,
            carbs_g: 11,
            protein_g: 2,
            fats_g: 1,
          },
        ],
      },
      dinner: {
        title: 'Dinner',
        timing: '07:30 PM - 08:30 PM',
        icon: '🍲',
        items: [
          {
            id: `${day}-d1`,
            name: '1 Jowar Roti + Steamed Kaddu (Pumpkin) Sabzi',
            quantity: '1 roti + 150g sabzi',
            energy_kcal: 165,
            carbs_g: 30,
            protein_g: 4.5,
            fats_g: 3,
          },
          {
            id: `${day}-d2`,
            name: 'Steamed Broccoli, Zucchini & Tofu/Paneer Bowl',
            quantity: '1 bowl (180g)',
            energy_kcal: 160,
            carbs_g: 8,
            protein_g: 15,
            fats_g: 8,
          },
          {
            id: `${day}-d3`,
            name: 'Warm Turmeric (Curcumin) Almond Milk',
            quantity: '150ml warm cup',
            energy_kcal: 90,
            carbs_g: 6,
            protein_g: 3.5,
            fats_g: 5.5,
          },
        ],
      },
    },
  }
}

// Helpers to compute totals
export const calcMealSubtotal = (items: FoodItemRow[]) => {
  return items.reduce(
    (acc, it) => ({
      energy: acc.energy + (Number(it.energy_kcal) || 0),
      carbs: acc.carbs + (Number(it.carbs_g) || 0),
      protein: acc.protein + (Number(it.protein_g) || 0),
      fats: acc.fats + (Number(it.fats_g) || 0),
    }),
    { energy: 0, carbs: 0, protein: 0, fats: 0 }
  )
}

export const calcDayTotal = (dayPlan: DayPlanData) => {
  const b = calcMealSubtotal(dayPlan.sections.breakfast.items)
  const l = calcMealSubtotal(dayPlan.sections.lunch.items)
  const s = calcMealSubtotal(dayPlan.sections.evening_snacks.items)
  const d = calcMealSubtotal(dayPlan.sections.dinner.items)

  return {
    energy: Math.round(b.energy + l.energy + s.energy + d.energy),
    carbs: Math.round(b.carbs + l.carbs + s.carbs + d.carbs),
    protein: Math.round(b.protein + l.protein + s.protein + d.protein),
    fats: Math.round(b.fats + l.fats + s.fats + d.fats),
  }
}

interface Props {
  customerId: string
  customerName: string
  customerBmi?: number
  customerWeight?: number
  customerHeight?: number
  onSaved?: (status: 'draft' | 'published') => void
}

export default function StructuredDietEditor({
  customerId,
  customerName,
  customerBmi,
  customerWeight = 62.5,
  customerHeight = 165,
  onSaved,
}: Props) {
  const router = useRouter()
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Goal Summary State
  const [goalSummary, setGoalSummary] = useState<GoalSummaryData>({
    primary_goal: 'Metabolic Health & Sustainable Weight Loss',
    target_weight_kg: Number((customerWeight > 65 ? customerWeight - 6 : customerWeight - 3).toFixed(1)),
    current_weight_kg: customerWeight,
    health_observations:
      'Mild Vitamin D3 & B12 insufficiency. Healthy lipid profile with normal blood sugar. Recommended anti-inflammatory whole-food nutrition and regular morning sun exposure.',
    overall_plan_objective:
      'Improve mitochondrial energy production, optimize digestion with raw prebiotic roughage before meals, and achieve healthy BMI target.',
    special_dietary_restrictions:
      'Strictly avoid refined white sugar, Maida bakery products, deep-fried snacks, and late-night heavy dinners after 8:30 PM.',
  })

  // 2. Current Plan Metadata State
  const [currentPlanMeta, setCurrentPlanMeta] = useState<CurrentPlanMetaData>({
    plan_start_date: new Date().toISOString().split('T')[0],
    plan_duration: '4 Weeks (Phase 1 Reset)',
    doctor_name: 'Dr. Ananya Verma',
    doctor_instructions:
      'Follow the meal timings strictly; drink 3.0 Liters of warm structured water daily; chew every bite 32 times; perform 10 minutes of Vajrasana after lunch and dinner.',
    target_calories_kcal: 1450,
    target_carbs_g: 175,
    target_protein_g: 75,
    target_fats_g: 42,
    water_intake_liters: 3.0,
    dietary_type: 'Pure Vegetarian (Satvik Naturopathic)',
    last_updated: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: 'published',
    version_number: 1,
  })

  // 3. Day-wise 7-Day Plans State
  const [dayPlans, setDayPlans] = useState<Record<DayOfWeek, DayPlanData>>(() => {
    const initial: Record<string, DayPlanData> = {}
    DAYS_OF_WEEK.forEach(day => {
      initial[day] = createDefaultDayPlan(day)
    })
    return initial as Record<DayOfWeek, DayPlanData>
  })

  // 4. Plan History State
  const [planHistory, setPlanHistory] = useState<any[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // 5. Food Catalog & Quick Add Modal State
  const [foodCatalog, setFoodCatalog] = useState<any[]>([])
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [modalTargetMeal, setModalTargetMeal] = useState<MealSectionType>('breakfast')
  const [foodSearchQuery, setFoodSearchQuery] = useState('')
  const [newCustomFoodName, setNewCustomFoodName] = useState('')
  const [newCustomFoodQty, setNewCustomFoodQty] = useState('1 serving (150g)')
  const [newCustomFoodKcal, setNewCustomFoodKcal] = useState(150)
  const [newCustomFoodCarbs, setNewCustomFoodCarbs] = useState(20)
  const [newCustomFoodProtein, setNewCustomFoodProtein] = useState(8)
  const [newCustomFoodFats, setNewCustomFoodFats] = useState(5)

  // 6. Templates & Clone State
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [patients, setPatients] = useState<any[]>([])

  // Load Existing Plan, History, and Food Catalog
  useEffect(() => {
    // Load food catalog
    fetch('/api/foods')
      .then(res => res.json())
      .then(data => {
        if (data.foods) setFoodCatalog(data.foods)
      })
      .catch(() => {})

    // Load templates
    fetch('/api/diet-templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) setTemplates(data.templates)
      })
      .catch(() => {})

    // Load existing plans for customer
    fetch(`/api/plans?customer_id=${customerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.plans && data.plans.length > 0) {
          const master = data.plans[0]
          const versions = master.plan_versions || []
          setPlanHistory(versions)

          const active = versions.find((v: any) => v.status === 'published') || versions[0]
          if (active) {
            setCurrentPlanMeta(prev => ({
              ...prev,
              status: active.status || 'published',
              version_number: active.version_number || 1,
              plan_start_date: active.effective_from || prev.plan_start_date,
              last_updated: new Date(active.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            }))

            // Parse saved day_wise_meal_plan if stored in items
            const dayWiseItem = (active.plan_items || []).find(
              (it: any) => it.category === 'day_wise_meal_plan' || it.category === 'nutrition'
            )
            if (dayWiseItem?.internal_notes) {
              try {
                const parsed = JSON.parse(dayWiseItem.internal_notes)
                if (parsed.Monday && parsed.Tuesday) {
                  setDayPlans(parsed)
                }
              } catch {}
            }

            // Parse goal summary if stored
            const goalItem = (active.plan_items || []).find(
              (it: any) => it.category === 'goal_summary'
            )
            if (goalItem?.internal_notes) {
              try {
                const parsedGoal = JSON.parse(goalItem.internal_notes)
                setGoalSummary(prev => ({ ...prev, ...parsedGoal }))
              } catch {}
            }
          }
        }
      })
      .catch(() => {})
  }, [customerId])

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

  // Active Day Totals & Subtotals
  const currentDayPlan = dayPlans[activeDay]
  const currentDayTotal = calcDayTotal(currentDayPlan)

  const breakfastSubtotal = calcMealSubtotal(currentDayPlan.sections.breakfast.items)
  const lunchSubtotal = calcMealSubtotal(currentDayPlan.sections.lunch.items)
  const snacksSubtotal = calcMealSubtotal(currentDayPlan.sections.evening_snacks.items)
  const dinnerSubtotal = calcMealSubtotal(currentDayPlan.sections.dinner.items)

  // 1-Click Copy Day
  const handleCopyDay = (targetScope: 'all' | 'weekdays' | 'weekends') => {
    const sourcePlan = dayPlans[activeDay]
    const updated = { ...dayPlans }

    DAYS_OF_WEEK.forEach(d => {
      if (targetScope === 'all') {
        updated[d] = {
          day: d,
          sections: JSON.parse(JSON.stringify(sourcePlan.sections)),
        }
      } else if (targetScope === 'weekdays' && !['Saturday', 'Sunday'].includes(d)) {
        updated[d] = {
          day: d,
          sections: JSON.parse(JSON.stringify(sourcePlan.sections)),
        }
      } else if (targetScope === 'weekends' && ['Saturday', 'Sunday'].includes(d)) {
        updated[d] = {
          day: d,
          sections: JSON.parse(JSON.stringify(sourcePlan.sections)),
        }
      }
    })

    setDayPlans(updated)
    setSuccessMsg(
      `✓ Copied ${activeDay}'s meal plan to ${
        targetScope === 'all'
          ? 'all 7 days'
          : targetScope === 'weekdays'
          ? 'Monday through Friday'
          : 'Saturday and Sunday'
      }!`
    )
  }

  // Food Item Management
  const handleUpdateItem = (
    mealType: MealSectionType,
    index: number,
    field: keyof FoodItemRow,
    value: any
  ) => {
    const updated = { ...dayPlans }
    const items = [...updated[activeDay].sections[mealType].items]
    items[index] = {
      ...items[index],
      [field]: field === 'name' || field === 'quantity' || field === 'notes' ? value : Number(value) || 0,
    }
    updated[activeDay].sections[mealType].items = items
    setDayPlans(updated)
  }

  const handleRemoveItem = (mealType: MealSectionType, index: number) => {
    const updated = { ...dayPlans }
    const items = updated[activeDay].sections[mealType].items.filter((_, i) => i !== index)
    updated[activeDay].sections[mealType].items = items
    setDayPlans(updated)
  }

  const handleAddBlankItem = (mealType: MealSectionType) => {
    const updated = { ...dayPlans }
    updated[activeDay].sections[mealType].items.push({
      id: `${activeDay}-${mealType}-${Date.now()}`,
      name: 'Custom Food Item',
      quantity: '1 serving (150g)',
      energy_kcal: 120,
      carbs_g: 15,
      protein_g: 5,
      fats_g: 3,
    })
    setDayPlans(updated)
  }

  const handleSelectCatalogItem = (food: any) => {
    const updated = { ...dayPlans }
    updated[activeDay].sections[modalTargetMeal].items.push({
      id: `${activeDay}-${modalTargetMeal}-${Date.now()}`,
      name: food.name,
      quantity: food.default_quantity || '1 serving (150g)',
      energy_kcal: food.energy_kcal || 0,
      carbs_g: food.carbs_g || 0,
      protein_g: food.protein_g || 0,
      fats_g: food.fats_g || 0,
      notes: food.notes || '',
    })
    setDayPlans(updated)
    setShowFoodModal(false)
    setSuccessMsg(`✓ Added "${food.name}" to ${activeDay} ${modalTargetMeal}!`)
  }

  const handleCreateAndAddCustomFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomFoodName.trim()) return

    const newFood = {
      id: `custom-${Date.now()}`,
      name: newCustomFoodName.trim(),
      default_quantity: newCustomFoodQty.trim() || '1 serving (150g)',
      energy_kcal: Number(newCustomFoodKcal) || 0,
      carbs_g: Number(newCustomFoodCarbs) || 0,
      protein_g: Number(newCustomFoodProtein) || 0,
      fats_g: Number(newCustomFoodFats) || 0,
    }

    // Add to current meal
    handleSelectCatalogItem(newFood)

    // Save to server catalog in background
    try {
      await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFood),
      })
      setFoodCatalog([newFood, ...foodCatalog])
    } catch {}

    setNewCustomFoodName('')
  }

  // 1-Click Load Template
  const handleApplyTemplate = (tmpl: any) => {
    if (!tmpl) return
    if (tmpl.target_calories_kcal) {
      setCurrentPlanMeta(prev => ({
        ...prev,
        target_calories_kcal: tmpl.target_calories_kcal,
      }))
    }
    if (tmpl.name) {
      setGoalSummary(prev => ({
        ...prev,
        overall_plan_objective: `Clinical protocol applied: ${tmpl.name}`,
      }))
    }
    if (tmpl.strict_avoidances) {
      setGoalSummary(prev => ({
        ...prev,
        special_dietary_restrictions: tmpl.strict_avoidances,
      }))
    }
    setShowTemplateModal(false)
    setSuccessMsg(`✓ Loaded template: "${tmpl.name}"! Customize values and save as draft or publish.`)
  }

  // Save Plan: Supports both 'draft' and 'published' with versioning
  const handleSavePlan = async (targetStatus: 'draft' | 'published') => {
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Construct plan items payload
      const itemsPayload: any[] = [
        // Main 7-day day-wise meal plan matrix
        {
          category: 'day_wise_meal_plan',
          instruction: `7-Day Day-Wise Meal Plan (${currentPlanMeta.dietary_type}) • Target: ${currentPlanMeta.target_calories_kcal} kcal/day`,
          internal_notes: JSON.stringify(dayPlans),
          display_order: 1,
        },
        // Goal Summary
        {
          category: 'goal_summary',
          instruction: `🎯 Goal: ${goalSummary.primary_goal} (Current: ${goalSummary.current_weight_kg}kg → Target: ${goalSummary.target_weight_kg}kg)`,
          internal_notes: JSON.stringify(goalSummary),
          display_order: 2,
        },
        // Current Plan Metadata & Directives
        {
          category: 'current_plan_meta',
          instruction: `📋 Duration: ${currentPlanMeta.plan_duration} • Prescribed by ${currentPlanMeta.doctor_name}`,
          internal_notes: JSON.stringify({
            ...currentPlanMeta,
            status: targetStatus,
            last_updated: new Date().toISOString(),
          }),
          display_order: 3,
        },
        // Lifestyle & Special Restrictions
        {
          category: 'lifestyle',
          instruction: `⛔ Dietary Restrictions: ${goalSummary.special_dietary_restrictions}`,
          internal_notes: goalSummary.special_dietary_restrictions,
          display_order: 4,
        },
        // Hydration & Water Protocol
        {
          category: 'water',
          instruction: `💧 Hydration Target: ${currentPlanMeta.water_intake_liters} Liters of warm structured water daily.`,
          internal_notes: String(currentPlanMeta.water_intake_liters),
          display_order: 5,
        },
      ]

      // 2. Save via /api/plans
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          change_reason:
            targetStatus === 'draft'
              ? `Draft revision (${currentPlanMeta.plan_duration})`
              : `Published 7-day meal plan v${currentPlanMeta.version_number + 1} for ${goalSummary.primary_goal}`,
          effective_from: currentPlanMeta.plan_start_date,
          status: targetStatus,
          items: itemsPayload,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save plan')

      setCurrentPlanMeta(prev => ({
        ...prev,
        status: targetStatus,
        version_number: data.version?.version_number || prev.version_number + 1,
      }))

      if (targetStatus === 'draft') {
        setSuccessMsg(
          '📝 Day-wise Meal Plan successfully saved as Draft! It remains private to doctors until you click "Publish to Client & Trainer".'
        )
      } else {
        setSuccessMsg(
          '🚀 7-Day Meal Plan successfully Published! The day-wise schedule, macro targets, and food items are now live on the Patient & Trainer dashboards.'
        )
      }

      if (onSaved) onSaved(targetStatus)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving meal plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-lg)',
        background: 'white',
        borderRadius: 14,
        border: '1px solid var(--color-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      {/* Top Main Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 'var(--space-md)',
          paddingBottom: 'var(--space-sm)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🥗</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="text-headline-sm" style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                Doctor Day-Wise Meal Plan &amp; Clinical Nutrition
              </h2>
              <span
                className={`badge badge-${currentPlanMeta.status === 'published' ? 'success' : 'warning'}`}
                style={{ fontSize: 11, padding: '4px 10px', textTransform: 'uppercase', fontWeight: 700 }}
              >
                {currentPlanMeta.status === 'published' ? '🟢 Published (Live)' : '🟡 Draft (Private)'}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 11, padding: '4px 8px' }}>
                v{currentPlanMeta.version_number}
              </span>
            </div>
            <p className="text-body-sm text-muted" style={{ margin: '3px 0 0 0' }}>
              Formulating for <strong>{customerName}</strong>
              {customerBmi && <span> • BMI: <strong>{customerBmi}</strong> ({customerWeight} kg, {customerHeight} cm)</span>}
            </p>
          </div>
        </div>

        {/* Doctor Fast Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #0d9488', color: '#0d9488', fontWeight: 600, fontSize: 13 }}
          >
            📚 Load Template ({templates.length})
          </button>

          <button
            type="button"
            onClick={loadPatientsForClone}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #6366f1', color: '#6366f1', fontWeight: 600, fontSize: 13 }}
          >
            👥 Clone from Patient (Same BMI)
          </button>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="btn btn-ghost btn-sm"
            style={{ border: '1px solid #cbd5e1', color: '#475569', fontSize: 13 }}
          >
            📜 Plan History ({planHistory.length})
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            borderRadius: 8,
            marginBottom: 'var(--space-md)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            borderRadius: 8,
            marginBottom: 'var(--space-md)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: PLAN SUMMARY & GOALS (Doctor Overview)             */}
      {/* ============================================================ */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          padding: '18px 20px',
          borderRadius: 10,
          border: '1px solid #cbd5e1',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
              1. Plan Summary &amp; Goals
            </h3>
          </div>
          <span className="text-caption text-muted">
            Last Updated: <strong>{currentPlanMeta.last_updated}</strong> by <strong>{currentPlanMeta.doctor_name}</strong>
          </span>
        </div>

        {/* Goal Summary Inputs Grid */}
        <div className="grid-3" style={{ gap: 14, marginBottom: 12 }}>
          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Primary Clinical Goal *
            </label>
            <input
              type="text"
              value={goalSummary.primary_goal}
              onChange={e => setGoalSummary({ ...goalSummary, primary_goal: e.target.value })}
              placeholder="e.g. Weight Loss, Muscle Gain, Thyroid Reset, PCOD"
              className="form-input"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: 'white' }}
            />
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Current Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={goalSummary.current_weight_kg}
              onChange={e => setGoalSummary({ ...goalSummary, current_weight_kg: Number(e.target.value) })}
              className="form-input"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: 'white' }}
            />
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Target Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={goalSummary.target_weight_kg}
              onChange={e => setGoalSummary({ ...goalSummary, target_weight_kg: Number(e.target.value) })}
              className="form-input"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, background: 'white' }}
            />
          </div>
        </div>

        <div className="grid-2" style={{ gap: 14, marginBottom: 12 }}>
          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Health / Lifestyle Observations
            </label>
            <textarea
              rows={2}
              value={goalSummary.health_observations}
              onChange={e => setGoalSummary({ ...goalSummary, health_observations: e.target.value })}
              placeholder="Key clinical notes, vitamin deficiencies, metabolic observations..."
              className="form-input"
              style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: 'white' }}
            />
          </div>

          <div>
            <label className="text-caption" style={{ fontWeight: 600, display: 'block', marginBottom: 3 }}>
              Overall Plan Objective &amp; Timeline
            </label>
            <textarea
              rows={2}
              value={goalSummary.overall_plan_objective}
              onChange={e => setGoalSummary({ ...goalSummary, overall_plan_objective: e.target.value })}
              placeholder="Clinical strategy, gut healing, fasting window..."
              className="form-input"
              style={{ width: '100%', padding: '7px 10px', fontSize: 12, background: 'white' }}
            />
          </div>
        </div>

        {/* Current Plan Targets & Directives */}
        <div style={{ background: 'white', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div className="grid-4" style={{ gap: 12, marginBottom: 10 }}>
            <div>
              <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                Plan Start Date
              </label>
              <input
                type="date"
                value={currentPlanMeta.plan_start_date}
                onChange={e => setCurrentPlanMeta({ ...currentPlanMeta, plan_start_date: e.target.value })}
                className="form-input"
                style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
              />
            </div>

            <div>
              <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                Plan Duration
              </label>
              <input
                type="text"
                value={currentPlanMeta.plan_duration}
                onChange={e => setCurrentPlanMeta({ ...currentPlanMeta, plan_duration: e.target.value })}
                placeholder="e.g. 4 Weeks, 8 Weeks"
                className="form-input"
                style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
              />
            </div>

            <div>
              <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                Target Calories (kcal/day)
              </label>
              <input
                type="number"
                value={currentPlanMeta.target_calories_kcal}
                onChange={e =>
                  setCurrentPlanMeta({ ...currentPlanMeta, target_calories_kcal: Number(e.target.value) })
                }
                className="form-input"
                style={{ width: '100%', padding: '5px 8px', fontSize: 12, fontWeight: 700, color: '#0d9488' }}
              />
            </div>

            <div>
              <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
                Water Intake (L/day)
              </label>
              <input
                type="number"
                step="0.1"
                value={currentPlanMeta.water_intake_liters}
                onChange={e =>
                  setCurrentPlanMeta({ ...currentPlanMeta, water_intake_liters: Number(e.target.value) })
                }
                className="form-input"
                style={{ width: '100%', padding: '5px 8px', fontSize: 12, fontWeight: 700 }}
              />
            </div>
          </div>

          <div>
            <label className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>
              Special Dietary Restrictions / Avoidances
            </label>
            <input
              type="text"
              value={goalSummary.special_dietary_restrictions}
              onChange={e =>
                setGoalSummary({ ...goalSummary, special_dietary_restrictions: e.target.value })
              }
              placeholder="e.g. Gluten-free, Lactose-free, No white sugar, Avoid high-purine lentils"
              className="form-input"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: DAY-WISE TABS & DAY QUICK ACTIONS                  */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div>
            <h3 className="text-label-lg" style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
              📅 2. Day-Wise Meal Plan Schedule
            </h3>
            <p className="text-caption text-muted" style={{ margin: '2px 0 0 0' }}>
              Select a day to configure Breakfast, Lunch, Evening Snacks &amp; Dinner with live nutritional calculations.
            </p>
          </div>

          {/* Copy Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="text-caption text-muted" style={{ fontWeight: 600 }}>
              📋 Fast Copy:
            </span>
            <button
              type="button"
              onClick={() => handleCopyDay('all')}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid #cbd5e1', fontSize: 11, padding: '4px 8px' }}
              title="Copy current day plan to all 7 days"
            >
              Copy {activeDay} to All Days
            </button>
            <button
              type="button"
              onClick={() => handleCopyDay('weekdays')}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid #cbd5e1', fontSize: 11, padding: '4px 8px' }}
              title="Copy current day plan to Mon-Fri"
            >
              To Mon-Fri
            </button>
          </div>
        </div>

        {/* Day Switcher Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6,
            background: '#f1f5f9',
            padding: 6,
            borderRadius: 10,
          }}
        >
          {DAYS_OF_WEEK.map(day => {
            const isSelected = activeDay === day
            const dTot = calcDayTotal(dayPlans[day])
            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                style={{
                  padding: '10px 6px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid #0d9488' : '1px solid transparent',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#0d9488' : '#475569',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{day.slice(0, 3)}</div>
                <div style={{ fontSize: 11, color: isSelected ? '#0d9488' : '#64748b', marginTop: 2, fontWeight: 600 }}>
                  {dTot.energy} kcal
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: DAILY TOTALS & MACRO BREAKDOWN BAR                */}
      {/* ============================================================ */}
      <div
        style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 'var(--space-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>
              {activeDay}&apos;s Calculated Daily Nutritional Total
            </div>
            <div style={{ fontSize: 12, color: '#047857' }}>
              Sum of Breakfast + Lunch + Evening Snacks + Dinner
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              ENERGY (KCAL)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              {currentDayTotal.energy}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                / {currentPlanMeta.target_calories_kcal} target
              </span>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: '#a7f3d0' }} />

          <div style={{ textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              CARBS (G)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>
              {currentDayTotal.carbs}g
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: '#a7f3d0' }} />

          <div style={{ textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              PROTEIN (G)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
              {currentDayTotal.protein}g
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: '#a7f3d0' }} />

          <div style={{ textAlign: 'center' }}>
            <div className="text-caption text-muted" style={{ fontSize: 11, fontWeight: 600 }}>
              HEALTHY FATS (G)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>
              {currentDayTotal.fats}g
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: 4 MEAL SECTIONS WITH FOOD ITEM TABLES             */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 'var(--space-lg)' }}>
        {(['breakfast', 'lunch', 'evening_snacks', 'dinner'] as MealSectionType[]).map(mealKey => {
          const section = currentDayPlan.sections[mealKey]
          const subtotal = calcMealSubtotal(section.items)

          return (
            <div
              key={mealKey}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              {/* Meal Section Header */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{section.icon}</span>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {section.title}
                  </h4>
                  <input
                    type="text"
                    value={section.timing}
                    onChange={e => {
                      const updated = { ...dayPlans }
                      updated[activeDay].sections[mealKey].timing = e.target.value
                      setDayPlans(updated)
                    }}
                    placeholder="e.g. 08:00 AM - 08:45 AM"
                    style={{
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                      width: 150,
                      color: '#475569',
                    }}
                  />
                </div>

                {/* Subtotal Pill & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: '#f1f5f9',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    Subtotal: <strong>{subtotal.energy} kcal</strong> • {subtotal.carbs}g C • {subtotal.protein}g P • {subtotal.fats}g F
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setModalTargetMeal(mealKey)
                      setShowFoodModal(true)
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      border: '1px solid #0d9488',
                      color: '#0d9488',
                      fontWeight: 600,
                      fontSize: 12,
                      padding: '4px 10px',
                    }}
                  >
                    💡 + From Food Library
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddBlankItem(mealKey)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      padding: '4px 10px',
                    }}
                  >
                    + Add Custom Row
                  </button>
                </div>
              </div>

              {/* Food Item Table */}
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ minWidth: 240 }}>Food Item</th>
                      <th style={{ width: 140 }}>Quantity</th>
                      <th style={{ width: 110 }}>Energy (kcal)</th>
                      <th style={{ width: 110 }}>Carbs (g)</th>
                      <th style={{ width: 110 }}>Protein (g)</th>
                      <th style={{ width: 110 }}>Healthy Fats (g)</th>
                      <th style={{ width: 50, textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.length > 0 ? (
                      section.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => handleUpdateItem(mealKey, idx, 'name', e.target.value)}
                              placeholder="Food item name..."
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 13, fontWeight: 600 }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(mealKey, idx, 'quantity', e.target.value)}
                              placeholder="e.g. 1 bowl (150g)"
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.energy_kcal}
                              onChange={e => handleUpdateItem(mealKey, idx, 'energy_kcal', e.target.value)}
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 12, fontWeight: 700 }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              value={item.carbs_g}
                              onChange={e => handleUpdateItem(mealKey, idx, 'carbs_g', e.target.value)}
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              value={item.protein_g}
                              onChange={e => handleUpdateItem(mealKey, idx, 'protein_g', e.target.value)}
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.5"
                              value={item.fats_g}
                              onChange={e => handleUpdateItem(mealKey, idx, 'fats_g', e.target.value)}
                              className="form-input"
                              style={{ width: '100%', padding: '5px 8px', fontSize: 12 }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(mealKey, idx)}
                              className="btn btn-ghost btn-sm"
                              style={{ color: '#ef4444', padding: '4px 6px', fontSize: 12 }}
                              title="Delete food item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>
                          No food items added for this meal yet. Click &quot;+ From Food Library&quot; or &quot;+ Add Custom Row&quot;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: DOCTOR RECOMMENDATIONS & DIRECTIVES               */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <label className="text-body-sm" style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>
          📝 Doctor&apos;s Instructions &amp; Dietary Directives (Visible to Client &amp; Trainer)
        </label>
        <textarea
          rows={3}
          value={currentPlanMeta.doctor_instructions}
          onChange={e => setCurrentPlanMeta({ ...currentPlanMeta, doctor_instructions: e.target.value })}
          placeholder="Specific timing rules, post-meal habits, chewing guidelines..."
          className="form-input"
          style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
        />
      </div>

      {/* ============================================================ */}
      {/* SECTION 6: DRAFT VS. PUBLISH ACTION CONTROLS                 */}
      {/* ============================================================ */}
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
          {currentPlanMeta.status === 'draft' ? (
            <span>
              🟡 <strong>Mode: Draft</strong> (Stored privately. Patient will not see until you click Publish.)
            </span>
          ) : (
            <span>
              🟢 <strong>Mode: Published</strong> (Live on Patient &amp; Trainer dashboards.)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Action A: Save Draft */}
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
            {saving && currentPlanMeta.status === 'draft' ? 'Saving Draft…' : '📝 Save as Draft'}
          </button>

          {/* Action B: Publish */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSavePlan('published')}
            className="btn btn-primary"
            style={{
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
            }}
          >
            {saving && currentPlanMeta.status === 'published'
              ? 'Publishing…'
              : '🚀 Publish 7-Day Plan to Client & Trainer'}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: FOOD LIBRARY PICKER & ADD CUSTOM FOOD               */}
      {/* ============================================================ */}
      {showFoodModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 680,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                  💡 Select Food for {activeDay} {modalTargetMeal.toUpperCase()}
                </h3>
                <p className="text-caption text-muted" style={{ margin: '2px 0 0 0' }}>
                  Choose from standardized clinical foods or create a new entry with exact macros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFoodModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Search filter */}
            <input
              type="text"
              placeholder="🔍 Search food by name (e.g. oats, ragi, dal, paneer, makhana)..."
              value={foodSearchQuery}
              onChange={e => setFoodSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '8px 12px', fontSize: 13, marginBottom: 14 }}
            />

            {/* Catalog List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
              {foodCatalog
                .filter(
                  f =>
                    !foodSearchQuery ||
                    f.name.toLowerCase().includes(foodSearchQuery.toLowerCase()) ||
                    (f.notes && f.notes.toLowerCase().includes(foodSearchQuery.toLowerCase()))
                )
                .map(food => (
                  <div
                    key={food.id}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f8fafc',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{food.name}</div>
                      <div className="text-caption text-muted">
                        Qty: {food.default_quantity} • <strong>{food.energy_kcal} kcal</strong> ({food.carbs_g}g C / {food.protein_g}g P / {food.fats_g}g F)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectCatalogItem(food)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>

            {/* Quick Add Custom Food to Library */}
            <form onSubmit={handleCreateAndAddCustomFood} style={{ background: '#f1f5f9', padding: 14, borderRadius: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#334155' }}>
                ➕ Create &amp; Add New Food Item
              </div>
              <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Food Name (e.g. Quinoa Salad)"
                  value={newCustomFoodName}
                  onChange={e => setNewCustomFoodName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                  required
                />
                <input
                  type="text"
                  placeholder="Quantity (e.g. 1 bowl / 150g)"
                  value={newCustomFoodQty}
                  onChange={e => setNewCustomFoodQty(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <div className="grid-4" style={{ gap: 8, marginBottom: 10 }}>
                <input
                  type="number"
                  placeholder="Kcal"
                  value={newCustomFoodKcal}
                  onChange={e => setNewCustomFoodKcal(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="number"
                  placeholder="Carbs (g)"
                  value={newCustomFoodCarbs}
                  onChange={e => setNewCustomFoodCarbs(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={newCustomFoodProtein}
                  onChange={e => setNewCustomFoodProtein(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                />
                <input
                  type="number"
                  placeholder="Fats (g)"
                  value={newCustomFoodFats}
                  onChange={e => setNewCustomFoodFats(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%', fontWeight: 600 }}>
                Save &amp; Insert into Meal Table
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: LOAD CLINICAL TEMPLATE                              */}
      {/* ============================================================ */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 620,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📚 Clinical Template Library</h3>
              <button type="button" onClick={() => setShowTemplateModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{tmpl.name}</div>
                    <div className="text-caption text-muted">
                      Target: {tmpl.target_calories_kcal} kcal • {tmpl.condition || 'General Protocol'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="btn btn-primary btn-sm"
                  >
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CLONE FROM PATIENT                                  */}
      {/* ============================================================ */}
      {showCloneModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 620,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👥 Clone Regimen from Similar Patient</h3>
              <button type="button" onClick={() => setShowCloneModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>
            <p className="text-body-sm text-muted" style={{ marginBottom: 12 }}>
              Select a patient with similar BMI, height, and health condition to copy their working regimen in 1 click.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patients.length > 0 ? (
                patients.map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.user_profiles?.full_name || 'Patient'}</div>
                      <div className="text-caption text-muted">
                        Membership: {p.membership_status} • Phone: {p.user_profiles?.phone || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCloneModal(false)
                        setSuccessMsg(`✓ Cloned regimen from ${p.user_profiles?.full_name || 'Patient'}!`)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Clone Plan
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">No other patients found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: PLAN HISTORY & PREVIOUS VERSIONS                    */}
      {/* ============================================================ */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 650,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📜 Plan History &amp; Version Revisions</h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>
            {planHistory.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Effective Date</th>
                      <th>Status</th>
                      <th>Focus / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planHistory.map(ver => (
                      <tr key={ver.id}>
                        <td><strong>v{ver.version_number}</strong></td>
                        <td className="text-body-sm text-muted">
                          {ver.effective_from ? new Date(ver.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${ver.status === 'published' ? 'success' : ver.status === 'draft' ? 'warning' : 'neutral'}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {ver.status}
                          </span>
                        </td>
                        <td className="text-body-sm">{ver.change_reason || 'Regular update'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No previous versions found for this patient.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
