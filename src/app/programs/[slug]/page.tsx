import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import { mockDb, NormalProgram } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

function fmt(n: number) {
  const val = Number(n || 0)
  return '₹' + val.toLocaleString('en-IN')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await loadPersistedState()
  const { slug } = await params
  const programs: NormalProgram[] = mockDb.state.normal_programs ?? []
  const program = programs.find(
    p => p.key === slug || p.id === slug || String(p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '_') === slug
  )

  if (!program) {
    return { title: 'Program — Dr Fit Veda' }
  }

  return {
    title: `${program.title} — Doctor-Guided Lifestyle Program | Dr Fit Veda`,
    description: program.short_description || program.full_description,
  }
}

export default async function ProgramDetailPage({ params }: PageProps) {
  await loadPersistedState()
  const { slug } = await params

  const programs: NormalProgram[] = (mockDb.state.normal_programs ?? []).filter((p: NormalProgram) => p.is_active)
  const program = programs.find(
    (p: NormalProgram) => p.key === slug || p.id === slug || String(p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '_') === slug
  )

  if (!program) {
    notFound()
  }

  const otherPrograms = programs.filter(p => p.id !== program.id)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FDFAF6' }}>
      <PublicHeader active="programs" />

      <main style={{ flex: 1 }}>
        {/* Breadcrumb strip */}
        <section style={{ background: '#F6F1E8', borderBottom: '1px solid #D9CDBF', padding: '14px 0' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8B6F57' }}>
              <Link href="/" style={{ color: '#5C8CB5', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
              <span>›</span>
              <Link href="/programs" style={{ color: '#5C8CB5', textDecoration: 'none', fontWeight: 600 }}>Programs</Link>
              <span>›</span>
              <span style={{ color: '#1F1A17', fontWeight: 700 }}>{program.title}</span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section style={{ padding: '48px 0 36px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 40, alignItems: 'start' }}>
              {/* Left Column: Details */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                  <span>{program.icon}</span>
                  <span>{program.category}</span>
                </div>

                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 42px)', color: '#1F1A17', lineHeight: 1.15, marginBottom: 14 }}>
                  {program.title}
                </h1>

                <div style={{ fontSize: 15, fontWeight: 700, color: '#5C8CB5', marginBottom: 18 }}>
                  👨‍⚕️ Guided by: {program.specialist_role}
                </div>

                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', marginBottom: 24 }}>
                  {program.full_description || program.short_description}
                </p>

                {/* Ideal For Box */}
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 16, padding: '20px 22px', marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#453421', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    🎯 Ideal For
                  </div>
                  <p style={{ fontSize: 14, color: '#8B6F57', lineHeight: 1.6, margin: 0 }}>
                    {program.ideal_for}
                  </p>
                </div>

                {/* What Is Included */}
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 28px', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 14 }}>
                    What Is Included in This Guided Program:
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {program.inclusions.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#8B6F57' }}>
                        <span style={{ color: '#5C8CB5', fontWeight: 900 }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Pricing & Enrollment Card */}
              <div style={{ position: 'sticky', top: 90 }}>
                <div style={{ background: '#fff', border: '2px solid #5C8CB5', borderRadius: 22, padding: '32px 28px', boxShadow: '0 16px 45px rgba(69,52,33,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#453421', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Guided Care Membership
                    </span>
                    <span style={{ background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                      Doctor Monitored
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '12px 0 6px' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: '#1F1A17' }}>
                      {fmt(program.price)}
                    </span>
                    <span style={{ fontSize: 14, color: '#8B6F57' }}>/ 1 Month Starter Care</span>
                  </div>

                  {program.original_price && (
                    <div style={{ fontSize: 13, color: '#8B6F57', textDecoration: 'line-through', marginBottom: 16 }}>
                      Standard fee: {fmt(program.original_price)}
                    </div>
                  )}

                  <p style={{ fontSize: 12.5, color: '#8B6F57', marginBottom: 20 }}>
                    Includes 1-on-1 live trainer workouts, continuous doctor supervision, bi-weekly nutrition adjustments, and video form analysis.
                  </p>

                  <div style={{ borderTop: '1px solid #D9CDBF', paddingTop: 18, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: '#8B6F57' }}>Duration:</span>
                      <strong style={{ color: '#1F1A17' }}>30 to 365 Days</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: '#8B6F57' }}>Care Team:</span>
                      <strong style={{ color: '#1F1A17' }}>Doctor + Trainer + Dietitian</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#8B6F57' }}>Platform:</span>
                      <strong style={{ color: '#5C8CB5' }}>Browser-Based Google Meet</strong>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link
                    href="/memberships"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      background: '#5C8CB5',
                      color: '#fff',
                      padding: '16px 20px',
                      borderRadius: 999,
                      fontSize: 15,
                      fontWeight: 750,
                      textDecoration: 'none',
                      boxShadow: '0 10px 24px rgba(92,140,181,0.25)',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span>View Membership Plans &amp; Enroll</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Programs */}
        {otherPrograms.length > 0 && (
          <section style={{ padding: '40px 0 60px', background: '#fff', borderTop: '1px solid #D9CDBF' }}>
            <div className="container" style={{ maxWidth: 1100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1F1A17', margin: 0 }}>
                  Explore Other Guided Programs
                </h2>
                <Link href="/programs" style={{ fontSize: 13, fontWeight: 700, color: '#5C8CB5', textDecoration: 'none' }}>
                  All Programs →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                {otherPrograms.map(op => (
                  <div key={op.id} style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{op.icon}</div>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>{op.title}</h3>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#5C8CB5', marginBottom: 10 }}>
                        {op.specialist_role}
                      </div>
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: '#8B6F57', marginBottom: 16 }}>
                        {op.short_description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #D9CDBF' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1F1A17' }}>
                        {fmt(op.price)}
                      </span>
                      <Link
                        href={`/programs/${op.key}`}
                        style={{ fontSize: 12, fontWeight: 750, color: '#5C8CB5', textDecoration: 'none' }}
                      >
                        Explore →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
