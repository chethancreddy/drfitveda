import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import { mockDb } from '@/lib/mock-db'

export const metadata: Metadata = {
  title: 'Memberships & Pricing | Dr Fit Veda',
  description: 'Transparent membership plans: Starter ₹9,999, Growth ₹49,999, Elite ₹89,999, and Super ₹1,99,999. Live 1-on-1 trainer sessions on Google Meet, doctor monitoring, and separate specialist consultations at ₹499.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BADGE_COLOR: Record<string, string> = {
  'mbr-001': 'var(--color-primary)',
  'mbr-002': '#2563eb',
  'mbr-003': '#7c3aed',
  'mbr-004': 'linear-gradient(135deg,#f59e0b,#d97706)',
}
const BADGE_LABEL: Record<string, string> = {
  'mbr-001': '1 Month',
  'mbr-002': '6 Months',
  'mbr-003': '12 Months',
  'mbr-004': '🌟 Super Plan — 12 Months',
}
const CONSULT_ICON: Record<string, string> = { yoga: '🧘', pcod: '🩺', wellness: '💚' }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function MembershipsPage() {
  const plans = [...(mockDb.state.memberships ?? [])]
    .filter((m: any) => m.is_active)
    .sort((a: any, b: any) => a.display_order - b.display_order)

  const consultations = [...(mockDb.state.consultation_services ?? [])]
    .filter((s: any) => s.is_active)
    .sort((a: any, b: any) => a.display_order - b.display_order)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader active="memberships" />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center',
        }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="chip chip-accent" style={{ marginBottom: 'var(--space-xs)', display: 'inline-flex' }}>
              💎 Transparent, Results-Driven Pricing
            </span>
            <h1 className="text-display" style={{ color: 'white', marginBottom: 'var(--space-sm)' }}>
              Choose Your Transformation Journey
            </h1>
            <p className="text-body-lg" style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.65 }}>
              Every plan includes live 1-on-1 Google Meet sessions with certified trainers, a customized health plan, and a dedicated care team. No hidden fees.
            </p>
          </div>
        </section>

        {/* Plan Cards */}
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface-page)' }}>
          <div className="container" style={{ maxWidth: 1180 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: 'var(--space-md)',
              alignItems: 'stretch',
            }}>
              {plans.map((plan: any) => {
                const isSuper = plan.is_super_plan
                const border = isSuper ? '2px solid #f59e0b' : plan.display_order === 3 ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                const bg = isSuper ? 'linear-gradient(160deg,#1c1008 0%,#2a1800 100%)' : 'var(--surface-card)'
                const textCol = isSuper ? 'white' : 'inherit'
                const mutedCol = isSuper ? 'rgba(255,255,255,0.65)' : 'var(--color-muted)'

                return (
                  <div key={plan.id} className="card" style={{
                    padding: 'var(--space-xl)',
                    border,
                    background: bg,
                    color: textCol,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {isSuper && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: 'white', fontSize: 11, fontWeight: 700,
                        padding: '4px 14px', borderRadius: '0 0 0 12px',
                        letterSpacing: '0.5px',
                      }}>PREMIUM</div>
                    )}
                    {plan.display_order === 3 && !isSuper && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: 'var(--color-primary)',
                        color: 'white', fontSize: 11, fontWeight: 700,
                        padding: '4px 14px', borderRadius: '0 0 0 12px',
                        letterSpacing: '0.5px',
                      }}>POPULAR</div>
                    )}

                    <div>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          background: isSuper ? 'rgba(245,158,11,0.2)' : 'var(--color-neutral)',
                          color: isSuper ? '#f59e0b' : 'var(--color-muted)',
                          marginBottom: 8,
                        }}>
                          {BADGE_LABEL[plan.id] ?? plan.duration_label}
                        </span>
                        <h2 className="text-headline-md" style={{ marginBottom: 4, color: textCol }}>{plan.name}</h2>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 42, fontWeight: 800, color: isSuper ? '#f59e0b' : 'var(--color-on-surface)', lineHeight: 1 }}>
                          {fmt(plan.price)}
                        </span>
                        <span style={{ color: mutedCol, fontSize: 14 }}>/ {plan.duration_label}</span>
                      </div>
                      {plan.original_price && (
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ textDecoration: 'line-through', color: mutedCol, fontSize: 14 }}>
                            {fmt(plan.original_price)}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: 11 }}>
                            Save {fmt(plan.original_price - plan.price)}
                          </span>
                        </div>
                      )}

                      {/* Unified Inclusions & Frequency Box */}
                      <div style={{
                        background: isSuper ? 'rgba(245,158,11,0.08)' : 'var(--color-neutral)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        marginBottom: 20,
                        border: `1px solid ${isSuper ? 'rgba(245,158,11,0.25)' : 'var(--color-border)'}`,
                      }}>
                        {/* Live Session Frequency Highlight */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          paddingBottom: 14,
                          marginBottom: 14,
                          borderBottom: `1px solid ${isSuper ? 'rgba(255,255,255,0.1)' : 'var(--color-border)'}`,
                        }}>
                          <span style={{ fontSize: 20, lineHeight: 1 }}>🎥</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isSuper ? '#fde68a' : 'var(--color-primary)', lineHeight: 1.4 }}>
                              {plan.session_frequency}
                            </div>
                            <div style={{ fontSize: 11, color: mutedCol, marginTop: 3 }}>
                              Live 1-on-1 on Google Meet with recording &amp; review
                            </div>
                          </div>
                        </div>

                        {/* What's Included Feature List */}
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: mutedCol, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          What&apos;s Included:
                        </div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                          {(plan.benefits ?? []).map((b: string, i: number) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ color: isSuper ? '#f59e0b' : 'var(--color-success)', fontWeight: 700, flexShrink: 0, fontSize: 14 }}>✓</span>
                              <span style={{ fontSize: 13, lineHeight: 1.4, color: textCol }}>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <Link href="/login" className={`btn btn-full btn-lg ${isSuper ? '' : 'btn-primary'}`} style={isSuper ? {
                        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                      } : {}}>
                        {isSuper ? '🌟 Get Super Plan' : 'Get Started'}
                      </Link>
                      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: mutedCol }}>
                        100% Satisfaction Guarantee • Confidential Medical Data
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Google Meet note */}
        <section style={{ padding: 'var(--space-md) 0', background: 'var(--color-neutral)' }}>
          <div className="container" style={{ maxWidth: 860, textAlign: 'center' }}>
            <div className="alert alert-info" style={{ display: 'inline-flex', gap: 12, textAlign: 'left' }}>
              <span style={{ fontSize: 24 }}>📹</span>
              <div>
                <strong>All live sessions are conducted on Google Meet.</strong>
                <p className="text-body-sm" style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
                  Every session is recorded and stored securely. Super Plan members get full overwrite & override access to their session recordings. Trainer & doctor sessions are clearly labeled and searchable from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Separate Consultations */}
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface-page)' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <span className="chip chip-accent">🩺 Standalone Consultations</span>
              <h2 className="text-headline-lg" style={{ marginTop: 12, marginBottom: 8 }}>
                Separate Doctor Consultations
              </h2>
              <p className="text-body-md text-muted" style={{ maxWidth: 560, margin: '0 auto', lineHeight: 1.65 }}>
                No membership required. Book a focused one-on-one session with our specialist doctors. Available to all — or as add-ons to your plan.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-md)',
            }}>
              {consultations.map((c: any) => (
                <div key={c.id} className="card" style={{ padding: 'var(--space-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 36 }}>{CONSULT_ICON[c.category] ?? '🏥'}</div>
                  <div>
                    <h3 className="text-headline-sm" style={{ marginBottom: 4 }}>{c.name}</h3>
                    <p className="text-body-sm text-muted" style={{ lineHeight: 1.55 }}>{c.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px dashed var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>{fmt(c.price)}</span>
                      <span className="text-body-sm text-muted"> / {c.duration_min} min session</span>
                    </div>
                    <Link href="/login" className="btn btn-primary btn-sm">Book Now</Link>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'var(--space-md)', padding: '14px 20px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p className="text-body-sm text-muted">
                All consultations conducted via <strong>Google Meet</strong>. Sessions are recorded and shared with you post-consultation.
                <br />Yoga, PCOD/PCOS & Wellness consultations are separate from membership entitlements.
              </p>
            </div>
          </div>
        </section>

        {/* Financial transparency */}
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--color-neutral)' }}>
          <div className="container" style={{ maxWidth: 700, textAlign: 'center' }}>
            <h2 className="text-headline-md" style={{ marginBottom: 12 }}>Radical Financial Transparency</h2>
            <p className="text-body-md text-muted" style={{ lineHeight: 1.65, marginBottom: 24 }}>
              Over 67% of your membership fee directly compensates the certified medical and fitness professionals working on your care. Admins can view and manage the full allocation breakdown.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
              {[
                { label: 'Certified Trainer Sessions', sub: 'Live Google Meet coaching', val: '55%' },
                { label: 'Doctor Reviews & Planning', sub: 'Clinical assessments & plan updates', val: '12%' },
                { label: 'Platform & Secure Storage', sub: 'Video, HIPAA-grade hosting', val: '33%' },
              ].map(r => (
                <div key={r.label} className="card" style={{ padding: '16px 20px', minWidth: 190, flex: '1 1 180px', textAlign: 'left' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4 }}>{r.val}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{r.label}</div>
                  <div className="text-caption text-muted">{r.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
