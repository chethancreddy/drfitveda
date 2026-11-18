'use client'
// ============================================================
// BookAppointmentModal — Standard vs Priority Consultation Booking
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProfessionalOption {
  id: string
  full_name: string
  role: string
  specialization?: string | null
}

interface BookAppointmentModalProps {
  professionals: ProfessionalOption[]
  customerId: string
  consultationServiceId?: string
  consultationType?: string
  durationMin?: number
  servicePrice?: number
  serviceCurrency?: string
  prioritySurchargePercent?: number
}

export default function BookAppointmentModal({
  professionals,
  customerId,
  consultationServiceId,
  consultationType,
  durationMin = 30,
  servicePrice = 999,
  serviceCurrency = 'INR',
  prioritySurchargePercent = 40,
}: BookAppointmentModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [bookingType, setBookingType] = useState<'standard' | 'priority'>('standard')
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '')

  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('10:00')
  const [requestedTimeCustom, setRequestedTimeCustom] = useState('11:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  // Pricing calculations
  const basePrice = Number(servicePrice || 0)
  const isPriority = bookingType === 'priority'
  const prioritySurcharge = isPriority ? Math.round(basePrice * (prioritySurchargePercent / 100)) : 0
  const totalPrice = basePrice + prioritySurcharge

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!consent) {
        throw new Error('Please confirm your consent to share consultation details with the doctor.')
      }

      const selectedTime = isPriority ? (requestedTimeCustom || time) : time
      const scheduledAt = new Date(`${date}T${selectedTime}:00`).toISOString()

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          professional_id: professionalId,
          consultation_service_id: consultationServiceId,
          consultation_type: consultationType,
          booking_type: bookingType,
          scheduled_at: scheduledAt,
          requested_date: date,
          requested_time: selectedTime,
          duration_min: durationMin || 30,
          notes: notes.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment')

      if (isPriority) {
        setSuccess('Priority consultation request submitted! Our clinical team is reviewing and will confirm based on doctor availability.')
      } else {
        setSuccess('Consultation appointment confirmed! Details sent to your portal and WhatsApp.')
      }

      setTimeout(() => {
        setIsOpen(false)
        setSuccess(null)
        router.refresh()
      }, 2200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn btn-primary btn-sm">
        + Book Consultation
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-sm)',
        overflowY: 'auto',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 540,
          width: '100%',
          padding: '28px 24px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#453421',
                background: isPriority ? '#FFF8EC' : '#F6F1E8',
                border: `1px solid ${isPriority ? '#F0B95A' : '#D9CDBF'}`,
                padding: '3px 10px',
                borderRadius: 999,
                display: 'inline-block',
                marginBottom: 6,
              }}
            >
              {isPriority ? '⚡ Priority Scheduling' : '📅 Standard Appointment'}
            </span>
            <h3 className="text-headline-sm" style={{ margin: 0, color: '#1F1A17' }}>
              {consultationType ? `Book ${consultationType}` : 'Book Consultation'}
            </h3>
            <div className="text-caption text-muted" style={{ marginTop: 4 }}>
              Duration: {durationMin} minutes • 1-on-1 Online via Google Meet
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 16, padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 16, fontSize: 13 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Appointment Option Switcher */}
          <div style={{ marginBottom: 20 }}>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 8, fontWeight: 700 }}>
              Choose Appointment Option:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Option A: Standard */}
              <button
                type="button"
                onClick={() => setBookingType('standard')}
                style={{
                  border: `2px solid ${!isPriority ? '#5C8CB5' : '#D9CDBF'}`,
                  background: !isPriority ? '#F0F6FA' : '#fff',
                  borderRadius: 14,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13, color: '#453421' }}>Standard</strong>
                  {!isPriority && <span style={{ color: '#5C8CB5', fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1F1A17', margin: '4px 0' }}>
                  ₹{basePrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#8B6F57', lineHeight: 1.3 }}>
                  Select from published doctor calendar slots.
                </div>
              </button>

              {/* Option B: Priority */}
              <button
                type="button"
                onClick={() => setBookingType('priority')}
                style={{
                  border: `2px solid ${isPriority ? '#F0B95A' : '#D9CDBF'}`,
                  background: isPriority ? '#FFF8EC' : '#fff',
                  borderRadius: 14,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13, color: '#453421' }}>Priority (+40%)</strong>
                  {isPriority && <span style={{ color: '#CFA16A', fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#453421', margin: '4px 0' }}>
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: '#8B6F57', lineHeight: 1.3 }}>
                  Flexible scheduling. Request any preferred date &amp; time.
                </div>
              </button>
            </div>
          </div>

          {/* Transparent Price Breakdown */}
          <div
            style={{
              background: '#FDFAF6',
              border: '1px solid #D9CDBF',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#8B6F57' }}>Base Consultation Fee:</span>
              <strong style={{ color: '#1F1A17' }}>₹{basePrice.toLocaleString('en-IN')}</strong>
            </div>
            {isPriority && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#453421' }}>
                <span>Priority Scheduling Charge (+40%):</span>
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
                fontSize: 14,
              }}
            >
              <strong style={{ color: '#1F1A17' }}>Total Payable:</strong>
              <strong style={{ color: '#1F1A17', fontSize: 16 }}>₹{totalPrice.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Select Professional */}
          <div style={{ marginBottom: 14 }}>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>
              Select Doctor / Professional
            </label>
            <select
              className="input"
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              required
            >
              {professionals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.role.replace('_', ' ')}{p.specialization ? ` - ${p.specialization}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>
                {isPriority ? 'Preferred Date *' : 'Appointment Date *'}
              </label>
              <input
                type="date"
                className="input"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>
                {isPriority ? 'Preferred Time (Flexible) *' : 'Published Time Slot *'}
              </label>
              {!isPriority ? (
                <select className="input" value={time} onChange={e => setTime(e.target.value)}>
                  {[
                    '09:00',
                    '09:30',
                    '10:00',
                    '10:30',
                    '11:00',
                    '11:30',
                    '14:00',
                    '14:30',
                    '15:00',
                    '15:30',
                    '16:00',
                    '16:30',
                    '17:00',
                  ].map(t => (
                    <option key={t} value={t}>
                      {t} IST
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="time"
                  className="input"
                  value={requestedTimeCustom}
                  onChange={e => setRequestedTimeCustom(e.target.value)}
                  required
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
                padding: '10px 14px',
                fontSize: 12,
                color: '#453421',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              ⚠️ <strong>Note on Priority Scheduling:</strong> Your requested date and time are submitted as a priority request and confirmed based on doctor availability. The doctor / clinical admin reviews and confirms your appointment.
            </div>
          )}

          {/* Reason / Symptoms */}
          <div style={{ marginBottom: 16 }}>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>
              Reason / Symptoms for Consultation
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Plan adjustment, blood test review, hormonal symptoms..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Consent */}
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              fontSize: 12,
              lineHeight: 1.45,
              marginBottom: 16,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              I consent to my medical history and symptoms being shared with the doctor for this consultation (
              <Link href="/privacy" target="_blank">
                Privacy Policy
              </Link>
              ). *
            </span>
          </label>

          <div className="flex justify-end gap-xs">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isPriority ? 'btn-accent' : 'btn-primary'}`}
              disabled={loading}
              style={
                isPriority
                  ? { background: '#453421', borderColor: '#453421', color: '#fff', fontWeight: 800 }
                  : { background: '#5C8CB5', borderColor: '#5C8CB5', color: '#fff', fontWeight: 800 }
              }
            >
              {loading
                ? 'Processing...'
                : isPriority
                ? `Request Priority Booking (₹${totalPrice.toLocaleString('en-IN')})`
                : `Confirm Appointment (₹${basePrice.toLocaleString('en-IN')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
