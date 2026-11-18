'use client'

import React from 'react'
import Link from 'next/link'
import { VitalityRoadmapStep } from '@/lib/mock-db'

interface VitalityRoadmapProps {
  steps: VitalityRoadmapStep[]
  compact?: boolean
}

export default function VitalityRoadmap({ steps, compact = false }: VitalityRoadmapProps) {
  const activeSteps = (steps || [])
    .filter(s => s.is_active !== false)
    .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 48px' }}>
        <span
          style={{
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontSize: 11.5,
            fontWeight: 800,
            color: '#5C8CB5',
            background: '#F6F1E8',
            border: '1px solid #D9CDBF',
            padding: '4px 14px',
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          🌿 The Clinical Journey
        </span>
        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(30px, 4vw, 44px)',
            color: '#1F1A17',
            lineHeight: 1.15,
            margin: '0 0 14px',
          }}
        >
          Your 7-Step Roadmap to Vitality
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#8B6F57', margin: 0 }}>
          A doctor-guided, structured medical progression that systematically restores circadian rhythms, metabolic health, and physical stamina over 90 days.
        </p>
      </div>

      {/* 7-Step Sequential Roadmap */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        {activeSteps.map((s, idx) => (
          <div
            key={s.id || s.step}
            style={{
              background: '#fff',
              border: '1px solid #D9CDBF',
              borderRadius: 20,
              padding: compact ? '20px 22px' : '28px 30px',
              boxShadow: '0 8px 24px rgba(69,52,33,0.06)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: 24,
              alignItems: 'center',
              borderLeft: `6px solid ${s.accentColor || '#5C8CB5'}`,
              position: 'relative',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <div>
              {/* Step Badge & Timing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: '#453421',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  STEP {s.step}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#5C8CB5',
                    background: 'rgba(92,140,181,0.12)',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  ⏱️ {s.timing}
                </span>
              </div>

              {/* Step Title & Icon */}
              <h3
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: compact ? 19 : 22,
                  color: '#1F1A17',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  margin: '0 0 10px',
                }}
              >
                <span style={{ fontSize: 26 }}>{s.icon}</span>
                <span>{s.title}</span>
              </h3>

              {/* Step Description */}
              <p style={{ fontSize: 14, color: '#8B6F57', lineHeight: 1.65, margin: '0 0 16px' }}>
                {s.description}
              </p>

              {/* Key Deliverable */}
              {s.deliverable && (
                <div
                  style={{
                    background: '#F6F1E8',
                    border: '1px solid #D9CDBF',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#1F1A17',
                  }}
                >
                  <strong style={{ color: '#453421', fontWeight: 800 }}>Key Deliverable: </strong>
                  <span>{s.deliverable}</span>
                </div>
              )}
            </div>

            {/* Highlights Box */}
            <div
              style={{
                background: '#FDFAF6',
                border: '1px dashed #D9CDBF',
                borderRadius: 14,
                padding: '20px 22px',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: '#453421',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                {s.highlightTitle || 'Clinical Inclusions'}
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16, margin: 0 }}>
                {(s.highlights || []).map((h, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: '#8B6F57',
                      lineHeight: 1.45,
                    }}
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Enroll & Start Your Journey CTA Box */}
      <div
        style={{
          marginTop: 48,
          textAlign: 'center',
          padding: '36px 30px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #453421 0%, #302316 100%)',
          color: '#fff',
          maxWidth: 960,
          marginInline: 'auto',
          boxShadow: '0 16px 40px rgba(69,52,33,0.18)',
        }}
      >
        <span
          style={{
            background: 'rgba(255,255,255,0.18)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'inline-block',
            marginBottom: 10,
          }}
        >
          Comprehensive Care Membership
        </span>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(24px, 3.5vw, 32px)', margin: '0 0 10px', color: '#fff' }}>
          Ready to Walk the 7-Step Roadmap?
        </h3>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Experience continuous doctor oversight, 1-on-1 live training, personalized whole-food nutrition, and weekly reviews starting at ₹9,999/month.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link
            href="/memberships"
            style={{
              background: '#5C8CB5',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 999,
              fontSize: 14.5,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(92,140,181,0.35)',
            }}
          >
            Start Your Journey / Enroll Now →
          </Link>
          <Link
            href="/how-it-works"
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.45)',
              padding: '14px 24px',
              borderRadius: 999,
              fontSize: 14.5,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Read Detailed Methodology ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
