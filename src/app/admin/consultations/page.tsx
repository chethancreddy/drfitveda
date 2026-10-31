'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

export interface ConsultationCategory {
  id: string
  key: string
  label: string
  icon: string
  display_order: number
  is_active: boolean
}

export interface ConsultationService {
  id: string
  key: string
  name: string
  category: string
  category_label?: string
  short_description: string
  full_description: string
  description: string
  specialist_designation: string
  icon: string
  image_url: string | null
  duration_min: number
  consultation_type: string
  price: number
  currency: string
  is_active: boolean
  is_archived?: boolean
  display_order: number
}

const DEFAULT_CATEGORIES: ConsultationCategory[] = [
  { id: 'ccat-001', key: 'doctor_consultation', label: 'Doctor Consultation', icon: '👨‍⚕️', display_order: 1, is_active: true },
  { id: 'ccat-002', key: 'nutrition_consultation', label: 'Nutrition Consultation', icon: '🥗', display_order: 2, is_active: true },
  { id: 'ccat-003', key: 'yoga', label: 'Yoga Consultation', icon: '🧘', display_order: 3, is_active: true },
  { id: 'ccat-004', key: 'womens_health', label: "Women's Health Consultation", icon: '🌸', display_order: 4, is_active: true },
  { id: 'ccat-005', key: 'pcod', label: 'PCOD / PCOS Consultation', icon: '🩺', display_order: 5, is_active: true },
  { id: 'ccat-006', key: 'lifestyle_consultation', label: 'Lifestyle Consultation', icon: '🌿', display_order: 6, is_active: true },
  { id: 'ccat-007', key: 'wellness', label: 'General Wellness Consultation', icon: '💚', display_order: 7, is_active: true },
  { id: 'ccat-008', key: 'other_services', label: 'Other Services', icon: '🏥', display_order: 8, is_active: true },
]

const CONSULTATION_MODES = [
  'Online Video (Zoho Meeting)',
  'Video / Audio Teleconsultation',
  'Follow-Up Clinical Review',
  'In-Depth Diagnostic Consultation',
]

const ICON_PRESETS = ['🩺', '👨‍⚕️', '🧘', '🥗', '💚', '🌸', '🌿', '🏥', '🫀', '🧬', '🏃', '🧠']

const EMPTY_SERVICE: Partial<ConsultationService> = {
  name: '',
  category: 'doctor_consultation',
  short_description: '',
  full_description: '',
  description: '',
  specialist_designation: 'Preventive Medicine & Lifestyle Physician',
  icon: '🩺',
  image_url: '',
  duration_min: 30,
  consultation_type: 'Online Video (Zoho Meeting)',
  price: 499,
  currency: 'INR',
  is_active: true,
  is_archived: false,
  display_order: 10,
}

function formatPrice(price: number, currency = 'INR') {
  const num = Number(price || 0)
  if (currency === 'USD') return '$' + num.toLocaleString('en-US')
  if (currency === 'AED') return 'AED ' + num.toLocaleString('en-AE')
  return '₹' + num.toLocaleString('en-IN')
}

export default function AdminConsultationServicesPage() {
  const [services, setServices] = useState<ConsultationService[]>([])
  const [categories, setCategories] = useState<ConsultationCategory[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')

  // Modals
  const [editingService, setEditingService] = useState<Partial<ConsultationService> | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [previewService, setPreviewService] = useState<ConsultationService | null>(null)
  const [confirmDeleteService, setConfirmDeleteService] = useState<ConsultationService | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('🩺')

  useEffect(() => {
    loadData()
  }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/consultation-services?include_inactive=true&include_archived=true', {
        cache: 'no-store',
      })
      const data = await res.json()
      if (Array.isArray(data.consultation_services)) {
        setServices(data.consultation_services)
      }
      if (Array.isArray(data.consultation_categories) && data.consultation_categories.length > 0) {
        setCategories(data.consultation_categories)
      }
    } catch {
      showToast('Failed to load consultation services', 'error')
    } finally {
      setLoading(false)
    }
  }

  const categoryMap = useMemo(() => {
    const map: Record<string, ConsultationCategory> = {}
    for (const c of categories) {
      map[c.key] = c
    }
    return map
  }, [categories])

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (statusFilter === 'active' && (!s.is_active || s.is_archived)) return false
      if (statusFilter === 'inactive' && (s.is_active || s.is_archived)) return false
      if (statusFilter === 'archived' && !s.is_archived) return false
      if (statusFilter === 'all' && s.is_archived) return false

      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const hay = `${s.name} ${s.category} ${s.category_label || ''} ${s.specialist_designation || ''} ${s.short_description || ''} ${s.description || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [services, statusFilter, categoryFilter, searchQuery])

  function openNewServiceModal() {
    const nextOrder = services.length > 0 ? Math.max(...services.map(s => Number(s.display_order) || 0)) + 1 : 1
    setFormError(null)
    setEditingService({
      ...EMPTY_SERVICE,
      display_order: nextOrder,
    })
  }

  function openEditServiceModal(svc: ConsultationService) {
    setFormError(null)
    setEditingService({
      ...svc,
      short_description: svc.short_description || svc.description || '',
      full_description: svc.full_description || svc.description || '',
      specialist_designation: svc.specialist_designation || 'Preventive Medicine & Lifestyle Physician',
      consultation_type: svc.consultation_type || 'Online Video (Zoho Meeting)',
      currency: svc.currency || 'INR',
      icon: svc.icon || categoryMap[svc.category]?.icon || '🩺',
    })
  }

  async function handleSaveService() {
    if (!editingService) return
    setFormError(null)

    const name = String(editingService.name ?? '').trim()
    if (name.length < 2) {
      setFormError('Consultation service name is required (at least 2 characters).')
      return
    }
    const category = String(editingService.category ?? '').trim()
    if (!category) {
      setFormError('Please select a consultation service category.')
      return
    }
    const price = Number(editingService.price)
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Consultation price must be a valid non-negative number.')
      return
    }
    const durationMin = Number(editingService.duration_min)
    if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480) {
      setFormError('Consultation duration must be between 5 and 480 minutes.')
      return
    }

    setSaving(true)
    try {
      const isNew = !editingService.id
      const url = isNew ? '/api/consultation-services' : `/api/consultation-services/${editingService.id}`
      const method = isNew ? 'POST' : 'PUT'

      const payload = {
        ...editingService,
        name,
        category,
        price,
        duration_min: durationMin,
        description:
          editingService.full_description?.trim() ||
          editingService.short_description?.trim() ||
          editingService.description?.trim() ||
          '',
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save consultation service')
      }

      showToast(isNew ? 'Consultation service created!' : 'Consultation service updated!')
      setEditingService(null)
      await loadData()
    } catch (err: any) {
      setFormError(err?.message || 'Error saving consultation service')
      showToast(err?.message || 'Error saving consultation service', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(svc: ConsultationService) {
    try {
      const nextActive = !svc.is_active
      const res = await fetch(`/api/consultation-services/${svc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...svc,
          is_active: nextActive,
          is_archived: false,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      showToast(nextActive ? `"${svc.name}" activated and visible to customers` : `"${svc.name}" deactivated`)
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle service status', 'error')
    }
  }

  async function handleMoveOrder(svc: ConsultationService, direction: 'up' | 'down') {
    const visible = [...filteredServices].sort((a, b) => a.display_order - b.display_order)
    const idx = visible.findIndex(item => item.id === svc.id)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= visible.length) return

    const other = visible[swapIdx]
    const orderA = svc.display_order
    const orderB = other.display_order === orderA ? (direction === 'up' ? orderA - 1 : orderA + 1) : other.display_order

    try {
      await Promise.all([
        fetch(`/api/consultation-services/${svc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: orderB }),
        }),
        fetch(`/api/consultation-services/${other.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: orderA }),
        }),
      ])
      showToast('Display order updated')
      await loadData()
    } catch {
      showToast('Failed to reorder services', 'error')
    }
  }

  async function handleDeleteOrArchive() {
    if (!confirmDeleteService) return
    setSaving(true)
    try {
      const res = await fetch(`/api/consultation-services/${confirmDeleteService.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete/archive consultation service')

      showToast(data.message || (data.archived ? 'Service archived safely' : 'Service deleted'))
      setConfirmDeleteService(null)
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete service', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/consultation-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_category',
          label: newCategoryLabel.trim(),
          icon: newCategoryIcon || '🩺',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to add category')

      if (Array.isArray(data.consultation_categories)) {
        setCategories(data.consultation_categories)
      }
      if (editingService && data.category?.key) {
        setEditingService(prev => (prev ? { ...prev, category: data.category.key } : prev))
      }
      setNewCategoryLabel('')
      setShowCategoryModal(false)
      showToast(`Category "${data.category?.label || newCategoryLabel}" added!`)
    } catch (err: any) {
      showToast(err?.message || 'Failed to create category', 'error')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = services.filter(s => s.is_active && !s.is_archived).length
  const inactiveCount = services.filter(s => !s.is_active && !s.is_archived).length
  const minPrice = services.length > 0 ? Math.min(...services.filter(s => !s.is_archived).map(s => Number(s.price) || 0)) : 499

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        {/* Breadcrumb & Page Header */}
        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/admin" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>Admin Portal</Link>
          <span>→</span>
          <Link href="/admin/cms" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>CMS</Link>
          <span>→</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Consultation Services</span>
        </div>

        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Consultation Services CMS</h1>
            <p className="text-body-md text-muted">
              Create, configure, and manage standalone doctor &amp; specialist consultations independently from membership plans
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/admin/memberships" className="btn btn-ghost btn-sm">
              💳 Membership Plans CMS
            </Link>
            <button className="btn btn-outline btn-sm" onClick={() => setShowCategoryModal(true)}>
              + Add Category
            </button>
            <button className="btn btn-primary btn-sm" onClick={openNewServiceModal}>
              + Add Consultation Service
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div className="card" style={{ padding: '14px 18px' }}>
            <div className="text-caption text-muted">Total Services</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-on-surface)', marginTop: 2 }}>
              {services.filter(s => !s.is_archived).length}
            </div>
            <div className="text-caption text-muted" style={{ marginTop: 2 }}>Standalone clinical offerings</div>
          </div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div className="text-caption text-muted">Active Public Services</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)', marginTop: 2 }}>
              {activeCount}
            </div>
            <div className="text-caption text-muted" style={{ marginTop: 2 }}>Bookable on website &amp; portal</div>
          </div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div className="text-caption text-muted">Service Categories</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginTop: 2 }}>
              {categories.length}
            </div>
            <div className="text-caption text-muted" style={{ marginTop: 2 }}>Configurable clinical specialties</div>
          </div>
          <div className="card" style={{ padding: '14px 18px' }}>
            <div className="text-caption text-muted">Starting Consultation Fee</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0d9488', marginTop: 2 }}>
              {formatPrice(minPrice)}
            </div>
            <div className="text-caption text-muted" style={{ marginTop: 2 }}>1-on-1 Zoho Meeting session</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, flex: '1 1 420px' }}>
            <input
              className="form-input"
              style={{ flex: '1 1 220px', minWidth: 200 }}
              placeholder="🔍 Search by service name, category, or specialist..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: 190 }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat.key} value={cat.key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { key: 'all', label: `All (${services.filter(s => !s.is_archived).length})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'inactive', label: `Inactive (${inactiveCount})` },
                { key: 'archived', label: `Archived (${services.filter(s => s.is_archived).length})` },
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

        {/* Services List */}
        {loading ? (
          <div className="empty-state">Loading consultation services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🩺</div>
            <h3 className="text-headline-sm" style={{ marginBottom: 6 }}>No Consultation Services Found</h3>
            <p className="text-body-sm text-muted" style={{ marginBottom: 16 }}>
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try clearing your search or filter criteria.'
                : 'Create your first standalone consultation service to make it available for customer booking.'}
            </p>
            <button className="btn btn-primary btn-sm" onClick={openNewServiceModal}>
              + Add Consultation Service
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {filteredServices.map((svc, idx) => {
              const catInfo = categoryMap[svc.category]
              const catLabel = svc.category_label || catInfo?.label || svc.category
              const icon = svc.icon || catInfo?.icon || '🩺'

              return (
                <div
                  key={svc.id}
                  className="card"
                  style={{
                    padding: 'var(--space-lg)',
                    border: svc.is_active && !svc.is_archived ? '1px solid var(--color-border)' : '1px dashed var(--color-border)',
                    opacity: svc.is_active && !svc.is_archived ? 1 : 0.72,
                    background: 'var(--surface-card)',
                  }}
                >
                  <div className="flex justify-between items-start" style={{ gap: 16, flexWrap: 'wrap' }}>
                    {/* Left Content */}
                    <div style={{ display: 'flex', gap: 14, flex: '1 1 480px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 12,
                          background: 'var(--color-neutral)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 28,
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-on-surface)' }}>
                            {svc.name}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: 11, fontWeight: 600 }}>
                            {catLabel}
                          </span>
                          <span
                            className={`badge ${
                              svc.is_archived
                                ? 'badge-neutral'
                                : svc.is_active
                                  ? 'badge-success'
                                  : 'badge-warning'
                            }`}
                            style={{ fontSize: 11 }}
                          >
                            {svc.is_archived ? 'Archived' : svc.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-caption text-muted" style={{ fontSize: 11 }}>
                            Order #{svc.display_order}
                          </span>
                        </div>

                        {svc.specialist_designation && (
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0d9488', marginBottom: 6 }}>
                            👨‍⚕️ {svc.specialist_designation} • 📹 {svc.consultation_type || 'Online Video (Zoho Meeting)'}
                          </div>
                        )}

                        <p className="text-body-sm text-muted" style={{ lineHeight: 1.55, marginBottom: 10 }}>
                          {svc.short_description || svc.description}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                            alignItems: 'center',
                            paddingTop: 8,
                            borderTop: '1px dashed var(--color-border)',
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-primary)' }}>
                              {formatPrice(svc.price, svc.currency)}
                            </span>
                            <span className="text-muted"> / session</span>
                          </div>
                          <div className="text-muted">
                            ⏱️ <strong>{svc.duration_min} mins</strong> duration
                          </div>
                          <div className="text-muted">
                            🔑 Key: <code>{svc.key}</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Controls */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        minWidth: 140,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openEditServiceModal(svc)}
                      >
                        ✏️ Edit Service
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setPreviewService(svc)}
                      >
                        👁️ Preview Card
                      </button>
                      {svc.is_archived ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/consultation-services/${svc.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ restore: true, is_active: true }),
                              })
                              if (!res.ok) throw new Error('Failed to restore service')
                              showToast(`"${svc.name}" restored!`)
                              await loadData()
                            } catch {
                              showToast('Failed to restore service', 'error')
                            }
                          }}
                        >
                          ♻️ Restore Service
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggleActive(svc)}
                        >
                          {svc.is_active ? '⏸️ Deactivate' : '✅ Activate'}
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, padding: '4px 8px' }}
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(svc, 'up')}
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1, padding: '4px 8px' }}
                          disabled={idx === filteredServices.length - 1}
                          onClick={() => handleMoveOrder(svc, 'down')}
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1.5, padding: '4px 8px', color: '#dc2626' }}
                          onClick={() => setConfirmDeleteService(svc)}
                          title="Delete or Archive Service"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── CREATE / EDIT CONSULTATION SERVICE MODAL ─── */}
        {editingService && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: 'var(--space-lg)',
              }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <div>
                  <h2 className="text-headline-sm">
                    {editingService.id ? 'Edit Consultation Service' : 'Add New Consultation Service'}
                  </h2>
                  <p className="text-caption text-muted">
                    Configure clinical consultation details, pricing, duration, and customer visibility
                  </p>
                </div>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingService(null)}>
                  ✕
                </button>
              </div>

              {formError && (
                <div className="alert alert-error" style={{ marginBottom: 14, fontSize: 13 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Section 1: Service Information */}
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
                    1. Service Information
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginBottom: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Consultation Service Name *</span>
                      <input
                        className="form-input"
                        placeholder="e.g. Clinical Nutrition & Metabolic Consultation"
                        value={editingService.name ?? ''}
                        onChange={e => setEditingService(s => ({ ...s, name: e.target.value }))}
                      />
                    </label>

                    <label className="form-field">
                      <div className="flex justify-between items-center">
                        <span className="form-label">Service Category *</span>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--color-primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          + New Category
                        </button>
                      </div>
                      <select
                        className="form-input"
                        value={editingService.category ?? 'doctor_consultation'}
                        onChange={e => {
                          const catKey = e.target.value
                          const catObj = categoryMap[catKey]
                          setEditingService(s => ({
                            ...s,
                            category: catKey,
                            icon: s?.icon || catObj?.icon || '🩺',
                          }))
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat.key} value={cat.key}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginBottom: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Doctor / Specialist Designation</span>
                      <input
                        className="form-input"
                        placeholder="e.g. Senior Clinical Nutritionist & Endocrinologist"
                        value={editingService.specialist_designation ?? ''}
                        onChange={e => setEditingService(s => ({ ...s, specialist_designation: e.target.value }))}
                      />
                    </label>

                    <label className="form-field">
                      <span className="form-label">Service Icon</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ width: 64, textAlign: 'center', fontSize: 18 }}
                          value={editingService.icon ?? '🩺'}
                          onChange={e => setEditingService(s => ({ ...s, icon: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {ICON_PRESETS.slice(0, 6).map(ic => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => setEditingService(s => ({ ...s, icon: ic }))}
                              style={{
                                border: editingService.icon === ic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: 'white',
                                borderRadius: 6,
                                width: 28,
                                height: 28,
                                cursor: 'pointer',
                                fontSize: 14,
                              }}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    </label>
                  </div>

                  <label className="form-field" style={{ marginBottom: 10 }}>
                    <span className="form-label">Short Description (Shown on customer summary cards)</span>
                    <input
                      className="form-input"
                      placeholder="Concise 1-2 sentence summary of who this consultation is for..."
                      value={editingService.short_description ?? ''}
                      onChange={e =>
                        setEditingService(s => ({
                          ...s,
                          short_description: e.target.value,
                          description: s?.full_description || e.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Full Clinical Description</span>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Detailed explanation of what happens during the session, clinical deliverables, and follow-up guidance..."
                      value={editingService.full_description ?? editingService.description ?? ''}
                      onChange={e =>
                        setEditingService(s => ({
                          ...s,
                          full_description: e.target.value,
                          description: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                {/* Section 2: Session Configuration & Pricing */}
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
                    2. Session Configuration &amp; Pricing
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Consultation Fee *</span>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        value={editingService.price ?? 499}
                        onChange={e => setEditingService(s => ({ ...s, price: Number(e.target.value) }))}
                      />
                    </label>

                    <label className="form-field">
                      <span className="form-label">Currency</span>
                      <select
                        className="form-input"
                        value={editingService.currency ?? 'INR'}
                        onChange={e => setEditingService(s => ({ ...s, currency: e.target.value }))}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="AED">AED (د.إ)</option>
                      </select>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Duration (Minutes) *</span>
                      <input
                        className="form-input"
                        type="number"
                        min={5}
                        max={480}
                        step={5}
                        value={editingService.duration_min ?? 30}
                        onChange={e => setEditingService(s => ({ ...s, duration_min: Number(e.target.value) }))}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10 }}>
                    <label className="form-field">
                      <span className="form-label">Consultation Mode / Type</span>
                      <select
                        className="form-input"
                        value={editingService.consultation_type ?? 'Online Video (Zoho Meeting)'}
                        onChange={e => setEditingService(s => ({ ...s, consultation_type: e.target.value }))}
                      >
                        {CONSULTATION_MODES.map(mode => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Display Order / Priority</span>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={editingService.display_order ?? 1}
                        onChange={e => setEditingService(s => ({ ...s, display_order: Number(e.target.value) }))}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Status & Visibility */}
                <div
                  style={{
                    background: 'var(--color-neutral)',
                    padding: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!editingService.is_active}
                      onChange={e => setEditingService(s => ({ ...s, is_active: e.target.checked, is_archived: false }))}
                    />
                    <span>Active — Visible &amp; Bookable on Customer Website</span>
                  </label>
                  <span className="text-caption text-muted">
                    Existing appointments keep their original service &amp; price even if edited later.
                  </span>
                </div>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingService(null)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveService} disabled={saving}>
                    {saving ? 'Saving…' : editingService.id ? 'Save Changes' : 'Create Consultation Service'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CUSTOMER WEBSITE PREVIEW MODAL ─── */}
        {previewService && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setPreviewService(null)}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 460, padding: 'var(--space-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <span className="text-label-md text-muted">Customer Website Preview</span>
                <button className="btn btn-icon btn-ghost" onClick={() => setPreviewService(null)}>
                  ✕
                </button>
              </div>

              <div
                className="card"
                style={{
                  padding: 'var(--space-lg)',
                  border: '2px solid var(--color-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 36 }}>{previewService.icon || '🩺'}</div>
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                    {previewService.category_label || categoryMap[previewService.category]?.label || previewService.category}
                  </span>
                </div>
                <div>
                  <h3 className="text-headline-sm" style={{ marginBottom: 4 }}>{previewService.name}</h3>
                  {previewService.specialist_designation && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0d9488', marginBottom: 6 }}>
                      👨‍⚕️ {previewService.specialist_designation}
                    </div>
                  )}
                  <p className="text-body-sm text-muted" style={{ lineHeight: 1.55 }}>
                    {previewService.short_description || previewService.description}
                  </p>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  📹 {previewService.consultation_type || 'Online Video (Zoho Meeting)'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px dashed var(--color-border)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatPrice(previewService.price, previewService.currency)}
                    </span>
                    <span className="text-body-sm text-muted"> / {previewService.duration_min} min session</span>
                  </div>
                  <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                    Book Now
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DELETE / ARCHIVE CONFIRMATION MODAL ─── */}
        <AdminRecordDeleteModal
          isOpen={!!confirmDeleteService}
          moduleKey="consultation_services"
          moduleLabel="Consultation Services CMS"
          recordId={confirmDeleteService?.id || ''}
          recordName={confirmDeleteService?.name || ''}
          onClose={() => setConfirmDeleteService(null)}
          onConfirm={async () => {
            await handleDeleteOrArchive()
          }}
        />

        {/* ─── ADD NEW CATEGORY MODAL ─── */}
        {showCategoryModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: 420, padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <h3 className="text-headline-sm">Add Consultation Category</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowCategoryModal(false)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="form-field">
                  <span className="form-label">Category Name *</span>
                  <input
                    className="form-input"
                    placeholder="e.g. Thyroid & Metabolic Care"
                    value={newCategoryLabel}
                    onChange={e => setNewCategoryLabel(e.target.value)}
                    required
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Category Icon</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {ICON_PRESETS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setNewCategoryIcon(ic)}
                        style={{
                          border: newCategoryIcon === ic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: 'white',
                          borderRadius: 6,
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </label>
                <div className="flex justify-end" style={{ gap: 8, marginTop: 6 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCategoryModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Adding…' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 2000,
              background: toast.type === 'error' ? '#dc2626' : 'var(--color-success)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {toast.type === 'error' ? '⚠️ ' : '✓ '}
            {toast.msg}
          </div>
        )}
      </main>
    </div>
  )
}

