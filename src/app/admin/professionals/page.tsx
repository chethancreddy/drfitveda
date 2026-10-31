'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

interface Professional {
  id: string
  user_id: string
  full_name: string
  role: string
  qualification: string
  specialization: string
  phone?: string
  email?: string
  is_available: boolean
  is_active: boolean
  is_archived?: boolean
}

export interface ProfessionalRole {
  id: string
  value: string
  label: string
  category: 'doctor' | 'trainer' | 'nutritionist' | 'therapist' | 'consultant' | 'other'
  description?: string
  icon?: string
  is_active: boolean
  display_order: number
}

const EMPTY_PRO: Partial<Professional> = {
  full_name: '',
  role: 'doctor',
  qualification: '',
  specialization: '',
  phone: '',
  email: '',
  is_available: true,
  is_active: true,
}

const DEFAULT_FALLBACK_ROLES: ProfessionalRole[] = [
  { id: '1', value: 'doctor', label: '🩺 Medical Doctor / Consultant', category: 'doctor', icon: '🩺', is_active: true, display_order: 1 },
  { id: '2', value: 'naturopathy_doctor', label: '🌿 BNYS Naturopathy Doctor', category: 'doctor', icon: '🌿', is_active: true, display_order: 2 },
  { id: '3', value: 'ayurveda_doctor', label: '🪔 BAMS Ayurvedic Doctor', category: 'doctor', icon: '🪔', is_active: true, display_order: 3 },
  { id: '4', value: 'trainer', label: '🏋️ Certified Fitness Trainer', category: 'trainer', icon: '🏋️', is_active: true, display_order: 4 },
  { id: '5', value: 'yoga_doctor', label: '🧘 Yoga & Pranayama Doctor', category: 'doctor', icon: '🧘', is_active: true, display_order: 5 },
  { id: '6', value: 'yoga_consultant', label: '🧘 Yoga Consultant', category: 'consultant', icon: '🧘', is_active: true, display_order: 6 },
  { id: '7', value: 'nutritionist', label: '🥗 Clinical Nutritionist & Dietitian', category: 'nutritionist', icon: '🥗', is_active: true, display_order: 7 },
  { id: '8', value: 'physiotherapist', label: '🩹 Clinical Physiotherapist', category: 'therapist', icon: '🩹', is_active: true, display_order: 8 },
  { id: '9', value: 'wellness_coach', label: '✨ Holistic Wellness Coach', category: 'consultant', icon: '✨', is_active: true, display_order: 9 },
]

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [roles, setRoles] = useState<ProfessionalRole[]>(DEFAULT_FALLBACK_ROLES)
  const [loading, setLoading] = useState(true)
  const [editingPro, setEditingPro] = useState<Partial<Professional> | null>(null)
  const [viewingPro, setViewingPro] = useState<any | null>(null)
  const [deletingPro, setDeletingPro] = useState<Professional | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadProfessionals()
    loadRoles()
  }, [])

  async function loadProfessionals() {
    setLoading(true)
    try {
      const res = await fetch('/api/professionals', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setProfessionals(data.professionals || [])
      }
    } catch {
      showToast('Failed to load professionals')
    }
    setLoading(false)
  }

  async function loadRoles() {
    try {
      const res = await fetch('/api/settings/roles', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.roles && data.roles.length > 0) {
          setRoles(data.roles)
        }
      }
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3800)
  }

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p => {
      if (statusFilter === 'active' && (!p.is_active || p.is_archived)) return false
      if (statusFilter === 'inactive' && (p.is_active || p.is_archived)) return false
      if (statusFilter === 'archived' && !p.is_archived) return false
      if (statusFilter === 'all' && p.is_archived) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = `${p.full_name} ${p.role} ${p.qualification || ''} ${p.specialization || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [professionals, statusFilter, searchQuery])

  async function openViewModal(pro: Professional) {
    try {
      const res = await fetch(`/api/professionals/${pro.id}`)
      const data = await res.json()
      setViewingPro(data.professional ? data : { professional: pro })
    } catch {
      setViewingPro({ professional: pro })
    }
  }

  async function saveProfessional(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPro?.full_name?.trim()) {
      showToast('Full name is required')
      return
    }

    setSaving(true)
    try {
      const isNew = !editingPro.id
      const url = isNew ? '/api/professionals' : `/api/professionals/${editingPro.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPro),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save professional')
      }
      showToast(isNew ? 'Professional added successfully!' : 'Professional updated!')
      setEditingPro(null)
      await loadProfessionals()
    } catch (err: any) {
      showToast(err?.message || 'Error saving professional. Please try again.')
    }
    setSaving(false)
  }

  async function toggleStatus(pro: Professional, field: 'is_active' | 'is_available') {
    const updatedVal = !pro[field]
    try {
      const res = await fetch(`/api/professionals/${pro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedVal }),
      })
      if (res.ok) {
        showToast(`${pro.full_name} ${field === 'is_active' ? (updatedVal ? 'activated' : 'deactivated') : 'availability updated'}`)
        await loadProfessionals()
      }
    } catch {
      showToast('Failed to update status')
    }
  }

  async function restoreProfessional(pro: Professional) {
    try {
      const res = await fetch(`/api/professionals/${pro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      })
      if (res.ok) {
        showToast(`✓ Restored "${pro.full_name}" from archive!`)
        await loadProfessionals()
      }
    } catch {
      showToast('Failed to restore professional')
    }
  }

  async function confirmDeleteProfessional(options?: {
    forceArchive?: boolean
    reassignToId?: string
    resolveActive?: boolean
  }) {
    if (!deletingPro) return
    const params = new URLSearchParams()
    if (options?.forceArchive) params.set('mode', 'archive')
    if (options?.reassignToId) params.set('reassign_to_id', options.reassignToId)
    if (options?.resolveActive) params.set('resolve_active', 'true')

    const qs = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`/api/professionals/${deletingPro.id}${qs}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to remove professional')

    showToast(data.message || (data.archived ? 'Professional archived safely' : 'Professional permanently deleted'))
    setDeletingPro(null)
    await loadProfessionals()
  }

  const getRoleInfo = (roleValue: string) => {
    const matched = roles.find(r => r.value === roleValue)
    return {
      icon:
        matched?.icon ||
        (roleValue.includes('trainer')
          ? '🏋️'
          : roleValue.includes('yoga')
            ? '🧘'
            : roleValue.includes('nutri')
              ? '🥗'
              : '🩺'),
      label: matched?.label || roleValue.replace(/_/g, ' '),
    }
  }

  const activeRoles = roles.filter(r => r.is_active && !(r as any).is_archived)
  const activeCount = professionals.filter(p => p.is_active && !p.is_archived).length
  const inactiveCount = professionals.filter(p => !p.is_active && !p.is_archived).length
  const archivedCount = professionals.filter(p => p.is_archived).length

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Professionals &amp; Care Team</h1>
            <p className="text-body-md text-muted">
              Manage doctors, certified trainers, clinical nutritionists, and yoga specialists
            </p>
          </div>
          <div className="flex gap-xs">
            <Link
              href="/admin/settings#roles"
              className="btn btn-secondary btn-sm"
              title="Configure roles & disciplines in Settings"
            >
              ⚙️ Role Settings
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => setEditingPro({ ...EMPTY_PRO })}>
              + Add Professional
            </button>
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
            placeholder="🔍 Search by name, role, qualification, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'all', label: `All (${professionals.filter(p => !p.is_archived).length})` },
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
          <div className="empty-state">Loading professionals...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {filteredProfessionals.length ? (
              filteredProfessionals.map(p => {
                const info = getRoleInfo(p.role)
                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      padding: 'var(--space-md)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-md)',
                      flexWrap: 'wrap',
                      opacity: p.is_active && !p.is_archived ? 1 : 0.65,
                      border:
                        p.is_active && !p.is_archived
                          ? '1px solid var(--color-border)'
                          : '1px dashed var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'var(--color-neutral)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        flexShrink: 0,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {info.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{p.full_name}</span>
                        <span
                          className="badge badge-neutral"
                          style={{ textTransform: 'capitalize', fontSize: 11, fontWeight: 600 }}
                        >
                          {p.role?.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`badge badge-${
                            p.is_archived ? 'neutral' : p.is_active ? 'success' : 'warning'
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {p.is_archived ? 'Archived' : p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {p.qualification && (
                        <div className="text-body-sm text-primary" style={{ fontWeight: 600, marginTop: 2 }}>
                          {p.qualification}
                        </div>
                      )}
                      {p.specialization && (
                        <div className="text-caption text-muted" style={{ marginTop: 1 }}>
                          Specialization: {p.specialization}
                        </div>
                      )}
                      {(p.email || p.phone) && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 12,
                            marginTop: 4,
                            fontSize: 12,
                            color: '#475569',
                          }}
                        >
                          {p.email && (
                            <span>
                              ✉️ <strong>{p.email}</strong>
                            </span>
                          )}
                          {p.phone && (
                            <span>
                              📞 <strong>{p.phone}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {!p.is_archived && (
                        <button
                          className={`btn btn-sm ${p.is_available ? 'badge-success' : 'badge-neutral'}`}
                          style={{ border: '1px solid var(--color-border)', cursor: 'pointer' }}
                          onClick={() => toggleStatus(p, 'is_available')}
                          title="Click to toggle availability"
                        >
                          {p.is_available ? '● Available' : '○ Unavailable'}
                        </button>
                      )}

                      <button className="btn btn-ghost btn-sm" onClick={() => openViewModal(p)}>
                        👁️ View
                      </button>

                      <button className="btn btn-primary btn-sm" onClick={() => setEditingPro({ ...p })}>
                        ✏️ Edit
                      </button>

                      {p.is_archived ? (
                        <button className="btn btn-outline btn-sm" onClick={() => restoreProfessional(p)}>
                          ♻️ Restore
                        </button>
                      ) : (
                        <button
                          className={`btn btn-sm ${p.is_active ? 'btn-outline' : 'btn-ghost'}`}
                          onClick={() => toggleStatus(p, 'is_active')}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#dc2626' }}
                        onClick={() => setDeletingPro(p)}
                        title="Delete or Archive Professional"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👨‍⚕️</div>
                <p className="text-body-md text-muted">No professionals found matching the current filter.</p>
              </div>
            )}
          </div>
        )}

        {/* View Professional Details Modal */}
        {viewingPro && (
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
            onClick={() => setViewingPro(null)}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <h2 className="text-headline-sm">{viewingPro.professional?.full_name}</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setViewingPro(null)}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 12, background: 'var(--color-neutral)', borderRadius: 8 }}>
                  <div className="text-caption text-muted">Role &amp; Qualification</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {viewingPro.professional?.role?.replace(/_/g, ' ')} • {viewingPro.professional?.qualification || 'Certified Specialist'}
                  </div>
                  <div className="text-body-sm text-muted" style={{ marginTop: 4 }}>
                    Specialization: {viewingPro.professional?.specialization || 'Holistic Care'}
                  </div>
                  <div className="text-caption" style={{ marginTop: 6 }}>
                    ✉️ {viewingPro.professional?.email || 'No email'} • 📞 {viewingPro.professional?.phone || 'No phone'}
                  </div>
                </div>

                {viewingPro.dependencyCheck?.linkedRecords && (
                  <div>
                    <div className="text-label-md" style={{ marginBottom: 6 }}>
                      Caseload &amp; Record Summary
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {viewingPro.dependencyCheck.linkedRecords.map((lr: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            background: '#f8fafc',
                            border: '1px solid var(--color-border)',
                            borderRadius: 6,
                            fontSize: 12.5,
                          }}
                        >
                          <div className="text-muted">{lr.label}</div>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>{lr.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end" style={{ gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const p = viewingPro.professional
                      setViewingPro(null)
                      setEditingPro({ ...p })
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setViewingPro(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete / Archive Confirmation Modal */}
        {deletingPro && (
          <AdminRecordDeleteModal
            isOpen={!!deletingPro}
            module="professionals"
            moduleLabel="Professionals & Care Team"
            recordId={deletingPro.id}
            recordName={deletingPro.full_name}
            reassignmentOptions={professionals
              .filter(p => p.id !== deletingPro.id && p.is_active && !p.is_archived)
              .map(p => ({ id: p.id, label: `${p.full_name} (${p.role.replace(/_/g, ' ')})` }))}
            onClose={() => setDeletingPro(null)}
            onConfirm={confirmDeleteProfessional}
          />
        )}

        {/* Edit / Add Modal */}
        {editingPro && (
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
              style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">
                  {editingPro.id ? 'Edit Professional' : 'Add New Professional'}
                </h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingPro(null)}>
                  ✕
                </button>
              </div>

              <form onSubmit={saveProfessional} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Full Name *</span>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g. Dr. Ananya Verma"
                      value={editingPro.full_name ?? ''}
                      onChange={e => setEditingPro(p => ({ ...p, full_name: e.target.value }))}
                    />
                  </label>

                  <label className="form-field">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <span className="form-label">Role / Discipline *</span>
                      <Link
                        href="/admin/settings#roles"
                        className="text-caption text-primary"
                        style={{ fontWeight: 600, fontSize: 11 }}
                        target="_blank"
                      >
                        ⚙️ Edit in Settings ↗
                      </Link>
                    </div>
                    <select
                      className="form-input"
                      value={editingPro.role ?? 'doctor'}
                      onChange={e => setEditingPro(p => ({ ...p, role: e.target.value }))}
                    >
                      {activeRoles.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      {editingPro.role && !activeRoles.some(r => r.value === editingPro.role) && (
                        <option value={editingPro.role}>
                          {editingPro.role.replace(/_/g, ' ')} (Custom)
                        </option>
                      )}
                    </select>
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-label">Qualification / Degree</span>
                  <input
                    className="form-input"
                    placeholder="e.g. BNYS (Naturopathy & Yoga), Gold's Gym Certified Master Trainer"
                    value={editingPro.qualification ?? ''}
                    onChange={e => setEditingPro(p => ({ ...p, qualification: e.target.value }))}
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Clinical / Fitness Specialization</span>
                  <input
                    className="form-input"
                    placeholder="e.g. Hormonal Health, Clinical Nutrition, Functional Movement"
                    value={editingPro.specialization ?? ''}
                    onChange={e => setEditingPro(p => ({ ...p, specialization: e.target.value }))}
                  />
                </label>

                <div className="form-row">
                  <label className="form-field">
                    <span className="form-label">Contact Phone</span>
                    <input
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={editingPro.phone ?? ''}
                      onChange={e => setEditingPro(p => ({ ...p, phone: e.target.value }))}
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Email Address</span>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="doctor@drfitveda.com"
                      value={editingPro.email ?? ''}
                      onChange={e => setEditingPro(p => ({ ...p, email: e.target.value }))}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 20,
                    padding: '12px 14px',
                    background: 'var(--color-neutral)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!editingPro.is_available}
                      onChange={e => setEditingPro(p => ({ ...p, is_available: e.target.checked }))}
                    />
                    <strong>Available for Consultations</strong>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!editingPro.is_active}
                      onChange={e => setEditingPro(p => ({ ...p, is_active: e.target.checked }))}
                    />
                    <strong>Active Member of Staff</strong>
                  </label>
                </div>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingPro(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Professional'}
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
