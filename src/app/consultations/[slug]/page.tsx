import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import ConsultationBookingCard from '@/components/public/ConsultationBookingCard'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

function fmt(n: number, currency = 'INR') {
  const val = Number(n || 0)
  if (currency === 'USD') return '$' + val.toLocaleString('en-US')
  if (currency === 'AED') return 'AED ' + val.toLocaleString('en-AE')
  return '₹' + val.toLocaleString('en-IN')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await loadPersistedState()
  const { slug } = await params
  const services: any[] = mockDb.state.consultation_services ?? []
  const service = services.find(
    (s: any) =>
      s.key === slug ||
      s.id === slug ||
      String(s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_') === slug
  )

  if (!service) {
    return { title: 'Consultation Service — Dr Fit Veda' }
  }

  return {
    title: `${service.name} — Doctor-Guided Consultation | Dr Fit Veda`,
    description: service.short_description || service.description || 'Doctor-guided 1-on-1 healthcare teleconsultation.',
  }
}

export default async function ConsultationDetailPage({ params }: PageProps) {
  await loadPersistedState()
  const { slug } = await params

  const services: any[] = (mockDb.state.consultation_services ?? []).filter(
    (s: any) => s.is_active !== false && !s.is_archived
  )

  const service = services.find(
    (s: any) =>
      s.key === slug ||
      s.id === slug ||
      String(s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_') === slug
  )

  if (!service) {
    notFound()
  }

  const related = services.filter((s: any) => s.id !== service.id).slice(0, 3)

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
              <Link href="/programs" style={{ color: '#5C8CB5', textDecoration: 'none', fontWeight: 600 }}>Programs &amp; Care</Link>
              <span>›</span>
              <span style={{ color: '#1F1A17', fontWeight: 700 }}>{service.name}</span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section style={{ padding: '48px 0 36px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 36, alignItems: 'start' }}>
              {/* Left Column: Details */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                  <span>{service.icon || '🩺'}</span>
                  <span>{service.category_label || service.category || 'Consultation Program'}</span>
                </div>

                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 42px)', color: '#1F1A17', lineHeight: 1.15, marginBottom: 14 }}>
                  {service.name}
                </h1>

                {service.specialist_designation && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#5C8CB5', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>👨‍⚕️</span>
                    <span>{service.specialist_designation}</span>
                  </div>
                )}

                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', marginBottom: 24 }}>
                  {service.full_description || service.description || service.short_description}
                </p>

                {/* Clinical Metadata Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
                  <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#8B6F57', fontWeight: 700 }}>Session Duration</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1F1A17', marginTop: 4 }}>
                      ⏱️ {service.duration_min || 30} mins
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#8B6F57', fontWeight: 700 }}>Meeting Mode</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1F1A17', marginTop: 4 }}>
                      📹 Google Meet
                    </div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#8B6F57', fontWeight: 700 }}>Delivery Type</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1F1A17', marginTop: 4 }}>
                      1-on-1 Dedicated
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 28px', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 14 }}>
                    What Is Included in This Session:
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      'In-depth clinical symptom intake & health history evaluation',
                      'Root-cause diagnosis aligned with Naturopathy & science-backed lifestyle medicine',
                      'Personalized treatment protocol, dietary adjustments, and yoga/movement suggestions',
                      'Direct Q&A with your certified specialist physician',
                      'Written consultation summary delivered to your private DrFitVeda portal',
                      'Dedicated browser-based Google Meet link sent via WhatsApp & Email',
                    ].map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#8B6F57' }}>
                        <span style={{ color: '#5C8CB5', fontWeight: 900 }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Pricing & Interactive Standard vs Priority Booking Card */}
              <div style={{ position: 'sticky', top: 90 }}>
                <ConsultationBookingCard service={service} />
              </div>
            </div>
          </div>
        </section>

        {/* Related Services */}
        {related.length > 0 && (
          <section style={{ padding: '40px 0 60px', background: '#fff', borderTop: '1px solid #D9CDBF' }}>
            <div className="container" style={{ maxWidth: 1100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1F1A17', margin: 0 }}>
                    Other Clinical Consultations
                  </h2>
                  <p style={{ fontSize: 13, color: '#8B6F57', margin: '4px 0 0' }}>
                    Explore specialist care across yoga, hormonal health, and lifestyle medicine.
                  </p>
                </div>
                <Link href="/programs" style={{ fontSize: 13, fontWeight: 700, color: '#5C8CB5', textDecoration: 'none' }}>
                  View All Programs &amp; Consultations →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                {related.map((rel: any) => (
                  <div key={rel.id} style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{rel.icon || '🩺'}</div>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>{rel.name}</h3>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#5C8CB5', marginBottom: 10 }}>
                        {rel.specialist_designation || 'Specialist Doctor'}
                      </div>
                      <p style={{ fontSize: 12.5, lineHeight: 1.6, color: '#8B6F57', marginBottom: 16 }}>
                        {rel.short_description || rel.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #D9CDBF' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1F1A17' }}>
                        {fmt(rel.price, rel.currency)}
                      </span>
                      <Link
                        href={`/consultations/${rel.key || rel.id}`}
                        style={{ fontSize: 12, fontWeight: 750, color: '#5C8CB5', textDecoration: 'none' }}
                      >
                        Learn More →
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
