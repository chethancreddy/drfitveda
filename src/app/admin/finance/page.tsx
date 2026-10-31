'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

interface PayoutComponent {
  id: string
  component_code: string
  component_name: string
  role: string | null
  amount_type: 'fixed' | 'percentage' | string
  amount: number
  is_active: boolean
}

interface RuleVersion {
  id: string
  name: string
  effective_from: string
  effective_to: string | null
  is_active: boolean
  is_archived?: boolean
  archived_at?: string | null
  created_at?: string
  payout_rule_components: PayoutComponent[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default function AdminFinancePage() {
  const [rules, setRules] = useState<RuleVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [viewingRule, setViewingRule] = useState<RuleVersion | null>(null)
  const [editingRule, setEditingRule] = useState<RuleVersion | null>(null)
  const [deletingRule, setDeletingRule] = useState<RuleVersion | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/finance/compensation-rules?include_archived=true', { cache: 'no-store' })
      const data = await res.json()
      setRules(data.rules || [])
    } catch {
      showToast('Failed to load compensation rules')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function toggleRuleActive(rule: RuleVersion) {
    try {
      const res = await fetch(`/api/finance/compensation-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update rule status')
      showToast(rule.is_active ? 'Compensation rule deactivated' : 'Compensation rule activated')
      await loadRules()
    } catch {
      showToast('Failed to update rule status')
    }
  }

  async function restoreRule(rule: RuleVersion) {
    try {
      const res = await fetch(`/api/finance/compensation-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true, is_active: false }),
      })
      if (!res.ok) throw new Error('Failed to restore rule')
      showToast(`"${rule.name}" restored!`)
      await loadRules()
    } catch {
      showToast('Failed to restore rule')
    }
  }

  async function saveEditedRule(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRule) return
    setSaving(true)
    try {
      const res = await fetch(`/api/finance/compensation-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingRule.name,
          effective_from: editingRule.effective_from,
          effective_to: editingRule.effective_to || null,
          is_active: editingRule.is_active,
          payout_rule_components: editingRule.payout_rule_components,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update compensation rule')
      showToast('Compensation rule updated! Historical payout calculations remain unchanged.')
      setEditingRule(null)
      await loadRules()
    } catch (err: any) {
      showToast(err?.message || 'Error updating compensation rule')
    }
    setSaving(false)
  }

  async function confirmDeleteRule() {
    if (!deletingRule) return
    const res = await fetch(`/api/finance/compensation-rules/${deletingRule.id}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete compensation rule')
    }
    showToast(data.message || (data.archived ? 'Rule archived safely' : 'Rule permanently deleted'))
    setDeletingRule(null)
    await loadRules()
  }

  const activeRule = useMemo(() => {
    return rules.find(r => r.is_active && !r.is_archived) || null
  }, [rules])

  const companyAllocation = useMemo(() => {
    if (!activeRule) return null
    const baseAmount = 9999
    let totalPayouts = 0
    for (const c of activeRule.payout_rule_components || []) {
      if (!c.is_active) continue
      if (c.amount_type === 'fixed') totalPayouts += Number(c.amount || 0)
      else if (c.amount_type === 'percentage') totalPayouts += Math.round((baseAmount * Number(c.amount || 0)) / 100)
    }
    return Math.max(0, baseAmount - totalPayouts)
  }, [activeRule])

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (statusFilter === 'active' && (!r.is_active || r.is_archived)) return false
      if (statusFilter === 'inactive' && (r.is_active || r.is_archived)) return false
      if (statusFilter === 'archived' && !r.is_archived) return false
      if (statusFilter === 'all' && r.is_archived) return false
      return true
    })
  }, [rules, statusFilter])

  const nonArchivedCount = rules.filter(r => !r.is_archived).length
  const activeCount = rules.filter(r => r.is_active && !r.is_archived).length
  const inactiveCount = rules.filter(r => !r.is_active && !r.is_archived).length
  const archivedCount = rules.filter(r => r.is_archived).length

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Compensation Rules</h1>
            <p className="text-body-md text-muted">
              Manage payout components and rule versions. Historical transactions and completed payout calculations are never altered.
            </p>
          </div>
          <Link href="/admin/finance/new" className="btn btn-primary btn-sm">+ New Rule Version</Link>
        </div>

        {/* Live allocation preview */}
        {activeRule && (
          <div className="card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--color-primary)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 8 }}>
              <div className="text-headline-sm">Current Allocation Preview — {fmt(9999)} membership</div>
              <span className="badge badge-success">Active: {activeRule.name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 'var(--space-xs)' }}>
              {(activeRule.payout_rule_components || []).filter(c => c.is_active).map(c => (
                <div key={c.id} className="stat-card">
                  <div className="stat-label">{c.component_name}</div>
                  <div className="stat-value">{c.amount_type === 'fixed' ? fmt(c.amount) : `${c.amount}%`}</div>
                  <div className="text-caption text-muted" style={{ textTransform: 'capitalize' }}>{c.role?.replace(/_/g, ' ') ?? 'company'}</div>
                </div>
              ))}
              {companyAllocation !== null && (
                <div className="stat-card" style={{ borderColor: 'var(--color-success)' }}>
                  <div className="stat-label">Company Allocation</div>
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>{fmt(companyAllocation)}</div>
                  <div className="text-caption text-muted">auto-calculated</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          className="card"
          style={{
            padding: '10px 16px',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span className="text-body-sm text-muted">Filter Rule Versions by Status:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'all', label: `All (${nonArchivedCount})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'inactive', label: `Inactive (${inactiveCount})` },
                { key: 'archived', label: `Archived (${archivedCount})` },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* All rule versions */}
        {loading ? (
          <div className="empty-state">Loading compensation rules...</div>
        ) : filteredRules.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
            <div className="empty-state-icon">💰</div>
            <p className="text-body-md text-muted">No compensation rules match the selected filter.</p>
            <Link href="/admin/finance/new" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-xs)' }}>Create New Rule Version</Link>
          </div>
        ) : filteredRules.map(rule => (
          <div key={rule.id} className="card" style={{ marginBottom: 'var(--space-sm)', opacity: rule.is_active && !rule.is_archived ? 1 : 0.72 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="text-label-lg" style={{ fontWeight: 700 }}>{rule.name}</span>
                  {rule.is_archived ? (
                    <span className="badge badge-neutral">Archived</span>
                  ) : (
                    <span className={`badge badge-${rule.is_active ? 'success' : 'warning'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
                <div className="text-body-sm text-muted">
                  Effective: {rule.effective_from}{rule.effective_to ? ` → ${rule.effective_to}` : ' (no end date)'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setViewingRule(rule)}
                >
                  View
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setEditingRule(JSON.parse(JSON.stringify(rule)))}
                >
                  Edit
                </button>
                {rule.is_archived ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => restoreRule(rule)}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn btn-sm ${rule.is_active ? 'btn-outline' : 'btn-ghost'}`}
                    onClick={() => toggleRuleActive(rule)}
                  >
                    {rule.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#dc2626' }}
                  onClick={() => setDeletingRule(rule)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead><tr><th>Component</th><th>Role</th><th>Amount</th><th>Type</th><th>Active</th></tr></thead>
                <tbody>
                  {rule.payout_rule_components?.length ? rule.payout_rule_components.map(c => (
                    <tr key={c.id}>
                      <td className="text-body-sm" style={{ fontWeight: 500 }}>{c.component_name}</td>
                      <td className="text-body-sm text-muted" style={{ textTransform: 'capitalize' }}>{c.role?.replace(/_/g, ' ') ?? '—'}</td>
                      <td className="text-body-sm" style={{ fontWeight: 600 }}>{c.amount_type === 'fixed' ? fmt(c.amount) : `${c.amount}%`}</td>
                      <td><span className="badge badge-neutral">{c.amount_type}</span></td>
                      <td>{c.is_active ? '✅' : '—'}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="text-muted text-body-sm">No components</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* View Rule Modal */}
        {viewingRule && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setViewingRule(null)}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 560, padding: 'var(--space-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <div>
                  <h2 className="text-headline-sm">{viewingRule.name}</h2>
                  <p className="text-caption text-muted">
                    Effective {viewingRule.effective_from} {viewingRule.effective_to ? `to ${viewingRule.effective_to}` : '(ongoing)'}
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setViewingRule(null)}>✕</button>
              </div>

              <div className="table-wrapper" style={{ marginBottom: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Role</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingRule.payout_rule_components || []).map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.component_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{c.role?.replace(/_/g, ' ') || 'Company'}</td>
                        <td>{c.amount_type === 'fixed' ? fmt(c.amount) : `${c.amount}%`}</td>
                        <td>{c.is_active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const r = viewingRule
                    setViewingRule(null)
                    setEditingRule(JSON.parse(JSON.stringify(r)))
                  }}
                >
                  Edit Rule
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewingRule(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Rule Modal */}
        {editingRule && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <div>
                  <h2 className="text-headline-sm">Edit Compensation Rule</h2>
                  <p className="text-caption text-muted">
                    Updates apply to future allocations only. Completed financial calculations remain unchanged.
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingRule(null)}>✕</button>
              </div>

              <form onSubmit={saveEditedRule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">Rule Version Name *</span>
                  <input
                    className="form-input"
                    required
                    value={editingRule.name}
                    onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                  />
                </label>

                <div className="grid-2" style={{ gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Effective From *</span>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={editingRule.effective_from}
                      onChange={e => setEditingRule({ ...editingRule, effective_from: e.target.value })}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Effective To (Optional)</span>
                    <input
                      type="date"
                      className="form-input"
                      value={editingRule.effective_to || ''}
                      onChange={e => setEditingRule({ ...editingRule, effective_to: e.target.value || null })}
                    />
                  </label>
                </div>

                <div>
                  <div className="form-label" style={{ marginBottom: 8 }}>Payout Components</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(editingRule.payout_rule_components || []).map((comp, idx) => (
                      <div
                        key={comp.id || idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr auto',
                          gap: 8,
                          alignItems: 'center',
                          padding: 10,
                          background: 'var(--color-neutral)',
                          borderRadius: 8,
                        }}
                      >
                        <input
                          className="form-input"
                          value={comp.component_name}
                          onChange={e => {
                            const next = [...editingRule.payout_rule_components]
                            next[idx] = { ...comp, component_name: e.target.value }
                            setEditingRule({ ...editingRule, payout_rule_components: next })
                          }}
                        />
                        <select
                          className="form-input"
                          value={comp.amount_type}
                          onChange={e => {
                            const next = [...editingRule.payout_rule_components]
                            next[idx] = { ...comp, amount_type: e.target.value }
                            setEditingRule({ ...editingRule, payout_rule_components: next })
                          }}
                        >
                          <option value="fixed">Fixed (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                        <input
                          type="number"
                          className="form-input"
                          value={comp.amount}
                          onChange={e => {
                            const next = [...editingRule.payout_rule_components]
                            next[idx] = { ...comp, amount: Number(e.target.value) }
                            setEditingRule({ ...editingRule, payout_rule_components: next })
                          }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={comp.is_active}
                            onChange={e => {
                              const next = [...editingRule.payout_rule_components]
                              next[idx] = { ...comp, is_active: e.target.checked }
                              setEditingRule({ ...editingRule, payout_rule_components: next })
                            }}
                          />
                          Active
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={editingRule.is_active}
                    onChange={e => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                  />
                  <strong>Active Rule Version</strong>
                </label>

                <div className="flex justify-end" style={{ gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingRule(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Rule Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete / Archive Safety Modal */}
        <AdminRecordDeleteModal
          isOpen={!!deletingRule}
          moduleKey="compensation_rules"
          moduleLabel="Compensation Rules"
          recordId={deletingRule?.id || ''}
          recordName={deletingRule?.name || ''}
          onClose={() => setDeletingRule(null)}
          onConfirm={confirmDeleteRule}
        />

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 2000,
              background: 'var(--color-success)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            ✓ {toast}
          </div>
        )}
      </main>
    </div>
  )
}
