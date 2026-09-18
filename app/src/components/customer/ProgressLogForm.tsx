'use client'
// ============================================================
// ProgressLogForm — Client component to log a progress entry
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProgressLogForm() {
  const router = useRouter()
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight) { setError('Weight is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: parseFloat(weight), notes: notes || undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setSaving(false)
    }
  }

  if (done) return (
    <div className="alert alert-success" style={{ borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)' }}>
      ✅ Progress logged successfully!
    </div>
  )

  return (
    <div className="card" style={{ marginBottom: 'var(--space-sm)' }}>
      <div className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Log Today&apos;s Weight</div>
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-xs)' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="weight-input">Weight (kg) *</label>
          <input id="weight-input" type="number" step="0.1" min="20" max="300" className="form-input"
            value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 72.5" required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="notes-input">Notes (optional)</label>
          <input id="notes-input" type="text" className="form-input"
            value={notes} onChange={e => setNotes(e.target.value)} placeholder="Feeling lighter today…" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} id="btn-log-progress">
          {saving ? 'Saving…' : 'Log Progress'}
        </button>
      </form>
    </div>
  )
}
