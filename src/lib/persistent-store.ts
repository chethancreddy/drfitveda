// ============================================================
// Dr Fit Veda — Durable Supabase State Persistence Layer
// Bridges mockDb.state with Supabase PostgreSQL (public.website_settings)
// so all Admin, CMS, Customer, and Professional changes persist
// across Vercel serverless cold starts, devices, and sessions.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mockDb, MOCK_USERS } from './mock-db'
import { emailsMatch, normalizePhoneForMatch, isProfessionalRole } from './auth-resolver'

const STATE_KEY_PREFIX = 'drf_state:'
const CACHE_TTL_MS = 400 // Deduplicate multiple reads within the same request tick

let cachedClient: SupabaseClient | null = null
let lastLoadTimestamp = 0
let inFlightLoad: Promise<boolean> | null = null

function getRawSupabaseAdmin(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder')) {
    return null
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}

/**
 * Synchronizes runtime in-memory references (like MOCK_USERS.admin, MOCK_USERS.doctor,
 * MOCK_USERS.trainer, user_profiles, professionals, and customers)
 * after loading persisted state from Supabase.
 */
export function syncRuntimeReferences() {
  if (!mockDb.state) return
  if (!Array.isArray(mockDb.state.user_profiles)) {
    mockDb.state.user_profiles = []
  }

  const userProfiles: any[] = mockDb.state.user_profiles

  // 1. Sync Admin Profile into user_profiles (keep MOCK_USERS.admin as immutable fallback)
  const adminProf = mockDb.state.admin_profile
  if (adminProf) {
    const adminIdx = userProfiles.findIndex(
      (u: any) => u.id === MOCK_USERS.admin.id || u.role === 'admin' || u.role === 'super_admin'
    )
    if (adminIdx >= 0) {
      userProfiles[adminIdx] = {
        ...userProfiles[adminIdx],
        role: adminProf.role || userProfiles[adminIdx].role || 'admin',
        full_name: adminProf.full_name || userProfiles[adminIdx].full_name,
        phone: adminProf.phone || userProfiles[adminIdx].phone,
        email: adminProf.email || userProfiles[adminIdx].email,
      }
    }
  }

  // 2. Sync Professionals (Doctors, Trainers, Nutritionists, Yoga Specialists) -> user_profiles
  if (Array.isArray(mockDb.state.professionals)) {
    for (const pro of mockDb.state.professionals) {
      if (!pro || !pro.user_id) continue

      // Ensure user_profiles has an up-to-date record for this professional's user_id
      const uIdx = userProfiles.findIndex((up: any) => up.id === pro.user_id)
      if (uIdx >= 0) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          role: pro.role || userProfiles[uIdx].role || 'doctor',
          full_name: pro.full_name || userProfiles[uIdx].full_name,
          email: pro.email || userProfiles[uIdx].email || '',
          phone: pro.phone || userProfiles[uIdx].phone || '',
          is_active: pro.is_active !== false && !pro.is_archived,
          is_archived: Boolean(pro.is_archived),
        }
      } else {
        userProfiles.push({
          id: pro.user_id,
          role: pro.role || 'doctor',
          full_name: pro.full_name || 'Specialist',
          email: pro.email || '',
          phone: pro.phone || '',
          is_active: pro.is_active !== false && !pro.is_archived,
          is_archived: Boolean(pro.is_archived),
          created_at: pro.created_at || new Date().toISOString(),
        })
      }
    }
  }

  // 3. Sync Operations Team Members -> user_profiles
  if (Array.isArray(mockDb.state.team_members)) {
    for (const tm of mockDb.state.team_members) {
      if (!tm) continue
      const tmUserId = tm.user_id || tm.id
      if (!tmUserId) continue
      const uIdx = userProfiles.findIndex((up: any) => up.id === tmUserId)
      if (uIdx >= 0) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          role: tm.role || userProfiles[uIdx].role || 'care_coordinator',
          full_name: tm.full_name || userProfiles[uIdx].full_name,
          email: tm.email || userProfiles[uIdx].email || '',
          phone: tm.phone || userProfiles[uIdx].phone || '',
          is_active: tm.is_active !== false && !tm.is_archived,
          is_archived: Boolean(tm.is_archived),
        }
      } else {
        userProfiles.push({
          id: tmUserId,
          role: tm.role || 'care_coordinator',
          full_name: tm.full_name || 'Team Member',
          email: tm.email || '',
          phone: tm.phone || '',
          is_active: tm.is_active !== false && !tm.is_archived,
          is_archived: Boolean(tm.is_archived),
          created_at: tm.created_at || new Date().toISOString(),
        })
      }
    }
  }

  // 4. Remove any stale auto-provisioned `u-otp-*` customer profile whose email or phone
  // actually belongs to an Admin, Professional (Doctor/Trainer), or Team Member.
  const privilegedEmails: string[] = []
  const privilegedPhones: string[] = []

  if (adminProf?.email) privilegedEmails.push(adminProf.email)
  if (adminProf?.phone) privilegedPhones.push(normalizePhoneForMatch(adminProf.phone))

  for (const mu of Object.values(MOCK_USERS)) {
    if (mu.role !== 'customer') {
      if (mu.email) privilegedEmails.push(mu.email)
      if (mu.phone) privilegedPhones.push(normalizePhoneForMatch(mu.phone))
    }
  }

  if (Array.isArray(mockDb.state.professionals)) {
    for (const p of mockDb.state.professionals) {
      if (p.is_active === false) continue
      if (p.email) privilegedEmails.push(p.email)
      if (p.phone) privilegedPhones.push(normalizePhoneForMatch(p.phone))
    }
  }

  if (Array.isArray(mockDb.state.team_members)) {
    for (const tm of mockDb.state.team_members) {
      if (tm.is_active === false) continue
      if (tm.email) privilegedEmails.push(tm.email)
      if (tm.phone) privilegedPhones.push(normalizePhoneForMatch(tm.phone))
    }
  }

  mockDb.state.user_profiles = userProfiles.filter((up: any) => {
    if (!up || typeof up.id !== 'string') return false
    if (up.id.startsWith('u-otp-') && up.role === 'customer') {
      const upEmail = up.email || ''
      const upPhoneNorm = normalizePhoneForMatch(up.phone)
      const conflictsEmail =
        upEmail && privilegedEmails.some(pe => emailsMatch(pe, upEmail))
      const conflictsPhone =
        upPhoneNorm && privilegedPhones.some(pp => pp && pp === upPhoneNorm)
      if (conflictsEmail || conflictsPhone) {
        return false
      }
    }
    return true
  })

  // 5. Ensure every user_profile with a professional role has a corresponding record in `professionals`
  if (Array.isArray(mockDb.state.professionals)) {
    for (const up of mockDb.state.user_profiles) {
      if (up && isProfessionalRole(up.role) && up.is_active !== false && !up.is_archived) {
        const hasPro = mockDb.state.professionals.some((p: any) => p.user_id === up.id)
        if (!hasPro) {
          mockDb.state.professionals.push({
            id: `p0000000-0000-0000-0000-${String(up.id).replace(/\D/g, '').slice(-12).padStart(12, '0')}`,
            user_id: up.id,
            role: up.role,
            full_name: up.full_name || 'Specialist',
            email: up.email || '',
            phone: up.phone || '',
            qualification: up.role === 'trainer' ? 'Certified Fitness Trainer' : 'Naturopathy & Wellness Specialist',
            specialization: 'Holistic Lifestyle Management',
            is_available: true,
            is_active: true,
          })
        }
      }
    }
  }

  // 6. Ensure consultation_categories and consultation_services have backward-compatible defaults
  const defaultCategories = [
    { id: 'cc-001', key: 'doctor_consultation', name: 'Doctor Consultation', icon: '🩺', is_active: true, display_order: 1 },
    { id: 'cc-002', key: 'nutrition_consultation', name: 'Nutrition Consultation', icon: '🥗', is_active: true, display_order: 2 },
    { id: 'cc-003', key: 'yoga', name: 'Yoga Consultation', icon: '🧘', is_active: true, display_order: 3 },
    { id: 'cc-004', key: 'womens_health', name: "Women's Health Consultation", icon: '🌸', is_active: true, display_order: 4 },
    { id: 'cc-005', key: 'pcod', name: 'PCOD / PCOS Consultation', icon: '🩺', is_active: true, display_order: 5 },
    { id: 'cc-006', key: 'lifestyle_consultation', name: 'Lifestyle Consultation', icon: '🌿', is_active: true, display_order: 6 },
    { id: 'cc-007', key: 'wellness', name: 'General Wellness Consultation', icon: '💚', is_active: true, display_order: 7 },
    { id: 'cc-008', key: 'other', name: 'Other Services', icon: '🏥', is_active: true, display_order: 8 },
  ]
  if (!Array.isArray(mockDb.state.consultation_categories) || mockDb.state.consultation_categories.length === 0) {
    mockDb.state.consultation_categories = defaultCategories
  }

  const categoryIconMap: Record<string, string> = {
    doctor_consultation: '🩺',
    nutrition_consultation: '🥗',
    yoga: '🧘',
    womens_health: '🌸',
    pcod: '🩺',
    lifestyle_consultation: '🌿',
    wellness: '💚',
    other: '🏥',
  }

  let hadZohoToClean = false
  if (Array.isArray(mockDb.state.consultation_services)) {
    mockDb.state.consultation_services = mockDb.state.consultation_services.map((s: any, idx: number) => {
      const origType = String(s.consultation_type || '')
      const origDesc = String(s.description || '')
      const origShort = String(s.short_description || '')
      const origFull = String(s.full_description || '')
      if (/zoho/i.test(origType) || /zoho/i.test(origDesc) || /zoho/i.test(origShort) || /zoho/i.test(origFull)) {
        hadZohoToClean = true
      }
      return {
        ...s,
        short_description: (s.short_description || s.description || '').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        full_description: (s.full_description || s.description || s.short_description || '').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        description: (s.description || s.full_description || s.short_description || '').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        specialist_designation: s.specialist_designation || 'Certified Specialist Doctor',
        icon: s.icon || categoryIconMap[s.category] || '🩺',
        image_url: s.image_url || '',
        consultation_type: (s.consultation_type || 'Online Video (Google Meet)').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        currency: s.currency || 'INR',
        is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
        is_archived: Boolean(s.is_archived),
        display_order: s.display_order !== undefined ? Number(s.display_order) : idx + 1,
      }
    })
  }

  if (Array.isArray(mockDb.state.memberships)) {
    mockDb.state.memberships = mockDb.state.memberships.map((m: any) => {
      const origBenefits = Array.isArray(m.benefits) ? m.benefits.join(' ') : ''
      if (/zoho/i.test(origBenefits) || /zoho/i.test(m.session_frequency || '')) {
        hadZohoToClean = true
      }
      return {
        ...m,
        session_frequency: (m.session_frequency || '').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        benefits: Array.isArray(m.benefits)
          ? m.benefits.map((b: string) => b.replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'))
          : [],
      }
    })
  }

  if (mockDb.state.settings) {
    const defaultUrl = (mockDb.state.settings as any).google_meet_default_url
    if (!defaultUrl || defaultUrl === 'https://meet.google.com/fit-veda-live' || defaultUrl === 'https://meet.google.com') {
      ;(mockDb.state.settings as any).google_meet_default_url = 'https://meet.google.com/new'
    }
  }

  if (Array.isArray(mockDb.state.customers)) {
    mockDb.state.customers = mockDb.state.customers.map((c: any) => {
      const meetUrl = String(c.google_meet_url || c.meeting_url || '')
      if (meetUrl.includes('fit-veda-live') || meetUrl.includes('dfv-') || !meetUrl || meetUrl === 'https://meet.google.com') {
        return {
          ...c,
          google_meet_url: 'https://meet.google.com/new',
          meeting_url: 'https://meet.google.com/new',
          meeting_provider: 'google_meet',
        }
      }
      return c
    })
  }

  if (Array.isArray(mockDb.state.appointments)) {
    mockDb.state.appointments = mockDb.state.appointments.map((a: any) => {
      if (/zoho/i.test(a.consultation_type || '')) hadZohoToClean = true
      const meetUrl = String(a.meeting_url || '')
      const safeMeetUrl = (meetUrl.includes('fit-veda-live') || meetUrl.includes('dfv-') || !meetUrl || meetUrl === 'https://meet.google.com')
        ? 'https://meet.google.com/new'
        : meetUrl
      return {
        ...a,
        meeting_url: safeMeetUrl,
        consultation_type: (a.consultation_type || 'Online Video (Google Meet)')
          .replace(/zoho meeting/gi, 'Google Meet')
          .replace(/zoho/gi, 'Google Meet'),
      }
    })
  }

  if (Array.isArray(mockDb.state.training_sessions)) {
    mockDb.state.training_sessions = mockDb.state.training_sessions.map((ts: any) => {
      const meetUrl = String(ts.meeting_url || '')
      const safeMeetUrl = (meetUrl.includes('fit-veda-live') || meetUrl.includes('dfv-') || !meetUrl || meetUrl === 'https://meet.google.com')
        ? 'https://meet.google.com/new'
        : meetUrl
      return {
        ...ts,
        meeting_url: safeMeetUrl,
      }
    })
  }

  // 9. Ensure normal_programs exists and is seeded
  if (!Array.isArray(mockDb.state.normal_programs) || mockDb.state.normal_programs.length === 0) {
    mockDb.state.normal_programs = [
      {
        id: 'prog-001',
        key: 'fitness_strength',
        title: 'Functional Fitness & Strength Training',
        category: 'Movement & Orthopedic Conditioning',
        icon: '🏋️',
        image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85',
        short_description: "Certified master trainer-delivered 1-on-1 live sessions tailored to your orthopedic profile and fitness level. Recorded for replay with form reviews.",
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
    ]
  }

  // 10. Ensure homepage_settings exists
  if (!mockDb.state.homepage_settings || typeof mockDb.state.homepage_settings !== 'object') {
    mockDb.state.homepage_settings = {
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
    }
  }

  // 11. Ensure vitality_roadmap_steps exists and has the 7 core steps
  if (!Array.isArray(mockDb.state.vitality_roadmap_steps) || mockDb.state.vitality_roadmap_steps.length === 0) {
    mockDb.state.vitality_roadmap_steps = [
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
    ]
  }

  if (hadZohoToClean) {
    savePersistedState(['consultation_services', 'memberships', 'appointments']).catch(() => {})
  }
}

/**
 * Loads all persisted `drf_state:*` collections from Supabase `public.website_settings`
 * into `mockDb.state`. Safe to call at the start of any API route or Server Component.
 */
export async function loadPersistedState(force = false): Promise<boolean> {
  const client = getRawSupabaseAdmin()
  if (!client) return false

  const now = Date.now()
  if (!force && now - lastLoadTimestamp < CACHE_TTL_MS) {
    return true
  }

  if (!force && inFlightLoad) {
    return inFlightLoad
  }

  inFlightLoad = (async () => {
    try {
      const { data, error } = await client
        .from('website_settings')
        .select('key, value')
        .like('key', `${STATE_KEY_PREFIX}%`)

      if (error) {
        console.error('[persistent-store] Failed to load state from Supabase:', error.message)
        return false
      }

      if (Array.isArray(data)) {
        for (const row of data) {
          if (row?.key && typeof row.key === 'string' && row.key.startsWith(STATE_KEY_PREFIX)) {
            const stateKey = row.key.slice(STATE_KEY_PREFIX.length)
            if (stateKey && row.value !== undefined && row.value !== null) {
              mockDb.state[stateKey] = row.value
            }
          }
        }
      }

      syncRuntimeReferences()
      lastLoadTimestamp = Date.now()
      return true
    } catch (err: any) {
      console.error('[persistent-store] Unexpected error loading state:', err?.message || err)
      return false
    } finally {
      inFlightLoad = null
    }
  })()

  return inFlightLoad
}

/**
 * Persists one or more `mockDb.state` keys durably into Supabase `public.website_settings`.
 */
export async function savePersistedState(keys: string | string[]): Promise<boolean> {
  const client = getRawSupabaseAdmin()
  const keyList = Array.isArray(keys) ? keys : [keys]
  const uniqueKeys = Array.from(new Set(keyList.filter(Boolean)))

  syncRuntimeReferences()

  if (!client || uniqueKeys.length === 0) {
    return false
  }

  try {
    const nowIso = new Date().toISOString()
    const rowsToUpsert: Array<{ key: string; value: any; updated_at: string }> = []

    for (const k of uniqueKeys) {
      if (mockDb.state[k] !== undefined) {
        rowsToUpsert.push({
          key: `${STATE_KEY_PREFIX}${k}`,
          value: mockDb.state[k],
          updated_at: nowIso,
        })
      }
    }

    // Also mirror core settings keys directly in website_settings for external readers
    if (uniqueKeys.includes('settings') && mockDb.state.settings) {
      const s = mockDb.state.settings
      const mirroredKeys = [
        'site_name',
        'site_tagline',
        'contact_email',
        'contact_phone',
        'address',
        'google_meet_client_id',
        'google_meet_client_secret',
        'google_meet_refresh_token',
        'google_calendar_id',
      ]
      for (const mk of mirroredKeys) {
        if (s[mk] !== undefined) {
          rowsToUpsert.push({
            key: mk,
            value: s[mk],
            updated_at: nowIso,
          })
        }
      }
    }

    if (rowsToUpsert.length === 0) return true

    const { error } = await client
      .from('website_settings')
      .upsert(rowsToUpsert, { onConflict: 'key' })

    if (error) {
      console.error('[persistent-store] Failed to save state to Supabase:', error.message)
      return false
    }

    lastLoadTimestamp = Date.now()
    return true
  } catch (err: any) {
    console.error('[persistent-store] Unexpected error saving state:', err?.message || err)
    return false
  }
}

