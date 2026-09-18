'use client'
// ============================================================
// PayoutActions — Inline approve/pay/cancel buttons for payouts table
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PayoutActions({ payoutId, status }: { payoutId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(action: 'approve' | 'pay' | 'cancel') {
    setBusy(action); setError(null)
    try {
      const res = await fetch(`/api/finance/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {error && <div className="text-caption" style={{ color: 'var(--color-error)' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {status === 'pending' && (
          <button className="btn btn-primary btn-sm" onClick={() => act('approve')} disabled={busy !== null} id={`btn-approve-${payoutId}`}>
            {busy === 'approve' ? '…' : 'Approve'}
          </button>
        )}
        {status === 'approved' && (
          <button className="btn btn-success btn-sm" onClick={() => act('pay')} disabled={busy !== null} id={`btn-pay-${payoutId}`}>
            {busy === 'pay' ? '…' : 'Mark Paid'}
          </button>
        )}
        {['pending', 'approved'].includes(status) && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}
            onClick={() => { if (window.confirm('Cancel this payout?')) act('cancel') }}
            disabled={busy !== null} id={`btn-cancel-${payoutId}`}>
            {busy === 'cancel' ? '…' : 'Cancel'}
          </button>
        )}
        {status === 'paid' && <span className="text-body-sm text-muted">✅ Paid</span>}
        {status === 'cancelled' && <span className="text-body-sm text-muted">Cancelled</span>}
      </div>
    </div>
  )
}
