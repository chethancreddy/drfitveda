'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NormalProgram, HomepageSettings, VitalityRoadmapStep } from '@/lib/mock-db'
import VitalityRoadmap from '@/components/public/VitalityRoadmap'
import ConsultationHowItWorks from '@/components/public/ConsultationHowItWorks'

interface HomepageViewProps {
  settings: HomepageSettings
  consultationServices: any[]
  normalPrograms: NormalProgram[]
  memberships: any[]
  roadmapSteps?: VitalityRoadmapStep[]
}

function fmt(n: number, currency = 'INR') {
  const val = Number(n || 0)
  if (currency === 'USD') return '$' + val.toLocaleString('en-US')
  if (currency === 'AED') return 'AED ' + val.toLocaleString('en-AE')
  return '₹' + val.toLocaleString('en-IN')
}

export default function HomepageView({
  settings,
  consultationServices,
  normalPrograms,
  memberships,
  roadmapSteps = [],
}: HomepageViewProps) {
  const [programTab, setProgramTab] = useState<'normal' | 'consultation'>('normal')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx))
  }

  // Active published services
  const publishedServices = consultationServices.slice(0, 8)
  const publishedNormal = normalPrograms.slice(0, 4)
  const sortedMemberships = [...memberships].sort((a, b) => a.display_order - b.display_order)

  return (
    <div style={{ color: '#1F1A17', background: '#FDFAF6' }}>
      {/* ─── 1. TOPBAR ─── */}
      {settings.show_topbar && (
        <div
          style={{
            background: '#453421',
            color: '#F6F1E8',
            fontSize: 11,
            letterSpacing: '0.04em',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>{settings.topbar_text}</span>
            <span style={{ opacity: 0.85 }}>{settings.topbar_sub}</span>
          </div>
        </div>
      )}

      {/* ─── 2. HERO SECTION ─── */}
      {settings.show_hero && (
        <section
          id="home"
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '64px 0 72px',
            background: 'radial-gradient(circle at 85% 15%, rgba(207,161,106,0.18) 0, transparent 35%), linear-gradient(105deg, #FDFAF6 0%, #F6F1E8 60%, #EFE7DB 100%)',
            borderBottom: '1px solid #D9CDBF',
          }}
        >
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                alignItems: 'center',
                gap: 48,
              }}
            >
              {/* Hero Copy */}
              <div style={{ maxWidth: 620 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#5C8CB5',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ width: 20, height: 2, background: '#CFA16A', display: 'inline-block' }}></span>
                  {settings.hero_eyebrow}
                </span>

                <h1
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 'clamp(38px, 5.5vw, 68px)',
                    lineHeight: 1.05,
                    color: '#1F1A17',
                    margin: '0 0 20px',
                    letterSpacing: '-0.025em',
                  }}
                >
                  {settings.hero_title_line1}
                  <br />
                  <span style={{ color: '#5C8CB5', fontStyle: 'italic', fontWeight: 400 }}>
                    {settings.hero_title_highlight}
                  </span>
                  <br />
                  {settings.hero_title_line2}
                </h1>

                <p
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.75,
                    color: '#8B6F57',
                    marginBottom: 28,
                    maxWidth: 540,
                  }}
                >
                  {settings.hero_lead}
                </p>

                {/* Hero Actions — Distinct Two Program Categories */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
                  <Link
                    href="/programs"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#5C8CB5',
                      color: '#fff',
                      padding: '14px 26px',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 750,
                      textDecoration: 'none',
                      boxShadow: '0 10px 24px rgba(92,140,181,0.28)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{settings.hero_cta_primary_label || 'Normal Programs'}</span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/programs?tab=consultation"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#fff',
                      color: '#453421',
                      border: '1.5px solid #D9CDBF',
                      padding: '14px 24px',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{settings.hero_cta_secondary_label || 'Consultation Programs'}</span>
                    <span>↗</span>
                  </Link>
                </div>

                {/* Micro Guarantee Tags */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  {['Continuous Doctor Oversight', '1-on-1 Google Meet Sessions', 'No App Download Required'].map((tag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#8B6F57' }}>
                      <span style={{ color: '#5C8CB5', fontWeight: 800 }}>✓</span>
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Visual Card */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    borderRadius: '28px 140px 28px 28px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 60px rgba(69,52,33,0.12)',
                    position: 'relative',
                    aspectRatio: '4/3.8',
                    background: '#FDFAF6',
                    border: '1px solid #D9CDBF',
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=85"
                    alt="Holistic lifestyle wellness session and doctor guidance"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(31,26,23,0.7) 0%, transparent 50%)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 24,
                      left: 24,
                      right: 24,
                      color: '#fff',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.22)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'inline-block',
                        marginBottom: 8,
                      }}
                    >
                      Doctor Supervised
                    </span>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: 0, color: '#fff' }}>
                      Personalized Naturopathy, Yoga &amp; Nutrition
                    </h3>
                  </div>
                </div>

                {/* Floating Badge 1: 100% Google Meet */}
                <div
                  style={{
                    position: 'absolute',
                    top: 24,
                    right: -12,
                    background: '#fff',
                    padding: '12px 18px',
                    borderRadius: 16,
                    boxShadow: '0 12px 30px rgba(69,52,33,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '1px solid #D9CDBF',
                  }}
                >
                  <span style={{ fontSize: 24 }}>📹</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1F1A17' }}>1-on-1 Google Meet</div>
                    <div style={{ fontSize: 11, color: '#8B6F57' }}>Zero downloads required</div>
                  </div>
                </div>

                {/* Floating Badge 2: Certified Specialists */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    left: 24,
                    background: '#fff',
                    padding: '12px 18px',
                    borderRadius: 16,
                    boxShadow: '0 12px 30px rgba(69,52,33,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '1px solid #D9CDBF',
                  }}
                >
                  <span style={{ fontSize: 24 }}>🩺</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1F1A17' }}>Accredited Physicians</div>
                    <div style={{ fontSize: 11, color: '#8B6F57' }}>BNYS Doctors &amp; Certified Coaches</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 3. TRUST STRIP ─── */}
      {settings.show_trust_strip && (
        <div style={{ background: '#fff', borderBottom: '1px solid #D9CDBF' }}>
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                padding: '22px 0',
                gap: 16,
              }}
            >
              {[
                { icon: '✚', title: 'Doctor-guided clinical approach' },
                { icon: '◎', title: 'Personalised whole-body care' },
                { icon: '⌁', title: 'Lifestyle & metabolic wellness' },
                { icon: '♡', title: 'Continuous doctor & coach support' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#453421', fontSize: 13, fontWeight: 700 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#F6F1E8',
                      border: '1px solid #D9CDBF',
                      color: '#5C8CB5',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. ABOUT DR FIT VEDA / DOCTOR-GUIDED CARE ─── */}
      {settings.show_about && (
        <section style={{ padding: '80px 0', background: '#FDFAF6' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 48, alignItems: 'center' }}>
              <div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                  {settings.about_eyebrow}
                </span>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 4vw, 44px)', color: '#1F1A17', lineHeight: 1.15, marginBottom: 18 }}>
                  {settings.about_title}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: '#8B6F57', marginBottom: 24 }}>
                  {settings.about_lead}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {settings.about_points.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14.5, color: '#1F1A17' }}>
                      <span style={{ color: '#5C8CB5', fontWeight: 900, fontSize: 16 }}>✓</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/about"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#453421',
                    fontWeight: 750,
                    fontSize: 14,
                    textDecoration: 'none',
                    borderBottom: '2px solid #CFA16A',
                    paddingBottom: 2,
                  }}
                >
                  <span>Learn more about our clinical methodology</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Clinical Quad Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 20px', boxShadow: '0 8px 24px rgba(69,52,33,0.05)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🩺</div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>Naturopathy</h3>
                  <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>Root-cause diagnosis, botanical medicine, and non-invasive vitality therapies.</p>
                </div>
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 20px', boxShadow: '0 8px 24px rgba(69,52,33,0.05)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🥗</div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>Clinical Nutrition</h3>
                  <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>Circadian eating, anti-inflammatory meal planning, and metabolic reset.</p>
                </div>
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 20px', boxShadow: '0 8px 24px rgba(69,52,33,0.05)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🧘</div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>Therapeutic Yoga</h3>
                  <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>Yoga Doctor-prescribed therapeutic asanas, pranayama, and vagus nerve calm.</p>
                </div>
                <div style={{ background: '#fff', border: '1px solid #D9CDBF', borderRadius: 18, padding: '24px 20px', boxShadow: '0 8px 24px rgba(69,52,33,0.05)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🏋️</div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1F1A17', marginBottom: 6 }}>Certified Fitness</h3>
                  <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>1-on-1 master trainer sessions on Google Meet, recorded with video technique review.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 5. COMPREHENSIVE LIFESTYLE CARE (100% SYNCHRONIZED WITH CONSULTATION SERVICES CMS!) ─── */}
      {settings.show_care && (
        <section id="care" style={{ padding: '88px 0', background: '#fff', borderTop: '1px solid #D9CDBF', borderBottom: '1px solid #D9CDBF' }}>
          <div className="container">
            <div style={{ maxWidth: 740, margin: '0 auto 48px', textAlign: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#5C8CB5',
                  marginBottom: 10,
                }}
              >
                {settings.care_eyebrow}
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4.5vw, 48px)', color: '#1F1A17', lineHeight: 1.12, margin: '0 0 16px' }}>
                {settings.care_title}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', margin: 0 }}>
                {settings.care_lead}
              </p>
            </div>

            {/* Dynamic Consultation Service Cards from CMS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
                gap: 22,
              }}
            >
              {publishedServices.map((svc: any) => (
                <article
                  key={svc.id}
                  style={{
                    background: '#FDFAF6',
                    border: '1px solid #D9CDBF',
                    borderRadius: 20,
                    padding: '26px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 6px 20px rgba(69,52,33,0.04)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          background: '#F6F1E8',
                          border: '1px solid #D9CDBF',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 22,
                          color: '#453421',
                        }}
                      >
                        {svc.icon || '🩺'}
                      </div>
                      <span
                        style={{
                          background: '#F6F1E8',
                          border: '1px solid #D9CDBF',
                          color: '#453421',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {svc.category_label || svc.category || 'Consultation'}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 6 }}>
                      {svc.name}
                    </h3>

                    {svc.specialist_designation && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#5C8CB5', marginBottom: 10 }}>
                        👨‍⚕️ {svc.specialist_designation}
                      </div>
                    )}

                    <p style={{ fontSize: 13, color: '#8B6F57', lineHeight: 1.6, marginBottom: 18 }}>
                      {svc.short_description || svc.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                      <span style={{ fontSize: 11, background: '#fff', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                        ⏱️ {svc.duration_min || 30} mins
                      </span>
                      <span style={{ fontSize: 11, background: '#fff', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                        📹 Google Meet
                      </span>
                    </div>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: '1px solid #D9CDBF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                      <div>
                        <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#8B6F57', fontWeight: 700, display: 'block' }}>Standard Fee</span>
                        <strong style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1F1A17' }}>
                          {fmt(svc.price, svc.currency)}
                        </strong>
                        <span style={{ fontSize: 11, color: '#453421', display: 'block', fontWeight: 600 }}>
                          Priority: {fmt(Math.round(Number(svc.price || 999) * 1.40), svc.currency)}
                        </span>
                      </div>
                      <Link
                        href={`/consultations/${svc.key || svc.id}`}
                        style={{ fontSize: 12.5, fontWeight: 750, color: '#5C8CB5', textDecoration: 'none' }}
                      >
                        Enrol &amp; Book →
                      </Link>
                    </div>

                    <Link
                      href={`/login?redirect=/customer/consult?service=${encodeURIComponent(svc.key || svc.id)}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        width: '100%',
                        background: '#5C8CB5',
                        color: '#fff',
                        padding: '11px 16px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 750,
                        textDecoration: 'none',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        boxShadow: '0 4px 14px rgba(92,140,181,0.25)',
                      }}
                    >
                      <span>Book Consultation</span>
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <Link
                href="/programs?tab=consultation"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F6F1E8',
                  color: '#453421',
                  border: '1px solid #D9CDBF',
                  padding: '12px 26px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 750,
                  textDecoration: 'none',
                }}
              >
                <span>View All Specialist Consultations</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. OUR PROGRAMS (TWO DISTINCT TYPES: NORMAL vs CONSULTATION) ─── */}
      {settings.show_programs && (
        <section style={{ padding: '88px 0', background: '#F6F1E8' }}>
          <div className="container">
            <div style={{ maxWidth: 740, margin: '0 auto 40px', textAlign: 'center' }}>
              <span
                style={{
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#5C8CB5',
                  marginBottom: 10,
                }}
              >
                {settings.programs_eyebrow}
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4.5vw, 48px)', color: '#1F1A17', lineHeight: 1.12, margin: '0 0 16px' }}>
                {settings.programs_title}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', margin: 0 }}>
                {settings.programs_lead}
              </p>

              {/* Tab Switcher */}
              <div
                style={{
                  display: 'inline-flex',
                  background: '#FDFAF6',
                  border: '1px solid #D9CDBF',
                  padding: 6,
                  borderRadius: 999,
                  gap: 6,
                  marginTop: 26,
                }}
              >
                <button
                  type="button"
                  onClick={() => setProgramTab('normal')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '12px 24px',
                    background: programTab === 'normal' ? '#453421' : 'transparent',
                    color: programTab === 'normal' ? '#fff' : '#8B6F57',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🏋️ Normal Programs ({publishedNormal.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProgramTab('consultation')}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: '12px 24px',
                    background: programTab === 'consultation' ? '#453421' : 'transparent',
                    color: programTab === 'consultation' ? '#fff' : '#8B6F57',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🩺 Consultation Programs ({publishedServices.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Normal Programs */}
            {programTab === 'normal' && (
              <div>
                <div
                  style={{
                    background: '#FDFAF6',
                    border: '1px solid #D9CDBF',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 32,
                    textAlign: 'center',
                    fontSize: 14.5,
                    color: '#453421',
                    fontWeight: 600,
                  }}
                >
                  ✨ <strong>Normal Programs:</strong> Follow our 7-Step Roadmap to Vitality with continuous physician monitoring and 1-on-1 live training.
                </div>

                <VitalityRoadmap steps={roadmapSteps} compact={true} />

                <div style={{ marginTop: 48, textAlign: 'center' }}>
                  <Link
                    href="/programs"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#5C8CB5',
                      color: '#fff',
                      padding: '12px 26px',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 750,
                      textDecoration: 'none',
                      boxShadow: '0 6px 16px rgba(92,140,181,0.25)',
                    }}
                  >
                    <span>View All Normal Programs &amp; Disciplines</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Consultation Programs */}
            {programTab === 'consultation' && (
              <div>
                <div
                  style={{
                    background: '#F0F6FA',
                    border: '1px solid #5C8CB5',
                    borderRadius: 16,
                    padding: '16px 20px',
                    marginBottom: 32,
                    textAlign: 'center',
                    fontSize: 14.5,
                    color: '#453421',
                    fontWeight: 600,
                  }}
                >
                  🩺 <strong>Consultation Programs:</strong> Choose your consultation. Book your slot. Connect with your doctor.
                </div>

                <ConsultationHowItWorks />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24, marginTop: 32 }}>
                  {publishedServices.map((svc: any) => {
                    const baseFee = Number(svc.price || 999)
                    const priorityFee = Math.round(baseFee * 1.40)

                    return (
                      <div
                        key={svc.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #D9CDBF',
                          borderRadius: 22,
                          padding: '28px 24px',
                          boxShadow: '0 10px 30px rgba(69,52,33,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 32 }}>{svc.icon || '🩺'}</span>
                            <span style={{ background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                              {svc.category_label || svc.category || 'Consultation'}
                            </span>
                          </div>
                          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 8 }}>
                            {svc.name}
                          </h3>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#5C8CB5', marginBottom: 10 }}>
                            👨‍⚕️ {svc.specialist_designation || 'Specialist Doctor'}
                          </div>
                          <p style={{ fontSize: 13, color: '#8B6F57', lineHeight: 1.6, marginBottom: 16 }}>
                            {svc.short_description || svc.description}
                          </p>

                          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                              ⏱️ {svc.duration_min || 30} mins
                            </span>
                            <span style={{ fontSize: 11, background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                              📹 Google Meet
                            </span>
                            <span style={{ fontSize: 11, background: '#FFF8EC', border: '1px solid #F0B95A', padding: '3px 8px', borderRadius: 8, color: '#453421' }}>
                              ⚡ Priority (+40%)
                            </span>
                          </div>
                        </div>

                        <div style={{ paddingTop: 14, borderTop: '1px solid #D9CDBF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: 10.5, color: '#8B6F57', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Fee</span>
                            <strong style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17' }}>
                              {fmt(baseFee, svc.currency)}
                            </strong>
                            <span style={{ fontSize: 11, color: '#8B6F57', display: 'block' }}>
                              Priority: {fmt(priorityFee, svc.currency)}
                            </span>
                          </div>
                          <Link
                            href={`/consultations/${svc.key || svc.id}`}
                            style={{
                              background: '#5C8CB5',
                              color: '#fff',
                              padding: '9px 16px',
                              borderRadius: 999,
                              fontSize: 12.5,
                              fontWeight: 750,
                              textDecoration: 'none',
                              boxShadow: '0 4px 12px rgba(92,140,181,0.25)',
                            }}
                          >
                            Book →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <Link
                    href="/programs?tab=consultation"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#5C8CB5',
                      color: '#fff',
                      padding: '12px 26px',
                      borderRadius: 999,
                      fontSize: 14,
                      fontWeight: 750,
                      textDecoration: 'none',
                      boxShadow: '0 6px 16px rgba(92,140,181,0.25)',
                    }}
                  >
                    <span>View All Consultation Programs</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 7. HOW IT WORKS / CLINICAL JOURNEY ─── */}
      {settings.show_journey && (
        <section style={{ padding: '88px 0', background: '#FDFAF6' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 48, alignItems: 'center' }}>
              <div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                  {settings.journey_eyebrow}
                </span>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4.5vw, 48px)', color: '#1F1A17', lineHeight: 1.15, marginBottom: 18 }}>
                  {settings.journey_title}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', marginBottom: 32 }}>
                  {settings.journey_lead}
                </p>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14, alignItems: 'start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>
                      01
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, color: '#1F1A17', margin: '2px 0 4px', fontWeight: 700 }}>Explore Your Options</h3>
                      <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, margin: 0 }}>
                        Browse our published lifestyle programs and standalone specialist consultations without needing an account.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14, alignItems: 'start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>
                      02
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, color: '#1F1A17', margin: '2px 0 4px', fontWeight: 700 }}>Choose Your Next Step</h3>
                      <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, margin: 0 }}>
                        Review service inclusions, physician specialization, duration, and transparent pricing.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14, alignItems: 'start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', color: '#453421', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>
                      03
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, color: '#1F1A17', margin: '2px 0 4px', fontWeight: 700 }}>Book and Continue</h3>
                      <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, margin: 0 }}>
                        Sign in when ready to confirm your appointment, join 1-on-1 on Google Meet, and access your private health portal.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <Link
                    href="/how-it-works"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'transparent',
                      color: '#453421',
                      border: '1px solid #D9CDBF',
                      padding: '12px 24px',
                      borderRadius: 999,
                      fontSize: 13.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read Complete 7-Step Clinical Story</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Journey Visual */}
              <div style={{ position: 'relative', height: 440, borderRadius: '24px 180px 24px 24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(69,52,33,0.12)' }}>
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=85"
                  alt="Mindful lifestyle guidance and restorative wellness"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    right: 24,
                    background: 'rgba(69,52,33,0.92)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    borderRadius: 16,
                    padding: '18px 22px',
                  }}
                >
                  <strong style={{ fontFamily: 'Georgia, serif', fontSize: 18, display: 'block', marginBottom: 4 }}>
                    One step at a time.
                  </strong>
                  <span style={{ fontSize: 12, color: '#F6F1E8', lineHeight: 1.5, display: 'block' }}>
                    Sustainable vitality comes from daily deliberate practice guided by caring physicians.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. HEALTHCARE TEAM / EXPERTS ─── */}
      {settings.show_experts && (
        <section style={{ padding: '80px 0', background: '#fff', borderTop: '1px solid #D9CDBF' }}>
          <div className="container">
            <div style={{ maxWidth: 700, margin: '0 auto 48px', textAlign: 'center' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                Our Care Team
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 4vw, 44px)', color: '#1F1A17', lineHeight: 1.15, margin: '0 0 14px' }}>
                Guided by Certified Doctors &amp; Master Coaches
              </h2>
              <p style={{ fontSize: 15.5, color: '#8B6F57', margin: 0 }}>
                Dr Fit Veda care is delivered by accredited physicians, master trainers, and clinical nutritionists working together.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              <div style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', margin: '0 auto 14px', display: 'grid', placeItems: 'center', fontSize: 32 }}>
                  👩‍⚕️
                </div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#1F1A17', marginBottom: 4 }}>Dr. Ananya Verma</h3>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5C8CB5', marginBottom: 8 }}>
                  BNYS (Naturopathy &amp; Yoga Doctor)
                </div>
                <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>
                  Specialist in root-cause hormonal reversal, PCOD management, and therapeutic pranayama.
                </p>
              </div>

              <div style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', margin: '0 auto 14px', display: 'grid', placeItems: 'center', fontSize: 32 }}>
                  🏋️
                </div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#1F1A17', marginBottom: 4 }}>Vikram Singh</h3>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5C8CB5', marginBottom: 8 }}>
                  Gold&apos;s Gym Certified Master Trainer
                </div>
                <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>
                  Master fitness coach specializing in orthopedic conditioning, progressive overload, and joint longevity.
                </p>
              </div>

              <div style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', margin: '0 auto 14px', display: 'grid', placeItems: 'center', fontSize: 32 }}>
                  🩺
                </div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#1F1A17', marginBottom: 4 }}>Dr. Rajesh Deshmukh</h3>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5C8CB5', marginBottom: 8 }}>
                  Preventive Medicine &amp; Lifestyle Physician
                </div>
                <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>
                  Focuses on metabolic syndrome, cardiovascular vitality, and circadian lifestyle regulation.
                </p>
              </div>

              <div style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 20, padding: '26px 22px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F6F1E8', border: '1px solid #D9CDBF', margin: '0 auto 14px', display: 'grid', placeItems: 'center', fontSize: 32 }}>
                  🥗
                </div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#1F1A17', marginBottom: 4 }}>Kavita Rao</h3>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5C8CB5', marginBottom: 8 }}>
                  Clinical Nutritionist &amp; Care Coordinator
                </div>
                <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, margin: 0 }}>
                  Ensures synchronized coordination between patient lab work, weekly doctor reviews, and dietary compliance.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 9. MEMBERSHIPS & PRICING (CORRECTED INCONSISTENCY!) ─── */}
      {settings.show_memberships && (
        <section id="memberships" style={{ padding: '88px 0', background: '#FDFAF6', borderTop: '1px solid #D9CDBF' }}>
          <div className="container" style={{ maxWidth: 1180 }}>
            <div style={{ maxWidth: 700, margin: '0 auto 48px', textAlign: 'center' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                Transparent Pricing
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 4.5vw, 48px)', color: '#1F1A17', lineHeight: 1.15, margin: '0 0 14px' }}>
                Guided Transformation Memberships
              </h2>
              <p style={{ fontSize: 15.5, color: '#8B6F57', margin: 0 }}>
                Every membership includes live 1-on-1 Google Meet sessions with certified trainers, physician supervision, and customized plans.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'stretch' }}>
              {sortedMemberships.map((plan: any) => {
                const isSuper = plan.is_super_plan
                const isGrowth = plan.display_order === 2

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: isSuper ? '#453421' : '#fff',
                      color: isSuper ? '#fff' : '#1F1A17',
                      border: isGrowth ? '2px solid #5C8CB5' : isSuper ? '2px solid #CFA16A' : '1px solid #D9CDBF',
                      borderRadius: 22,
                      padding: '30px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: isGrowth || isSuper ? '0 16px 40px rgba(69,52,33,0.12)' : '0 6px 20px rgba(0,0,0,0.03)',
                    }}
                  >
                    {isGrowth && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#5C8CB5',
                          color: '#fff',
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '4px 14px',
                          borderRadius: 999,
                        }}
                      >
                        Most Popular
                      </div>
                    )}
                    {isSuper && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#CFA16A',
                          color: '#453421',
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '4px 14px',
                          borderRadius: 999,
                        }}
                      >
                        Elite Concierge
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isSuper ? '#CFA16A' : '#5C8CB5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {plan.name}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 4px' }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 700, color: isSuper ? '#fff' : '#1F1A17' }}>
                          {fmt(plan.price)}
                        </span>
                        <span style={{ fontSize: 12, color: isSuper ? 'rgba(255,255,255,0.7)' : '#8B6F57' }}>
                          / {plan.duration_label}
                        </span>
                      </div>

                      {plan.original_price && (
                        <div style={{ fontSize: 12, color: isSuper ? 'rgba(255,255,255,0.5)' : '#8B6F57', textDecoration: 'line-through', marginBottom: 14 }}>
                          Standard: {fmt(plan.original_price)}
                        </div>
                      )}

                      <p style={{ fontSize: 12.5, color: isSuper ? 'rgba(255,255,255,0.85)' : '#8B6F57', lineHeight: 1.5, marginBottom: 18 }}>
                        {plan.session_frequency || `${plan.live_sessions_count} live 1-on-1 sessions on Google Meet.`}
                      </p>

                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {(plan.benefits || []).slice(0, 5).map((b: string, i: number) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: isSuper ? '#F6F1E8' : '#8B6F57' }}>
                            <span style={{ color: isSuper ? '#CFA16A' : '#5C8CB5', fontWeight: 900 }}>✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href="/memberships"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'center',
                        background: isSuper ? '#CFA16A' : '#5C8CB5',
                        color: isSuper ? '#453421' : '#fff',
                        padding: '12px 18px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 750,
                        textDecoration: 'none',
                        boxSizing: 'border-box',
                        boxShadow: isSuper ? '0 4px 14px rgba(207,161,106,0.35)' : '0 4px 14px rgba(92,140,181,0.25)',
                      }}
                    >
                      View Plan Details →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── 10. PATIENT TESTIMONIALS ─── */}
      {settings.show_testimonials && (
        <section style={{ padding: '80px 0', background: '#fff', borderTop: '1px solid #D9CDBF' }}>
          <div className="container">
            <div style={{ maxWidth: 700, margin: '0 auto 48px', textAlign: 'center' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                Patient Stories
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 4vw, 44px)', color: '#1F1A17', lineHeight: 1.15, margin: '0 0 14px' }}>
                Stories of Healing &amp; Sustainable Vitality
              </h2>
              <p style={{ fontSize: 15.5, color: '#8B6F57', margin: 0 }}>
                What real patients experience during their physician-monitored lifestyle transformation.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                {
                  quote: 'Normalized my cycles in 60 days and lost 8.2 kg. Having my doctor and trainer synchronized on one plan was life-changing.',
                  author: 'Priya Mukherjee',
                  tag: 'PCOD Reversal • Bangalore',
                },
                {
                  quote: 'My HbA1c dropped from 7.1 to 5.8 in 90 days. Having recorded Google Meet sessions meant I never missed a workout while traveling.',
                  author: 'Rahul Kulkarni',
                  tag: 'Metabolic Health • Mumbai',
                },
                {
                  quote: 'I struggled with chronic acid reflux for 6 years. Dr Fit Veda healed my gut with whole-food clinical nutrition and circadian timing.',
                  author: 'Ananya Sharma',
                  tag: 'Gut Health • Delhi',
                },
              ].map((t, i) => (
                <div key={i} style={{ background: '#FDFAF6', border: '1px solid #D9CDBF', borderRadius: 20, padding: '26px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#F0B95A', fontSize: 16, marginBottom: 10 }}>★★★★★</div>
                    <p style={{ fontSize: 14, color: '#8B6F57', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 18 }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div style={{ paddingTop: 12, borderTop: '1px solid #D9CDBF' }}>
                    <strong style={{ fontSize: 14, color: '#1F1A17', display: 'block' }}>{t.author}</strong>
                    <span style={{ fontSize: 12, color: '#8B6F57' }}>{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 11. FAQS ─── */}
      {settings.show_faq && (
        <section style={{ padding: '80px 0', background: '#FDFAF6', borderTop: '1px solid #D9CDBF' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#5C8CB5', display: 'block', marginBottom: 10 }}>
                Helpful Answers
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 42px)', color: '#1F1A17', lineHeight: 1.15, margin: 0 }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  q: 'Can I view consultation services and programs without registering or logging in?',
                  a: 'Yes! All published consultation services, specialist descriptions, and program details are completely public. You only need to sign in when you proceed to book an appointment or access your private patient portal.',
                },
                {
                  q: 'What is the difference between a Normal Program and a Consultation Program?',
                  a: 'Normal Programs are multi-week or multi-month guided lifestyle transformation memberships (such as Functional Fitness, Therapeutic Yoga, or Nutrition) featuring continuous physician monitoring and 1-on-1 live trainer workouts. Consultation Programs are standalone 1-on-1 clinical teleconsultations (30–45 mins) with specialized doctors for diagnosis, second opinions, or specific root-cause guidance.',
                },
                {
                  q: 'How do video consultations and live workouts work?',
                  a: 'All virtual sessions run on browser-based Google Meet. You receive a dedicated meeting link on WhatsApp and Email. There is zero app download required—you can join directly from your phone, tablet, or laptop browser.',
                },
                {
                  q: 'How do I choose between a membership and a standalone consultation?',
                  a: 'If you want to address an immediate clinical query (such as PCOD symptoms, yoga therapy for back pain, or gut healing), start with a standalone Consultation. If you want full habit transformation, progressive strength training, and weekly doctor monitoring, choose a Guided Membership.',
                },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #D9CDBF',
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      style={{
                        width: '100%',
                        padding: '18px 22px',
                        background: 'transparent',
                        border: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left',
                        fontFamily: 'Georgia, serif',
                        fontSize: 17,
                        fontWeight: 600,
                        color: '#1F1A17',
                        cursor: 'pointer',
                        gap: 16,
                      }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ fontSize: 20, color: '#8B6F57', fontWeight: 400 }}>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 22px 18px', fontSize: 14, color: '#8B6F57', lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── 12. CONTACT / CTA BAND ─── */}
      {settings.show_cta && (
        <section style={{ padding: '0 0 80px', background: '#FDFAF6' }}>
          <div className="container">
            <div
              style={{
                background: 'linear-gradient(135deg, #453421 0%, #302316 60%, #22180E 100%)',
                borderRadius: 24,
                padding: '48px 44px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 24,
                boxShadow: '0 20px 50px rgba(69,52,33,0.22)',
              }}
            >
              <div style={{ maxWidth: 580 }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 800, color: '#CFA16A', display: 'block', marginBottom: 8 }}>
                  Begin Your Health Journey
                </span>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 4vw, 38px)', color: '#fff', lineHeight: 1.15, margin: '0 0 8px' }}>
                  {settings.cta_box_title}
                </h2>
                <p style={{ fontSize: 15, color: '#F6F1E8', margin: 0, lineHeight: 1.6 }}>
                  {settings.cta_box_lead}
                </p>
              </div>

              <a
                href={settings.cta_box_btn_href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#5C8CB5',
                  color: '#fff',
                  padding: '16px 28px',
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(92,140,181,0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{settings.cta_box_btn_label}</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
