'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

interface Customer {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  membership_status: string
  membership_plan_id: string | null
  membership_expires_at?: string | null
  google_meet_url: string
  zoho_meeting_url?: string
  is_active: boolean
  is_archived?: boolean
  deleted_at?: string | null
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State for New Onboarding
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('new') === '1') {
        setShowOnboardModal(true)
      }
    }
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [cRes, pRes, mRes] = await Promise.all([
        fetch('/api/customers', { cache: 'no-store' }),
        fetch('/api/professionals', { cache: 'no-store' }),
        fetch('/api/memberships?include_inactive=true', { cache: 'no-store' }),
      ])
      const cData = await cRes.json()
      const pData = await pRes.json()
      const mData = await mRes.json()

      setCustomers(cData.customers || [])
      setProfessionals(pData.professionals || [])
      setPlans(mData.memberships || [])

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
    setTimeout(() => setToast(''), 3800)
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (statusFilter === 'active' && (!c.is_active || c.is_archived)) return false
      if (statusFilter === 'inactive' && (c.is_active || c.is_archived)) return false
      if (statusFilter === 'archived' && !c.is_archived) return false
      if (statusFilter === 'all' && c.is_archived) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = `${c.full_name} ${c.email || ''} ${c.phone || ''} ${c.plan?.name || ''} ${c.membership_status || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [customers, statusFilter, searchQuery])

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    setFormData(prev => ({
      ...prev,
      full_name: name,
      google_meet_url:
        prev.google_meet_url &&
        !prev.google_meet_url.includes('fitveda-') &&
        !prev.google_meet_url.includes('meet.zoho.com')
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

  async function handleSaveEditCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCustomer) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editingCustomer.full_name,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
          membership_plan_id: editingCustomer.membership_plan_id,
          membership_status: editingCustomer.membership_status,
          google_meet_url: editingCustomer.google_meet_url,
          zoho_meeting_url: editingCustomer.google_meet_url,
          is_active: editingCustomer.is_active,
          profile: editingCustomer.profile,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update customer')

      showToast(`✓ Updated "${editingCustomer.full_name}" successfully!`)
      setEditingCustomer(null)
      await loadAllData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  async function toggleCustomerActive(customer: Customer) {
    try {
      const nextActive = !customer.is_active
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast(
          nextActive
            ? `✓ Customer "${customer.full_name}" reactivated (eligible membership synced)`
            : `✓ Customer "${customer.full_name}" deactivated & active membership suspended`
        )
        await loadAllData()
      } else {
        showToast(data.error || 'Failed to update status')
      }
    } catch {
      showToast('Failed to update status')
    }
  }

  async function restoreCustomer(customer: Customer) {
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      })
      if (res.ok) {
        showToast(`✓ Customer "${customer.full_name}" restored from archive!`)
        await loadAllData()
      }
    } catch {
      showToast('Failed to restore customer')
    }
  }

  async function confirmDeleteCustomer(options?: { forceArchive?: boolean }) {
    if (!deletingCustomer) return
    const modeQuery = options?.forceArchive ? '?mode=archive' : ''
    const res = await fetch(`/api/customers/${deletingCustomer.id}${modeQuery}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to remove customer')

    showToast(data.message || (data.archived ? 'Customer archived safely' : 'Customer permanently deleted'))
    setDeletingCustomer(null)
    await loadAllData()
  }

  const activeCount = customers.filter(c => c.is_active && !c.is_archived).length
  const inactiveCount = customers.filter(c => !c.is_active && !c.is_archived).length
  const archivedCount = customers.filter(c => c.is_archived).length

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Customers</h1>
            <p className="text-body-md text-muted">
              Manage patient profiles, memberships, dedicated Zoho Meeting rooms, and care teams
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowOnboardModal(true)}>
            + Onboard New Customer
          </button>
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
            placeholder="🔍 Search by customer name, email, phone, or plan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'all', label: `All (${customers.filter(c => !c.is_archived).length})` },
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

        {loading ? (
          <div className="empty-state">Loading customers...</div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Membership Plan &amp; Status</th>
                    <th>Dedicated Zoho Meeting Link</th>
                    <th>Assigned Care Team</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length ? (
                    filteredCustomers.map(c => {
                      const doc = c.assigned_professionals?.find(p => p.role.includes('doctor'))
                      const trn = c.assigned_professionals?.find(p => p.role.includes('trainer'))
                      const meetLink =
                        c.zoho_meeting_url || c.google_meet_url || 'https://meet.zoho.com/fitveda-priya'

                      return (
                        <tr key={c.id} style={{ opacity: c.is_active && !c.is_archived ? 1 : 0.72 }}>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.full_name}</div>
                            <div className="text-caption text-muted">
                              {c.email || c.phone || 'No contact listed'}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>
                                {c.plan?.name || 'No Plan Assigned'}
                              </span>
                              <span
                                className={`badge badge-${
                                  c.membership_status === 'active'
                                    ? 'success'
                                    : c.membership_status === 'expired' || c.membership_status === 'cancelled'
                                      ? 'warning'
                                      : 'neutral'
                                }`}
                                style={{ textTransform: 'capitalize', fontSize: 11 }}
                              >
                                Membership: {c.membership_status || 'inactive'}
                              </span>
                            </div>
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
                                  style={{
                                    fontWeight: 600,
                                    maxWidth: 180,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                  }}
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
                            <span
                              className={`badge badge-${
                                c.is_archived ? 'neutral' : c.is_active ? 'success' : 'warning'
                              }`}
                            >
                              {c.is_archived ? 'Archived' : c.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link href={`/admin/customers/${c.id}`} className="btn btn-ghost btn-sm" title="View full patient profile">
                                👁️ View
                              </Link>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  setEditingCustomer({
                                    ...c,
                                    google_meet_url: c.zoho_meeting_url || c.google_meet_url || '',
                                    profile: { ...(c.profile || {}) },
                                  })
                                }
                                title="Edit customer & membership"
                              >
                                ✏️ Edit
                              </button>
                              {c.is_archived ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => restoreCustomer(c)}
                                >
                                  ♻️ Restore
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={`btn btn-sm ${c.is_active ? 'btn-outline' : 'btn-primary'}`}
                                  onClick={() => toggleCustomerActive(c)}
                                >
                                  {c.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: '#dc2626' }}
                                onClick={() => setDeletingCustomer(c)}
                                title="Delete or Archive Customer"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                          No customers found matching the current filter.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Customer & Membership Modal */}
        {editingCustomer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                  <h2 className="text-headline-sm">Edit Customer &amp; Membership</h2>
                  <p className="text-caption text-muted">
                    Update profile details, Zoho Meeting link, account status, or manually adjust membership status
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingCustomer(null)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 10 }}>
                  <label className="form-field">
                    <span className="form-label">Full Name *</span>
                    <input
                      className="form-input"
                      required
                      value={editingCustomer.full_name}
                      onChange={e => setEditingCustomer(p => (p ? { ...p, full_name: e.target.value } : p))}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Email</span>
                    <input
                      className="form-input"
                      type="email"
                      value={editingCustomer.email || ''}
                      onChange={e => setEditingCustomer(p => (p ? { ...p, email: e.target.value } : p))}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Phone</span>
                    <input
                      className="form-input"
                      value={editingCustomer.phone || ''}
                      onChange={e => setEditingCustomer(p => (p ? { ...p, phone: e.target.value } : p))}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="form-field">
                    <span className="form-label">Membership Plan</span>
                    <select
                      className="form-input"
                      value={editingCustomer.membership_plan_id || ''}
                      onChange={e =>
                        setEditingCustomer(p => (p ? { ...p, membership_plan_id: e.target.value || null } : p))
                      }
                    >
                      <option value="">No Active Plan</option>
                      {plans.map(pl => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} (₹{Number(pl.price || 0).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">Membership Status (Manual Override)</span>
                    <select
                      className="form-input"
                      value={editingCustomer.membership_status || 'inactive'}
                      onChange={e =>
                        setEditingCustomer(p => (p ? { ...p, membership_status: e.target.value } : p))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-label">Dedicated Zoho Meeting URL</span>
                  <input
                    className="form-input"
                    value={editingCustomer.google_meet_url || ''}
                    onChange={e => setEditingCustomer(p => (p ? { ...p, google_meet_url: e.target.value } : p))}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                  <label className="form-field">
                    <span className="form-label">Height (cm)</span>
                    <input
                      className="form-input"
                      type="number"
                      value={editingCustomer.profile?.height_cm ?? ''}
                      onChange={e =>
                        setEditingCustomer(p =>
                          p
                            ? {
                                ...p,
                                profile: { ...(p.profile || {}), height_cm: Number(e.target.value) || undefined },
                              }
                            : p
                        )
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Weight (kg)</span>
                    <input
                      className="form-input"
                      type="number"
                      step="0.1"
                      value={editingCustomer.profile?.weight_kg ?? ''}
                      onChange={e =>
                        setEditingCustomer(p =>
                          p
                            ? {
                                ...p,
                                profile: { ...(p.profile || {}), weight_kg: Number(e.target.value) || undefined },
                              }
                            : p
                        )
                      }
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Health Goals</span>
                    <input
                      className="form-input"
                      value={editingCustomer.profile?.goals ?? ''}
                      onChange={e =>
                        setEditingCustomer(p =>
                          p ? { ...p, profile: { ...(p.profile || {}), goals: e.target.value } } : p
                        )
                      }
                    />
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={!!editingCustomer.is_active}
                    onChange={e => setEditingCustomer(p => (p ? { ...p, is_active: e.target.checked } : p))}
                  />
                  <strong>Customer Account Active</strong> (Deactivating automatically suspends active membership)
                </label>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingCustomer(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete / Archive Safety Confirmation Modal */}
        {deletingCustomer && (
          <AdminRecordDeleteModal
            isOpen={!!deletingCustomer}
            module="customers"
            moduleLabel="Customers & Patient Profiles"
            recordId={deletingCustomer.id}
            recordName={deletingCustomer.full_name}
            onClose={() => setDeletingCustomer(null)}
            onConfirm={confirmDeleteCustomer}
          />
        )}

        {/* Onboarding Modal */}
        {showOnboardModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                  <h2 className="text-headline-sm">Onboard New Customer</h2>
                  <p className="text-caption text-muted">
                    Setup patient profile, dedicated Zoho Meeting room, care team, and plan
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowOnboardModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    background: 'var(--color-neutral)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-primary)',
                      marginBottom: 10,
                      letterSpacing: '0.5px',
                    }}
                  >
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

                <div
                  style={{
                    background: '#f0fdf4',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#166534',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>🟢 2. Dedicated Zoho Meeting Room Link</span>
                      <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>
                        Zoho Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={autoGenerateZohoLink}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        height: 'auto',
                        background: '#ffffff',
                        borderColor: '#86efac',
                        color: '#166534',
                        fontWeight: 600,
                      }}
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
                  </label>
                </div>

                <div
                  style={{
                    background: 'var(--color-neutral)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--color-primary)',
                      marginBottom: 10,
                      letterSpacing: '0.5px',
                    }}
                  >
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
                            {pl.name} (₹{Number(pl.price || 0).toLocaleString('en-IN')})
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
                        {professionals
                          .filter(p => p.role.includes('doctor') && p.is_active)
                          .map(d => (
                            <option key={d.id} value={d.id}>
                              🩺 {d.full_name}
                            </option>
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
                        {professionals
                          .filter(p => p.role.includes('trainer') && p.is_active)
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              🏋️ {t.full_name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
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
            {toast}
          </div>
        )}
      </main>
    </div>
  )
}
