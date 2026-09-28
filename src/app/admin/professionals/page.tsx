'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

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
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadProfessionals()
    loadRoles()
  }, [])

  async function loadProfessionals() {
    setLoading(true)
    try {
      const res = await fetch('/api/professionals')
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
      const res = await fetch('/api/settings/roles')
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
    setTimeout(() => setToast(''), 3500)
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

      if (!res.ok) throw new Error('Save failed')
      showToast(isNew ? 'Professional added successfully!' : 'Professional updated!')
      setEditingPro(null)
      await loadProfessionals()
    } catch {
      // Demo fallback
      if (editingPro.id) {
        setProfessionals(prev => prev.map(p => p.id === editingPro.id ? { ...p, ...editingPro } as Professional : p))
      }
      showToast('Changes saved locally')
      setEditingPro(null)
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
        setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, [field]: updatedVal } : p))
        showToast(`${pro.full_name} updated`)
      }
    } catch {
      setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, [field]: updatedVal } : p))
      showToast('Updated locally')
    }
  }

  const getRoleInfo = (roleValue: string) => {
    const matched = roles.find(r => r.value === roleValue)
    return {
      icon: matched?.icon || (roleValue.includes('trainer') ? '🏋️' : roleValue.includes('yoga') ? '🧘' : roleValue.includes('nutri') ? '🥗' : '🩺'),
      label: matched?.label || roleValue.replace(/_/g, ' '),
    }
  }

  const activeRoles = roles.filter(r => r.is_active)

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Professionals &amp; Care Team</h1>
            <p className="text-body-md text-muted">Manage doctors, certified trainers, clinical nutritionists, and yoga specialists</p>
          </div>
          <div className="flex gap-xs">
            <Link href="/admin/settings#roles" className="btn btn-secondary btn-sm" title="Configure roles & disciplines in Settings">
              ⚙️ Role Settings
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => setEditingPro({ ...EMPTY_PRO })}>
              + Add Professional
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading professionals...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {professionals.length ? professionals.map(p => {
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
                    opacity: p.is_active ? 1 : 0.6,
                    border: p.is_active ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                  }}
                >
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'var(--color-neutral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, flexShrink: 0,
                    border: '1px solid var(--color-border)',
                  }}>
                    {info.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{p.full_name}</span>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: 11, fontWeight: 600 }}>
                        {p.role?.replace(/_/g, ' ')}
                      </span>
                      {!p.is_active && <span className="badge badge-neutral" style={{ fontSize: 11 }}>Inactive</span>}
                    </div>
                    {p.qualification && <div className="text-body-sm text-primary" style={{ fontWeight: 600, marginTop: 2 }}>{p.qualification}</div>}
                    {p.specialization && <div className="text-caption text-muted" style={{ marginTop: 1 }}>Specialization: {p.specialization}</div>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className={`btn btn-sm ${p.is_available ? 'badge-success' : 'badge-neutral'}`}
                      style={{ border: '1px solid var(--color-border)', cursor: 'pointer' }}
                      onClick={() => toggleStatus(p, 'is_available')}
                      title="Click to toggle availability"
                    >
                      {p.is_available ? '● Available' : '○ Unavailable'}
                    </button>

                    <button className="btn btn-primary btn-sm" onClick={() => setEditingPro({ ...p })}>
                      Edit
                    </button>

                    <button
                      className={`btn btn-sm ${p.is_active ? 'btn-outline' : 'btn-ghost'}`}
                      onClick={() => toggleStatus(p, 'is_active')}
                    >
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            }) : (
              <div className="empty-state">
                <div className="empty-state-icon">👨‍⚕️</div>
                <p className="text-body-md text-muted">No professionals found. Click &quot;+ Add Professional&quot; to add your medical and fitness team.</p>
              </div>
            )}
          </div>
        )}

        {/* Edit / Add Modal */}
        {editingPro && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">{editingPro.id ? 'Edit Professional' : 'Add New Professional'}</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingPro(null)}>✕</button>
              </div>

              <form onSubmit={saveProfessional} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span className="form-label">Role / Discipline *</span>
                      <Link
                        href="/admin/settings#roles"
                        className="text-caption text-primary"
                        style={{ fontWeight: 600, fontSize: 11 }}
                        target="_blank"
                        title="Add, edit or rename roles in Settings"
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
                      {/* Preserve custom or legacy role if not in active list */}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

                <div style={{ display: 'flex', gap: 20, padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
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
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingPro(null)}>Cancel</button>
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
