// ============================================================
// Dr Fit Veda — In-Memory Mock Database & Session Store
// For local testing & zero-configuration development
// ============================================================

export interface MockUser {
  id: string
  email: string
  role: 'customer' | 'doctor' | 'trainer' | 'admin' | 'super_admin' | 'operations_manager' | 'care_coordinator' | 'staff'
  full_name: string
  phone: string
  password?: string
}

export const MOCK_USERS: Record<string, MockUser> = {
  customer: {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'customer@drfitveda.com',
    role: 'customer',
    full_name: 'Priya Sharma',
    phone: '+91 98765 43210',
    password: 'customer123',
  },
  doctor: {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'doctor@drfitveda.com',
    role: 'doctor',
    full_name: 'Dr. Ananya Verma',
    phone: '+91 98765 43211',
    password: 'doctor123',
  },
  trainer: {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'trainer@drfitveda.com',
    role: 'trainer',
    full_name: 'Vikram Singh',
    phone: '+91 98765 43212',
    password: 'trainer123',
  },
  coordinator: {
    id: 'u-team-001',
    email: 'kavita.operations@drfitveda.com',
    role: 'operations_manager',
    full_name: 'Kavita Rao (Care Manager)',
    phone: '+91 98111 22334',
    password: 'coordinator123',
  },
  admin: {
    id: 'u0000000-0000-0000-0000-000000000004',
    email: 'admin@drfitveda.com',
    role: 'admin',
    full_name: 'Rajesh Kumar (Admin)',
    phone: '+91 98765 43213',
    password: 'admin123',
  },
}

export interface NormalProgram {
  id: string
  key: string
  title: string
  category: string
  icon: string
  image_url: string
  short_description: string
  full_description: string
  ideal_for: string
  duration_label: string
  duration_days: number
  price: number
  original_price?: number
  inclusions: string[]
  specialist_role: string
  cta_label: string
  cta_href: string
  is_active: boolean
  display_order: number
}

export interface VitalityRoadmapStep {
  id: string
  step: string // '01' to '07'
  timing: string // e.g. 'Day 1', 'Days 2–3'
  icon: string // emoji or icon
  title: string
  accentColor: string
  description: string
  deliverable: string
  highlightTitle: string
  highlights: string[]
  display_order: number
  is_active: boolean
}

export interface HomepageSettings {
  topbar_text: string
  topbar_sub: string
  hero_eyebrow: string
  hero_title_line1: string
  hero_title_highlight: string
  hero_title_line2: string
  hero_lead: string
  hero_cta_primary_label: string
  hero_cta_primary_href: string
  hero_cta_secondary_label: string
  hero_cta_secondary_href: string
  hero_image_url: string
  hero_stat_1_val: string
  hero_stat_1_lbl: string
  hero_stat_2_val: string
  hero_stat_2_lbl: string
  hero_stat_3_val: string
  hero_stat_3_lbl: string
  about_eyebrow: string
  about_title: string
  about_lead: string
  about_points: string[]
  care_eyebrow: string
  care_title: string
  care_lead: string
  programs_eyebrow: string
  programs_title: string
  programs_lead: string
  journey_eyebrow: string
  journey_title: string
  journey_lead: string
  cta_box_title: string
  cta_box_lead: string
  cta_box_btn_label: string
  cta_box_btn_href: string
  show_topbar: boolean
  show_hero: boolean
  show_trust_strip: boolean
  show_about: boolean
  show_care: boolean
  show_programs: boolean
  show_journey: boolean
  show_experts: boolean
  show_memberships: boolean
  show_testimonials: boolean
  show_faq: boolean
  show_cta: boolean
}

// Global in-memory data store for local dev
class MockDatabase {
  private static instance: MockDatabase
  public state: any

  private constructor() {
    this.reset()
  }

  public static getInstance(): MockDatabase {
    const g = globalThis as any
    if (!g.__mockDbInstance) {
      g.__mockDbInstance = new MockDatabase()
    }
    return g.__mockDbInstance
  }

  public reset() {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]

    this.state = {
      user_profiles: [
        { id: MOCK_USERS.customer.id, role: 'customer', full_name: MOCK_USERS.customer.full_name, email: MOCK_USERS.customer.email, phone: MOCK_USERS.customer.phone, is_active: true },
        { id: MOCK_USERS.doctor.id, role: 'doctor', full_name: MOCK_USERS.doctor.full_name, email: MOCK_USERS.doctor.email, phone: MOCK_USERS.doctor.phone, is_active: true },
        { id: MOCK_USERS.trainer.id, role: 'trainer', full_name: MOCK_USERS.trainer.full_name, email: MOCK_USERS.trainer.email, phone: MOCK_USERS.trainer.phone, is_active: true },
        { id: MOCK_USERS.admin.id, role: 'admin', full_name: MOCK_USERS.admin.full_name, email: MOCK_USERS.admin.email, phone: MOCK_USERS.admin.phone, is_active: true },
        { id: 'u-doc-003', role: 'doctor', full_name: 'Dr. Rajesh Deshmukh', email: 'rajesh@drfitveda.com', phone: '+91 98765 43220', is_active: true },
        { id: 'u-trn-004', role: 'trainer', full_name: 'Pooja Hegde', email: 'pooja@drfitveda.com', phone: '+91 98765 43221', is_active: true },
      ],
      team_members: [
        {
          id: 'tm-001',
          user_id: 'u-team-001',
          full_name: 'Kavita Rao',
          email: 'kavita.operations@drfitveda.com',
          phone: '+91 98111 22334',
          role: 'operations_manager',
          department: 'Care Operations & Scheduling',
          shift: 'Morning (07:00 AM - 03:00 PM)',
          assigned_region: 'National / All India',
          is_active: true,
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 'tm-002',
          user_id: 'u-team-002',
          full_name: 'Arjun Nambiar',
          email: 'arjun.coordinator@drfitveda.com',
          phone: '+91 98222 33445',
          role: 'care_coordinator',
          department: 'Patient Onboarding & Slot Dispatch',
          shift: 'General (09:00 AM - 06:00 PM)',
          assigned_region: 'South & West Zones',
          is_active: true,
          created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          id: 'tm-003',
          user_id: 'u-team-003',
          full_name: 'Neha Kapoor',
          email: 'neha.support@drfitveda.com',
          phone: '+91 98333 44556',
          role: 'staff',
          department: 'Customer Success & Follow-ups',
          shift: 'Evening (01:00 PM - 09:00 PM)',
          assigned_region: 'North & East Zones',
          is_active: true,
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
      ],
      professionals: [
        {
          id: 'p0000000-0000-0000-0000-000000000001',
          user_id: MOCK_USERS.doctor.id,
          role: 'doctor',
          full_name: 'Dr. Ananya Verma',
          email: MOCK_USERS.doctor.email,
          phone: MOCK_USERS.doctor.phone,
          qualification: 'BNYS (Naturopathy & Yoga Doctor)',
          specialization: 'Naturopathic Medicine & Clinical Nutrition',
          max_caseload: 25,
          working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          working_slots: [
            '07:00 AM - 08:00 AM',
            '08:00 AM - 09:00 AM',
            '10:00 AM - 11:00 AM',
            '04:00 PM - 05:00 PM',
            '06:00 PM - 07:00 PM',
          ],
          is_available: true,
          is_active: true,
        },
        {
          id: 'p0000000-0000-0000-0000-000000000002',
          user_id: MOCK_USERS.trainer.id,
          role: 'trainer',
          full_name: 'Vikram Singh',
          email: MOCK_USERS.trainer.email,
          phone: MOCK_USERS.trainer.phone,
          qualification: "Gold's Gym Certified Master Trainer",
          specialization: 'Functional Movement & Strength',
          max_caseload: 30,
          working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          working_slots: [
            '06:00 AM - 07:00 AM',
            '07:00 AM - 08:00 AM',
            '08:00 AM - 09:00 AM',
            '05:00 PM - 06:00 PM',
            '06:00 PM - 07:00 PM',
            '07:00 PM - 08:00 PM',
          ],
          is_available: true,
          is_active: true,
        },
        {
          id: 'p0000000-0000-0000-0000-000000000003',
          user_id: 'u-doc-003',
          role: 'doctor',
          full_name: 'Dr. Rajesh Deshmukh',
          email: 'rajesh@drfitveda.com',
          phone: '+91 98765 43220',
          qualification: 'BNYS, MD (Acupressure & Yoga Therapy)',
          specialization: 'Metabolic Disorders & Hypertension',
          max_caseload: 20,
          working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          working_slots: [
            '09:00 AM - 10:00 AM',
            '11:00 AM - 12:00 PM',
            '03:00 PM - 04:00 PM',
            '05:00 PM - 06:00 PM',
          ],
          is_available: true,
          is_active: true,
        },
        {
          id: 'p0000000-0000-0000-0000-000000000004',
          user_id: 'u-trn-004',
          role: 'trainer',
          full_name: 'Pooja Hegde',
          email: 'pooja@drfitveda.com',
          phone: '+91 98765 43221',
          qualification: 'Gold’s Gym & ACE Certified Trainer',
          specialization: 'Women Posture & Core Stability',
          max_caseload: 25,
          working_days: ['Mon', 'Wed', 'Fri', 'Sat'],
          working_slots: [
            '07:00 AM - 08:00 AM',
            '09:00 AM - 10:00 AM',
            '04:00 PM - 05:00 PM',
            '06:00 PM - 07:00 PM',
          ],
          is_available: true,
          is_active: true,
        },
      ],
      customers: [
        {
          id: 'c0000000-0000-0000-0000-000000000001',
          user_id: MOCK_USERS.customer.id,
          membership_status: 'active',
          membership_plan_id: 'mbr-001',
          zoho_meeting_url: 'https://meet.google.com/dfv-priya-sharma',
          zoho_meeting_key: 'dfv-priya-sharma',
          google_meet_url: 'https://meet.google.com/dfv-priya-sharma',
          meeting_url: 'https://meet.google.com/dfv-priya-sharma',
          meeting_provider: 'google_meet',
          is_active: true,
        },
      ],
      customer_profiles: [
        {
          id: 'cp000000-0000-0000-0000-000000000001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          date_of_birth: '1995-06-15',
          gender: 'female',
          height_cm: 165,
          weight_kg: 62.5,
          bmi: 23.0,
          occupation: 'UX Designer',
          sleep_hours: 7.5,
          activity_level: 'moderate',
          stress_level: 4,
          lifestyle_notes: 'Desk job, morning meditation practitioner.',
          goals: 'Improve strength, maintain gut health, manage work-related stress.',
        },
      ],
      food_profiles: [
        {
          id: 'fp000000-0000-0000-0000-000000000001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          dietary_preference: 'vegetarian',
          water_intake_liters: 2.5,
          allergies: 'None reported',
          restrictions: 'Avoid deep-fried food after 7 PM',
        },
      ],
      professional_assignments: [
        {
          id: 'pa000000-0000-0000-0000-000000000001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          professional_id: 'p0000000-0000-0000-0000-000000000001', // Dr. Ananya
          role: 'doctor',
          is_active: true,
        },
        {
          id: 'pa000000-0000-0000-0000-000000000002',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          professional_id: 'p0000000-0000-0000-0000-000000000002', // Vikram Trainer
          role: 'trainer',
          is_active: true,
        },
      ],
      plans: [
        {
          id: 'plan-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          created_by: MOCK_USERS.doctor.id,
          created_at: new Date(Date.now() - 7*86400000).toISOString(),
        },
      ],
      plan_versions: [
        {
          id: 'pv-001',
          plan_id: 'plan-001',
          version_number: 1,
          status: 'published',
          change_reason: 'Initial Doctor Holistic Plan',
          effective_from: yesterday,
          created_by: MOCK_USERS.doctor.id,
          created_at: new Date(Date.now() - 7*86400000).toISOString(),
        },
      ],
      plan_items: [
        { id: 'pi-1', plan_version_id: 'pv-001', category: 'nutrition', instruction: 'Warm cumin water upon waking, followed by fresh seasonal fruits.', display_order: 1 },
        { id: 'pi-2', plan_version_id: 'pv-001', category: 'workout',   instruction: '30 mins functional bodyweight workout: squats, glute bridges, pushups.', display_order: 2 },
        { id: 'pi-3', plan_version_id: 'pv-001', category: 'yoga',      instruction: 'Surya Namaskar (6 cycles) + Anulom Vilom Pranayama (10 mins).', display_order: 3 },
        { id: 'pi-4', plan_version_id: 'pv-001', category: 'sleep',     instruction: 'Wind down screen time by 10:00 PM; chamomlie tea or warm turmeric milk.', display_order: 4 },
        { id: 'pi-5', plan_version_id: 'pv-001', category: 'water',     instruction: 'Hydration goal: 2.5L throughout the day, sip slowly at room temperature.', display_order: 5 },
      ],
      daily_check_ins: [
        { id: 'dci-1', customer_id: 'c0000000-0000-0000-0000-000000000001', check_in_date: yesterday, workout_status: 'yes', diet_status: 'yes', yoga_status: 'yes', water_status: 'yes', energy_level: 5, mood_level: 5, note: 'Great energy today!' },
        { id: 'dci-2', customer_id: 'c0000000-0000-0000-0000-000000000001', check_in_date: twoDaysAgo, workout_status: 'yes', diet_status: 'partial', yoga_status: 'no', water_status: 'yes', energy_level: 4, mood_level: 4, note: 'Busy work day but got workout done.' },
      ],
      progress_records: [
        { id: 'pr-1', customer_id: 'c0000000-0000-0000-0000-000000000001', recorded_date: twoDaysAgo, weight_kg: 62.5, notes: 'Feeling lighter and more energetic' },
      ],
      weekly_reviews: [
        {
          id: 'wr-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          doctor_id: 'p0000000-0000-0000-0000-000000000001',
          review_date: today,
          status: 'due',
          adherence_notes: 'Excellent check-in consistency',
          doctor_notes: null,
          outcome: null,
        },
      ],
      appointments: [
        {
          id: 'appt-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          professional_id: 'p0000000-0000-0000-0000-000000000001',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          duration_min: 30,
          status: 'scheduled',
          notes: 'Discuss weekly review & posture exercises',
          meeting_url: 'https://meet.google.com/dfv-priya-sharma',
        },
      ],
      consultation_notes: [],
      gallery_videos: [
        {
          id: 'vid-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          title: 'Morning Surya Namaskar & Core Flow',
          category: 'yoga',
          video_url: '/videos/demo-movement.mp4',
          thumbnail_url: '/images/gallery-surya-namaskar.svg',
          duration_seconds: 120,
          notes: 'Completed 6 cycles of Surya Namaskar. Focused on breath pacing.',
          trainer_feedback: 'Excellent posture and lumbar alignment. Keep knees soft during transition.',
          created_at: new Date(Date.now() - 2*86400000).toISOString(),
        },
        {
          id: 'vid-002',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          title: 'Squat Form & Hip Mobility Check',
          category: 'workout',
          video_url: '/videos/demo-movement.mp4',
          thumbnail_url: '/images/gallery-squat-form.svg',
          duration_seconds: 45,
          notes: 'Form check for bodyweight squats (Set 3 of 4).',
          trainer_feedback: 'Depth is great! Ensure knees track in line with 2nd toe on ascent.',
          created_at: new Date(Date.now() - 4*86400000).toISOString(),
        },
      ],
      medical_documents: [
        {
          id: 'doc-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          doc_type: 'blood_test',
          file_name: 'Complete_Blood_Count_Sep2026.pdf',
          file_size: 452000,
          status: 'reviewed',
          notes: 'Hemoglobin and lipid levels within normal range.',
          uploaded_at: new Date(Date.now() - 5*86400000).toISOString(),
        },
      ],
      clinical_records: [
        {
          id: 'clin-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          doctor_id: 'p0000000-0000-0000-0000-000000000001',
          doctor_name: 'Dr. Ananya Verma',
          recorded_at: new Date(Date.now() - 3*86400000).toISOString(),
          vitals: {
            height_cm: 165,
            weight_kg: 62.5,
            bmi: 23.0,
            body_fat_pct: 24.2,
            muscle_mass_kg: 43.1,
            visceral_fat_level: 4,
            bmr_kcal: 1380,
            blood_pressure_sys: 118,
            blood_pressure_dia: 76,
            resting_pulse_bpm: 72,
            spo2_pct: 99,
          },
          blood_reports: {
            vitamin_d3: 21.4, // ng/mL (Low: <20, Insufficient: 20-30, Sufficient: 30-100)
            vitamin_b12: 240, // pg/mL (Low: <200, Borderline: 200-300, Normal: >300)
            hemoglobin: 12.8, // g/dL
            ferritin_iron: 34, // ng/mL
            total_cholesterol: 192, // mg/dL (<200 desirable)
            hdl_cholesterol: 54, // mg/dL (>50 optimal for women)
            ldl_cholesterol: 114, // mg/dL (<100 optimal)
            triglycerides: 120, // mg/dL (<150 normal)
            vldl_cholesterol: 24, // mg/dL
            fasting_blood_sugar: 92, // mg/dL (70-99 normal)
            postprandial_blood_sugar: 124, // mg/dL (<140 normal)
            hba1c_pct: 5.4, // % (<5.7 normal)
            tsh: 2.4, // uIU/mL (0.4-4.0 normal)
            t3: 1.1,
            t4: 7.8,
            serum_creatinine: 0.8,
            uric_acid: 4.5,
            sgpt_alt: 22,
            sgot_ast: 20,
          },
          digestive_and_lifestyle: {
            appetite_level: 'moderate',
            bowel_movement: 'regular',
            water_intake_liters: 2.5,
            food_allergies: 'Mild lactose sensitivity',
            dietary_preference: 'vegetarian',
            sleep_hours: 7.5,
            sleep_quality: 'good',
            stress_triggers: 'Work screen time & tight deadlines',
          },
          doctor_clinical_assessment: {
            diagnostic_summary: 'Mild Vitamin D3 deficiency, borderline B12. Healthy cardiovascular lipid profile and insulin sensitivity. Needs dietary micronutrient enrichment, morning sun therapy, and digestive gut harmony.',
            metabolic_health_grade: 'Grade A- (Good Metabolic Health)',
            deficiency_alerts: 'Low Vitamin D3 (21.4 ng/mL), Borderline B12 (240 pg/mL)',
            naturopathic_root_cause: 'Sedentary indoor work reducing natural vitamin synthesis; mild evening sluggishness.',
          },
          prescribed_diet_chart: {
            morning_detox_drink: '1 glass warm water with freshly squeezed lemon juice, grated ginger, and a pinch of cinnamon powder (7:00 AM).',
            breakfast: 'Sprouted moong & methi bowl with grated coconut and pomegranate seeds + 1 cup boiled vegetable daliya / ragi porridge (8:30 AM).',
            mid_morning: 'Fresh tender coconut water with 5 soaked almonds and 2 walnuts (11:00 AM).',
            lunch: '2 Jowar/Bajra rotis + 1 bowl seasonal lauki/turai curry + 1 cup sprouted dal/tofu + fresh cucumber and carrot salad with cold-pressed sesame dressing (1:30 PM).',
            evening_snack: '1 cup herbal Tulsi-Ginger Kadha / Green tea + roasted lotus seeds (Makhana) or roasted chana (5:00 PM).',
            dinner: 'Light bottle gourd & moringa soup + 1 small bowl vegetable brown rice khichdi with ghee (7:30 PM).',
            bedtime_routine: 'Warm turmeric cinnamon almond milk or chamomile infusion with 1/2 tsp triphala powder (9:45 PM).',
            food_guidelines_to_avoid: 'Refined flour (Maida), white sugar, deep fried snacks, cold carbonated drinks, late-night dinners after 8:30 PM.',
            naturopathy_lifestyle_rules: '20 minutes morning sun bath (7:30 - 8:30 AM); chew every bite 32 times; 10 minutes Vajrasana after lunch and dinner.',
          },
          doctor_notes: 'Patient is responsive and motivated. Follow-up consultation scheduled in 14 days to monitor biomarker improvement.',
        },
      ],
      notifications: [
        {
          id: 'notif-1',
          user_id: MOCK_USERS.customer.id,
          title: 'Weekly Doctor Review Due',
          body: 'Your doctor Dr. Ananya has initiated your weekly adherence review.',
          type: 'review',
          is_read: false,
          action_url: '/customer/reviews',
          created_at: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          user_id: MOCK_USERS.customer.id,
          title: 'Upcoming Consultation Tomorrow',
          body: 'Consultation scheduled at 10:00 AM IST with Dr. Ananya Verma.',
          type: 'appointment',
          is_read: false,
          action_url: '/customer/consult',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      training_sessions: [
        {
          id: 'ts-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          trainer_id: 'p0000000-0000-0000-0000-000000000002',
          scheduled_at: yesterday,
          status: 'completed',
          notes: 'Lower body mobility & core focus',
          meeting_url: 'https://meet.google.com/dfv-priya-sharma',
          recording_url: null, // Admin pastes session recording link after session
        },
      ],
      training_recordings: [
        {
          id: 'tr-001',
          session_id: 'ts-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          storage_key: 'recordings/ts-001.mp4',
          recording_status: 'available',
          is_active: true,
          file_size_bytes: 48500000,
          duration_seconds: 1800,
        },
      ],
      compensation_rule_versions: [
        {
          id: 'crv-001',
          name: 'Standard Rate V1',
          effective_from: '2024-01-01',
          is_active: true,
        },
      ],
      payout_rule_components: [
        { id: 'prc-1', rule_version_id: 'crv-001', component_code: 'initial_doctor_plan', component_name: 'Initial Doctor Plan', role: 'doctor', amount_type: 'fixed', amount: 999, is_active: true },
        { id: 'prc-2', rule_version_id: 'crv-001', component_code: 'trainer_service', component_name: 'Trainer Service', role: 'trainer', amount_type: 'fixed', amount: 5499, is_active: true },
        { id: 'prc-3', rule_version_id: 'crv-001', component_code: 'weekly_review', component_name: 'Weekly Doctor Review', role: 'doctor', amount_type: 'fixed', amount: 199, is_active: true },
      ],
      payouts: [
        {
          id: 'pay-001',
          professional_id: 'p0000000-0000-0000-0000-000000000001', // Dr. Ananya
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          payout_type: 'initial_doctor_plan',
          amount: 999,
          currency: 'INR',
          status: 'paid',
          notes: 'Initial plan formulation payout',
          created_at: new Date(Date.now() - 7*86400000).toISOString(),
        },
        {
          id: 'pay-002',
          professional_id: 'p0000000-0000-0000-0000-000000000002', // Vikram Trainer
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          payout_type: 'trainer_service',
          amount: 5499,
          currency: 'INR',
          status: 'approved',
          notes: 'Monthly live training compensation',
          created_at: new Date(Date.now() - 2*86400000).toISOString(),
        },
      ],
      memberships: [
        {
          id: 'mbr-001',
          name: 'Starter Plan',
          duration_label: '1 Month',
          duration_days: 30,
          price: 9999,
          original_price: 14999,
          live_sessions_count: 12,
          session_frequency: 'Total 12 live 1-on-1 sessions with trainers',
          extra_consultation_count: 0,
          has_yoga_consultation: false,
          has_yoga_plan: false,
          is_super_plan: false,
          google_meet_recording: true,
          benefits: [
            '12 live 1-on-1 sessions with certified trainer',
            'Customized fitness & nutrition plan',
            'Daily check-in & adherence tracking',
            'Secure chat with care team',
            'Video gallery: upload & get coach feedback',
            'Google Meet sessions with recordings',
          ],
          is_active: true,
          display_order: 1,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'mbr-002',
          name: 'Growth Plan',
          duration_label: '6 Months',
          duration_days: 180,
          price: 49999,
          original_price: 79999,
          live_sessions_count: 72,
          session_frequency: 'Total 72 live 1-on-1 sessions with trainers',
          extra_consultation_count: 0,
          has_yoga_consultation: false,
          has_yoga_plan: false,
          is_super_plan: false,
          google_meet_recording: true,
          benefits: [
            '72 live 1-on-1 sessions with certified trainer',
            'Customized fitness & nutrition plan',
            'Bi-weekly doctor plan review & iteration',
            'Daily check-in & adherence tracking',
            'Secure chat with care team',
            'Video gallery: upload & get coach feedback',
            'Google Meet sessions with recordings',
            'Progress tracking & monthly health reports',
          ],
          is_active: true,
          display_order: 2,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'mbr-003',
          name: 'Elite Plan',
          duration_label: '12 Months',
          duration_days: 365,
          price: 89999,
          original_price: 149999,
          live_sessions_count: 150,
          session_frequency: 'Total 150 live 1-on-1 sessions with trainers',
          extra_consultation_count: 0,
          has_yoga_consultation: false,
          has_yoga_plan: false,
          is_super_plan: false,
          google_meet_recording: true,
          benefits: [
            '150 live 1-on-1 sessions with certified trainer',
            'Customized fitness & nutrition plan',
            'Bi-weekly doctor plan review & iteration',
            'Daily check-in & adherence tracking',
            'Secure chat with care team',
            'Video gallery: upload & get coach feedback',
            'Google Meet sessions with recordings',
            'Progress tracking & quarterly health reports',
            'Priority appointment scheduling',
          ],
          is_active: true,
          display_order: 3,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'mbr-004',
          name: 'Super Plan',
          duration_label: '12 Months',
          duration_days: 365,
          price: 199999,
          original_price: 299999,
          live_sessions_count: null, // Weekly 5 sessions = ~260/year
          session_frequency: 'Weekly 5 live 1-on-1 sessions with trainer + Weekly 1 doctor diagnosis & monitoring + Unlimited daily live doctor consultation (weekdays only)',
          extra_consultation_count: null, // Unlimited daily
          has_yoga_consultation: true,
          has_yoga_plan: true,
          is_super_plan: true,
          google_meet_recording: true,
          benefits: [
            'Weekly 5 live 1-on-1 sessions with certified trainer (Google Meet)',
            'Weekly 1 live doctor diagnosis & full activity monitoring session',
            'Unlimited live 1-on-1 doctor consultations (once per day, weekdays only)',
            'All Google Meet sessions recorded with overwrite access',
            'Customized fitness, nutrition & yoga plan',
            'Daily check-in & adherence tracking',
            'Dedicated care team: doctor + trainer + yoga specialist',
            'Video gallery: upload & get expert feedback',
            'Priority 24/7 secure chat with care team',
            'Quarterly full health assessments & reports',
            'Yoga consultation & personalized yoga plan',
          ],
          is_active: true,
          display_order: 4,
          created_at: new Date('2024-01-01').toISOString(),
        },
      ],
      consultation_categories: [
        { id: 'cc-001', key: 'doctor_consultation', name: 'Doctor Consultation', icon: '🩺', is_active: true, display_order: 1 },
        { id: 'cc-002', key: 'nutrition_consultation', name: 'Nutrition Consultation', icon: '🥗', is_active: true, display_order: 2 },
        { id: 'cc-003', key: 'yoga', name: 'Yoga Consultation', icon: '🧘', is_active: true, display_order: 3 },
        { id: 'cc-004', key: 'womens_health', name: "Women's Health Consultation", icon: '🌸', is_active: true, display_order: 4 },
        { id: 'cc-005', key: 'pcod', name: 'PCOD / PCOS Consultation', icon: '🩺', is_active: true, display_order: 5 },
        { id: 'cc-006', key: 'lifestyle_consultation', name: 'Lifestyle Consultation', icon: '🌿', is_active: true, display_order: 6 },
        { id: 'cc-007', key: 'wellness', name: 'General Wellness Consultation', icon: '💚', is_active: true, display_order: 7 },
        { id: 'cc-008', key: 'other', name: 'Other Services', icon: '🏥', is_active: true, display_order: 8 },
      ],
      consultation_services: [
        {
          id: 'cs-001',
          key: 'yoga_consultation',
          name: 'Yoga Consultation',
          category: 'yoga',
          short_description: 'One-on-one session with a certified Yoga Doctor for posture, breathwork, and therapeutic asana alignment.',
          full_description: 'One-on-one session with a certified Yoga Doctor. Includes assessment, pranayama prescription, and personalised yoga asana plan.',
          description: 'One-on-one session with a certified Yoga Doctor. Includes assessment, pranayama prescription, and personalised yoga asana plan.',
          specialist_designation: 'BNYS Certified Yoga & Pranayama Doctor',
          icon: '🧘',
          image_url: '',
          consultation_type: 'Online Video (Google Meet)',
          price: 499,
          currency: 'INR',
          duration_min: 30,
          is_active: true,
          is_archived: false,
          display_order: 1,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'cs-002',
          key: 'pcod_consultation',
          name: 'PCOD / PCOS Consultation',
          category: 'pcod',
          short_description: 'Specialist clinical consultation for hormonal balance, PCOD & PCOS root-cause management.',
          full_description: 'Specialist clinical consultation for hormonal imbalances, PCOD & PCOS. Includes dietary guidance, lifestyle correction, and follow-up protocol.',
          description: 'Specialist clinical consultation for hormonal imbalances, PCOD & PCOS. Includes dietary guidance, lifestyle correction, and follow-up protocol.',
          specialist_designation: "Women's Health & Naturopathy Specialist Doctor",
          icon: '🩺',
          image_url: '',
          consultation_type: 'Online Video (Google Meet)',
          price: 499,
          currency: 'INR',
          duration_min: 30,
          is_active: true,
          is_archived: false,
          display_order: 2,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'cs-003',
          key: 'wellness_consultation',
          name: 'General Wellness Consultation',
          category: 'wellness',
          short_description: 'Holistic naturopathic consultation for thyroid, gut health, sleep, stress, and metabolic vitality.',
          full_description: 'For thyroid, stress, gut health, immunity, and other general health concerns with a naturopathic doctor.',
          description: 'For thyroid, stress, gut health, immunity, and other general health concerns with a naturopathic doctor.',
          specialist_designation: 'BNYS Naturopathic & Clinical Wellness Doctor',
          icon: '💚',
          image_url: '',
          consultation_type: 'Online Video (Google Meet)',
          price: 499,
          currency: 'INR',
          duration_min: 30,
          is_active: true,
          is_archived: false,
          display_order: 3,
          created_at: new Date('2024-01-01').toISOString(),
        },
      ],
      audit_logs: [],
      training_retention_config: [
        {
          id: 'trc-001',
          config_key: 'default_retention_policy',
          retention_mode: 'grace_period',
          grace_period_hours: 24,
          max_recordings_per_customer: 3,
          auto_delete_enabled: true,
          retention_days: 30,
          updated_at: new Date('2024-01-01').toISOString(),
        },
      ],
      consent_records: [],
      data_subject_requests: [],
      financial_transactions: [],
      contact_inquiries: [],
      whatsapp_notifications: [],
      whatsapp_scheduler_runs: [],
      normal_programs: [
        {
          id: 'prog-001',
          key: 'fitness_strength',
          title: 'Functional Fitness & Strength Training',
          category: 'Movement & Orthopedic Conditioning',
          icon: '🏋️',
          image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85',
          short_description: "Certified trainer-delivered 1-on-1 live sessions tailored to your orthopedic profile and fitness level. Recorded for replay with form reviews.",
          full_description: "A comprehensive movement curriculum designed by Gold's Gym certified master trainers and supervised by sports medicine physicians. Includes progressive resistance training, joint mobility, core stability, and habit tracking.",
          ideal_for: 'Weight loss, lean muscle tone, joint stability, desk posture correction, and cardiovascular endurance.',
          duration_label: '30–365 Days (Structured Care)',
          duration_days: 30,
          price: 9999,
          original_price: 14999,
          inclusions: [
            '1-on-1 live workouts on Google Meet with Gold\'s Gym certified master trainer',
            'Rolling session replay videos with technique review',
            'Customer Video Gallery form checks',
            'Joint mobility and posture correction routines',
            'Weekly doctor plan updates & milestone reviews',
          ],
          specialist_role: 'Master Fitness Trainer & Movement Specialist',
          cta_label: 'Enroll in Program',
          cta_href: '/memberships',
          is_active: true,
          display_order: 1,
        },
        {
          id: 'prog-002',
          key: 'therapeutic_yoga',
          title: 'Therapeutic Yoga & Pranayama',
          category: 'Mind-Body & Nervous System Regulation',
          icon: '🧘',
          image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=85',
          short_description: 'Yoga Doctor-prescribed therapeutic asanas and breathwork (pranayama) for joint mobility, cortisol reduction, and nervous system balance.',
          full_description: 'Therapeutic yoga integrated with clinical naturopathy. Specifically formulated for stress-induced metabolic dysfunction, back pain, anxiety, and sleep disorders. Prescribed and guided by certified BNYS Yoga Doctors.',
          ideal_for: 'Spine health, stress relief, hypertension, anxiety, insomnia, and restorative flexibility.',
          duration_label: '30–365 Days (Structured Care)',
          duration_days: 30,
          price: 9999,
          original_price: 14999,
          inclusions: [
            '1-on-1 live sessions guided by certified Yoga Doctor',
            'Personalized therapeutic asana sequence adapted to injury history',
            'Circadian pranayama and guided breathwork routines',
            'Vagus nerve activation and somatic relaxation practices',
            'Weekly doctor health checks & flexibility tracking',
          ],
          specialist_role: 'BNYS Naturopathy & Yoga Doctor',
          cta_label: 'Enroll in Program',
          cta_href: '/memberships',
          is_active: true,
          display_order: 2,
        },
        {
          id: 'prog-003',
          key: 'clinical_nutrition',
          title: 'Clinical Nutrition & Metabolic Reset',
          category: 'Metabolic Health & Whole-Food Nutrition',
          icon: '🥗',
          image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85',
          short_description: 'Gut-healing metabolic nutrition and whole-food protocols customized to your kitchen, culture, blood markers, and daily schedule.',
          full_description: 'No fad starvation diets. Our clinical nutritionists design whole-food, anti-inflammatory dietary regimens based on comprehensive blood work, microbiome health, and metabolic rate.',
          ideal_for: 'Fatty liver, pre-diabetes, high cholesterol, gut dysbiosis, bloating, and sustainable weight management.',
          duration_label: '30–365 Days (Structured Care)',
          duration_days: 30,
          price: 9999,
          original_price: 14999,
          inclusions: [
            'Blood marker & lipid profile nutritional diagnosis',
            'Weekly kitchen-friendly meal plans with macro-micro balance',
            'Circadian eating windows & glycemic stability guidance',
            'Natural gut microbiome rejuvenation protocols',
            'Direct chat support with clinical nutritionist',
          ],
          specialist_role: 'Clinical Dietitian & Lifestyle Physician',
          cta_label: 'Enroll in Program',
          cta_href: '/memberships',
          is_active: true,
          display_order: 3,
        },
        {
          id: 'prog-004',
          key: 'womens_wellness',
          title: "Women's Wellness & Hormonal Vitality",
          category: 'Endocrine & Hormonal Balance',
          icon: '🌸',
          image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85',
          short_description: 'Specialized clinical protocols for PCOD/PCOS root-cause reversal, thyroid balance, adrenal vitality, and cycle synchronization.',
          full_description: 'Designed exclusively for women experiencing hormonal fluctuations, irregular cycles, cystic acne, hirsutism, or fertility challenges. Combines endocrine-supportive nutrition, cycle-synced workouts, and naturopathic care.',
          ideal_for: 'PCOD/PCOS, thyroid optimization, peri-menopause support, fertility preparation, and hormonal acne.',
          duration_label: '30–365 Days (Structured Care)',
          duration_days: 30,
          price: 9999,
          original_price: 14999,
          inclusions: [
            'Hormonal panel analysis & insulin resistance mapping',
            'Cycle-synced nutritional & strength training regimen',
            'Herbal and botanical lifestyle supplementation guidance',
            'Stress resilience & adrenal recovery protocols',
            'Dedicated care team: Female Physician + Clinical Trainer',
          ],
          specialist_role: "Women's Health & Naturopathy Doctor",
          cta_label: 'Enroll in Program',
          cta_href: '/memberships',
          is_active: true,
          display_order: 4,
        },
      ],
      vitality_roadmap_steps: [
        {
          id: 'vstep-001',
          step: '01',
          timing: 'Day 1',
          icon: '📋',
          title: 'Comprehensive Health & Lifestyle Intake',
          accentColor: '#5c8cb5',
          description: 'Share your medical history, recent blood tests, sleep habits, dietary likes/dislikes, stress patterns, and personal goals through our secure patient portal.',
          deliverable: 'Complete Patient Profile & Medical Document Repository',
          highlightTitle: 'What We Assess',
          highlights: [
            'Height, weight, and live calculated body mass index (BMI)',
            'Circadian sleep rhythm and daily occupation demands',
            'Food preferences, allergies, and hydration status',
            'Blood chemistry (CBC, lipid profile, HbA1c, thyroid)',
          ],
          display_order: 1,
          is_active: true,
        },
        {
          id: 'vstep-002',
          step: '02',
          timing: 'Days 2–3',
          icon: '🩺',
          title: '1-on-1 Doctor Clinical Assessment',
          accentColor: '#c8956d',
          description: 'Your assigned doctor reviews your diagnostic reports and conducts a teleconsultation to diagnose root causes rather than just masking symptoms.',
          deliverable: 'Clinical Findings Dossier & Treatment Trajectory',
          highlightTitle: 'Doctor Focus Areas',
          highlights: [
            'Naturopathic root-cause diagnosis & metabolic health evaluation',
            'Metabolic and hormonal review (insulin resistance, PCOD)',
            'Joint mobility, past injuries, and functional limitations',
            'Customized therapeutic goals for the 90-day cycle',
          ],
          display_order: 2,
          is_active: true,
        },
        {
          id: 'vstep-003',
          step: '03',
          timing: 'Day 4',
          icon: '🥗',
          title: 'Personalized Regimen Formulation',
          accentColor: '#48a868',
          description: 'Your doctor, nutritionist, and trainer collaborate to build your custom, versioned regimen across six foundational pillars: Nutrition, Workout, Yoga, Sleep, Lifestyle, and Water.',
          deliverable: 'Plan Version 1 Published to your Customer Portal',
          highlightTitle: 'Your Daily Protocol Includes',
          highlights: [
            'Whole-food clinical nutrition, hydration protocols, and meal timings',
            'Tailored strength exercises and reps matching your fitness',
            'Therapeutic yoga asanas and breathwork (pranayama)',
            'Evening wind-down rituals for deep REM sleep',
          ],
          display_order: 3,
          is_active: true,
        },
        {
          id: 'vstep-004',
          step: '04',
          timing: 'Days 5–90',
          icon: '🏋️',
          title: 'Live 1-on-1 Training & Rolling Video Recordings',
          accentColor: '#9b59b6',
          description: "Train live with your certified fitness coach via Google Meet. Every session is recorded and delivered to your portal with rolling retention, so you can re-watch and practice anytime.",
          deliverable: 'Live Coaching Sessions + On-Demand Session Replay',
          highlightTitle: 'Training Features',
          highlights: [
            'Real-time posture and movement correction',
            'Video recordings automatically available within hours',
            'Video Gallery: upload your form checks for coach feedback',
            'Secure signed streaming URLs for patient data privacy',
          ],
          display_order: 4,
          is_active: true,
        },
        {
          id: 'vstep-005',
          step: '05',
          timing: 'Daily (30 seconds)',
          icon: '✅',
          title: 'Effortless 30-Second Daily Check-In',
          accentColor: '#e67e22',
          description: 'No overwhelming calorie counting or complicated logs. A simple 30-second daily check-in lets you log your workout, meals, yoga, hydration, energy, and mood.',
          deliverable: 'Continuous Adherence Tracking & Streak Metrics',
          highlightTitle: 'What You Track',
          highlights: [
            'Workout & Yoga adherence pills (yes / partial / no)',
            'Dietary compliance & water intake',
            'Subjective energy & mood levels on a 1-5 scale',
            'Daily notes to communicate directly with your care team',
          ],
          display_order: 5,
          is_active: true,
        },
        {
          id: 'vstep-006',
          step: '06',
          timing: 'Every 7 Days',
          icon: '📊',
          title: 'Weekly Doctor Reviews & Plan Iterations',
          accentColor: '#3498db',
          description: 'Every week, your doctor analyzes your check-ins and weight trends, conducts a review, and updates your plan version so you never hit a plateau.',
          deliverable: 'Weekly Review Summary & Plan Version 2, 3, etc.',
          highlightTitle: 'The Review Engine',
          highlights: [
            'Doctor evaluates 7-day adherence and weight trajectory',
            'Detailed clinical notes and actionable modifications',
            'New plan version created without erasing historical logs',
            'Continuous doctor oversight across your entire membership',
          ],
          display_order: 6,
          is_active: true,
        },
        {
          id: 'vstep-007',
          step: '07',
          timing: 'Day 90 and Beyond',
          icon: '✨',
          title: 'Sustainable Vitality & Habit Rewiring',
          accentColor: '#27ae60',
          description: 'By the end of your journey, you have achieved sustainable metabolic health, rewiring your relationship with food, movement, and sleep for the rest of your life.',
          deliverable: '90-Day Transformation Report & Long-Term Maintenance Plan',
          highlightTitle: 'Measurable Outcomes',
          highlights: [
            'Normalized metabolic markers and healthy BMI reduction',
            'Increased physical strength, stamina, and posture balance',
            'Restored circadian rhythm and natural, deep sleep',
            'Confidence and self-sufficiency in managing your health',
          ],
          display_order: 7,
          is_active: true,
        },
      ],
      homepage_settings: {
        topbar_text: 'Doctor-guided care. Everyday lifestyle transformation.',
        topbar_sub: 'Holistic health, made personal',
        hero_eyebrow: 'Physician-Led Holistic Health System',
        hero_title_line1: 'Better health.',
        hero_title_highlight: 'A more balanced',
        hero_title_line2: 'you.',
        hero_lead: 'Comprehensive lifestyle care that brings movement, nutrition and personalised doctor guidance together — helping you take meaningful, sustainable steps toward lasting vitality.',
        hero_cta_primary_label: 'Explore Our Care',
        hero_cta_primary_href: '#care',
        hero_cta_secondary_label: 'Explore Programs',
        hero_cta_secondary_href: '/programs',
        hero_image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85',
        hero_stat_1_val: '1,200+',
        hero_stat_1_lbl: 'Patients Guided',
        hero_stat_2_val: '100%',
        hero_stat_2_lbl: 'Doctor Supervised',
        hero_stat_3_val: '91.8%',
        hero_stat_3_lbl: 'Habit Adherence',
        about_eyebrow: 'Doctor-Guided Care',
        about_title: 'Care That Sees the Whole You',
        about_lead: 'At Dr Fit Veda, we combine Naturopathic Medicine, therapeutic yoga, clinical nutrition, and Gold\'s Gym certified training into one synchronized, doctor-monitored lifestyle system.',
        about_points: [
          'No fads, no starvation — science-backed holistic protocols',
          'A synchronized care team: Doctor + Trainer + Nutritionist',
          'Weekly doctor reviews with continuous plan adjustments',
          'Private health portal with adherence tracking & video check-ins',
        ],
        care_eyebrow: 'Comprehensive Lifestyle Care',
        care_title: 'Specialized Consultations & Care Modalities',
        care_lead: 'Explore our standalone doctor & specialist consultations. Each session provides dedicated 1-on-1 clinical diagnosis, prescription, and individualized guidance.',
        programs_eyebrow: 'Choose Your Journey',
        programs_title: 'Two Distinct Ways to Access Care',
        programs_lead: 'Whether you need a comprehensive guided lifestyle membership or a focused one-to-one clinical consultation, explore the right care for your needs.',
        journey_eyebrow: 'The Clinical Journey',
        journey_title: 'Your Wellbeing Journey, Made Clearer',
        journey_lead: 'From day one diagnostic intake to week 12 sustainable vitality, follow our step-by-step roadmap.',
        cta_box_title: 'Make space for a healthier you.',
        cta_box_lead: 'Explore the doctor-guided services and programs available at Dr Fit Veda.',
        cta_box_btn_label: 'Book a Consultation',
        cta_box_btn_href: '#care',
        show_topbar: true,
        show_hero: true,
        show_trust_strip: true,
        show_about: true,
        show_care: true,
        show_programs: true,
        show_journey: true,
        show_experts: true,
        show_memberships: true,
        show_testimonials: true,
        show_faq: true,
        show_cta: true,
      },
      settings: {
        platform_name: 'Dr Fit Veda',
        tagline: 'Naturopathy · Clinical Nutrition · Yoga · Certified Fitness',
        contact_email: 'support@drfitveda.com',
        support_phone: '+91 98765 00000',
        platform_address: 'Bangalore, Karnataka, India',
        google_meet_platform: 'Google Meet',
        google_meet_recording_policy: 'Admin/trainer shares Google Meet recording link after session completion',
        google_meet_super_plan_overwrite: true,
        google_meet_auto_notify: true,
        google_meet_default_url: 'https://meet.google.com/fit-veda-live',
        priority_consultation_enabled: true,
        priority_consultation_surcharge_percent: 40,
      },
      professional_roles: [
        {
          id: 'role-001',
          value: 'doctor',
          label: '🩺 Medical Doctor / Consultant',
          category: 'doctor',
          description: 'Clinical consultations, medical intake review, and prescription of holistic regimens',
          icon: '🩺',
          is_active: true,
          display_order: 1,
        },
        {
          id: 'role-002',
          value: 'naturopathy_doctor',
          label: '🌿 BNYS Naturopathy Doctor',
          category: 'doctor',
          description: 'Naturopathic physician formulating botanical, lifestyle, and hydrotherapy treatments',
          icon: '🌿',
          is_active: true,
          display_order: 2,
        },
        {
          id: 'role-003',
          value: 'ayurveda_doctor',
          label: '🪔 BAMS Ayurvedic Doctor',
          category: 'doctor',
          description: 'Ayurvedic practitioner managing dosha balance, herbal formulations, and detox therapies',
          icon: '🪔',
          is_active: true,
          display_order: 3,
        },
        {
          id: 'role-004',
          value: 'trainer',
          label: '🏋️ Certified Fitness Trainer',
          category: 'trainer',
          description: 'Functional movement, hypertrophy, fat loss, posture, and strength conditioning coach',
          icon: '🏋️',
          is_active: true,
          display_order: 4,
        },
        {
          id: 'role-005',
          value: 'yoga_doctor',
          label: '🧘 Yoga & Pranayama Doctor',
          category: 'doctor',
          description: 'Therapeutic yoga, asana alignment, kriya, and pranayama medical specialist',
          icon: '🧘',
          is_active: true,
          display_order: 5,
        },
        {
          id: 'role-006',
          value: 'yoga_consultant',
          label: '🧘 Yoga Consultant',
          category: 'consultant',
          description: 'Personalized guided meditation, mindfulness, and breathing exercises',
          icon: '🧘',
          is_active: true,
          display_order: 6,
        },
        {
          id: 'role-007',
          value: 'nutritionist',
          label: '🥗 Clinical Nutritionist & Dietitian',
          category: 'nutritionist',
          description: 'Custom macro planning, caloric deficit, micronutrient balancing, and therapeutic diets',
          icon: '🥗',
          is_active: true,
          display_order: 7,
        },
        {
          id: 'role-008',
          value: 'physiotherapist',
          label: '🩹 Clinical Physiotherapist',
          category: 'therapist',
          description: 'Injury rehabilitation, spinal alignment, ergonomics, and mobility restoration',
          icon: '🩹',
          is_active: true,
          display_order: 8,
        },
        {
          id: 'role-009',
          value: 'wellness_coach',
          label: '✨ Holistic Wellness Coach',
          category: 'consultant',
          description: 'Lifestyle habit formation, circadian rhythm optimization, and stress reduction',
          icon: '✨',
          is_active: true,
          display_order: 9,
        },
      ],
    }
  }
}

export interface ProfessionalRoleOption {
  id: string
  value: string
  label: string
  category: 'doctor' | 'trainer' | 'nutritionist' | 'therapist' | 'consultant' | 'other'
  description?: string
  icon?: string
  is_active: boolean
  display_order: number
}

export const DEFAULT_PROFESSIONAL_ROLES: ProfessionalRoleOption[] = [
  {
    id: 'role-001',
    value: 'doctor',
    label: '🩺 Medical Doctor / Consultant',
    category: 'doctor',
    description: 'Clinical consultations, medical intake review, and prescription of holistic regimens',
    icon: '🩺',
    is_active: true,
    display_order: 1,
  },
  {
    id: 'role-002',
    value: 'naturopathy_doctor',
    label: '🌿 BNYS Naturopathy Doctor',
    category: 'doctor',
    description: 'Naturopathic physician formulating botanical, lifestyle, and hydrotherapy treatments',
    icon: '🌿',
    is_active: true,
    display_order: 2,
  },
  {
    id: 'role-003',
    value: 'ayurveda_doctor',
    label: '🪔 BAMS Ayurvedic Doctor',
    category: 'doctor',
    description: 'Ayurvedic practitioner managing dosha balance, herbal formulations, and detox therapies',
    icon: '🪔',
    is_active: true,
    display_order: 3,
  },
  {
    id: 'role-004',
    value: 'trainer',
    label: '🏋️ Certified Fitness Trainer',
    category: 'trainer',
    description: 'Functional movement, hypertrophy, fat loss, posture, and strength conditioning coach',
    icon: '🏋️',
    is_active: true,
    display_order: 4,
  },
  {
    id: 'role-005',
    value: 'yoga_doctor',
    label: '🧘 Yoga & Pranayama Doctor',
    category: 'doctor',
    description: 'Therapeutic yoga, asana alignment, kriya, and pranayama medical specialist',
    icon: '🧘',
    is_active: true,
    display_order: 5,
  },
  {
    id: 'role-006',
    value: 'yoga_consultant',
    label: '🧘 Yoga Consultant',
    category: 'consultant',
    description: 'Personalized guided meditation, mindfulness, and breathing exercises',
    icon: '🧘',
    is_active: true,
    display_order: 6,
  },
  {
    id: 'role-007',
    value: 'nutritionist',
    label: '🥗 Clinical Nutritionist & Dietitian',
    category: 'nutritionist',
    description: 'Custom macro planning, caloric deficit, micronutrient balancing, and therapeutic diets',
    icon: '🥗',
    is_active: true,
    display_order: 7,
  },
  {
    id: 'role-008',
    value: 'physiotherapist',
    label: '🩹 Clinical Physiotherapist',
    category: 'therapist',
    description: 'Injury rehabilitation, spinal alignment, ergonomics, and mobility restoration',
    icon: '🩹',
    is_active: true,
    display_order: 8,
  },
  {
    id: 'role-009',
    value: 'wellness_coach',
    label: '✨ Holistic Wellness Coach',
    category: 'consultant',
    description: 'Lifestyle habit formation, circadian rhythm optimization, and stress reduction',
    icon: '✨',
    is_active: true,
    display_order: 9,
  },
]

export const mockDb = MockDatabase.getInstance()
