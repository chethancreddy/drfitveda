'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

interface Membership {
  id: string
  name: string
  duration_label: string
  duration_days: number
  price: number
  original_price: number
  live_sessions_count: number | null
  session_frequency: string
  extra_consultation_count: number | null
  has_yoga_consultation: boolean
  has_yoga_plan: boolean
  is_super_plan: boolean
  google_meet_recording: boolean
  benefits: string[]
  is_active: boolean
  is_archived?: boolean
  archived_at?: string | null
  display_order: number
}

interface ConsultationService {
  id: string
  key: string
  name: string
  category: string
  description: string
  price: number
  duration_min: number
  is_active: boolean
  display_order: number
}

const EMPTY_PLAN: Partial<Membership> = {
  name: '',
  duration_label: '',
  duration_days: 30,
  price: 0,
  original_price: 0,
  live_sessions_count: 0,
  session_frequency: '',
  extra_consultation_count: 0,
  has_yoga_consultation: false,
  has_yoga_plan: false,
  is_super_plan: false,
  google_meet_recording: true,
  benefits: [],
  is_active: true,
  display_order: 99,
}

function fmt(n: number) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<Membership[]>([])
  const [consultations, setConsultations] = useState<ConsultationService[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Partial<Membership> | null>(null)
  const [viewingPlan, setViewingPlan] = useState<Membership | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Membership | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/memberships?include_inactive=true&include_archived=true', { cache: 'no-store' }),
        fetch('/api/consultation-services', { cache: 'no-store' }),
      ])
      const pData = await pRes.json()
      const cData = await cRes.json()
      setPlans(pData.memberships ?? [])
      setConsultations(cData.consultation_services ?? [])
    } catch {
      showToast('Failed to load data')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function savePlan() {
    if (!editingPlan) return
    setSaving(true)
    try {
      const isNew = !editingPlan.id
      const url = isNew ? '/api/memberships' : `/api/memberships/${editingPlan.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save plan')
      }
      showToast(isNew ? 'Plan created!' : 'Plan updated!')
      setEditingPlan(null)
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Error saving plan. Please try again.')
    }
    setSaving(false)
  }

  async function togglePlanActive(plan: Membership) {
    try {
      const res = await fetch(`/api/memberships/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, is_active: !plan.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update plan status')
      showToast(plan.is_active ? 'Plan deactivated' : 'Plan activated')
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle plan status')
    }
  }

  async function restorePlan(plan: Membership) {
    try {
      const res = await fetch(`/api/memberships/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true, is_active: true }),
      })
      if (!res.ok) throw new Error('Failed to restore plan')
      showToast(`"${plan.name}" restored!`)
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to restore plan')
    }
  }

  async function confirmDeletePlan() {
    if (!deletingPlan) return
    const res = await fetch(`/api/memberships/${deletingPlan.id}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete membership plan')
    }
    showToast(data.message || (data.archived ? 'Plan archived safely' : 'Plan permanently deleted'))
    setDeletingPlan(null)
    await loadData()
  }

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (statusFilter === 'active' && (!p.is_active || p.is_archived)) return false
      if (statusFilter === 'inactive' && (p.is_active || p.is_archived)) return false
      if (statusFilter === 'archived' && !p.is_archived) return false
      if (statusFilter === 'all' && p.is_archived) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = `${p.name} ${p.duration_label} ${p.session_frequency} ${(p.benefits || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [plans, statusFilter, searchQuery])

  const nonArchivedCount = plans.filter(p => !p.is_archived).length
  const activeCount = plans.filter(p => p.is_active && !p.is_archived).length
  const inactiveCount = plans.filter(p => !p.is_active && !p.is_archived).length
  const archivedCount = plans.filter(p => p.is_archived).length

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Membership Plans CMS</h1>
            <p className="text-body-md text-muted">Create and manage subscription membership plans, session counts, pricing, and package benefits</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/admin/consultations" className="btn btn-outline btn-sm">
              🩺 Manage Consultation Services →
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => setEditingPlan({ ...EMPTY_PLAN })}>+ New Plan</button>
          </div>
        </div>

        {/* Dedicated Module Notice & Quick Switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span
              style={{
                padding: '8px 16px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: '2px solid var(--color-primary)',
                fontSize: 14,
              }}
            >
              💳 Membership Plans ({nonArchivedCount})
            </span>
            <Link
              href="/admin/consultations"
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                fontWeight: 600,
                color: 'var(--color-muted)',
                borderBottom: '2px solid transparent',
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              🩺 Consultation Services CMS ({consultations.length}) ↗
            </Link>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <input
            className="form-input"
            style={{ flex: '1 1 260px', maxWidth: 420 }}
            placeholder="🔍 Search by plan name, duration, or benefits..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
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

        {loading && <div className="empty-state">Loading...</div>}

        {/* Plans List */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {filteredPlans.length === 0 ? (
              <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                <div className="text-headline-sm">No Membership Plans Found</div>
                <p className="text-body-sm text-muted">Try adjusting your filter or click &ldquo;+ New Plan&rdquo; above.</p>
              </div>
            ) : filteredPlans.map(plan => (
              <div key={plan.id} className="card" style={{
                padding: 'var(--space-lg)',
                border: plan.is_super_plan ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                opacity: plan.is_active && !plan.is_archived ? 1 : 0.65,
                background: plan.is_super_plan ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%)' : 'var(--surface-card)',
              }}>
                <div className="flex justify-between items-start" style={{ gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 18 }}>{plan.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: 12, fontWeight: 600 }}>{plan.duration_label}</span>
                      {plan.is_super_plan && <span className="badge" style={{ background: '#f59e0b', color: 'white', fontSize: 11, fontWeight: 700 }}>🌟 SUPER PLAN</span>}
                      {plan.is_archived ? (
                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>Archived</span>
                      ) : (
                        <span className={`badge badge-${plan.is_active ? 'success' : 'warning'}`} style={{ fontSize: 11 }}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                        {fmt(plan.price)}
                        {plan.original_price > plan.price && (
                          <span className="text-caption text-muted" style={{ fontSize: 12, fontWeight: 400, marginLeft: 6, textDecoration: 'line-through' }}>
                            {fmt(plan.original_price)}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Single Unified Info Box */}
                    <div style={{
                      background: 'var(--color-neutral)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      marginTop: 10,
                      border: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>🎥</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                          {plan.session_frequency}
                        </div>
                      </div>

                      {plan.benefits && plan.benefits.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--color-border)' }}>
                          {plan.benefits.slice(0, 4).map((b, i) => (
                            <span key={i} className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                              ✓ {b}
                            </span>
                          ))}
                          {plan.benefits.length > 4 && (
                            <span className="text-caption text-muted" style={{ fontSize: 11, alignSelf: 'center' }}>
                              +{plan.benefits.length - 4} more benefits
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, minWidth: 110 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setViewingPlan(plan)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setEditingPlan({ ...plan })}
                    >
                      Edit
                    </button>
                    {plan.is_archived ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => restorePlan(plan)}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`btn btn-sm ${plan.is_active ? 'btn-outline' : 'btn-ghost'}`}
                        onClick={() => togglePlanActive(plan)}
                      >
                        {plan.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => setDeletingPlan(plan)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Plan Modal */}
        {viewingPlan && (
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
            onClick={() => setViewingPlan(null)}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 540, padding: 'var(--space-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <div>
                  <h2 className="text-headline-sm">{viewingPlan.name}</h2>
                  <p className="text-caption text-muted">
                    {viewingPlan.duration_label} ({viewingPlan.duration_days} days) • Order #{viewingPlan.display_order}
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setViewingPlan(null)}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: 12, background: 'var(--color-neutral)', borderRadius: 8 }}>
                  <div className="text-caption text-muted">Subscription Price</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
                    {fmt(viewingPlan.price)}
                  </div>
                </div>
                <div style={{ padding: 12, background: 'var(--color-neutral)', borderRadius: 8 }}>
                  <div className="text-caption text-muted">Live Sessions</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {viewingPlan.live_sessions_count ?? 'Weekly Super Plan'}
                  </div>
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--color-neutral)', borderRadius: 8, marginBottom: 14 }}>
                <div className="text-caption text-muted">Session Frequency</div>
                <div className="text-body-sm" style={{ fontWeight: 600, marginTop: 2 }}>
                  {viewingPlan.session_frequency}
                </div>
              </div>

              {viewingPlan.benefits?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="text-caption text-muted" style={{ marginBottom: 6 }}>Included Benefits</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                    {viewingPlan.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const p = viewingPlan
                    setViewingPlan(null)
                    setEditingPlan({ ...p })
                  }}
                >
                  Edit Plan
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewingPlan(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Edit Modal */}
        {editingPlan && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">{editingPlan.id ? 'Edit Membership Plan' : 'Create New Plan'}</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingPlan(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Section 1: Basic Details & Pricing */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    1. Plan Overview &amp; Pricing
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginBottom: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Plan Name</span>
                      <input className="form-input" placeholder="e.g. Starter Plan" value={editingPlan.name ?? ''} onChange={e => setEditingPlan(p => ({ ...p, name: e.target.value }))} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Duration Label</span>
                      <input className="form-input" placeholder="e.g. 1 Month" value={editingPlan.duration_label ?? ''} onChange={e => setEditingPlan(p => ({ ...p, duration_label: e.target.value }))} />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Price (₹)</span>
                      <input className="form-input" type="number" value={editingPlan.price ?? 0} onChange={e => setEditingPlan(p => ({ ...p, price: Number(e.target.value) }))} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Original Price (₹)</span>
                      <input className="form-input" type="number" value={editingPlan.original_price ?? 0} onChange={e => setEditingPlan(p => ({ ...p, original_price: Number(e.target.value) }))} />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Display Order</span>
                      <input className="form-input" type="number" value={editingPlan.display_order ?? 1} onChange={e => setEditingPlan(p => ({ ...p, display_order: Number(e.target.value) }))} />
                    </label>
                  </div>
                </div>

                {/* Section 2: Session Frequency & Live Delivery */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    2. Session Frequency &amp; Delivery Schedule
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Session Frequency Description (Displayed prominently on website)</span>
                      <input
                        className="form-input"
                        placeholder="e.g. Total 12 live 1-on-1 sessions with trainers"
                        value={editingPlan.session_frequency ?? ''}
                        onChange={e => setEditingPlan(p => ({ ...p, session_frequency: e.target.value }))}
                      />
                      <span className="text-caption text-muted" style={{ marginTop: 4 }}>
                        This text is shown on the plan pricing card on the homepage and memberships page.
                      </span>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Total Live Sessions Count (Numeric)</span>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="e.g. 12 (or leave empty for Super Plan weekly model)"
                        value={editingPlan.live_sessions_count ?? ''}
                        onChange={e => setEditingPlan(p => ({ ...p, live_sessions_count: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Benefits & Features */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    3. Included Benefits &amp; Features
                  </div>
                  <label className="form-field" style={{ marginBottom: 12 }}>
                    <span className="form-label">Benefits Checklist (one benefit per line)</span>
                    <textarea
                      className="form-input"
                      rows={5}
                      placeholder="12 live 1-on-1 sessions with certified trainer&#10;Customized fitness & nutrition plan&#10;Daily check-in & adherence tracking"
                      value={(editingPlan.benefits ?? []).join('\n')}
                      onChange={e => setEditingPlan(p => ({ ...p, benefits: e.target.value.split('\n').filter(Boolean) }))}
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 8, borderTop: '1px dashed var(--color-border)' }}>
                    {[
                      { key: 'has_yoga_consultation', label: '🧘 Yoga Consultation Included' },
                      { key: 'has_yoga_plan', label: '📋 Yoga Plan Included' },
                      { key: 'is_super_plan', label: '🌟 Super Plan (Weekly Model)' },
                      { key: 'google_meet_recording', label: '📹 Zoho Meeting Recording' },
                      { key: 'is_active', label: '✅ Active (Visible to Customers)' },
                    ].map(field => (
                      <label key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={!!(editingPlan as any)[field.key]}
                          onChange={e => setEditingPlan(p => ({ ...p, [field.key]: e.target.checked }))}
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>

                {editingPlan.id && (
                  <div className="alert alert-info" style={{ fontSize: 12, padding: '8px 12px' }}>
                    <span>ℹ️</span>
                    <span>Historical memberships remain unchanged. Only new purchases will reflect updated pricing and terms.</span>
                  </div>
                )}

                <div className="flex justify-end" style={{ gap: 10, marginTop: 4 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingPlan(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={savePlan} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Plan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete / Archive Safety Modal */}
        <AdminRecordDeleteModal
          isOpen={!!deletingPlan}
          moduleKey="memberships"
          moduleLabel="Membership Plans CMS"
          recordId={deletingPlan?.id || ''}
          recordName={deletingPlan?.name || ''}
          onClose={() => setDeletingPlan(null)}
          onConfirm={confirmDeletePlan}
        />

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
            background: 'var(--color-success)', color: 'white',
            padding: '12px 20px', borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            ✓ {toast}
          </div>
        )}
      </main>
    </div>
  )
}
