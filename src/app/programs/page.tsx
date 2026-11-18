import type { Metadata } from 'next'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import ProgramsView from '@/components/public/ProgramsView'
import { mockDb, NormalProgram, VitalityRoadmapStep } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

export const metadata: Metadata = {
  title: 'Our Programs & Clinical Consultations — Doctor-Guided Holistic Care | Dr Fit Veda',
  description: 'Explore our multi-disciplinary lifestyle programs and standalone specialist consultations: Fitness Training, Therapeutic Yoga, Clinical Nutrition, and Women\'s Wellness.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  await loadPersistedState()
  const params = await searchParams
  const initialTab = params?.tab === 'consultation' ? 'consultation' : 'normal'

  const normalPrograms: NormalProgram[] = (mockDb.state.normal_programs ?? [])
    .filter((p: NormalProgram) => p.is_active)
    .sort((a: NormalProgram, b: NormalProgram) => (a.display_order ?? 99) - (b.display_order ?? 99))

  const consultationServices: any[] = (mockDb.state.consultation_services ?? [])
    .filter((s: any) => s.is_active !== false && !s.is_archived)
    .sort((a: any, b: any) => (a.display_order ?? 99) - (b.display_order ?? 99))

  const roadmapSteps: VitalityRoadmapStep[] = (mockDb.state.vitality_roadmap_steps ?? [])
    .filter((s: VitalityRoadmapStep) => s.is_active !== false)
    .sort((a: VitalityRoadmapStep, b: VitalityRoadmapStep) => (a.display_order ?? 99) - (b.display_order ?? 99))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FDFAF6' }}>
      <PublicHeader active="programs" />

      <main style={{ flex: 1 }}>
        {/* Hero Banner */}
        <section
          style={{
            background: 'linear-gradient(135deg, #453421 0%, #302316 60%, #22180E 100%)',
            color: 'white',
            padding: '56px 0 48px',
            textAlign: 'center',
          }}
        >
          <div className="container" style={{ maxWidth: 820 }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#F6F1E8',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 14,
              }}
            >
              🌿 Physician-Led Holistic Health System
            </span>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(32px, 5vw, 52px)',
                lineHeight: 1.1,
                color: 'white',
                marginBottom: 14,
              }}
            >
              Our Programs &amp; Specialist Care
            </h1>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.85)',
                maxWidth: 640,
                marginInline: 'auto',
              }}
            >
              Choose between structured, doctor-monitored lifestyle transformation memberships or standalone 1-on-1 specialist teleconsultations.
            </p>
          </div>
        </section>

        {/* Dynamic Dual-Tab Programs View */}
        <section style={{ padding: '48px 0 80px' }}>
          <div className="container" style={{ maxWidth: 1180 }}>
            <ProgramsView
              normalPrograms={normalPrograms}
              consultationServices={consultationServices}
              roadmapSteps={roadmapSteps}
              initialTab={initialTab}
            />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
