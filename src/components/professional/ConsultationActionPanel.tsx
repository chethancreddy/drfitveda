'use client'
// ============================================================
// ConsultationActionPanel — Doctor action panel for appointments
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConsultationActionPanelProps {
  appointmentId: string
  currentStatus?: string
  customerId?: string
  initialNotes?: string
  initialRecommendations?: string
  initialFollowUpDate?: string
}

export default function ConsultationActionPanel({
  appointmentId,
  currentStatus = 'scheduled',
  customerId,
  initialNotes = '',
  initialRecommendations = '',
  initialFollowUpDate = '',
}: ConsultationActionPanelProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(initialNotes)
  const [recommendations, setRecommendations] = useState(initialRecommendations)
  const [followUpDate, setFollowUpDate] = useState(initialFollowUpDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async (newStatus?: string) => {
    setError(null)
    setLoading(true)

    try {
      const targetStatus = newStatus || status

      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          notes,
          recommendations,
          follow_up_date: followUpDate || null,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update consultation')

      if (newStatus) setStatus(newStatus)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{padding:'var(--space-md)'}}>
      <div className="flex justify-between items-center" style={{marginBottom:'var(--space-sm)'}}>
        <h3 className="text-label-lg">Consultation Clinical Notes</h3>
        <span className={`badge badge-${status === 'completed' ? 'success' : status === 'cancelled' ? 'error' : 'warning'}`} style={{textTransform:'capitalize'}}>
          {status}
        </span>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>Clinical notes saved!</div>}

      <div style={{marginBottom:'var(--space-sm)'}}>
        <label className="text-label-md" style={{display:'block',marginBottom:4}}>Doctor / Clinical Findings</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Patient condition, observed symptoms, progress discussion..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div style={{marginBottom:'var(--space-sm)'}}>
        <label className="text-label-md" style={{display:'block',marginBottom:4}}>Specific Recommendations / Modifications</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Dietary changes, asanas advised, supplements/herbs recommended..."
          value={recommendations}
          onChange={e => setRecommendations(e.target.value)}
        />
      </div>

      <div style={{marginBottom:'var(--space-md)'}}>
        <label className="text-label-md" style={{display:'block',marginBottom:4}}>Follow-up Consultation Date</label>
        <input
          type="date"
          className="input"
          value={followUpDate}
          onChange={e => setFollowUpDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-xs">
        <button
          type="button"
          onClick={() => handleSave()}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Draft Notes'}
        </button>

        {status !== 'completed' && (
          <button
            type="button"
            onClick={() => handleSave('completed')}
            className="btn btn-primary"
            disabled={loading}
          >
            Mark Consultation Completed
          </button>
        )}
      </div>
    </div>
  )
}
