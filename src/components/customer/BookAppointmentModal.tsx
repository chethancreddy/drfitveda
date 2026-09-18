'use client'
// ============================================================
// BookAppointmentModal — Modal/form to schedule a consultation
// ============================================================
import { useState } from 'react'
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
  consultationType?: string
}

export default function BookAppointmentModal({
  professionals,
  customerId,
  consultationType,
}: BookAppointmentModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || '')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState(consultationType ? `Consultation type: ${consultationType}` : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          professional_id: professionalId,
          scheduled_at: scheduledAt,
          duration_min: 30,
          notes: notes.trim(),
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to schedule appointment')

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1500)
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-sm)'
    }}>
      <div className="card" style={{maxWidth:500,width:'100%',padding:'var(--space-md)'}}>
        <div className="flex justify-between items-center" style={{marginBottom:'var(--space-sm)'}}>
          <h3 className="text-headline-sm">Book Consultation</h3>
          <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
        {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>Consultation booked successfully!</div>}

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'var(--space-sm)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Select Doctor / Professional</label>
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

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--space-xs)',marginBottom:'var(--space-sm)'}}>
            <div>
              <label className="text-label-md" style={{display:'block',marginBottom:4}}>Date</label>
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
              <label className="text-label-md" style={{display:'block',marginBottom:4}}>Time Slot</label>
              <select className="input" value={time} onChange={e => setTime(e.target.value)}>
                {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(t => (
                  <option key={t} value={t}>{t} IST</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{marginBottom:'var(--space-md)'}}>
            <label className="text-label-md" style={{display:'block',marginBottom:4}}>Reason / Symptoms for Consultation</label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. Plan adjustment, reviewing blood test results, discussion on energy levels..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-xs">
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
