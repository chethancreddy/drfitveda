'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NormalProgram, VitalityRoadmapStep } from '@/lib/mock-db'
import VitalityRoadmap from '@/components/public/VitalityRoadmap'
import ConsultationHowItWorks from '@/components/public/ConsultationHowItWorks'

interface ProgramsViewProps {
  normalPrograms: NormalProgram[]
  consultationServices: any[]
  roadmapSteps?: VitalityRoadmapStep[]
  initialTab?: 'normal' | 'consultation'
}

function fmt(n: number, currency = 'INR') {
  const val = Number(n || 0)
  if (currency === 'USD') return '$' + val.toLocaleString('en-US')
  if (currency === 'AED') return 'AED ' + val.toLocaleString('en-AE')
  return '₹' + val.toLocaleString('en-IN')
}

export default function ProgramsView({
  normalPrograms,
  consultationServices,
  roadmapSteps = [],
  initialTab = 'normal',
}: ProgramsViewProps) {
  const [activeTab, setActiveTab] = useState<'normal' | 'consultation'>(initialTab)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Synchronize activeTab with URL search params and handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const tab = urlParams.get('tab') === 'consultation' ? 'consultation' : 'normal'
        setActiveTab(tab)
      }
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab') === 'consultation' ? 'consultation' : 'normal'
      if (tab !== activeTab) {
        setActiveTab(tab)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync if initialTab prop changes from server
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleSelectTab = (tab: 'normal' | 'consultation') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const newUrl = tab === 'consultation' ? '/programs?tab=consultation' : '/programs'
      window.history.pushState({ tab }, '', newUrl)
    }
  }

  const filteredNormal = normalPrograms.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.short_description.toLowerCase().includes(q) ||
      p.specialist_role.toLowerCase().includes(q)
    )
  })

  const filteredConsultations = consultationServices.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) {
      return false
    }
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.category_label || '').toLowerCase().includes(q) ||
      (c.specialist_designation || '').toLowerCase().includes(q) ||
      (c.short_description || c.description || '').toLowerCase().includes(q)
    )
  })

  const categories = [
    { key: 'all', label: 'All Consultations' },
    { key: 'doctor_consultation', label: 'Doctor / Physician' },
    { key: 'yoga', label: 'Yoga Consultation' },
    { key: 'nutrition_consultation', label: 'Nutrition & Diet' },
    { key: 'womens_health', label: "Women's Health & Hormones" },
    { key: 'pcod', label: 'PCOD / PCOS' },
    { key: 'wellness', label: 'General Wellness' },
    { key: 'lifestyle_consultation', label: 'Lifestyle Medicine' },
  ]

  return (
    <div>
      {/* Tab Switcher & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Two Distinct Tabs */}
        <div
          role="tablist"
          aria-label="Program categories"
          style={{
            display: 'inline-flex',
            background: '#F6F1E8',
            border: '1px solid #D9CDBF',
            padding: 6,
            borderRadius: 999,
            gap: 6,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'normal'}
            onClick={() => handleSelectTab('normal')}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '12px 24px',
              background: activeTab === 'normal' ? '#453421' : 'transparent',
              color: activeTab === 'normal' ? '#fff' : '#8B6F57',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'normal' ? '0 4px 14px rgba(69,52,33,0.18)' : 'none',
            }}
          >
            Option 1: Normal Programs (7-Step Roadmap)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'consultation'}
            onClick={() => handleSelectTab('consultation')}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '12px 24px',
              background: activeTab === 'consultation' ? '#453421' : 'transparent',
              color: activeTab === 'consultation' ? '#fff' : '#8B6F57',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'consultation' ? '0 4px 14px rgba(69,52,33,0.18)' : 'none',
            }}
          >
            Option 2: Consultation Programs ({consultationServices.length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs & specialties…"
            style={{
              width: '100%',
              padding: '12px 16px 12px 38px',
              borderRadius: 999,
              border: '1px solid #D9CDBF',
              background: '#fff',
              fontSize: 13.5,
              outline: 'none',
              boxSizing: 'border-box',
              color: '#1F1A17',
            }}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: 14 }}>
            🔍
          </span>
        </div>
      </div>

      {/* Distinction Callout */}
      <div
        style={{
          background: activeTab === 'normal' ? '#FDFAF6' : '#F0F6FA',
          border: `1px solid ${activeTab === 'normal' ? '#D9CDBF' : '#5C8CB5'}`,
          borderRadius: 18,
          padding: '20px 24px',
          marginBottom: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 32, flexShrink: 0 }}>
          {activeTab === 'normal' ? '📋' : '🩺'}
        </span>
        <div>
          <strong style={{ fontSize: 14.5, color: '#453421', display: 'block', marginBottom: 3 }}>
            {activeTab === 'normal'
              ? 'Normal Programs: The 7-Step Roadmap to Vitality'
              : 'Consultation Programs: Standalone Specialist Care'}
          </strong>
          <p style={{ fontSize: 13, color: '#8B6F57', margin: 0, lineHeight: 1.55 }}>
            {activeTab === 'normal'
              ? 'Follow our continuous 7-step medical lifestyle methodology—integrating medical intake, doctor clinical assessments, custom regimen formulation, live 1-on-1 Google Meet training, and weekly progress updates.'
              : 'Choose your consultation, book your slot, and connect with verified doctors. Choose Standard Consultation (published calendar slots) or Priority Consultation (+40% flexible scheduling).'}
          </p>
        </div>
      </div>

      {/* ─── TAB 1: NORMAL PROGRAMS (YOUR 7-STEP ROADMAP TO VITALITY) ─── */}
      {activeTab === 'normal' && (
        <div>
          {/* Visual 7-Step Roadmap */}
          <VitalityRoadmap steps={roadmapSteps} />

          {/* Normal Programs Offerings List */}
          <div style={{ marginTop: 64 }}>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 36px' }}>
              <span
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#5C8CB5',
                  background: '#F6F1E8',
                  border: '1px solid #D9CDBF',
                  padding: '4px 14px',
                  borderRadius: 999,
                  display: 'inline-block',
                  marginBottom: 8,
                }}
              >
                Structured Clinical Offerings
              </span>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1F1A17', margin: '0 0 10px' }}>
                Lifestyle Management Disciplines
              </h3>
              <p style={{ fontSize: 14.5, color: '#8B6F57', margin: 0 }}>
                Every discipline operates under the 7-Step Roadmap to Vitality with doctor oversight and certified coaching.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {filteredNormal.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #D9CDBF' }}>
                  <p style={{ fontSize: 16, color: '#8B6F57' }}>No programs match your search.</p>
                </div>
              ) : (
                filteredNormal.map(prog => (
                  <div
                    key={prog.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #D9CDBF',
                      borderRadius: 22,
                      padding: '30px 28px',
                      boxShadow: '0 10px 30px rgba(69,52,33,0.05)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                      gap: 32,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 32 }}>{prog.icon}</span>
                        <span
                          style={{
                            background: '#F6F1E8',
                            border: '1px solid #D9CDBF',
                            color: '#453421',
                            padding: '4px 12px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {prog.category}
                        </span>
                      </div>

                      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1F1A17', marginBottom: 8 }}>
                        {prog.title}
                      </h2>

                      <div style={{ fontSize: 13, fontWeight: 700, color: '#5C8CB5', marginBottom: 12 }}>
                        👨‍⚕️ Guided by: {prog.specialist_role}
                      </div>

                      <p style={{ fontSize: 14, color: '#8B6F57', lineHeight: 1.65, marginBottom: 18 }}>
                        {prog.short_description}
                      </p>

                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#8B6F57', letterSpacing: '0.08em', marginBottom: 4 }}>
                          Ideal For
                        </div>
                        <p style={{ fontSize: 13, color: '#1F1A17', margin: 0 }}>{prog.ideal_for}</p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <Link
                          href={prog.cta_href || '/memberships'}
                          style={{
                            background: '#5C8CB5',
                            color: '#fff',
                            padding: '12px 22px',
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 750,
                            textDecoration: 'none',
                            boxShadow: '0 6px 16px rgba(92,140,181,0.25)',
                          }}
                        >
                          {prog.cta_label || 'Enroll in Program'} →
                        </Link>
                        <Link
                          href={`/programs/${prog.key || prog.id}`}
                          style={{
                            color: '#453421',
                            fontSize: 13,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          View Details ↗
                        </Link>
                      </div>
                    </div>

                    {/* Inclusions Card */}
                    <div
                      style={{
                        background: '#FDFAF6',
                        border: '1px solid #D9CDBF',
                        borderRadius: 18,
                        padding: 24,
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#453421', letterSpacing: '0.08em', marginBottom: 14 }}>
                        What This Program Includes
                      </div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                        {prog.inclusions.map((inc, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#8B6F57', lineHeight: 1.5 }}>
                            <span style={{ color: '#5C8CB5', fontWeight: 900 }}>✓</span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>

                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #D9CDBF', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#8B6F57', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Starting At</span>
                          <strong style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1F1A17' }}>
                            {fmt(prog.price)}
                          </strong>
                          <span style={{ fontSize: 12, color: '#8B6F57' }}> / {prog.duration_label || 'month'}</span>
                        </div>
                        {prog.original_price && (
                          <span style={{ fontSize: 12.5, color: '#8B6F57', textDecoration: 'line-through' }}>
                            {fmt(prog.original_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CONSULTATION PROGRAMS ─── */}
      {activeTab === 'consultation' && (
        <div>
          {/* Dedicated How It Works for Consultation Programs */}
          <ConsultationHowItWorks />

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 28,
              paddingBottom: 4,
            }}
          >
            {categories.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryFilter(cat.key)}
                style={{
                  border: `1px solid ${categoryFilter === cat.key ? '#453421' : '#D9CDBF'}`,
                  background: categoryFilter === cat.key ? '#453421' : '#fff',
                  color: categoryFilter === cat.key ? '#fff' : '#8B6F57',
                  borderRadius: 999,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Consultation Grid (100% Synchronized with CMS!) */}
          {filteredConsultations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #D9CDBF' }}>
              <p style={{ fontSize: 16, color: '#8B6F57' }}>No consultations found for the selected filter.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                gap: 24,
              }}
            >
              {filteredConsultations.map((svc: any) => {
                const basePrice = Number(svc.price || 999)
                const priorityPrice = Math.round(basePrice * 1.40)

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
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    }}
                  >
                    <div>
                      {/* Top Meta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 32 }}>{svc.icon || '🩺'}</span>
                        <span
                          style={{
                            background: '#F6F1E8',
                            border: '1px solid #D9CDBF',
                            color: '#453421',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 10.5,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                          }}
                        >
                          {svc.category_label || svc.category || 'Consultation'}
                        </span>
                      </div>

                      {/* Title & Specialist */}
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 6 }}>
                        {svc.name}
                      </h3>

                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5C8CB5', marginBottom: 12 }}>
                        👨‍⚕️ {svc.specialist_designation || 'Specialist Doctor'}
                      </div>

                      <p style={{ fontSize: 13, color: '#8B6F57', lineHeight: 1.6, marginBottom: 16 }}>
                        {svc.short_description || svc.description}
                      </p>

                      {/* Duration & Google Meet */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                          ⏱️ {svc.duration_min || 30} mins
                        </span>
                        <span style={{ fontSize: 11, background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '3px 8px', borderRadius: 8, color: '#8B6F57' }}>
                          📹 Google Meet
                        </span>
                        <span style={{ fontSize: 11, background: '#FFF8EC', border: '1px solid #F0B95A', padding: '3px 8px', borderRadius: 8, color: '#453421' }}>
                          ⚡ Priority Option Available
                        </span>
                      </div>
                    </div>

                    {/* Bottom Pricing & Booking Action */}
                    <div
                      style={{
                        paddingTop: 16,
                        borderTop: '1px solid #D9CDBF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10.5, color: '#8B6F57', textTransform: 'uppercase', fontWeight: 700 }}>
                          Standard Fee
                        </div>
                        <strong style={{ fontFamily: 'Georgia, serif', fontSize: 21, color: '#1F1A17' }}>
                          {fmt(basePrice, svc.currency)}
                        </strong>
                        <span style={{ fontSize: 11, color: '#8B6F57', display: 'block' }}>
                          Priority: {fmt(priorityPrice, svc.currency)}
                        </span>
                      </div>

                      <Link
                        href={`/consultations/${svc.key || svc.id}`}
                        style={{
                          background: '#5C8CB5',
                          color: '#fff',
                          padding: '10px 18px',
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 750,
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(92,140,181,0.25)',
                        }}
                      >
                        Enrol &amp; Book →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
