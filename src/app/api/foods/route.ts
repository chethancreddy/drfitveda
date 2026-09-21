import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export interface FoodItemCatalog {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'evening_snacks' | 'dinner' | 'all'
  default_quantity: string
  energy_kcal: number
  carbs_g: number
  protein_g: number
  fats_g: number
  dietary_type?: string
  notes?: string
}

export const DEFAULT_FOOD_CATALOG: FoodItemCatalog[] = [
  // Breakfast Items
  {
    id: 'f-b-1',
    name: 'Sprouted Moong & Methi Bowl with Pomegranate',
    category: 'breakfast',
    default_quantity: '1 bowl (150g)',
    energy_kcal: 160,
    carbs_g: 24,
    protein_g: 12,
    fats_g: 2,
    dietary_type: 'Vegetarian',
    notes: 'High micronutrient bioavailability & live enzymes',
  },
  {
    id: 'f-b-2',
    name: 'Vegetable Rolled Oats with Chia & Flaxseeds',
    category: 'breakfast',
    default_quantity: '1 bowl (200g)',
    energy_kcal: 220,
    carbs_g: 36,
    protein_g: 8,
    fats_g: 6,
    dietary_type: 'Vegetarian',
    notes: 'Soluble beta-glucan fiber for blood sugar control',
  },
  {
    id: 'f-b-3',
    name: 'Fermented Ragi Idli with Fresh Mint Chutney',
    category: 'breakfast',
    default_quantity: '2 idlis (120g)',
    energy_kcal: 180,
    carbs_g: 34,
    protein_g: 5,
    fats_g: 3,
    dietary_type: 'Vegetarian',
    notes: 'Calcium rich & gut microbiome probiotic fermentation',
  },
  {
    id: 'f-b-4',
    name: 'Besan Veggie Cheela with Grated Paneer',
    category: 'breakfast',
    default_quantity: '2 cheelas (140g)',
    energy_kcal: 240,
    carbs_g: 22,
    protein_g: 14,
    fats_g: 9,
    dietary_type: 'Vegetarian',
    notes: 'High protein chickpea flour pancake',
  },
  {
    id: 'f-b-5',
    name: 'Foxtail Millet Vegetable Upma with Mustard Tempering',
    category: 'breakfast',
    default_quantity: '1 bowl (180g)',
    energy_kcal: 190,
    carbs_g: 32,
    protein_g: 6,
    fats_g: 4,
    dietary_type: 'Vegetarian',
    notes: 'Low glycemic index millet energy',
  },
  {
    id: 'f-b-6',
    name: 'Boiled Egg Whites with Black Pepper & Steamed Spinach',
    category: 'breakfast',
    default_quantity: '3 egg whites (100g)',
    energy_kcal: 85,
    carbs_g: 2,
    protein_g: 14,
    fats_g: 1,
    dietary_type: 'Eggetarian',
    notes: 'Pure lean protein & lutein',
  },
  {
    id: 'f-b-7',
    name: 'Chia Coconut Pudding with Fresh Berries',
    category: 'breakfast',
    default_quantity: '1 cup (150g)',
    energy_kcal: 170,
    carbs_g: 16,
    protein_g: 4,
    fats_g: 10,
    dietary_type: 'Vegan',
    notes: 'Omega-3 fatty acids and dietary antioxidants',
  },

  // Lunch Items
  {
    id: 'f-l-1',
    name: 'Jowar (Sorghum) Rotis (Gluten-Free)',
    category: 'lunch',
    default_quantity: '2 rotis (70g)',
    energy_kcal: 190,
    carbs_g: 40,
    protein_g: 6,
    fats_g: 2,
    dietary_type: 'Vegetarian',
    notes: 'Alkaline complex carbohydrates for steady insulin release',
  },
  {
    id: 'f-l-2',
    name: 'Bajra (Pearl Millet) Rotis with Cumin',
    category: 'lunch',
    default_quantity: '2 rotis (70g)',
    energy_kcal: 200,
    carbs_g: 38,
    protein_g: 6.5,
    fats_g: 3,
    dietary_type: 'Vegetarian',
    notes: 'High iron, magnesium and gut motility fiber',
  },
  {
    id: 'f-l-3',
    name: 'Yellow Moong Dal Tadka with Cumin & Pure Ghee',
    category: 'lunch',
    default_quantity: '1 bowl (150g)',
    energy_kcal: 140,
    carbs_g: 18,
    protein_g: 9,
    fats_g: 4,
    dietary_type: 'Vegetarian',
    notes: 'Easily digestible protein with essential amino acids',
  },
  {
    id: 'f-l-4',
    name: 'Masoor Dal with Fresh Spinach (Palak)',
    category: 'lunch',
    default_quantity: '1 bowl (150g)',
    energy_kcal: 150,
    carbs_g: 19,
    protein_g: 10,
    fats_g: 3.5,
    dietary_type: 'Vegetarian',
    notes: 'Plant iron and folate powerhouse',
  },
  {
    id: 'f-l-5',
    name: 'Steamed Lauki (Bottle Gourd) & Turai Sabzi',
    category: 'lunch',
    default_quantity: '1 bowl (150g)',
    energy_kcal: 65,
    carbs_g: 9,
    protein_g: 2,
    fats_g: 2.5,
    dietary_type: 'Vegetarian',
    notes: 'Hydrating, cooling & liver supportive',
  },
  {
    id: 'f-l-6',
    name: 'Grilled Paneer / Organic Tofu Cubes',
    category: 'lunch',
    default_quantity: '100g portion',
    energy_kcal: 190,
    carbs_g: 5,
    protein_g: 18,
    fats_g: 12,
    dietary_type: 'Vegetarian',
    notes: 'Complete protein and healthy dietary fats',
  },
  {
    id: 'f-l-7',
    name: 'Fresh Probiotic Chaach with Roasted Jeera',
    category: 'lunch',
    default_quantity: '1 glass (200ml)',
    energy_kcal: 55,
    carbs_g: 5,
    protein_g: 4,
    fats_g: 2,
    dietary_type: 'Vegetarian',
    notes: 'Aids digestive enzyme secretion & cools digestive fire',
  },
  {
    id: 'f-l-8',
    name: 'Raw Rainbow Salad (Cucumber, Beetroot, Carrot & Radish)',
    category: 'lunch',
    default_quantity: '1 bowl (120g)',
    energy_kcal: 45,
    carbs_g: 9,
    protein_g: 1.5,
    fats_g: 0.5,
    dietary_type: 'Vegan',
    notes: 'Raw prebiotic roughage eaten 15 mins before cooked meal',
  },

  // Evening Snacks Items
  {
    id: 'f-s-1',
    name: 'Roasted Fox Nuts (Makhana) with Turmeric & Pepper',
    category: 'evening_snacks',
    default_quantity: '1 cup (30g)',
    energy_kcal: 110,
    carbs_g: 20,
    protein_g: 3,
    fats_g: 1.5,
    dietary_type: 'Vegetarian',
    notes: 'Low glycemic, anti-inflammatory evening snack',
  },
  {
    id: 'f-s-2',
    name: 'Roasted Unsalted Chana (Bengal Gram)',
    category: 'evening_snacks',
    default_quantity: '1 small bowl (40g)',
    energy_kcal: 140,
    carbs_g: 22,
    protein_g: 8,
    fats_g: 2.5,
    dietary_type: 'Vegetarian',
    notes: 'Satiety-boosting slow-release protein & fiber',
  },
  {
    id: 'f-s-3',
    name: 'Soaked Almonds & Walnuts',
    category: 'evening_snacks',
    default_quantity: '5 almonds + 2 walnuts (20g)',
    energy_kcal: 130,
    carbs_g: 3,
    protein_g: 4,
    fats_g: 12,
    dietary_type: 'Vegan',
    notes: 'Omega-3 fatty acids for cognitive and hormonal support',
  },
  {
    id: 'f-s-4',
    name: 'Herbal Tulsi-Ginger-Mulethi Kadha',
    category: 'evening_snacks',
    default_quantity: '1 cup (150ml)',
    energy_kcal: 15,
    carbs_g: 3,
    protein_g: 0.5,
    fats_g: 0,
    dietary_type: 'Vegan',
    notes: 'Immunity modulating adaptive herbal decoction',
  },
  {
    id: 'f-s-5',
    name: 'Tender Coconut Water with Chia Seeds',
    category: 'evening_snacks',
    default_quantity: '1 whole (200ml)',
    energy_kcal: 60,
    carbs_g: 11,
    protein_g: 2,
    fats_g: 1,
    dietary_type: 'Vegan',
    notes: 'Natural isotonic electrolytes (Potassium, Magnesium)',
  },
  {
    id: 'f-s-6',
    name: 'Fresh Guava / Green Apple Slices with Cinnamon',
    category: 'evening_snacks',
    default_quantity: '1 fruit (120g)',
    energy_kcal: 65,
    carbs_g: 15,
    protein_g: 1,
    fats_g: 0.5,
    dietary_type: 'Vegan',
    notes: 'High Vitamin C & pectin fiber with cinnamon for insulin sensitivity',
  },

  // Dinner Items
  {
    id: 'f-d-1',
    name: 'Clear Bottle Gourd & Moringa Leaf Soup',
    category: 'dinner',
    default_quantity: '1 large bowl (250ml)',
    energy_kcal: 60,
    carbs_g: 10,
    protein_g: 2,
    fats_g: 1,
    dietary_type: 'Vegan',
    notes: 'Ultra-light dinner digestion with potent bioavailable polyphenols',
  },
  {
    id: 'f-d-2',
    name: 'Vegetable Quinoa & Moong Dal Khichdi',
    category: 'dinner',
    default_quantity: '1 bowl (200g)',
    energy_kcal: 210,
    carbs_g: 36,
    protein_g: 8,
    fats_g: 4,
    dietary_type: 'Vegetarian',
    notes: 'Complete amino acid profile; light on nocturnal metabolism',
  },
  {
    id: 'f-d-3',
    name: 'Steamed Broccoli, Zucchini & Tofu/Paneer Bowl',
    category: 'dinner',
    default_quantity: '1 bowl (180g)',
    energy_kcal: 160,
    carbs_g: 8,
    protein_g: 15,
    fats_g: 8,
    dietary_type: 'Vegetarian',
    notes: 'Low carb, high micronutrient evening recovery meal',
  },
  {
    id: 'f-d-4',
    name: '1 Jowar Roti + Steamed Kaddu (Pumpkin) Sabzi',
    category: 'dinner',
    default_quantity: '1 roti + 150g sabzi',
    energy_kcal: 165,
    carbs_g: 30,
    protein_g: 4.5,
    fats_g: 3,
    dietary_type: 'Vegetarian',
    notes: 'Tryptophan-rich dinner aiding sound restorative sleep',
  },
  {
    id: 'f-d-5',
    name: 'Warm Turmeric (Curcumin) Almond Milk',
    category: 'dinner',
    default_quantity: '150ml warm cup',
    energy_kcal: 90,
    carbs_g: 6,
    protein_g: 3.5,
    fats_g: 5.5,
    dietary_type: 'Vegan',
    notes: 'Bedtime restorative repair and gentle anti-inflammatory recovery',
  },
]

// ============================================================
// GET /api/foods — List foods with search and category filters
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() || ''
    const category = searchParams.get('category') || ''

    if (!mockDb.state.food_catalog) {
      mockDb.state.food_catalog = [...DEFAULT_FOOD_CATALOG]
    }

    let items: FoodItemCatalog[] = mockDb.state.food_catalog

    if (category && category !== 'all') {
      items = items.filter(
        it => it.category === category || it.category === 'all'
      )
    }

    if (q) {
      items = items.filter(
        it =>
          it.name.toLowerCase().includes(q) ||
          (it.notes && it.notes.toLowerCase().includes(q)) ||
          (it.dietary_type && it.dietary_type.toLowerCase().includes(q))
      )
    }

    return NextResponse.json({ foods: items })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/foods — Add new food item to catalog (Doctor / Admin)
// ============================================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      category = 'all',
      default_quantity = '1 serving (150g)',
      energy_kcal = 150,
      carbs_g = 20,
      protein_g = 8,
      fats_g = 5,
      dietary_type = 'Vegetarian',
      notes = '',
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Food name is required' }, { status: 400 })
    }

    if (!mockDb.state.food_catalog) {
      mockDb.state.food_catalog = [...DEFAULT_FOOD_CATALOG]
    }

    const newItem: FoodItemCatalog = {
      id: `f-${Date.now()}`,
      name: name.trim(),
      category,
      default_quantity,
      energy_kcal: Number(energy_kcal) || 0,
      carbs_g: Number(carbs_g) || 0,
      protein_g: Number(protein_g) || 0,
      fats_g: Number(fats_g) || 0,
      dietary_type,
      notes,
    }

    mockDb.state.food_catalog.unshift(newItem)

    return NextResponse.json({ success: true, food: newItem })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
