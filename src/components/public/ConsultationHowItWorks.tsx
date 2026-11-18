'use client'

import React from 'react'

export default function ConsultationHowItWorks() {
  return (
    <div style={{ width: '100%', marginBottom: 48 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 36px' }}>
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
            marginBottom: 10,
          }}
        >
          🩺 Dedicated Consultation Experience
        </span>
        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(28px, 3.8vw, 40px)',
            color: '#1F1A17',
            lineHeight: 1.15,
            margin: '0 0 12px',
          }}
        >
          How Consultation Programs Work
        </h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#8B6F57', margin: 0 }}>
          Choose your clinical consultation, select your preferred booking option, and connect with verified specialist doctors via Google Meet.
        </p>
      </div>

      {/* 3 Step Visual Progression */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 24,
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #D9CDBF',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 8px 24px rgba(69,52,33,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: 8,
                background: '#5C8CB5',
                color: '#fff',
              }}
            >
              STEP 1
            </span>
            <span style={{ fontSize: 32 }}>🩺</span>
          </div>

          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 10 }}>
            Choose Your Consultation
          </h3>
          <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, marginBottom: 16 }}>
            Browse our specialized clinical consultation offerings below—including <strong>Yoga Consultation</strong>, <strong>Nutrition Consultation</strong>, <strong>Women’s Health</strong>, <strong>PCOD/PCOS</strong>, and <strong>General Wellness</strong>.
          </p>

          <div style={{ marginTop: 'auto', background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '12px 14px', borderRadius: 12, fontSize: 12.5, color: '#1F1A17' }}>
            ✓ Verified physician credentials<br />
            ✓ Fixed duration (30–45 mins)<br />
            ✓ Transparent base pricing from ₹999
          </div>
        </div>

        {/* Step 2 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #D9CDBF',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 8px 24px rgba(69,52,33,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: 8,
                background: '#CFA16A',
                color: '#fff',
              }}
            >
              STEP 2
            </span>
            <span style={{ fontSize: 32 }}>⚡</span>
          </div>

          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 10 }}>
            Enrol &amp; Select Booking Option
          </h3>
          <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, marginBottom: 16 }}>
            Select your preferred consultation tier based on your schedule urgency:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <div style={{ background: '#F6F1E8', border: '1px solid #D9CDBF', padding: '10px 12px', borderRadius: 10, fontSize: 12.5 }}>
              <strong style={{ color: '#453421' }}>Option A: Standard Consultation</strong>
              <div style={{ color: '#8B6F57', fontSize: 12, marginTop: 2 }}>Pay standard fee. Pick from published calendar slots.</div>
            </div>
            <div style={{ background: '#FFF8EC', border: '1px solid #F0B95A', padding: '10px 12px', borderRadius: 10, fontSize: 12.5 }}>
              <strong style={{ color: '#453421' }}>Option B: Priority Consultation (+40%)</strong>
              <div style={{ color: '#8B6F57', fontSize: 12, marginTop: 2 }}>Flexible scheduling. Request any preferred date and time.</div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #D9CDBF',
            borderRadius: 20,
            padding: '28px 24px',
            boxShadow: '0 8px 24px rgba(69,52,33,0.05)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: 8,
                background: '#453421',
                color: '#fff',
              }}
            >
              STEP 3
            </span>
            <span style={{ fontSize: 32 }}>📹</span>
          </div>

          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1F1A17', marginBottom: 10 }}>
            Connect with Your Doctor
          </h3>
          <p style={{ fontSize: 13.5, color: '#8B6F57', lineHeight: 1.6, marginBottom: 16 }}>
            Receive your direct Google Meet appointment link via WhatsApp and Email. Join directly in your browser without downloading any apps.
          </p>

          <div style={{ marginTop: 'auto', background: '#FDFAF6', border: '1px solid #D9CDBF', padding: '12px 14px', borderRadius: 12, fontSize: 12.5, color: '#1F1A17' }}>
            ✓ 1-on-1 private clinical video<br />
            ✓ Digital clinical prescription delivered to portal<br />
            ✓ Automated 15-min WhatsApp reminder
          </div>
        </div>
      </div>
    </div>
  )
}
