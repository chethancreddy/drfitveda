'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface Customer {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  membership_status: string
  membership_plan_id: string | null
  google_meet_url: string
  is_active: boolean
  profile?: {
    gender?: string
    height_cm?: number
    weight_kg?: number
    bmi?: number
    goals?: string
  }
  assigned_professionals?: {
    id: string
    role: string
    professional_id: string
    full_name: string
  }[]
  plan?: {
    name: string
    price: number
    duration_label: string
  }
}

interface Professional {
  id: string
  full_name: string
  role: string
  is_active: boolean
}

interface Membership {
  id: string
  name: string
  duration_label: string
  price: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [plans, setPlans] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: 'female',
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    goals: '',
    membership_plan_id: 'mbr-001',
    google_meet_url: '',
    doctor_id: '',
    trainer_id: '',
  })

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [cRes, pRes, mRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/professionals'),
        fetch('/api/memberships'),
      ])
      const cData = await cRes.json()
      const pData = await pRes.json()
      const mData = await mRes.json()

      setCustomers(cData.customers || [])
      setProfessionals(pData.professionals || [])
      setPlans(mData.memberships || [])

      // Set default doctor and trainer for onboard modal
      const docs = (pData.professionals || []).filter((p: any) => p.role.includes('doctor') && p.is_active)
      const trns = (pData.professionals || []).filter((p: any) => p.role.includes('trainer') && p.is_active)
      setFormData(prev => ({
        ...prev,
        doctor_id: docs[0]?.id || '',
        trainer_id: trns[0]?.id || '',
      }))
    } catch {
      showToast('Failed to load customers')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    setFormData(prev => ({
      ...prev,
      full_name: name,
      google_meet_url: prev.google_meet_url && !prev.google_meet_url.includes('fitveda-') && !prev.google_meet_url.includes('meet.zoho.com')
        ? prev.google_meet_url
        : `https://meet.zoho.com/fitveda-${slug || 'customer'}-${Math.floor(100 + Math.random() * 900)}`,
    }))
  }

  function autoGenerateZohoLink() {
    const slug = (formData.full_name || 'customer').toLowerCase().replace(/[^a-z0-9]/g, '')
    const generated = `https://meet.zoho.com/fitveda-${slug}-${Math.floor(100 + Math.random() * 900)}`
    setFormData(prev => ({
      ...prev,
      google_meet_url: generated,
    }))
    showToast('✓ Generated unique Zoho Meeting room link!')
  }

  async function handleOnboardSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      showToast('Please enter customer full name')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...formData,
        zoho_meeting_url: formData.google_meet_url,
        meeting_url: formData.google_meet_url,
      }
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Onboarding failed')
      showToast('✓ Customer onboarded with Zoho Meeting assigned successfully!')
      setShowOnboardModal(false)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        gender: 'female',
        date_of_birth: '',
        height_cm: '',
        weight_kg: '',
        goals: '',
        membership_plan_id: 'mbr-001',
        google_meet_url: '',
        doctor_id: '',
        trainer_id: '',
      })
      await loadAllData()
    } catch {
      showToast('Error onboarding customer')
    }
    setSaving(false)
  }

  async function toggleCustomerActive(customer: Customer) {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !customer.is_active }),
      })
      if (res.ok) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_active: !c.is_active } : c))
        showToast(customer.is_active ? 'Customer deactivated' : 'Customer activated')
      }
    } catch {
      showToast('Failed to update status')
    }
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="text-headline-md">Customers</h1>
            <p className="text-body-md text-muted">Manage patient profiles, memberships, dedicated Zoho Meeting rooms, and care teams</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowOnboardModal(true)}>
            + Onboard New Customer
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading customers...</div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Membership Plan</th>
                    <th>Dedicated Zoho Meeting Link</th>
                    <th>Assigned Care Team</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length ? customers.map(c => {
                    const doc = c.assigned_professionals?.find(p => p.role.includes('doctor'))
                    const trn = c.assigned_professionals?.find(p => p.role.includes('trainer'))
                    const meetLink = (c as any).zoho_meeting_url || c.google_meet_url || 'https://meet.zoho.com/fitveda-priya'

                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.full_name}</div>
                          <div className="text-caption text-muted">{c.email || c.phone || 'No contact listed'}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${c.membership_status === 'active' ? 'success' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                            {c.plan?.name || c.membership_status || 'None'}
                          </span>
                        </td>
                        <td>
                          {meetLink ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 16 }}>📹</span>
                              <a
                                href={meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-caption text-primary"
                                style={{ fontWeight: 600, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                                title={meetLink}
                              >
                                {meetLink.replace('https://', '')}
                              </a>
                            </div>
                          ) : (
                            <span className="text-caption text-muted">No link set</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {doc && <div className="text-caption">🩺 {doc.full_name}</div>}
                            {trn && <div className="text-caption">🏋️ {trn.full_name}</div>}
                            {!doc && !trn && <span className="text-caption text-muted">Unassigned</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${c.is_active ? 'success' : 'neutral'}`}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link href={`/admin/customers/${c.id}`} className="btn btn-ghost btn-sm">
                              View Profile
                            </Link>
                            <button
                              className={`btn btn-sm ${c.is_active ? 'btn-outline' : 'btn-ghost'}`}
                              onClick={() => toggleCustomerActive(c)}
                            >
                              {c.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                          No customers found. Click &quot;+ Onboard New Customer&quot; above to register your first patient.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onboarding Modal */}
        {showOnboardModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                  <h2 className="text-headline-sm">Onboard New Customer</h2>
                  <p className="text-caption text-muted">Setup patient profile, dedicated Zoho Meeting room, care team, and plan</p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowOnboardModal(false)}>✕</button>
              </div>

              <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Identity & Contact */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    1. Patient Identity &amp; Contact
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Full Name *</span>
                      <input
                        className="form-input"
                        placeholder="e.g. Priya Sharma"
                        required
                        value={formData.full_name}
                        onChange={e => handleNameChange(e.target.value)}
                      />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Email Address</span>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="priya@example.com"
                        value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Phone Number</span>
                      <input
                        className="form-input"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Dedicated Zoho Meeting Link */}
                <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#166534', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🟢 2. Dedicated Zoho Meeting Room Link</span>
                      <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>Zoho Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={autoGenerateZohoLink}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: '4px 10px', height: 'auto', background: '#ffffff', borderColor: '#86efac', color: '#166534', fontWeight: 600 }}
                    >
                      ⚡ Auto-Generate Link
                    </button>
                  </div>
                  <label className="form-field">
                    <span className="form-label">Unique Zoho Meeting URL for this Customer</span>
                    <input
                      className="form-input"
                      placeholder="https://meet.zoho.com/fitveda-priya-sharma-123"
                      value={formData.google_meet_url}
                      onChange={e => setFormData(p => ({ ...p, google_meet_url: e.target.value }))}
                      style={{ fontFamily: 'monospace', fontSize: 13, background: '#ffffff' }}
                    />
                    <span className="text-caption" style={{ marginTop: 4, display: 'block', color: '#166534' }}>
                      ⚡ <strong>Auto-generated Zoho Meeting:</strong> Automatically generated from customer name upon typing, or click &ldquo;Auto-Generate Link&rdquo;. Used by assigned doctor and trainer for all live sessions.
                    </span>
                  </label>
                </div>

                {/* 3. Membership & Care Team Assignment */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    3. Membership Plan &amp; Assigned Professionals
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Membership Plan</span>
                      <select
                        className="form-input"
                        value={formData.membership_plan_id}
                        onChange={e => setFormData(p => ({ ...p, membership_plan_id: e.target.value }))}
                      >
                        <option value="">No Active Plan</option>
                        {plans.map(pl => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name} (₹{pl.price.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Assign Doctor</span>
                      <select
                        className="form-input"
                        value={formData.doctor_id}
                        onChange={e => setFormData(p => ({ ...p, doctor_id: e.target.value }))}
                      >
                        <option value="">None / Unassigned</option>
                        {professionals.filter(p => p.role.includes('doctor')).map(d => (
                          <option key={d.id} value={d.id}>🩺 {d.full_name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Assign Trainer</span>
                      <select
                        className="form-input"
                        value={formData.trainer_id}
                        onChange={e => setFormData(p => ({ ...p, trainer_id: e.target.value }))}
                      >
                        <option value="">None / Unassigned</option>
                        {professionals.filter(p => p.role.includes('trainer')).map(t => (
                          <option key={t.id} value={t.id}>🏋️ {t.full_name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* 4. Basic Biometrics & Goals */}
                <div style={{ background: 'var(--color-neutral)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 10, letterSpacing: '0.5px' }}>
                    4. Biometrics &amp; Health Goals
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Gender</span>
                      <select
                        className="form-input"
                        value={formData.gender}
                        onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="form-field">
                      <span className="form-label">Height (cm)</span>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="e.g. 165"
                        value={formData.height_cm}
                        onChange={e => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                      />
                    </label>
                    <label className="form-field">
                      <span className="form-label">Weight (kg)</span>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="e.g. 62.5"
                        value={formData.weight_kg}
                        onChange={e => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                      />
                    </label>
                  </div>

                  <label className="form-field">
                    <span className="form-label">Primary Health Goals</span>
                    <input
                      className="form-input"
                      placeholder="e.g. Weight loss, PCOS management, posture improvement"
                      value={formData.goals}
                      onChange={e => setFormData(p => ({ ...p, goals: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowOnboardModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Onboarding…' : 'Complete Onboarding'}
                  </button>
                </div>
              </form>
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
