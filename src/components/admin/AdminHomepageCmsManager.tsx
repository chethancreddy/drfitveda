'use client'

import { useState, useEffect } from 'react'
import { HomepageSettings } from '@/lib/mock-db'

export default function AdminHomepageCmsManager() {
  const [settings, setSettings] = useState<HomepageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/cms/homepage', { cache: 'no-store' })
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch {
      showToast('Failed to load homepage CMS settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/cms/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      showToast('Homepage CMS settings saved successfully! Changes are live.')
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p className="text-body-md text-muted">Loading Homepage CMS settings…</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="text-headline-sm" style={{ margin: 0 }}>Homepage Layout &amp; Content CMS</h2>
          <p className="text-body-sm text-muted" style={{ margin: 0 }}>
            Manage the hero banner, copy, images, section visibility, and calls-to-action on the public homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          {saving ? 'Saving…' : '💾 Save Homepage Settings'}
        </button>
      </div>

      {toast && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: toast.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Section Visibility Toggles */}
        <div style={{ background: 'var(--color-neutral)', padding: 18, borderRadius: 14 }}>
          <h3 className="text-label-lg" style={{ marginBottom: 12, color: 'var(--color-primary)' }}>
            👁️ Homepage Section Visibility Toggles
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { key: 'show_topbar', label: 'Top Clinical Bar' },
              { key: 'show_hero', label: 'Hero Section' },
              { key: 'show_trust_strip', label: 'Trust Strip' },
              { key: 'show_about', label: 'About Doctor-Guided Care' },
              { key: 'show_care', label: 'Comprehensive Lifestyle Care' },
              { key: 'show_programs', label: 'Two-Type Programs Section' },
              { key: 'show_journey', label: 'How It Works / Journey' },
              { key: 'show_experts', label: 'Care Team / Doctors' },
              { key: 'show_memberships', label: 'Memberships & Pricing' },
              { key: 'show_testimonials', label: 'Patient Testimonials' },
              { key: 'show_faq', label: 'FAQs Accordion' },
              { key: 'show_cta', label: 'Bottom Booking Banner' },
            ].map(sec => (
              <label key={sec.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)[sec.key])}
                  onChange={e => setSettings({ ...settings, [sec.key]: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                />
                <span>{sec.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Topbar Settings */}
        <div>
          <h3 className="text-headline-sm" style={{ fontSize: 17, marginBottom: 12 }}>
            📢 Topbar Announcement
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label className="form-field">
              <span className="form-label">Primary Message</span>
              <input
                className="form-input"
                value={settings.topbar_text}
                onChange={e => setSettings({ ...settings, topbar_text: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Right Sub-Message</span>
              <input
                className="form-input"
                value={settings.topbar_sub}
                onChange={e => setSettings({ ...settings, topbar_sub: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Hero Section */}
        <div>
          <h3 className="text-headline-sm" style={{ fontSize: 17, marginBottom: 12 }}>
            🌟 Hero Section &amp; Headlines
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>
            <label className="form-field">
              <span className="form-label">Eyebrow Badge</span>
              <input
                className="form-input"
                value={settings.hero_eyebrow}
                onChange={e => setSettings({ ...settings, hero_eyebrow: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Heading Line 1</span>
              <input
                className="form-input"
                value={settings.hero_title_line1}
                onChange={e => setSettings({ ...settings, hero_title_line1: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Heading Highlight (Italic green)</span>
              <input
                className="form-input"
                value={settings.hero_title_highlight}
                onChange={e => setSettings({ ...settings, hero_title_highlight: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Heading Line 2</span>
              <input
                className="form-input"
                value={settings.hero_title_line2}
                onChange={e => setSettings({ ...settings, hero_title_line2: e.target.value })}
              />
            </label>
          </div>

          <label className="form-field" style={{ marginBottom: 14 }}>
            <span className="form-label">Hero Lead Description</span>
            <textarea
              className="form-input"
              rows={3}
              value={settings.hero_lead}
              onChange={e => setSettings({ ...settings, hero_lead: e.target.value })}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <label className="form-field">
              <span className="form-label">Primary Button Label</span>
              <input
                className="form-input"
                value={settings.hero_cta_primary_label}
                onChange={e => setSettings({ ...settings, hero_cta_primary_label: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Primary Button Link / Anchor</span>
              <input
                className="form-input"
                value={settings.hero_cta_primary_href}
                onChange={e => setSettings({ ...settings, hero_cta_primary_href: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <label className="form-field">
              <span className="form-label">Secondary Button Label</span>
              <input
                className="form-input"
                value={settings.hero_cta_secondary_label}
                onChange={e => setSettings({ ...settings, hero_cta_secondary_label: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Secondary Button Link</span>
              <input
                className="form-input"
                value={settings.hero_cta_secondary_href}
                onChange={e => setSettings({ ...settings, hero_cta_secondary_href: e.target.value })}
              />
            </label>
          </div>

          <label className="form-field">
            <span className="form-label">Hero Image URL</span>
            <input
              className="form-input"
              value={settings.hero_image_url}
              onChange={e => setSettings({ ...settings, hero_image_url: e.target.value })}
            />
          </label>
        </div>

        {/* Hero Trust Statistics */}
        <div>
          <h3 className="text-headline-sm" style={{ fontSize: 17, marginBottom: 12 }}>
            📊 Hero Statistics Strip
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: 'var(--color-neutral, #F6F1E8)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border, #D9CDBF)' }}>
              <label className="form-field">
                <span className="form-label">Stat 1 Value</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_1_val}
                  onChange={e => setSettings({ ...settings, hero_stat_1_val: e.target.value })}
                />
              </label>
              <label className="form-field" style={{ marginTop: 8 }}>
                <span className="form-label">Stat 1 Label</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_1_lbl}
                  onChange={e => setSettings({ ...settings, hero_stat_1_lbl: e.target.value })}
                />
              </label>
            </div>

            <div style={{ background: 'var(--color-neutral, #F6F1E8)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border, #D9CDBF)' }}>
              <label className="form-field">
                <span className="form-label">Stat 2 Value</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_2_val}
                  onChange={e => setSettings({ ...settings, hero_stat_2_val: e.target.value })}
                />
              </label>
              <label className="form-field" style={{ marginTop: 8 }}>
                <span className="form-label">Stat 2 Label</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_2_lbl}
                  onChange={e => setSettings({ ...settings, hero_stat_2_lbl: e.target.value })}
                />
              </label>
            </div>

            <div style={{ background: 'var(--color-neutral, #F6F1E8)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border, #D9CDBF)' }}>
              <label className="form-field">
                <span className="form-label">Stat 3 Value</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_3_val}
                  onChange={e => setSettings({ ...settings, hero_stat_3_val: e.target.value })}
                />
              </label>
              <label className="form-field" style={{ marginTop: 8 }}>
                <span className="form-label">Stat 3 Label</span>
                <input
                  className="form-input"
                  value={settings.hero_stat_3_lbl}
                  onChange={e => setSettings({ ...settings, hero_stat_3_lbl: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section Headings */}
        <div>
          <h3 className="text-headline-sm" style={{ fontSize: 17, marginBottom: 12 }}>
            📝 Section Headings &amp; Intro Copies
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--color-neutral, #F6F1E8)', padding: 14, borderRadius: 12, border: '1px solid var(--color-border, #D9CDBF)' }}>
              <strong style={{ fontSize: 13, color: '#1F1A17', display: 'block', marginBottom: 8 }}>Comprehensive Lifestyle Care</strong>
              <label className="form-field" style={{ marginBottom: 8 }}>
                <span className="form-label">Heading</span>
                <input
                  className="form-input"
                  value={settings.care_title}
                  onChange={e => setSettings({ ...settings, care_title: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Intro Subtitle</span>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.care_lead}
                  onChange={e => setSettings({ ...settings, care_lead: e.target.value })}
                />
              </label>
            </div>

            <div style={{ background: 'var(--color-neutral, #F6F1E8)', padding: 14, borderRadius: 12, border: '1px solid var(--color-border, #D9CDBF)' }}>
              <strong style={{ fontSize: 13, color: '#1F1A17', display: 'block', marginBottom: 8 }}>Our Programs (Two-Type Section)</strong>
              <label className="form-field" style={{ marginBottom: 8 }}>
                <span className="form-label">Heading</span>
                <input
                  className="form-input"
                  value={settings.programs_title}
                  onChange={e => setSettings({ ...settings, programs_title: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Intro Subtitle</span>
                <textarea
                  className="form-input"
                  rows={2}
                  value={settings.programs_lead}
                  onChange={e => setSettings({ ...settings, programs_lead: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bottom CTA Box */}
        <div>
          <h3 className="text-headline-sm" style={{ fontSize: 17, marginBottom: 12 }}>
            🎯 Bottom Booking / CTA Banner
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <label className="form-field">
              <span className="form-label">Banner Title</span>
              <input
                className="form-input"
                value={settings.cta_box_title}
                onChange={e => setSettings({ ...settings, cta_box_title: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Banner Subtitle</span>
              <input
                className="form-input"
                value={settings.cta_box_lead}
                onChange={e => setSettings({ ...settings, cta_box_lead: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Button Label</span>
              <input
                className="form-input"
                value={settings.cta_box_btn_label}
                onChange={e => setSettings({ ...settings, cta_box_btn_label: e.target.value })}
              />
            </label>
            <label className="form-field">
              <span className="form-label">Button Destination</span>
              <input
                className="form-input"
                value={settings.cta_box_btn_href}
                onChange={e => setSettings({ ...settings, cta_box_btn_href: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-border, #D9CDBF)' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-lg"
          >
            {saving ? 'Saving…' : '💾 Save & Publish Homepage Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
