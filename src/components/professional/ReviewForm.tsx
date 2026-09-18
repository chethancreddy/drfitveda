'use client'
// ============================================================
// ReviewForm — Client component for completing/approving a review
// TRD §20 — complete → approve state machine
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reviewId: string
  status: string
  existingNotes: {
    adherence: string | null
    doctor: string | null
    outcome: string | null
    nextReviewDate: string | null
  }
}

export default function ReviewForm({ reviewId, status, existingNotes }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [adherenceNotes, setAdherenceNotes] = useState(existingNotes.adherence ?? '')
  const [doctorNotes,    setDoctorNotes]    = useState(existingNotes.doctor    ?? '')
  const [outcome,        setOutcome]        = useState(existingNotes.outcome   ?? '')
  const [nextReviewDate, setNextReviewDate] = useState(existingNotes.nextReviewDate ?? '')

  async function action(act: 'complete' | 'approve') {
    setBusy(act); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: act,
          adherence_notes: adherenceNotes || undefined,
          doctor_notes: doctorNotes || undefined,
          outcome: outcome || undefined,
          next_review_date: nextReviewDate || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setSuccess(act === 'complete' ? 'Review completed. Awaiting approval.' : 'Review approved! Payout created.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const isReadOnly = status === 'approved'

  return (
    <div className="card">
      <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>
        {status === 'approved' ? '✅ Review Approved' : status === 'completed' ? '📝 Review Completed — Awaiting Approval' : '📝 Conduct Review'}
      </h2>

      {error   && <div className="alert alert-error"   style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}
      {success  && <div className="alert alert-success" style={{ marginBottom: 'var(--space-sm)' }}>{success}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="adherence-notes">Adherence Notes</label>
          <textarea id="adherence-notes" className="form-input" rows={3}
            value={adherenceNotes} onChange={e => setAdherenceNotes(e.target.value)}
            placeholder="How well did the customer follow their plan this week?"
            disabled={isReadOnly} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="doctor-notes">Doctor Notes (shared with customer)</label>
          <textarea id="doctor-notes" className="form-input" rows={3}
            value={doctorNotes} onChange={e => setDoctorNotes(e.target.value)}
            placeholder="Feedback, observations, and guidance for the customer…"
            disabled={isReadOnly} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="outcome">Outcome</label>
          <input id="outcome" type="text" className="form-input"
            value={outcome} onChange={e => setOutcome(e.target.value)}
            placeholder="e.g. Plan maintained, new version issued, referral made"
            disabled={isReadOnly} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="next-review">Next Review Date</label>
          <input id="next-review" type="date" className="form-input"
            value={nextReviewDate} onChange={e => setNextReviewDate(e.target.value)}
            disabled={isReadOnly} />
        </div>

        {!isReadOnly && (
          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
            {status === 'due' && (
              <button className="btn btn-primary" onClick={() => action('complete')} disabled={busy !== null} id="btn-complete-review">
                {busy === 'complete' ? 'Saving…' : '✓ Mark Complete'}
              </button>
            )}
            {status === 'completed' && (
              <button className="btn btn-success" onClick={() => action('approve')} disabled={busy !== null} id="btn-approve-review">
                {busy === 'approve' ? 'Approving…' : '✅ Approve & Create Payout'}
              </button>
            )}
          </div>
        )}

        {isReadOnly && (
          <div className="alert alert-success">
            ✅ This review is approved and the payout has been created.
          </div>
        )}
      </div>
    </div>
  )
}
