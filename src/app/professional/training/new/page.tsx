'use client'
// ============================================================
// /professional/training/new — Create New Training Session
// TRD §47.11
// ============================================================
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Customer = { id: string; name: string }

export default function NewTrainingSessionPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerId, setCustomerId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    // Fetch assigned customers via the existing session endpoint context
    fetch('/api/training-sessions/assigned-customers')
      .then(r => r.json())
      .then(d => {
        setCustomers(d.customers ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { setError('Please select a customer'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          scheduled_at: scheduledAt || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create session')
      router.push(`/professional/training/${data.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating session')
      setSaving(false)
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar hide-mobile">
        <div className="logo" style={{padding:'8px 0',marginBottom:'var(--space-sm)'}}>
          <div className="logo-mark">DV</div>
          <div className="logo-text">Dr Fit Veda</div>
        </div>
        <Link href="/professional" className="sidebar-item"><span style={{fontSize:18}}>🏠</span>Dashboard</Link>
        <Link href="/professional/training" className="sidebar-item active"><span style={{fontSize:18}}>🎥</span>Live Training</Link>
      </aside>

      <main className="app-main">
        <div className="page-header">
          <Link href="/professional/training" className="btn btn-ghost btn-sm" style={{marginBottom:'var(--space-xs)'}}>← Back</Link>
          <h1 className="text-headline-md">New Training Session</h1>
          <p className="text-body-md text-muted">Schedule a live session with a customer</p>
        </div>

        <div className="card" style={{maxWidth:540}}>
          {error && (
            <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'var(--space-sm)'}}>

            <div className="form-group">
              <label className="form-label" htmlFor="customer-select">Customer *</label>
              {loading
                ? <div className="text-body-sm text-muted">Loading customers…</div>
                : customers.length === 0
                  ? <div className="text-body-sm text-muted">No assigned customers found. <Link href="/professional">Return to dashboard</Link>.</div>
                  : (
                    <select
                      id="customer-select"
                      className="form-input"
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      required
                    >
                      <option value="">— Select customer —</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )
              }
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="scheduled-at">Session Date &amp; Time</label>
              <input
                id="scheduled-at"
                type="datetime-local"
                className="form-input"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
              <span className="form-hint">Leave empty to create an unscheduled (ad hoc) session</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes (internal)</label>
              <textarea
                id="notes"
                className="form-input"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Focus areas, health flags, reminders…"
              />
            </div>

            <div style={{display:'flex',gap:'var(--space-xs)',justifyContent:'flex-end'}}>
              <Link href="/professional/training" className="btn btn-ghost">Cancel</Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || loading || customers.length === 0}
              >
                {saving ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
