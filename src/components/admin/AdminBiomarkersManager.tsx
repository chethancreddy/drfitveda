'use client'

import { useState, useEffect } from 'react'

export interface Biomarker {
  id: string
  name: string
  code: string
  category: string
  unit: string
  normal_range: string
  min?: number
  max?: number
  description?: string
  is_active: boolean
  is_custom?: boolean
}

const CATEGORIES = [
  'Metabolic & Renal',
  'Inflammatory Markers',
  'Thyroid Profile',
  'Vitamins & Micronutrients',
  'Lipid & Cardiac',
  'Metabolic & Glycemic',
  'Liver Function',
  'Hormonal & Endocrine',
  'General Lab Biomarkers',
]

export default function AdminBiomarkersManager() {
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // New Biomarker Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Metabolic & Renal',
    unit: 'mg/dL',
    normal_range: '',
    min: '',
    max: '',
    description: '',
    is_active: true,
  })

  // Selected Category Filter
  const [filterCat, setFilterCat] = useState('all')

  const fetchBiomarkers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/biomarkers')
      const data = await res.json()
      if (data.biomarkers) {
        setBiomarkers(data.biomarkers)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load biomarkers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBiomarkers()
  }, [])

  const handleSaveBiomarker = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/cms/biomarkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          min: form.min ? Number(form.min) : 0,
          max: form.max ? Number(form.max) : 100,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save biomarker')

      setSuccessMsg(`✓ Successfully added "${form.name}" to Doctor Clinical Intake & Biomarkers Suite!`)
      setShowAddModal(false)
      setForm({
        name: '',
        code: '',
        category: 'Metabolic & Renal',
        unit: 'mg/dL',
        normal_range: '',
        min: '',
        max: '',
        description: '',
        is_active: true,
      })
      fetchBiomarkers()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating biomarker')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (bm: Biomarker) => {
    try {
      const res = await fetch('/api/cms/biomarkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bm,
          is_active: !bm.is_active,
        }),
      })
      if (res.ok) {
        setBiomarkers(biomarkers.map(b => b.id === bm.id ? { ...b, is_active: !b.is_active } : b))
      }
    } catch {}
  }

  const filtered = filterCat === 'all'
    ? biomarkers
    : biomarkers.filter(b => b.category === filterCat)

  return (
    <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)', background: 'white', borderRadius: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🧪</span>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>Clinical Biomarkers &amp; Lab Parameters CMS</h2>
          </div>
          <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
            Configure and add clinical lab tests (Uric Acid, CRP/ESR, Thyroid, Vitamins, Lipids, etc.) available in the Doctor Intake &amp; Naturopathy Suite.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', fontWeight: 600 }}
        >
          + Add New Lab Parameter
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setFilterCat('all')}
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: filterCat === 'all' ? 700 : 500,
            background: filterCat === 'all' ? '#0d9488' : '#f1f5f9',
            color: filterCat === 'all' ? 'white' : '#475569',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All ({biomarkers.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = biomarkers.filter(b => b.category === cat).length
          if (count === 0 && cat !== 'Metabolic & Renal') return null
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: filterCat === cat ? 700 : 500,
                background: filterCat === cat ? '#0d9488' : '#f1f5f9',
                color: filterCat === cat ? 'white' : '#475569',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Biomarkers Table */}
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading biomarker directory…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Parameter Name</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Unit</th>
                <th style={{ padding: '10px 12px' }}>Normal Reference Range</th>
                <th style={{ padding: '10px 12px' }}>Description / Clinical Purpose</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(bm => (
                <tr key={bm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                    {bm.name}{' '}
                    {bm.is_custom && <span className="badge badge-neutral" style={{ fontSize: 10 }}>Custom</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11 }}>
                      {bm.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#0d9488', fontWeight: 600 }}>{bm.unit}</td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}><code>{bm.normal_range}</code></td>
                  <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 220 }}>{bm.description || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge badge-${bm.is_active ? 'success' : 'neutral'}`} style={{ fontSize: 10 }}>
                      {bm.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => toggleStatus(bm)}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      {bm.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Parameter Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 'var(--space-lg)', borderRadius: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>➕</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Add New Clinical Biomarker</h3>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveBiomarker} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Parameter Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Homocysteine / Cortisol / Serum Zinc"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Measurement Unit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mg/dL, µmol/L, pg/mL"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Normal Reference Range Text *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5.0 - 15.0 µmol/L"
                  value={form.normal_range}
                  onChange={e => setForm({ ...form, normal_range: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Min Value</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.0"
                    value={form.min}
                    onChange={e => setForm({ ...form, min: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Max Value</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.0"
                    value={form.max}
                    onChange={e => setForm({ ...form, max: e.target.value })}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Description / Clinical Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiovascular & methylation marker"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div className="flex justify-end gap-sm" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Adding…' : 'Save Parameter to CMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
