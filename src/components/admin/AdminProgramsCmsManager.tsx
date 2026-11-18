'use client'

import React, { useState, useEffect } from 'react'

interface NormalProgram {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  short_description: string
  full_description: string
  duration: string
  pricing_starting_at: string
  is_active: boolean
  display_order: number
  ideal_for: string[]
  inclusions: string[]
  specialist_role: string
  image_url: string
}

export default function AdminProgramsCmsManager() {
  const [programs, setPrograms] = useState<NormalProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProgram, setEditingProgram] = useState<Partial<NormalProgram> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/programs')
      const data = await res.json()
      if (data.programs) {
        setPrograms(data.programs)
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to load normal programs.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  const handleOpenEdit = (prog: NormalProgram) => {
    setEditingProgram({ ...prog })
    setIsNew(false)
    setStatusMessage(null)
  }

  const handleOpenNew = () => {
    setEditingProgram({
      id: `prog-${Date.now()}`,
      slug: `program-${Date.now()}`,
      title: '',
      subtitle: '',
      category: 'Lifestyle',
      short_description: '',
      full_description: '',
      duration: '3 Months / 90 Days',
      pricing_starting_at: '₹9,999 / month',
      is_active: true,
      display_order: programs.length + 1,
      ideal_for: ['General Wellness', 'Lifestyle Management'],
      inclusions: ['Personalized Nutrition Plan', 'Doctor Guidance', 'Weekly Check-ins'],
      specialist_role: 'Preventive Medicine Physician & Lifestyle Coach',
      image_url: '',
    })
    setIsNew(true)
    setStatusMessage(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProgram || !editingProgram.title) return

    setSaving(true)
    setStatusMessage(null)

    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/cms/programs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProgram),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save program')
      }

      setStatusMessage({ type: 'success', text: `Program ${isNew ? 'created' : 'updated'} successfully!` })
      setEditingProgram(null)
      fetchPrograms()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving program' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return

    try {
      const res = await fetch(`/api/cms/programs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete program')
      setStatusMessage({ type: 'success', text: 'Program deleted successfully.' })
      fetchPrograms()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting program' })
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🌿</span> Normal Programs CMS (Guided Lifestyle Memberships)
          </h2>
          <p className="text-body-sm text-muted">
            Manage comprehensive, multi-month lifestyle transformation programs shown on the public Homepage and Programs page.
          </p>
        </div>
        <button type="button" onClick={handleOpenNew} className="btn btn-primary btn-sm">
          + Add Normal Program
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: 14,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading normal programs...
        </div>
      ) : programs.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          No normal programs found. Click &quot;Add Normal Program&quot; to create one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {programs.map(prog => (
            <div
              key={prog.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 12,
                padding: 16,
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: prog.is_active ? '#ecfdf5' : '#f3f4f6',
                    color: prog.is_active ? '#065f46' : '#4b5563',
                  }}
                >
                  {prog.is_active ? 'Active' : 'Inactive'} • Order #{prog.display_order}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{prog.duration}</span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-foreground)', margin: 0 }}>
                {prog.title}
              </h3>
              <p style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, margin: 0 }}>{prog.subtitle}</p>

              <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.5, margin: 0 }}>
                {prog.short_description}
              </p>

              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 'auto', paddingTop: 8 }}>
                <strong>Pricing:</strong> {prog.pricing_starting_at}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(prog)}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(prog.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingProgram && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {isNew ? 'Create New Normal Program' : `Edit Program: ${editingProgram.title}`}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Program Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingProgram.title || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingProgram.slug || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, slug: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Subtitle / Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProgram.subtitle || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, subtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProgram.category || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, category: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Short Description</label>
                <textarea
                  rows={2}
                  className="form-input"
                  value={editingProgram.short_description || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, short_description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Full Clinical Description</label>
                <textarea
                  rows={4}
                  className="form-input"
                  value={editingProgram.full_description || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, full_description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProgram.duration || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Pricing Display</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingProgram.pricing_starting_at || ''}
                    onChange={e => setEditingProgram({ ...editingProgram, pricing_starting_at: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Specialist Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingProgram.specialist_role || ''}
                  onChange={e => setEditingProgram({ ...editingProgram, specialist_role: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Ideal For (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={(editingProgram.ideal_for || []).join(', ')}
                  onChange={e =>
                    setEditingProgram({
                      ...editingProgram,
                      ideal_for: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div>
                <label className="form-label">Key Inclusions (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={(editingProgram.inclusions || []).join(', ')}
                  onChange={e =>
                    setEditingProgram({
                      ...editingProgram,
                      inclusions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingProgram.display_order ?? 1}
                    onChange={e => setEditingProgram({ ...editingProgram, display_order: Number(e.target.value) })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input
                    type="checkbox"
                    id="prog_active"
                    checked={editingProgram.is_active ?? true}
                    onChange={e => setEditingProgram({ ...editingProgram, is_active: e.target.checked })}
                  />
                  <label htmlFor="prog_active" style={{ fontSize: 14, fontWeight: 600 }}>
                    Active (Visible on Website)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
