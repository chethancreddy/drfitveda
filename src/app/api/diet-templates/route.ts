import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export const DEFAULT_DIET_TEMPLATES = [
  {
    id: 'tmpl-pcod-hormonal',
    name: 'PCOD / PCOS & Hormonal Balance Protocol',
    condition: 'PCOD / PCOS / Hormonal Imbalance',
    target_bmi_range: '23.0 - 29.0',
    target_calories_kcal: 1450,
    dietary_type: 'Vegetarian',
    carbs_pct: 45,
    protein_pct: 25,
    fats_pct: 30,
    water_intake_liters: 3.0,
    fiber_target_g: 35,
    description: 'Low-glycemic, anti-inflammatory naturopathy regimen with seed cycling and insulin sensitization.',
    meals: [
      {
        slot_name: 'Early Morning Detox',
        timing: '06:30 AM - 07:15 AM',
        food_items: '1 glass warm water with 1 tbsp soaked Methi (fenugreek) seeds + 1 tsp cinnamon powder',
        purpose: 'Improves insulin sensitivity, balances morning cortisol',
        portion: '250 ml warm glass',
        alternatives: 'Warm Spearmint tea with lemon',
      },
      {
        slot_name: 'Naturopathy Breakfast',
        timing: '08:30 AM - 09:15 AM',
        food_items: 'Sprouted Moong & Methi bowl with 1 tbsp pumpkin seeds + 1 bowl Vegetable Daliya or Steel-cut oats',
        purpose: 'Phytoestrogen support & sustained morning satiety',
        portion: '1 medium bowl (150g)',
        alternatives: '2 Fermented Ragi-Oats chillas with coconut mint chutney',
      },
      {
        slot_name: 'Mid-Morning Vitality',
        timing: '11:00 AM - 11:30 AM',
        food_items: 'Fresh tender coconut water + 5 soaked almonds + 2 walnuts + 1 tsp sunflower seeds',
        purpose: 'Healthy essential fatty acids for ovarian hormone synthesis',
        portion: '1 coconut water + nuts',
        alternatives: '1 fresh Green Apple with cinnamon sprinkle',
      },
      {
        slot_name: 'Therapeutic Lunch',
        timing: '01:00 PM - 02:00 PM',
        food_items: '2 Multi-millet rotis (Jowar/Bajra) + 1 bowl Palak-Moong dal + 1 large cucumber-radish-beetroot salad + 1 cup Chaach with roasted jeera',
        purpose: 'Complex slow carbs, iron absorption, and prebiotic gut balance',
        portion: '2 rotis (70g) + 150g dal + 100g salad',
        alternatives: '1 bowl Quinoa vegetable pilaf with steamed tofu/paneer',
      },
      {
        slot_name: 'Evening Rejuvenation',
        timing: '04:30 PM - 05:30 PM',
        food_items: 'Spearmint & Tulsi herbal infusion + 1 cup roasted Makhana with pinch of black pepper',
        purpose: 'Reduces androgen levels & curbs evening sugar cravings',
        portion: '1 cup tea + 30g makhana',
        alternatives: 'Chamomile tea with roasted flaxseeds',
      },
      {
        slot_name: 'Light Healing Dinner',
        timing: '07:00 PM - 07:45 PM',
        food_items: 'Clear Bottle Gourd (Lauki) & Zucchini soup + steamed broccoli, beans and tofu cubes with lemon-herb dressing',
        purpose: 'Early light dinner to facilitate overnight insulin drop',
        portion: '1 large bowl (250ml) + 150g vegetables',
        alternatives: 'Moong dal vegetable broth with light brown rice',
      },
      {
        slot_name: 'Bedtime Digestive Ritual',
        timing: '09:30 PM - 10:00 PM',
        food_items: 'Warm almond milk with pure wild turmeric (Curcumin) and a pinch of nutmeg + 1/2 tsp Triphala in warm water',
        purpose: 'Restorative progesterone repair and gentle overnight bowel evacuation',
        portion: '150 ml warm cup',
        alternatives: 'Warm water with 1 tsp organic psyllium husk',
      },
    ],
    strict_avoidances: 'Refined sugar, white maida bakery products, dairy milk, soy isolates, fried foods, late dinner past 8 PM',
    naturopathy_lifestyle_rules: '25 mins morning sunbath (7:30-8:15 AM); 14-hour intermittent fasting window (7 PM to 9 AM); 15 mins Baddha Konasana & Nadi Shodhana Pranayama.',
  },
  {
    id: 'tmpl-uric-gout-alkaline',
    name: 'Uric Acid & Gout Alkaline Regimen',
    condition: 'High Uric Acid / Gout / Joint Inflammation',
    target_bmi_range: '22.0 - 28.0',
    target_calories_kcal: 1500,
    dietary_type: 'Vegetarian',
    carbs_pct: 55,
    protein_pct: 20,
    fats_pct: 25,
    water_intake_liters: 3.5,
    fiber_target_g: 38,
    description: 'Strictly low-purine, high-alkaline naturopathic regimen to accelerate renal purine clearance and reduce joint inflammation.',
    meals: [
      {
        slot_name: 'Early Morning Detox',
        timing: '06:30 AM - 07:15 AM',
        food_items: '1 glass fresh raw Ash Gourd (Petha) juice with 1 tsp coriander seed powder and a squeeze of lime',
        purpose: 'Potent systemic alkalizer that flushes uric acid crystals from kidneys',
        portion: '250 ml fresh juice',
        alternatives: '1 glass warm lemon water with grated ginger',
      },
      {
        slot_name: 'Naturopathy Breakfast',
        timing: '08:30 AM - 09:15 AM',
        food_items: 'Cooked steel-cut oats with soaked chia seeds, crushed walnuts, and fresh papaya cubes',
        purpose: 'Low-purine, rich in papain enzyme and dietary fiber',
        portion: '1 medium bowl (180g)',
        alternatives: 'Vegetable barley (Jau) daliya with bottle gourd and carrots',
      },
      {
        slot_name: 'Mid-Morning Vitality',
        timing: '11:00 AM - 11:30 AM',
        food_items: 'Fresh tender coconut water with 1 tbsp soaked Sabja (basil) seeds + 1 fresh sweet lime (Mosambi)',
        purpose: 'Potassium-rich electrolyte hydration to alkalize urine pH',
        portion: '1 coconut water + 1 fruit',
        alternatives: 'Fresh Amla-Cucumber-Mint cold-pressed juice',
      },
      {
        slot_name: 'Therapeutic Lunch',
        timing: '01:00 PM - 02:00 PM',
        food_items: '2 Barley-Jowar rotis + 1 bowl Yellow Moong dal (diluted) + large raw cucumber, radish and carrot salad with lemon dressing',
        purpose: 'Low purine complex carbs with high water content vegetables',
        portion: '2 rotis (70g) + 150g dal + 120g salad',
        alternatives: '1 bowl Foxtail millet vegetable khichdi',
      },
      {
        slot_name: 'Evening Rejuvenation',
        timing: '04:30 PM - 05:30 PM',
        food_items: 'Warm Coriander-Cumin-Fennel (CCF) herbal tea + roasted puffed rice (Murmura) with roasted jeera',
        purpose: 'Kidney flushing diuretic herbs',
        portion: '1 cup (150ml) + 30g murmura',
        alternatives: 'Ginger-Turmeric infusion with roasted lotus seeds (Makhana)',
      },
      {
        slot_name: 'Light Healing Dinner',
        timing: '07:00 PM - 07:45 PM',
        food_items: 'Bottle Gourd & Pumpkin clear soup + 1 small Jowar roti with steamed French beans and bottle gourd sabzi',
        purpose: 'Easily digestible evening meal to prevent overnight uric acid spike',
        portion: '1 bowl soup (200ml) + 1 roti + 100g sabzi',
        alternatives: 'Steamed sweet potato with moong broth',
      },
      {
        slot_name: 'Bedtime Digestive Ritual',
        timing: '09:30 PM - 10:00 PM',
        food_items: '1 glass warm water with 1 tsp organic Triphala powder',
        purpose: 'Colon cleansing and liver detox',
        portion: '200 ml warm glass',
        alternatives: 'Warm water with 1/2 tsp Ajwain and pinch of rock salt',
      },
    ],
    strict_avoidances: 'High-purine foods (Red lentils, Rajma, Chana, Spinach, Tomatoes, Mushrooms, Cauliflower, Organ meats, Seafood), alcohol, sugary carbonated beverages, late meals.',
    naturopathy_lifestyle_rules: 'Maintain 3.5L structured water intake daily; 20 mins morning sun bath; 10 mins Gomukhasana & Ujjayi Pranayama; warm Epsom salt foot bath twice weekly.',
  },
  {
    id: 'tmpl-thyroid-metabolic',
    name: 'Hypothyroid & Metabolic Activation Plan',
    condition: 'Hypothyroidism / Sluggish Metabolism / Weight Resistance',
    target_bmi_range: '24.0 - 32.0',
    target_calories_kcal: 1400,
    dietary_type: 'Vegetarian',
    carbs_pct: 45,
    protein_pct: 25,
    fats_pct: 30,
    water_intake_liters: 3.0,
    fiber_target_g: 32,
    description: 'Tyrosine, Zinc, and Selenium dense naturopathic regimen designed to stimulate thyroid hormone conversion (T4 to active T3) and elevate resting metabolic rate.',
    meals: [
      {
        slot_name: 'Early Morning Detox',
        timing: '06:30 AM - 07:15 AM',
        food_items: '1 glass warm water with 1 tbsp freshly crushed Coriander seed infusion + pinch of ginger powder',
        purpose: 'Thyroid gland stimulant and anti-inflammatory detox',
        portion: '250 ml warm glass',
        alternatives: 'Warm Lemon ginger infusion',
      },
      {
        slot_name: 'Naturopathy Breakfast',
        timing: '08:30 AM - 09:15 AM',
        food_items: '2 Brazil nuts (Selenium source) + Sprouted Moong bowl with pomegranate + 1 cup warm Quinoa porridge with flaxseeds',
        purpose: 'Provides 100% daily Selenium requirement essential for T4 to T3 conversion',
        portion: '1 bowl (180g) + 2 Brazil nuts',
        alternatives: 'Fermented Buckwheat (Kuttu) pancake with coconut chutney',
      },
      {
        slot_name: 'Mid-Morning Vitality',
        timing: '11:00 AM - 11:30 AM',
        food_items: 'Fresh tender coconut water with 5 soaked almonds + 1 fresh seasonal orange or kiwi',
        purpose: 'Vitamin C enhances iron absorption critical for thyroid peroxidase enzyme',
        portion: '1 coconut water + 1 fruit',
        alternatives: 'Amla juice with 1 tsp honey and warm water',
      },
      {
        slot_name: 'Therapeutic Lunch',
        timing: '01:00 PM - 02:00 PM',
        food_items: '2 Jowar-Ragi rotis + 1 bowl sprouted Dal with moringa (drumstick) + 1 cup raw salad (radish, cucumber, carrot) + 1 cup probiotic buttermilk with curry leaves',
        purpose: 'Tyrosine & mineral rich lunch for sustained cellular thermogenesis',
        portion: '2 rotis (70g) + 150g dal + 100g salad',
        alternatives: '1 bowl Brown rice with drumstick sambar and steamed greens',
      },
      {
        slot_name: 'Evening Rejuvenation',
        timing: '04:30 PM - 05:30 PM',
        food_items: 'Warm Ashwagandha & Cinnamon herbal brew + 1 tbsp roasted pumpkin seeds (Zinc rich)',
        purpose: 'Zinc & adaptogens for thyroid hormone receptor sensitivity and stress resilience',
        portion: '1 cup (150ml) + 20g seeds',
        alternatives: 'Tulsi Ginger tea with roasted makhana',
      },
      {
        slot_name: 'Light Healing Dinner',
        timing: '07:00 PM - 07:45 PM',
        food_items: 'Moong dal vegetable soup with steamed pumpkin, zucchini, and paneer/tofu cubes with crushed black pepper',
        purpose: 'Light, warm, easily assimilable evening protein',
        portion: '1 large bowl (250ml) + 120g vegetables',
        alternatives: 'Steamed vegetable khichdi with 1 tsp A2 cow ghee',
      },
      {
        slot_name: 'Bedtime Digestive Ritual',
        timing: '09:30 PM - 10:00 PM',
        food_items: 'Warm almond milk with wild turmeric (Curcumin) and a pinch of black pepper',
        purpose: 'Thyroid cellular repair during deep sleep cycles',
        portion: '150 ml warm cup',
        alternatives: 'Warm water with 1/2 tsp Triphala',
      },
    ],
    strict_avoidances: 'Raw cruciferous vegetables (raw cabbage, raw broccoli, raw cauliflower), unfermented soy, refined sugars, gluten excess, cold refrigerated foods, late night meals.',
    naturopathy_lifestyle_rules: '25 mins morning sun exposure on neck & chest (7:30-8:15 AM); 15 mins Sarvangasana (Shoulder Stand), Matsyasana (Fish Pose), and Ujjayi Pranayama daily; dry body brushing before shower.',
  },
  {
    id: 'tmpl-weight-gut-reset',
    name: 'Weight Management & Gut Dysbiosis Reset',
    condition: 'Overweight / Sluggish Digestion / Fatty Liver / Bloating',
    target_bmi_range: '25.0 - 34.0',
    target_calories_kcal: 1350,
    dietary_type: 'Vegetarian',
    carbs_pct: 45,
    protein_pct: 30,
    fats_pct: 25,
    water_intake_liters: 3.2,
    fiber_target_g: 40,
    description: 'Therapeutic intermittent fasting friendly naturopathy regimen focused on visceral fat reduction, gut microbiome restoration, and liver lipolysis.',
    meals: [
      {
        slot_name: 'Early Morning Detox',
        timing: '07:00 AM - 07:30 AM',
        food_items: '1 glass warm water with freshly squeezed lemon, grated ginger, and 1 tsp soaked chia seeds',
        purpose: 'Stimulates gastrocolic reflex & liver bile flow',
        portion: '250 ml warm glass',
        alternatives: 'Warm water with 1 tbsp raw apple cider vinegar',
      },
      {
        slot_name: 'Naturopathy Breakfast',
        timing: '08:45 AM - 09:30 AM',
        food_items: 'Fermented Ragi Idlis (2 pcs) with fresh coconut-coriander chutney + 1 cup sprouted pulse chaat with lemon & pomegranate',
        purpose: 'Probiotics + high prebiotic resistant starch for bifidobacteria growth',
        portion: '2 idlis + 1 cup sprouts (150g)',
        alternatives: 'Vegetable Oats Upma with crushed roasted peanuts',
      },
      {
        slot_name: 'Mid-Morning Vitality',
        timing: '11:15 AM - 11:45 AM',
        food_items: 'Fresh tender coconut water or fresh cold-pressed amla-cucumber juice + 4 soaked almonds & 2 walnuts',
        purpose: 'Electrolytes & antioxidant cellular hydration',
        portion: '200 ml + nuts',
        alternatives: '1 fresh seasonal guava or papaya bowl',
      },
      {
        slot_name: 'Therapeutic Lunch',
        timing: '01:15 PM - 02:00 PM',
        food_items: '1 large bowl raw salad (cucumber, grated carrot, beet, radish) + 2 Jowar rotis + 1 bowl mixed vegetable dal + 1 cup Chaach with mint & cumin',
        purpose: 'Fiber-first strategy to blunt postprandial glucose spike and maximize satiety',
        portion: '100g raw salad + 2 rotis (70g) + 150g dal',
        alternatives: '1 bowl Quinoa-Moong Khichdi with steamed greens',
      },
      {
        slot_name: 'Evening Rejuvenation',
        timing: '05:00 PM - 05:30 PM',
        food_items: 'Organic Green Tea / Herbal Tulsi decoction + 1 cup roasted Makhana (fox nuts) with turmeric',
        purpose: 'EGCG catechins boost resting thermogenesis and curb snacking',
        portion: '1 cup tea + 30g makhana',
        alternatives: 'Cinnamon clove infusion with roasted chana',
      },
      {
        slot_name: 'Light Healing Dinner',
        timing: '07:15 PM - 07:45 PM',
        food_items: 'Clear Bottle Gourd & Tomato soup + 150g steamed vegetables (beans, carrots, zucchini) with paneer/tofu cubes',
        purpose: 'Light carbohydrate-free dinner enabling 13-hour overnight fat burning window',
        portion: '1 large bowl soup (250ml) + 150g veggies',
        alternatives: 'Moong broth with steamed vegetables',
      },
      {
        slot_name: 'Bedtime Digestive Ritual',
        timing: '09:30 PM - 10:00 PM',
        food_items: 'Warm water with 1 tsp organic Triphala powder',
        purpose: 'Overnight natural bowel toner and colon mucosal healing',
        portion: '200 ml warm glass',
        alternatives: 'Chamomile tea with pinch of nutmeg',
      },
    ],
    strict_avoidances: 'Maida, white sugar, deep fried foods, ultra-processed snacks, dairy desserts, carbonated beverages, eating after 8 PM.',
    naturopathy_lifestyle_rules: '14-hour intermittent fasting window (7:45 PM to 9:45 AM); 10,000 daily steps; 15 mins Kapalbhati & Agnisar Kriya on empty stomach; 100 paces stroll after lunch.',
  },
]

// GET /api/diet-templates — List all templates
export async function GET() {
  try {
    if (!mockDb.state.diet_templates || mockDb.state.diet_templates.length === 0) {
      mockDb.state.diet_templates = DEFAULT_DIET_TEMPLATES
    }

    return NextResponse.json({
      success: true,
      templates: mockDb.state.diet_templates,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch diet templates' }, { status: 500 })
  }
}

// POST /api/diet-templates — Save new custom template from doctor
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      condition,
      target_bmi_range,
      target_calories_kcal,
      dietary_type,
      carbs_pct,
      protein_pct,
      fats_pct,
      water_intake_liters,
      fiber_target_g,
      description,
      meals,
      strict_avoidances,
      naturopathy_lifestyle_rules,
    } = body

    if (!name || !meals || meals.length === 0) {
      return NextResponse.json({ error: 'Template name and meals are required' }, { status: 400 })
    }

    if (!mockDb.state.diet_templates) {
      mockDb.state.diet_templates = DEFAULT_DIET_TEMPLATES
    }

    const newTemplate = {
      id: `tmpl-${Date.now()}`,
      name: name.trim(),
      condition: condition || 'General Naturopathic Wellness',
      target_bmi_range: target_bmi_range || 'Normal / Overweight',
      target_calories_kcal: Number(target_calories_kcal) || 1450,
      dietary_type: dietary_type || 'Vegetarian',
      carbs_pct: Number(carbs_pct) || 50,
      protein_pct: Number(protein_pct) || 25,
      fats_pct: Number(fats_pct) || 25,
      water_intake_liters: Number(water_intake_liters) || 3.0,
      fiber_target_g: Number(fiber_target_g) || 35,
      description: description || 'Doctor clinical diet protocol',
      meals,
      strict_avoidances: strict_avoidances || '',
      naturopathy_lifestyle_rules: naturopathy_lifestyle_rules || '',
      created_by: user.id,
      created_at: new Date().toISOString(),
    }

    mockDb.state.diet_templates.unshift(newTemplate)

    return NextResponse.json({
      success: true,
      message: 'New clinical diet template saved successfully to Doctor Library',
      template: newTemplate,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error saving diet template' }, { status: 400 })
  }
}
