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
        { id: MOCK_USERS.customer.id, role: 'customer', full_name: MOCK_USERS.customer.full_name, phone: MOCK_USERS.customer.phone, is_active: true },
        { id: MOCK_USERS.doctor.id, role: 'doctor', full_name: MOCK_USERS.doctor.full_name, phone: MOCK_USERS.doctor.phone, is_active: true },
        { id: MOCK_USERS.trainer.id, role: 'trainer', full_name: MOCK_USERS.trainer.full_name, phone: MOCK_USERS.trainer.phone, is_active: true },
        { id: MOCK_USERS.admin.id, role: 'admin', full_name: MOCK_USERS.admin.full_name, phone: MOCK_USERS.admin.phone, is_active: true },
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
          zoho_meeting_url: 'https://meet.zoho.com/fitveda-priya-sharma',
          zoho_meeting_key: 'fitveda-priya-sharma',
          google_meet_url: 'https://meet.zoho.com/fitveda-priya-sharma',
          meeting_url: 'https://meet.zoho.com/fitveda-priya-sharma',
          meeting_provider: 'zoho_meeting',
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
          meeting_url: 'https://meet.zoho.com/fitveda-priya-sharma',
        },
      ],
      consultation_notes: [],
      gallery_videos: [
        {
          id: 'vid-001',
          customer_id: 'c0000000-0000-0000-0000-000000000001',
          title: 'Morning Surya Namaskar & Core Flow',
          category: 'yoga',
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
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
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
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
          meeting_url: 'https://meet.zoho.com/fitveda-priya-sharma',
          recording_url: null, // Admin pastes Google Meet recording link after session
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
      consultation_services: [
        {
          id: 'cs-001',
          key: 'yoga_consultation',
          name: 'Yoga Consultation',
          category: 'yoga',
          description: 'One-on-one session with a certified Yoga Doctor. Includes assessment, pranayama prescription, and personalised yoga asana plan.',
          price: 499,
          duration_min: 30,
          is_active: true,
          display_order: 1,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'cs-002',
          key: 'pcod_consultation',
          name: 'PCOD / PCOS Consultation',
          category: 'pcod',
          description: 'Specialist clinical consultation for hormonal imbalances, PCOD & PCOS. Includes dietary guidance, lifestyle correction, and follow-up protocol.',
          price: 499,
          duration_min: 30,
          is_active: true,
          display_order: 2,
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'cs-003',
          key: 'wellness_consultation',
          name: 'General Wellness Consultation',
          category: 'wellness',
          description: 'For thyroid, stress, gut health, immunity, and other general health concerns with a naturopathic doctor.',
          price: 499,
          duration_min: 30,
          is_active: true,
          display_order: 3,
          created_at: new Date('2024-01-01').toISOString(),
        },
      ],
      audit_logs: [],
      settings: {
        platform_name: 'Dr Fit Veda',
        tagline: 'Naturopathy · Clinical Nutrition · Yoga · Certified Fitness',
        contact_email: 'support@drfitveda.com',
        support_phone: '+91 98765 00000',
        platform_address: 'Bangalore, Karnataka, India',
        google_meet_platform: 'Google Meet',
        google_meet_recording_policy: 'Admin/trainer pastes Google Meet recording link after session completion',
        google_meet_super_plan_overwrite: true,
        google_meet_auto_notify: true,
        google_meet_default_url: 'https://meet.google.com',
      },
    }
  }
}


export const mockDb = MockDatabase.getInstance()
