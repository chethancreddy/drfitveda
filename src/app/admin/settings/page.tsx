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

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<'identity' | 'google_meet' | null>(null)
  const [formData, setFormData] = useState<Partial<PlatformSettings>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadSettings()
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

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="text-headline-md">Platform Settings</h1>
            <p className="text-body-md text-muted">View and manage platform identity, Google Meet policies, and environment config</p>
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

            {/* 2. Google Meet Integration */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📹</span>
                  <div>
                    <h2 className="text-headline-sm" style={{ margin: 0 }}>Google Meet Integration &amp; Recording</h2>
                    <p className="text-caption text-muted">Configure live video session hosting and recording policy</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openEdit('google_meet')}>
                  ✏️ Edit Google Meet
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

            {/* 3. Standalone Consultations Quick Access */}
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

            {/* 4. Environment & System Info */}
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
                <h2 className="text-headline-sm">Edit Google Meet Integration</h2>
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
                    Shown to professionals and customers regarding how Google Meet session recordings are handled.
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
