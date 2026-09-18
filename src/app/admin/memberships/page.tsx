'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

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
  const [editingConsult, setEditingConsult] = useState<Partial<ConsultationService> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'plans' | 'consultations'>('plans')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/memberships'),
        fetch('/api/consultation-services'),
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
      if (!res.ok) throw new Error('Save failed')
      showToast(isNew ? 'Plan created!' : 'Plan updated!')
      setEditingPlan(null)
      await loadData()
    } catch {
      showToast('Error saving plan. Changes applied locally for demo.')
      // For demo: apply locally
      if (editingPlan.id) {
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...editingPlan } as Membership : p))
      }
      setEditingPlan(null)
    }
    setSaving(false)
  }

  async function togglePlanActive(plan: Membership) {
    try {
      await fetch(`/api/memberships/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, is_active: !plan.is_active }),
      })
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
      showToast(plan.is_active ? 'Plan deactivated' : 'Plan activated')
    } catch {
      showToast('Toggle applied locally')
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
    }
  }

  async function saveConsult() {
    if (!editingConsult) return
    setSaving(true)
    try {
      const res = await fetch(`/api/consultation-services/${editingConsult.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConsult),
      })
      if (!res.ok) throw new Error()
      showToast('Consultation service updated!')
      setEditingConsult(null)
      await loadData()
    } catch {
      // Apply locally for demo
      setConsultations(prev => prev.map(c => c.id === editingConsult.id ? { ...c, ...editingConsult } as ConsultationService : c))
      showToast('Updated locally (demo mode)')
      setEditingConsult(null)
    }
    setSaving(false)
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="text-headline-md">Membership & Consultation CMS</h1>
            <p className="text-body-md text-muted">Edit plans, session counts, pricing, and standalone consultation services</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setEditingPlan({ ...EMPTY_PLAN })}>+ New Plan</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
          {(['plans', 'consultations'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '10px 18px',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
                fontSize: 14, textTransform: 'capitalize',
              }}
            >
              {t === 'plans' ? '💳 Membership Plans' : '🩺 Consultation Services'}
            </button>
          ))}
        </div>

        {loading && <div className="empty-state">Loading...</div>}

        {/* Plans Tab */}
        {!loading && tab === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {plans.map(plan => (
              <div key={plan.id} className="card" style={{
                padding: 'var(--space-lg)',
                border: plan.is_super_plan ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                opacity: plan.is_active ? 1 : 0.55,
                background: plan.is_super_plan ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%)' : 'var(--surface-card)',
              }}>
                <div className="flex justify-between items-start" style={{ gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 18 }}>{plan.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: 12, fontWeight: 600 }}>{plan.duration_label}</span>
                      {plan.is_super_plan && <span className="badge" style={{ background: '#f59e0b', color: 'white', fontSize: 11, fontWeight: 700 }}>🌟 SUPER PLAN</span>}
                      {!plan.is_active && <span className="badge badge-neutral" style={{ fontSize: 11 }}>Inactive</span>}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, minWidth: 90 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setEditingPlan({ ...plan })}>Edit</button>
                    <button
                      className={`btn btn-sm ${plan.is_active ? 'btn-outline' : 'btn-ghost'}`}
                      onClick={() => togglePlanActive(plan)}
                    >
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consultations Tab */}
        {!loading && tab === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {consultations.map(c => (
              <div key={c.id} className="card" style={{ padding: 'var(--space-md)', border: '1px solid var(--color-border)', opacity: c.is_active ? 1 : 0.55 }}>
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{c.name}</span>
                      <span className="badge badge-neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>{c.category}</span>
                      {!c.is_active && <span className="badge badge-neutral" style={{ fontSize: 11 }}>Inactive</span>}
                    </div>
                    <p className="text-body-sm text-muted" style={{ lineHeight: 1.55, marginBottom: 6 }}>{c.description}</p>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span className="text-body-sm"><strong>₹{c.price}</strong> per session</span>
                      <span className="text-body-sm text-muted">{c.duration_min} min</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 16, flexShrink: 0 }} onClick={() => setEditingConsult({ ...c })}>Edit</button>
                </div>
              </div>
            ))}
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
                      { key: 'google_meet_recording', label: '📹 Google Meet Recording' },
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

        {/* Consultation Edit Modal */}
        {editingConsult && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">Edit Consultation Service</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingConsult(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">Service Name</span>
                  <input className="form-input" value={editingConsult.name ?? ''} onChange={e => setEditingConsult(c => ({ ...c, name: e.target.value }))} />
                </label>
                <label className="form-field">
                  <span className="form-label">Description</span>
                  <textarea className="form-input" rows={3} value={editingConsult.description ?? ''} onChange={e => setEditingConsult(c => ({ ...c, description: e.target.value }))} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Price (₹)</span>
                    <input className="form-input" type="number" value={editingConsult.price ?? 499} onChange={e => setEditingConsult(c => ({ ...c, price: Number(e.target.value) }))} />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Duration (min)</span>
                    <input className="form-input" type="number" value={editingConsult.duration_min ?? 30} onChange={e => setEditingConsult(c => ({ ...c, duration_min: Number(e.target.value) }))} />
                  </label>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={!!editingConsult.is_active}
                    onChange={e => setEditingConsult(c => ({ ...c, is_active: e.target.checked }))}
                  />
                  Active (visible to customers)
                </label>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingConsult(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveConsult} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
