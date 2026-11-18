'use client'

import React, { useState, useEffect } from 'react'
import { VitalityRoadmapStep } from '@/lib/mock-db'

export default function AdminRoadmapCmsManager() {
  const [steps, setSteps] = useState<VitalityRoadmapStep[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStep, setEditingStep] = useState<Partial<VitalityRoadmapStep> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSteps = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/roadmap')
      const data = await res.json()
      if (data.roadmap_steps) {
        setSteps(data.roadmap_steps)
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to load vitality roadmap steps.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSteps()
  }, [])

  const handleOpenEdit = (step: VitalityRoadmapStep) => {
    setEditingStep({ ...step })
    setIsNew(false)
    setStatusMessage(null)
  }

  const handleOpenNew = () => {
    const nextNum = String(steps.length + 1).padStart(2, '0')
    setEditingStep({
      id: `vstep-${Date.now()}`,
      step: nextNum,
      timing: `Phase ${nextNum}`,
      icon: '✨',
      title: '',
      accentColor: '#5C8CB5',
      description: '',
      deliverable: '',
      highlightTitle: 'Key Focus Areas',
      highlights: ['Diagnostic assessment', 'Clinical milestone tracking'],
      display_order: steps.length + 1,
      is_active: true,
    })
    setIsNew(true)
    setStatusMessage(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStep || !editingStep.title) return

    setSaving(true)
    setStatusMessage(null)

    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/cms/roadmap', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStep),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save roadmap step')
      }

      setStatusMessage({ type: 'success', text: `Step ${editingStep.step} saved successfully!` })
      setEditingStep(null)
      fetchSteps()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving step' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return

    try {
      const res = await fetch(`/api/cms/roadmap?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete step')
      setStatusMessage({ type: 'success', text: 'Step deleted successfully.' })
      fetchSteps()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting step' })
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🌿</span> 7-Step Roadmap to Vitality CMS
          </h2>
          <p className="text-body-sm text-muted">
            Manage the sequential steps (01 to 07) displayed on the public Homepage and Programs page under &quot;Your 7-Step Roadmap to Vitality&quot;.
          </p>
        </div>
        <button type="button" onClick={handleOpenNew} className="btn btn-primary btn-sm">
          + Add Roadmap Step
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
          Loading roadmap steps...
        </div>
      ) : steps.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          No roadmap steps found. Click &quot;Add Roadmap Step&quot; to initialize.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map(step => (
            <div
              key={step.id}
              style={{
                border: '1px solid var(--color-border)',
                borderLeft: `5px solid ${step.accentColor || '#5C8CB5'}`,
                borderRadius: 12,
                padding: '16px 20px',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
                <span
                  style={{
                    background: '#453421',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  STEP {step.step}
                </span>
                <span style={{ fontSize: 24 }}>{step.icon}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-foreground)' }}>
                    {step.title}
                  </h3>
                  <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>
                    ⏱️ {step.timing} • Order #{step.display_order} •{' '}
                    <span style={{ color: step.is_active ? '#15803d' : '#94a3b8' }}>
                      {step.is_active ? 'Active (Published)' : 'Draft (Hidden)'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(step)}
                  className="btn btn-outline btn-sm"
                >
                  Edit Step
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(step.id)}
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
      {editingStep && (
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
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {isNew ? 'Create New Roadmap Step' : `Edit Step ${editingStep.step}: ${editingStep.title}`}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Step Number (e.g. 01)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingStep.step || ''}
                    onChange={e => setEditingStep({ ...editingStep, step: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Step Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingStep.title || ''}
                    onChange={e => setEditingStep({ ...editingStep, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Icon / Emoji</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStep.icon || '✨'}
                    onChange={e => setEditingStep({ ...editingStep, icon: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Timing Badge (e.g. Day 1, Days 2–3)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStep.timing || ''}
                    onChange={e => setEditingStep({ ...editingStep, timing: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Accent Color</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingStep.accentColor || '#5C8CB5'}
                    onChange={e => setEditingStep({ ...editingStep, accentColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={editingStep.description || ''}
                  onChange={e => setEditingStep({ ...editingStep, description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Key Deliverable</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingStep.deliverable || ''}
                  onChange={e => setEditingStep({ ...editingStep, deliverable: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Highlights (comma-separated bullet points)</label>
                <textarea
                  rows={2}
                  className="form-input"
                  value={(editingStep.highlights || []).join(', ')}
                  onChange={e =>
                    setEditingStep({
                      ...editingStep,
                      highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
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
                    value={editingStep.display_order ?? 1}
                    onChange={e => setEditingStep({ ...editingStep, display_order: Number(e.target.value) })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <input
                    type="checkbox"
                    id="step_active"
                    checked={editingStep.is_active ?? true}
                    onChange={e => setEditingStep({ ...editingStep, is_active: e.target.checked })}
                  />
                  <label htmlFor="step_active" style={{ fontSize: 14, fontWeight: 600 }}>
                    Active (Published on Roadmap)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingStep(null)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Step'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
