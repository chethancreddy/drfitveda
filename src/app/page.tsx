import type { Metadata } from 'next'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import HomepageView from '@/components/public/HomepageView'
import { mockDb, NormalProgram, HomepageSettings, VitalityRoadmapStep } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Dr Fit Veda — Doctor-Guided Lifestyle Management & Specialist Care',
  description: 'Doctor-guided lifestyle care: Naturopathic Medicine, 1-on-1 certified trainer workouts on Google Meet, therapeutic yoga, and clinical nutrition. Begin your personalized health transformation.',
}

export default async function HomePage() {
  await loadPersistedState()

  const settings: HomepageSettings = mockDb.state.homepage_settings || {
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

  const consultationServices = (mockDb.state.consultation_services ?? [])
    .filter((s: any) => s.is_active !== false && !s.is_archived)
    .sort((a: any, b: any) => (a.display_order ?? 99) - (b.display_order ?? 99))

  const normalPrograms: NormalProgram[] = (mockDb.state.normal_programs ?? [])
    .filter((p: NormalProgram) => p.is_active)
    .sort((a: NormalProgram, b: NormalProgram) => (a.display_order ?? 99) - (b.display_order ?? 99))

  const roadmapSteps: VitalityRoadmapStep[] = (mockDb.state.vitality_roadmap_steps ?? [])
    .filter((s: VitalityRoadmapStep) => s.is_active !== false)
    .sort((a: VitalityRoadmapStep, b: VitalityRoadmapStep) => (a.display_order ?? 99) - (b.display_order ?? 99))

  const memberships = (mockDb.state.memberships ?? [])
    .filter((m: any) => m.is_active)
    .sort((a: any, b: any) => a.display_order - b.display_order)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader active="home" />

      <main style={{ flex: 1 }}>
        <HomepageView
          settings={settings}
          consultationServices={consultationServices}
          normalPrograms={normalPrograms}
          memberships={memberships}
          roadmapSteps={roadmapSteps}
        />
      </main>

      <PublicFooter />
    </div>
  )
}
