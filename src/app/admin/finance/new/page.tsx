'use client'
// ============================================================
// /admin/finance/new — Create New Compensation Rule Version
// TRD §9 — components array, effective dates
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

const DEFAULT_COMPONENTS = [
  { component_code: 'initial_doctor_plan', component_name: 'Initial Doctor Plan', role: 'doctor',        amount_type: 'fixed', amount: '999' },
  { component_code: 'trainer_service',     component_name: 'Trainer Service',     role: 'trainer',       amount_type: 'fixed', amount: '5499' },
  { component_code: 'weekly_review',       component_name: 'Weekly Doctor Review',role: 'doctor',        amount_type: 'fixed', amount: '199' },
]

type ComponentRow = { component_code: string; component_name: string; role: string; amount_type: string; amount: string }

export default function NewFinanceRulePage() {
  const router = useRouter()
  const [name,          setName]          = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [effectiveTo,   setEffectiveTo]   = useState('')
  const [isActive,      setIsActive]      = useState(true)
  const [components,    setComponents]    = useState<ComponentRow[]>(DEFAULT_COMPONENTS)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  function addComponent() {
    setComponents(c => [...c, { component_code: '', component_name: '', role: '', amount_type: 'fixed', amount: '' }])
  }
  function removeComponent(i: number) { setComponents(c => c.filter((_, idx) => idx !== i)) }
  function updateComponent(i: number, field: keyof ComponentRow, val: string) {
    setComponents(c => c.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/finance/compensation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, effective_from: effectiveFrom,
          effective_to: effectiveTo || undefined,
          is_active: isActive,
          components: components.filter(c => c.component_code && c.amount).map(c => ({
            ...c, amount: parseFloat(c.amount),
          })),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      router.push('/admin/finance')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setSaving(false)
    }
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <Link href="/admin/finance" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-xs)' }}>← Back</Link>
          <h1 className="text-headline-md">New Compensation Rule Version</h1>
          <p className="text-body-md text-muted">Define payout components. Old transactions are unaffected.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-sm)' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card">
            <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Rule Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label" htmlFor="rule-name">Rule Name *</label>
                <input id="rule-name" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 2026 Standard" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eff-from">Effective From *</label>
                <input id="eff-from" type="date" className="form-input" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="eff-to">Effective To (optional)</label>
                <input id="eff-to" type="date" className="form-input" value={effectiveTo} onChange={e => setEffectiveTo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Active</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <span className="text-body-sm">Make this the active rule version</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
              <h2 className="text-headline-sm">Payout Components</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addComponent}>+ Add Row</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {components.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px 90px 40px', gap: 8, alignItems: 'center' }}>
                  <input className="form-input" placeholder="Code (e.g. trainer_service)" value={c.component_code} onChange={e => updateComponent(i, 'component_code', e.target.value)} />
                  <input className="form-input" placeholder="Name" value={c.component_name} onChange={e => updateComponent(i, 'component_name', e.target.value)} />
                  <input className="form-input" placeholder="Role (e.g. trainer)" value={c.role} onChange={e => updateComponent(i, 'role', e.target.value)} />
                  <select className="form-input" value={c.amount_type} onChange={e => updateComponent(i, 'amount_type', e.target.value)}>
                    <option value="fixed">Fixed</option>
                    <option value="percent">%</option>
                  </select>
                  <input type="number" className="form-input" placeholder="Amount" step="0.01" value={c.amount} onChange={e => updateComponent(i, 'amount', e.target.value)} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeComponent(i)} style={{ color: 'var(--color-error)', padding: '4px 8px' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
            <Link href="/admin/finance" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-rule">
              {saving ? 'Saving…' : 'Create Rule Version'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
