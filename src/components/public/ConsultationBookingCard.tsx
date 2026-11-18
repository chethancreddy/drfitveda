'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConsultationBookingCardProps {
  service: {
    id: string
    key?: string
    name: string
    price: number
    currency?: string
    duration_min: number
    specialist_designation?: string
  }
}

export default function ConsultationBookingCard({ service }: ConsultationBookingCardProps) {
  const router = useRouter()
  const [bookingType, setBookingType] = useState<'standard' | 'priority'>('standard')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('10:00')
  const [requestedTime, setRequestedTime] = useState('11:00')

  const basePrice = Number(service.price || 999)
  const isPriority = bookingType === 'priority'
  const prioritySurcharge = isPriority ? Math.round(basePrice * 0.40) : 0
  const totalPrice = basePrice + prioritySurcharge

  const handleProceed = () => {
    const selectedTime = isPriority ? requestedTime : time
    const query = new URLSearchParams({
      service: service.key || service.id,
      booking_type: bookingType,
      date,
      time: selectedTime,
    }).toString()
    router.push(`/login?redirect=${encodeURIComponent(`/customer/consult?${query}`)}`)
  }

  return (
    <div
      style={{
        background: '#fff',
        border: `2px solid ${isPriority ? '#F0B95A' : '#5C8CB5'}`,
        borderRadius: 24,
        padding: '30px 26px',
        boxShadow: '0 16px 45px rgba(69,52,33,0.08)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Badge & Mode */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: '#453421',
            background: isPriority ? '#FFF8EC' : '#F6F1E8',
            border: `1px solid ${isPriority ? '#F0B95A' : '#D9CDBF'}`,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {isPriority ? '⚡ Priority Scheduling' : '📅 Standard Consultation'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#8B6F57' }}>
          ⏱️ {service.duration_min || 30} mins
        </span>
      </div>

      {/* Pricing Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 6px' }}>
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 42,
            fontWeight: 700,
            color: '#1F1A17',
          }}
        >
          ₹{totalPrice.toLocaleString('en-IN')}
        </span>
        <span style={{ fontSize: 13.5, color: '#8B6F57' }}>/ clinical session</span>
      </div>

      <p style={{ fontSize: 12.5, color: '#8B6F57', lineHeight: 1.5, marginBottom: 18 }}>
        1-on-1 private teleconsultation via Google Meet with {service.specialist_designation || 'certified specialist doctor'}.
      </p>

      {/* Appointment Tier Switcher */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 750, color: '#1F1A17', marginBottom: 8 }}>
          Select Appointment Option:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Option A: Standard */}
          <button
            type="button"
            onClick={() => setBookingType('standard')}
            style={{
              border: `2px solid ${!isPriority ? '#5C8CB5' : '#D9CDBF'}`,
              background: !isPriority ? '#F0F6FA' : '#fff',
              borderRadius: 14,
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 12.5, color: '#453421' }}>Standard</strong>
              {!isPriority && <span style={{ color: '#5C8CB5', fontWeight: 900 }}>✓</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1F1A17', margin: '3px 0' }}>
              ₹{basePrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: '#8B6F57', lineHeight: 1.25 }}>Published doctor slots</div>
          </button>

          {/* Option B: Priority */}
          <button
            type="button"
            onClick={() => setBookingType('priority')}
            style={{
              border: `2px solid ${isPriority ? '#F0B95A' : '#D9CDBF'}`,
              background: isPriority ? '#FFF8EC' : '#fff',
              borderRadius: 14,
              padding: '10px 12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 12.5, color: '#453421' }}>Priority (+40%)</strong>
              {isPriority && <span style={{ color: '#CFA16A', fontWeight: 900 }}>✓</span>}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#453421', margin: '3px 0' }}>
              ₹{totalPrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: '#8B6F57', lineHeight: 1.25 }}>Flexible date &amp; time</div>
          </button>
        </div>
      </div>

      {/* Transparent Breakdown */}
      <div
        style={{
          background: '#FDFAF6',
          border: '1px solid #D9CDBF',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 18,
          fontSize: 12.5,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#8B6F57' }}>Base Consultation Fee:</span>
          <strong style={{ color: '#1F1A17' }}>₹{basePrice.toLocaleString('en-IN')}</strong>
        </div>
        {isPriority && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#453421' }}>
            <span>Priority Scheduling (+40%):</span>
            <strong>+₹{prioritySurcharge.toLocaleString('en-IN')}</strong>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 6,
            borderTop: '1px dashed #D9CDBF',
            marginTop: 6,
          }}
        >
          <strong style={{ color: '#1F1A17' }}>Total Payable:</strong>
          <strong style={{ color: '#1F1A17', fontSize: 15 }}>
            ₹{totalPrice.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* Date & Time Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#1F1A17', marginBottom: 4 }}>
            {isPriority ? 'Preferred Date' : 'Select Date'}
          </label>
          <input
            type="date"
            className="input"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid #D9CDBF', background: '#fff', color: '#1F1A17' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#1F1A17', marginBottom: 4 }}>
            {isPriority ? 'Preferred Time' : 'Select Slot'}
          </label>
          {!isPriority ? (
            <select
              className="input"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid #D9CDBF', background: '#fff', color: '#1F1A17' }}
            >
              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                <option key={t} value={t}>
                  {t} IST
                </option>
              ))}
            </select>
          ) : (
            <input
              type="time"
              className="input"
              value={requestedTime}
              onChange={e => setRequestedTime(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 8, border: '1px solid #D9CDBF', background: '#fff', color: '#1F1A17' }}
            />
          )}
        </div>
      </div>

      {isPriority && (
        <div
          style={{
            background: '#FFF8EC',
            border: '1px solid #F0B95A',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 11.5,
            color: '#453421',
            lineHeight: 1.45,
            marginBottom: 16,
          }}
        >
          ℹ️ <strong>Priority Scheduling:</strong> Your requested appointment date and time will be handled as priority and confirmed based on doctor availability.
        </div>
      )}

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleProceed}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: isPriority ? '#453421' : '#5C8CB5',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: 999,
          fontSize: 14.5,
          fontWeight: 800,
          border: 0,
          cursor: 'pointer',
          boxShadow: isPriority
            ? '0 10px 24px rgba(69,52,33,0.25)'
            : '0 10px 24px rgba(92,140,181,0.25)',
          transition: 'all 0.2s ease',
        }}
      >
        <span>
          {isPriority
            ? `Request Priority Slot (₹${totalPrice.toLocaleString('en-IN')})`
            : `Book Consultation (₹${basePrice.toLocaleString('en-IN')})`}
        </span>
        <span>→</span>
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#8B6F57', marginTop: 12, marginInline: 'auto' }}>
        Instant Google Meet link &amp; WhatsApp confirmation. New patients can complete registration during checkout.
      </p>
    </div>
  )
}
