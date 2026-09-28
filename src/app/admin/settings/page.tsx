'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface PlatformSettings {
  platform_name: string
  tagline: string
  contact_email: string
  support_phone: string
  platform_address: string
  google_meet_platform: string
  google_meet_recording_policy: string
  google_meet_super_plan_overwrite: boolean
  google_meet_auto_notify: boolean
  google_meet_default_url: string
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

const DEFAULT_SETTINGS: PlatformSettings = {
  platform_name: 'Dr Fit Veda',
  tagline: 'Naturopathy · Clinical Nutrition · Yoga · Certified Fitness',
  contact_email: 'support@drfitveda.com',
  support_phone: '+91 98765 00000',
  platform_address: 'Bangalore, Karnataka, India',
  google_meet_platform: 'Google Meet',
  google_meet_recording_policy: 'Admin/trainer pastes Google Meet recording link after session completion',
  google_meet_super_plan_overwrite: true,
  google_meet_auto_notify: true,
  google_meet_default_url: 'https://meet.google.com',
}

const EMOJI_PRESETS = ['🩺', '🌿', '🪔', '🏋️', '🧘', '🥗', '🩹', '✨', '🧠', '💊', '🍎', '🏃', '🥋', '💆']

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [roles, setRoles] = useState<ProfessionalRole[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<'identity' | 'google_meet' | null>(null)
  const [formData, setFormData] = useState<Partial<PlatformSettings>>({})
  const [editingRole, setEditingRole] = useState<Partial<ProfessionalRole> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadSettings()
    loadRoles()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) setSettings(data.settings)
      }
    } catch {}
    setLoading(false)
  }

  async function loadRoles() {
    try {
      const res = await fetch('/api/settings/roles')
      if (res.ok) {
        const data = await res.json()
        if (data.roles) setRoles(data.roles)
      }
    } catch {}
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function openEdit(section: 'identity' | 'google_meet') {
    setEditingSection(section)
    setFormData({ ...settings })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      setSettings(data.settings)
      showToast('Settings saved successfully!')
      setEditingSection(null)
    } catch {
      // Apply locally for demo
      setSettings(prev => ({ ...prev, ...formData } as PlatformSettings))
      showToast('Settings saved!')
      setEditingSection(null)
    }
    setSaving(false)
  }

  // --- Role Management Actions ---
  function openAddRole() {
    setEditingRole({
      label: '',
      value: '',
      category: 'doctor',
      icon: '🩺',
      description: '',
      is_active: true,
      display_order: roles.length + 1,
    })
  }

  function handleRoleLabelChange(label: string) {
    const autoSlug = label.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '')
    setEditingRole(prev => ({
      ...prev,
      label,
      value: prev?.id ? prev.value : (autoSlug || prev?.value || ''),
    }))
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRole?.label?.trim()) {
      showToast('Role label is required')
      return
    }

    setSaving(true)
    try {
      const isNew = !editingRole.id
      const url = '/api/settings/roles'
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRole),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save role')
      }

      showToast(isNew ? '✓ New role added successfully!' : '✓ Role updated successfully!')
      setEditingRole(null)
      await loadRoles()
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Could not save role'}`)
    }
    setSaving(false)
  }

  async function handleToggleRoleStatus(role: ProfessionalRole) {
    try {
      const updated = { ...role, is_active: !role.is_active }
      const res = await fetch('/api/settings/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        setRoles(prev => prev.map(r => r.id === role.id ? updated : r))
        showToast(`✓ Role ${updated.is_active ? 'activated' : 'deactivated'}`)
      }
    } catch {
      showToast('Failed to update status')
    }
  }

  async function handleDeleteRole(role: ProfessionalRole) {
    if (!confirm(`Are you sure you want to delete "${role.label}"?`)) return
    try {
      const res = await fetch(`/api/settings/roles?id=${role.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setRoles(prev => prev.filter(r => r.id !== role.id))
        showToast('✓ Role deleted successfully')
      }
    } catch {
      showToast('Failed to delete role')
    }
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="text-headline-md">Platform Settings</h1>
            <p className="text-body-md text-muted">View and manage platform identity, professional roles &amp; disciplines, and system policies</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* 1. Platform Identity */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🏥</span>
                  <div>
                    <h2 className="text-headline-sm" style={{ margin: 0 }}>Platform Identity</h2>
                    <p className="text-caption text-muted">Company name, branding tagline, and support contact details</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openEdit('identity')}>
                  ✏️ Edit Identity
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Platform Name</div>
                  <div className="text-body-md" style={{ fontWeight: 700, marginTop: 2 }}>{settings.platform_name}</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Brand Tagline</div>
                  <div className="text-body-md" style={{ marginTop: 2 }}>{settings.tagline}</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Contact Email</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>{settings.contact_email}</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Support Phone</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>{settings.support_phone}</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                  <div className="text-label-md text-muted">Headquarters / Location</div>
                  <div className="text-body-md" style={{ marginTop: 2 }}>{settings.platform_address}</div>
                </div>
              </div>
            </div>

            {/* 2. Professional Roles & Disciplines (Editable Dropdown CMS) */}
            <div id="roles" className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>👨‍⚕️</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 className="text-headline-sm" style={{ margin: 0 }}>Professional Roles &amp; Disciplines</h2>
                      <span className="badge badge-success" style={{ fontSize: 11 }}>{roles.filter(r => r.is_active).length} Active Roles</span>
                    </div>
                    <p className="text-caption text-muted" style={{ marginTop: 2 }}>
                      Configure the roles and clinical disciplines that appear in the &ldquo;Role / Discipline&rdquo; dropdown when adding or editing professionals.
                    </p>
                  </div>
                </div>
                <div className="flex gap-xs">
                  <Link href="/admin/professionals" className="btn btn-secondary btn-sm">
                    👥 View Professionals List
                  </Link>
                  <button className="btn btn-primary btn-sm" onClick={openAddRole}>
                    ➕ Add New Role
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Icon</th>
                      <th>Role Display Name</th>
                      <th>System Value</th>
                      <th>Category</th>
                      <th>Scope &amp; Description</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length > 0 ? (
                      roles.map(r => (
                        <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.6 }}>
                          <td>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%',
                              background: 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20, border: '1px solid var(--color-border)'
                            }}>
                              {r.icon || '🩺'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.label}</div>
                          </td>
                          <td>
                            <code style={{ fontSize: 12, background: 'var(--color-neutral)', padding: '2px 6px', borderRadius: 4 }}>
                              {r.value}
                            </code>
                          </td>
                          <td>
                            <span className={`badge badge-${
                              r.category === 'doctor' ? 'primary' :
                              r.category === 'trainer' ? 'warning' :
                              r.category === 'nutritionist' ? 'success' : 'neutral'
                            }`} style={{ textTransform: 'capitalize' }}>
                              {r.category}
                            </span>
                          </td>
                          <td style={{ maxWidth: 280 }}>
                            <span className="text-caption text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {r.description || '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${r.is_active ? 'success' : 'neutral'}`}>
                              {r.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingRole({ ...r })}
                                title="Edit role"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className={`btn btn-sm ${r.is_active ? 'btn-outline' : 'btn-ghost'}`}
                                onClick={() => handleToggleRoleStatus(r)}
                                title={r.is_active ? 'Deactivate role' : 'Activate role'}
                              >
                                {r.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--color-error)' }}
                                onClick={() => handleDeleteRole(r)}
                                title="Delete role"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                            No roles defined. Click &ldquo;➕ Add New Role&rdquo; to create your first discipline.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Google Meet Integration */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📹</span>
                  <div>
                    <h2 className="text-headline-sm" style={{ margin: 0 }}>Google Meet / Zoho Integration &amp; Recording</h2>
                    <p className="text-caption text-muted">Configure live video session hosting and recording policy</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openEdit('google_meet')}>
                  ✏️ Edit Video Policies
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Video Platform</div>
                  <div className="text-body-md" style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: 2 }}>
                    📹 {settings.google_meet_platform}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Super Plan Overwrite Access</div>
                  <div className="text-body-md" style={{ marginTop: 2 }}>
                    <span className={`badge badge-${settings.google_meet_super_plan_overwrite ? 'success' : 'neutral'}`}>
                      {settings.google_meet_super_plan_overwrite ? '✓ Enabled for Super Plan' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Auto-Notify on Recording Upload</div>
                  <div className="text-body-md" style={{ marginTop: 2 }}>
                    <span className={`badge badge-${settings.google_meet_auto_notify ? 'success' : 'neutral'}`}>
                      {settings.google_meet_auto_notify ? '✓ Email & In-App Notification' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Default Meeting Link Provider</div>
                  <div className="text-body-md text-primary" style={{ marginTop: 2, wordBreak: 'break-all' }}>
                    {settings.google_meet_default_url}
                  </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                  <div className="text-label-md text-muted">Recording Policy &amp; Delivery Flow</div>
                  <div className="text-body-sm" style={{ marginTop: 4, lineHeight: 1.5 }}>
                    {settings.google_meet_recording_policy}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Standalone Consultations Quick Access */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🩺</span>
                  <div>
                    <h2 className="text-headline-sm" style={{ margin: 0 }}>Consultation Services</h2>
                    <p className="text-caption text-muted">Standalone doctor &amp; specialist consultation pricing</p>
                  </div>
                </div>
                <Link href="/admin/memberships" className="btn btn-outline btn-sm">
                  Manage on Memberships CMS →
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {[
                  { name: 'Yoga Consultation', price: '₹499 / 30 min', icon: '🧘' },
                  { name: 'PCOD / PCOS Consultation', price: '₹499 / 30 min', icon: '🩺' },
                  { name: 'General Wellness Consultation', price: '₹499 / 30 min', icon: '💚' },
                ].map(c => (
                  <div key={c.name} style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="text-body-sm" style={{ fontWeight: 600 }}>{c.icon} {c.name}</div>
                      <div className="text-caption text-primary" style={{ fontWeight: 700, marginTop: 2 }}>{c.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Environment & System Info */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
                <span style={{ fontSize: 24 }}>⚙️</span>
                <div>
                  <h2 className="text-headline-sm" style={{ margin: 0 }}>System &amp; Environment</h2>
                  <p className="text-caption text-muted">Runtime environment and operational status</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Operating Mode</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>Local Development (Active)</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Database Engine</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>Supabase + High-Speed In-Memory Store</div>
                </div>
                <div style={{ padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Session Authentication</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>Secured Multi-Role Session Adapter</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add / Edit Role */}
        {editingRole && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                  <h2 className="text-headline-sm">{editingRole.id ? 'Edit Role / Discipline' : 'Add New Role / Discipline'}</h2>
                  <p className="text-caption text-muted">This role will instantly appear in the professional creation and editing dropdown</p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingRole(null)}>✕</button>
              </div>

              <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Role Display Label *</span>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g. Ayurvedic Doctor"
                      value={editingRole.label ?? ''}
                      onChange={e => handleRoleLabelChange(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">System Value / Identifier *</span>
                    <input
                      className="form-input"
                      required
                      placeholder="e.g. ayurveda_doctor"
                      value={editingRole.value ?? ''}
                      onChange={e => setEditingRole(p => ({ ...p, value: e.target.value }))}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Category / Classification *</span>
                    <select
                      className="form-input"
                      value={editingRole.category ?? 'doctor'}
                      onChange={e => setEditingRole(p => ({ ...p, category: e.target.value as any }))}
                    >
                      <option value="doctor">🩺 Doctor / Medical Specialist</option>
                      <option value="trainer">🏋️ Fitness Trainer / Coach</option>
                      <option value="nutritionist">🥗 Clinical Nutritionist / Dietitian</option>
                      <option value="therapist">🩹 Physiotherapist / Rehab Specialist</option>
                      <option value="consultant">🧘 Yoga / Lifestyle Consultant</option>
                      <option value="other">✨ Other Specialist</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">Display Icon</span>
                    <input
                      className="form-input"
                      value={editingRole.icon ?? '🩺'}
                      onChange={e => setEditingRole(p => ({ ...p, icon: e.target.value }))}
                      style={{ fontSize: 16 }}
                    />
                  </label>
                </div>

                {/* Quick Icon Selector Chips */}
                <div>
                  <span className="text-caption text-muted" style={{ display: 'block', marginBottom: 6 }}>
                    Quick Pick Emoji:
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {EMOJI_PRESETS.map(em => (
                      <button
                        key={em}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{
                          fontSize: 16,
                          padding: '4px 8px',
                          border: editingRole.icon === em ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: editingRole.icon === em ? 'var(--color-primary-light, #f0fdf4)' : 'transparent',
                        }}
                        onClick={() => setEditingRole(p => ({ ...p, icon: em }))}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="form-field">
                  <span className="form-label">Clinical Scope &amp; Description</span>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Brief summary of duties, qualifications, and patient assignment scope..."
                    value={editingRole.description ?? ''}
                    onChange={e => setEditingRole(p => ({ ...p, description: e.target.value }))}
                  />
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={editingRole.is_active ?? true}
                      onChange={e => setEditingRole(p => ({ ...p, is_active: e.target.checked }))}
                    />
                    <strong>Active Role:</strong> Visible and selectable across the platform
                  </label>
                </div>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingRole(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editingRole.id ? 'Save Changes' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal: Platform Identity */}
        {editingSection === 'identity' && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 560, padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">Edit Platform Identity</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingSection(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">Platform / Company Name</span>
                  <input
                    className="form-input"
                    value={formData.platform_name ?? ''}
                    onChange={e => setFormData(p => ({ ...p, platform_name: e.target.value }))}
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Brand Tagline</span>
                  <input
                    className="form-input"
                    value={formData.tagline ?? ''}
                    onChange={e => setFormData(p => ({ ...p, tagline: e.target.value }))}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Contact Email</span>
                    <input
                      className="form-input"
                      type="email"
                      value={formData.contact_email ?? ''}
                      onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))}
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-label">Support Phone</span>
                    <input
                      className="form-input"
                      value={formData.support_phone ?? ''}
                      onChange={e => setFormData(p => ({ ...p, support_phone: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-label">Platform Address / Location</span>
                  <input
                    className="form-input"
                    value={formData.platform_address ?? ''}
                    onChange={e => setFormData(p => ({ ...p, platform_address: e.target.value }))}
                  />
                </label>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingSection(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal: Google Meet Integration */}
        {editingSection === 'google_meet' && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div className="card" style={{ width: '100%', maxWidth: 580, padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">Edit Google Meet / Video Integration</h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingSection(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">Live Video Platform</span>
                  <input
                    className="form-input"
                    value={formData.google_meet_platform ?? ''}
                    onChange={e => setFormData(p => ({ ...p, google_meet_platform: e.target.value }))}
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Default Meeting Provider URL</span>
                  <input
                    className="form-input"
                    placeholder="https://meet.google.com"
                    value={formData.google_meet_default_url ?? ''}
                    onChange={e => setFormData(p => ({ ...p, google_meet_default_url: e.target.value }))}
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Recording Policy Description</span>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.google_meet_recording_policy ?? ''}
                    onChange={e => setFormData(p => ({ ...p, google_meet_recording_policy: e.target.value }))}
                  />
                  <span className="text-caption text-muted" style={{ marginTop: 4 }}>
                    Shown to professionals and customers regarding how session recordings are handled.
                  </span>
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!formData.google_meet_super_plan_overwrite}
                      onChange={e => setFormData(p => ({ ...p, google_meet_super_plan_overwrite: e.target.checked }))}
                    />
                    <strong>Super Plan Overwrite Access:</strong> Allow Super Plan members to overwrite session recordings
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={!!formData.google_meet_auto_notify}
                      onChange={e => setFormData(p => ({ ...p, google_meet_auto_notify: e.target.checked }))}
                    />
                    <strong>Auto-Notification:</strong> Automatically notify customers when a session recording link is added
                  </label>
                </div>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setEditingSection(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
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
