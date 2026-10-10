'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['received', 'verifying', 'in_progress', 'completed', 'partially_completed', 'rejected']

export default function PrivacyRequestsTable({ requests }: { requests: any[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, { status: string; note: string; verified: boolean }>>({})

  const get = (r: any) => edits[r.id] ?? { status: r.status, note: r.resolution_note ?? '', verified: !!r.identity_verified }
  const set = (r: any, patch: Partial<{ status: string; note: string; verified: boolean }>) =>
    setEdits(e => ({ ...e, [r.id]: { ...get(r), ...patch } }))

  async function save(r: any) {
    const v = get(r)
    setBusy(r.id); setMsg(null)
    const res = await fetch('/api/data-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, status: v.status, resolution_note: v.note, identity_verified: v.verified }),
    })
    const data = await res.json()
    setBusy(null)
    if (!res.ok) { setMsg(data.error || 'Update failed'); return }
    setMsg('Saved.')
    router.refresh()
  }

  if (requests.length === 0) {
    return <div className="empty-state" style={{ padding: 'var(--space-md)' }}><p className="text-body-sm text-muted">No privacy requests yet.</p></div>
  }

  return (
    <>
      {msg && <div className="alert alert-info" style={{ marginBottom: 12 }} role="status">{msg}</div>}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Ref / Received</th><th>Type</th><th>Requester</th><th>Due</th><th>Handling</th></tr>
          </thead>
          <tbody>
            {requests.map(r => {
              const v = get(r)
              const overdue = !r.closed_at && new Date(r.due_at) < new Date()
              return (
                <tr key={r.id}>
                  <td className="text-body-sm">
                    <strong>{String(r.id).slice(0, 8).toUpperCase()}</strong>
                    <div className="text-caption text-muted">{new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </td>
                  <td className="text-body-sm" style={{ textTransform: 'capitalize' }}>{String(r.request_type).replace('_', ' ')}</td>
                  <td className="text-body-sm">
                    {r.requester_name}
                    <div className="text-caption text-muted">{r.requester_email}</div>
                    {r.details && <div className="text-caption" style={{ marginTop: 4, maxWidth: 260 }}>{r.details}</div>}
                  </td>
                  <td className="text-body-sm">
                    {new Date(r.due_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    {overdue && <div><span className="badge badge-warning">Overdue</span></div>}
                  </td>
                  <td style={{ minWidth: 260 }}>
                    <label className="text-caption" style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <input type="checkbox" checked={v.verified} onChange={e => set(r, { verified: e.target.checked })} />
                      Identity verified (via contact on file)
                    </label>
                    <select className="input" value={v.status} onChange={e => set(r, { status: e.target.value })} aria-label="Status" style={{ marginBottom: 6 }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <textarea className="input" rows={2} value={v.note} onChange={e => set(r, { note: e.target.value })}
                      placeholder="Outcome note — required if partial/rejected: what was kept and why" style={{ marginBottom: 6 }} />
                    <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => save(r)}>
                      {busy === r.id ? 'Saving…' : 'Save'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
