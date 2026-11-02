'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  APPROVED_WHATSAPP_TEMPLATES,
  WhatsAppTemplateDefinition,
  renderTemplatePreview,
} from '@/lib/services/whatsapp-templates'

interface CustomerRecipient {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  is_phone_valid: boolean
  phone_display: string
  is_active: boolean
  is_archived: boolean
  membership_status: string
  membership_plan_id: string | null
  plan_name: string
  meeting_url: string
}

interface CampaignRecord {
  id: string
  campaign_name: string
  template_name: string
  template_display_name: string
  language_code: string
  total_recipients: number
  success_count: number
  failed_count: number
  status: 'completed' | 'partial_failure' | 'failed'
  created_by: string
  created_at: string
  recipients?: Array<{
    customer_id: string
    customer_name: string
    phone: string
    status: 'sent' | 'failed'
    provider_request_id?: string
    error?: string
  }>
}

export default function WhatsAppAlertManager() {
  const [customers, setCustomers] = useState<CustomerRecipient[]>([])
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('all')

  // Selections
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Template & Mappings
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(
    APPROVED_WHATSAPP_TEMPLATES[0].name
  )
  const [variableMappings, setVariableMappings] = useState<
    Record<number, { source: 'field' | 'custom'; field?: string; customValue?: string }>
  >({})
  const [campaignName, setCampaignName] = useState('')

  // Modals & Send State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmedCheck, setConfirmedCheck] = useState(false)
  const [sending, setSending] = useState(false)
  const [viewingCampaign, setViewingCampaign] = useState<CampaignRecord | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const selectedTemplate = useMemo(() => {
    return (
      APPROVED_WHATSAPP_TEMPLATES.find(t => t.name === selectedTemplateName) ||
      APPROVED_WHATSAPP_TEMPLATES[0]
    )
  }, [selectedTemplateName])

  // Initialize default variable mappings when template changes
  useEffect(() => {
    const initial: Record<number, { source: 'field' | 'custom'; field?: string; customValue?: string }> = {}
    selectedTemplate.variables.forEach(v => {
      initial[v.index] = {
        source: v.defaultSource,
        field: v.defaultField || 'full_name',
        customValue: v.defaultValue || '',
      }
    })
    setVariableMappings(initial)
  }, [selectedTemplate])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp-alerts', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
        setCampaigns(data.campaigns || [])
        setPlans(data.plans || [])
      }
    } catch {
      showToast('Failed to load WhatsApp alerts data')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4500)
  }

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (c.is_archived) return false
      if (statusFilter === 'active' && !c.is_active) return false
      if (statusFilter === 'inactive' && c.is_active) return false
      if (planFilter !== 'all' && c.membership_plan_id !== planFilter) return false
      if (membershipStatusFilter !== 'all' && c.membership_status !== membershipStatusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = c.full_name?.toLowerCase().includes(q)
        const matchesEmail = c.email?.toLowerCase().includes(q)
        const matchesPhone = c.phone?.toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesPhone) return false
      }
      return true
    })
  }, [customers, statusFilter, planFilter, membershipStatusFilter, searchQuery])

  // Selection handlers
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllMatching() {
    if (selectedIds.size >= filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)))
    }
  }

  const selectedCustomersList = useMemo(() => {
    return customers.filter(c => selectedIds.has(c.id))
  }, [customers, selectedIds])

  const validPhoneCount = useMemo(() => {
    return selectedCustomersList.filter(c => c.is_phone_valid).length
  }, [selectedCustomersList])

  const invalidPhoneCount = selectedCustomersList.length - validPhoneCount

  // Live preview generator for sample customer
  const sampleCustomer = selectedCustomersList[0] || customers[0] || {
    id: 'c-sample',
    user_id: 'u-sample',
    full_name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43210',
    is_phone_valid: true,
    phone_display: '+91 98765 43210',
    is_active: true,
    is_archived: false,
    membership_status: 'active',
    membership_plan_id: 'mbr-001',
    plan_name: '3-Month Holistic Transformation',
    meeting_url: 'https://drfitveda.com/customer/appointments',
  }

  const livePreviewText = useMemo(() => {
    const renderedVars: string[] = []
    selectedTemplate.variables.forEach(v => {
      const mapping = variableMappings[v.index]
      let val = ''
      if (mapping?.source === 'custom') {
        val = mapping.customValue || v.defaultValue || ''
      } else {
        const field = mapping?.field || v.defaultField || 'full_name'
        switch (field) {
          case 'full_name':
            val = sampleCustomer.full_name
            break
          case 'email':
            val = sampleCustomer.email
            break
          case 'phone':
            val = sampleCustomer.phone_display || sampleCustomer.phone
            break
          case 'plan_name':
            val = sampleCustomer.plan_name
            break
          case 'meeting_url':
            val = sampleCustomer.meeting_url || 'https://drfitveda.com/customer'
            break
          case 'id':
            val = sampleCustomer.id
            break
          default:
            val = mapping?.customValue || v.defaultValue || ''
        }
      }
      renderedVars.push(val || `[${v.label}]`)
    })

    return renderTemplatePreview(selectedTemplate.bodyTemplate, renderedVars)
  }, [selectedTemplate, variableMappings, sampleCustomer])

  async function handleSendCampaign() {
    if (!confirmedCheck) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/whatsapp-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: campaignName.trim() || undefined,
          template_name: selectedTemplate.name,
          recipient_ids: Array.from(selectedIds),
          variable_mappings: variableMappings,
          language_code: selectedTemplate.language,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch alerts')

      showToast(`✓ Alert broadcast complete: ${data.campaign?.success_count || 0} sent successfully!`)
      setShowConfirmModal(false)
      setConfirmedCheck(false)
      setSelectedIds(new Set())
      await loadData()
    } catch (err: any) {
      showToast(err?.message || 'Error dispatching WhatsApp alerts')
    } finally {
      setSending(false)
    }
  }

  async function handleRetryCampaign(campaignId: string) {
    setRetryingId(campaignId)
    try {
      const res = await fetch('/api/admin/whatsapp-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry_campaign',
          campaign_id: campaignId,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast(`✓ Retried: ${data.retried_success || 0} succeeded, ${data.retried_failed || 0} failed.`)
        await loadData()
      } else {
        showToast(data.error || 'Retry failed')
      }
    } catch {
      showToast('Network error retrying campaign')
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          color: 'white',
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 14px rgba(6, 78, 59, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>📢</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#ffffff' }}>
                WhatsApp Alert &amp; Broadcast Manager
              </h2>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                MSG91 INTEGRATED
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.9, maxWidth: 680 }}>
              Select target customers, map approved MSG91 WhatsApp template variables dynamically with live preview, and broadcast with rate-limit protection.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={loadData}
            disabled={loading}
            style={{
              background: '#ffffff',
              color: '#064e3b',
              fontWeight: 700,
              border: 'none',
            }}
          >
            {loading ? 'Refreshing…' : '🔄 Refresh Lists'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Workflow Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Recipient Selection */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 className="text-headline-sm" style={{ margin: 0, fontSize: 17 }}>
                1. Select Recipients
              </h3>
              <p className="text-caption text-muted">
                Filter and select customers for this WhatsApp campaign
              </p>
            </div>
            <span
              className={`badge ${selectedIds.size > 0 ? 'badge-primary' : 'badge-neutral'}`}
              style={{ fontWeight: 800, fontSize: 12 }}
            >
              {selectedIds.size} Selected
            </span>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search by name, phone, or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: 13 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value="all">Status: All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                className="form-input"
                value={membershipStatusFilter}
                onChange={e => setMembershipStatusFilter(e.target.value)}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value="all">Plan Status: All</option>
                <option value="active">Plan Active</option>
                <option value="inactive">Plan Inactive</option>
                <option value="expired">Plan Expired</option>
              </select>

              <select
                className="form-input"
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                style={{ fontSize: 12, padding: '6px 8px' }}
              >
                <option value="all">Plans: All</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select All Checkbox Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--color-neutral)',
              borderRadius: 6,
              marginBottom: 8,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={
                  filteredCustomers.length > 0 && selectedIds.size >= filteredCustomers.length
                }
                onChange={toggleSelectAllMatching}
              />
              <span>
                Select All Matching ({filteredCustomers.length})
              </span>
            </label>
            {selectedIds.size > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedIds(new Set())}
                style={{ fontSize: 11, padding: '2px 6px', height: 'auto' }}
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Recipient List Box */}
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
                No customers match your filter criteria.
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = selectedIds.has(cust.id)
                return (
                  <label
                    key={cust.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--color-primary-light, #f0fdf4)' : 'transparent',
                      transition: 'background 0.15s ease',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(cust.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14 }}>{cust.full_name}</strong>
                        <span
                          className={`badge ${cust.is_active ? 'badge-success' : 'badge-neutral'}`}
                          style={{ fontSize: 10, padding: '1px 5px' }}
                        >
                          {cust.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 5px' }}>
                          {cust.plan_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2, fontSize: 12 }}>
                        <span style={{ color: cust.is_phone_valid ? '#166534' : '#dc2626' }}>
                          📞 {cust.phone_display || cust.phone || 'No phone'}
                          {!cust.is_phone_valid && (
                            <span style={{ fontSize: 10, marginLeft: 4, fontWeight: 700 }} title="Invalid international format">
                              ⚠️ Invalid
                            </span>
                          )}
                        </span>
                        {cust.email && <span className="text-muted text-caption">✉️ {cust.email}</span>}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {/* Validation Notice */}
          {selectedIds.size > 0 && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: invalidPhoneCount > 0 ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${invalidPhoneCount > 0 ? '#fde68a' : '#bbf7d0'}`,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{invalidPhoneCount > 0 ? '⚠️' : '✓'}</span>
              <div>
                <strong>{validPhoneCount} valid phone number(s)</strong> ready for dispatch.
                {invalidPhoneCount > 0 && (
                  <span style={{ color: '#b45309' }}>
                    {' '}
                    ({invalidPhoneCount} customer(s) have invalid phone numbers and will be safely flagged).
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Template & Dynamic Variable Mapping */}
        <div className="card" style={{ padding: 20 }}>
          <h3 className="text-headline-sm" style={{ margin: 0, fontSize: 17, marginBottom: 4 }}>
            2. Template &amp; Variable Mapping
          </h3>
          <p className="text-caption text-muted" style={{ marginBottom: 14 }}>
            Select an approved MSG91 WhatsApp template and configure parameter bindings
          </p>

          {/* Optional Campaign Label */}
          <div className="form-field" style={{ marginBottom: 12 }}>
            <span className="form-label">Campaign / Broadcast Label (Optional)</span>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. November Doctor Consultation Scheduling Broadcast"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>

          {/* Template Dropdown */}
          <div className="form-field" style={{ marginBottom: 14 }}>
            <span className="form-label">Approved WhatsApp Template</span>
            <select
              className="form-input"
              value={selectedTemplateName}
              onChange={e => setSelectedTemplateName(e.target.value)}
              style={{ fontWeight: 600, fontSize: 13 }}
            >
              {APPROVED_WHATSAPP_TEMPLATES.map(tmpl => (
                <option key={tmpl.id} value={tmpl.name}>
                  {tmpl.displayName} ({tmpl.name}) — [{tmpl.category.toUpperCase()}]
                </option>
              ))}
            </select>
            <div className="text-caption text-muted" style={{ marginTop: 4 }}>
              <strong>Purpose:</strong> {selectedTemplate.purpose} • <strong>Language:</strong> {selectedTemplate.language}
            </div>
          </div>

          {/* Dynamic Variable Mappings */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 8 }}>
              Variable Bindings ({selectedTemplate.variables.length} parameters)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedTemplate.variables.map(v => {
                const current = variableMappings[v.index] || {
                  source: v.defaultSource,
                  field: v.defaultField,
                  customValue: v.defaultValue,
                }

                return (
                  <div
                    key={v.index}
                    style={{
                      padding: 10,
                      background: 'var(--color-neutral)',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--color-primary)', fontSize: 13 }}>
                        {`{{${v.index}}}`} — {v.label}
                      </strong>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                          <input
                            type="radio"
                            name={`var_source_${v.index}`}
                            checked={current.source === 'field'}
                            onChange={() =>
                              setVariableMappings(p => ({
                                ...p,
                                [v.index]: { ...current, source: 'field' },
                              }))
                            }
                          />
                          Customer Field
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', margin: 0 }}>
                          <input
                            type="radio"
                            name={`var_source_${v.index}`}
                            checked={current.source === 'custom'}
                            onChange={() =>
                              setVariableMappings(p => ({
                                ...p,
                                [v.index]: { ...current, source: 'custom' },
                              }))
                            }
                          />
                          Custom Text
                        </label>
                      </div>
                    </div>

                    {current.source === 'field' ? (
                      <select
                        className="form-input"
                        value={current.field || v.defaultField || 'full_name'}
                        onChange={e =>
                          setVariableMappings(p => ({
                            ...p,
                            [v.index]: { ...current, field: e.target.value },
                          }))
                        }
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      >
                        <option value="full_name">Customer Full Name</option>
                        <option value="email">Customer Email</option>
                        <option value="phone">Customer Phone Number</option>
                        <option value="plan_name">Assigned Membership Plan Name</option>
                        <option value="meeting_url">Google Meet URL</option>
                        <option value="id">Customer ID</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-input"
                        placeholder={v.placeholder}
                        value={current.customValue || ''}
                        onChange={e =>
                          setVariableMappings(p => ({
                            ...p,
                            [v.index]: { ...current, customValue: e.target.value },
                          }))
                        }
                        style={{ fontSize: 12, padding: '4px 8px' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Live Message Preview */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)' }}>
                📱 Live WhatsApp Preview (Sample: {sampleCustomer.full_name})
              </span>
            </div>
            <div
              style={{
                background: '#e5ddd5',
                padding: 12,
                borderRadius: 8,
                backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '0 8px 8px 8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: '#111827',
                  maxWidth: 380,
                }}
              >
                {livePreviewText}
                <div style={{ textAlign: 'right', fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                  Just now ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Review & Send Action Button */}
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: 14 }}
            disabled={selectedIds.size === 0}
            onClick={() => {
              setConfirmedCheck(false)
              setShowConfirmModal(true)
            }}
          >
            {selectedIds.size === 0
              ? 'Select Recipients to Broadcast'
              : `Review & Send to ${selectedIds.size} Recipient(s) →`}
          </button>
        </div>
      </div>

      {/* Campaign History & Delivery Tracking Section */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 className="text-headline-sm" style={{ margin: 0, fontSize: 17 }}>
              Campaign History &amp; Dispatch Tracking
            </h3>
            <p className="text-caption text-muted">
              Audit log of all manual WhatsApp alert broadcasts with per-recipient delivery status and retry options
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            No WhatsApp broadcast campaigns logged yet. Your sent alert campaigns will be tracked here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Campaign Name</th>
                  <th>Template</th>
                  <th>Recipients</th>
                  <th>Success</th>
                  <th>Failed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(camp => (
                  <tr key={camp.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(camp.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td>
                      <strong>{camp.campaign_name}</strong>
                      <div className="text-caption text-muted">By {camp.created_by}</div>
                    </td>
                    <td>
                      <code>{camp.template_name}</code>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{camp.total_recipients}</span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {camp.success_count}
                      </span>
                    </td>
                    <td>
                      {camp.failed_count > 0 ? (
                        <span className="badge badge-error" style={{ fontWeight: 700 }}>
                          {camp.failed_count}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a' }}>0</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          camp.status === 'completed'
                            ? 'badge-success'
                            : camp.status === 'partial_failure'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {camp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {camp.recipients && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setViewingCampaign(camp)}
                          >
                            👁️ Logs
                          </button>
                        )}
                        {camp.failed_count > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ borderColor: '#f59e0b', color: '#b45309' }}
                            onClick={() => handleRetryCampaign(camp.id)}
                            disabled={retryingId === camp.id}
                          >
                            {retryingId === camp.id ? 'Retrying…' : '♻️ Retry Failed'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Safety Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderTop: '4px solid #059669',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🚀</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>
                  Confirm WhatsApp Alert Broadcast
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Campaign Summary */}
              <div
                style={{
                  padding: 12,
                  background: 'var(--color-neutral)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <span className="text-muted">Template: </span>
                  <strong>{selectedTemplate.displayName}</strong> (<code>{selectedTemplate.name}</code>)
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span className="text-muted">Total Recipients: </span>
                  <strong>{selectedIds.size} customer(s)</strong>
                </div>
                <div>
                  <span className="text-muted">Phone Status: </span>
                  <span style={{ color: '#166534', fontWeight: 700 }}>{validPhoneCount} valid</span>
                  {invalidPhoneCount > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      {' '}
                      • {invalidPhoneCount} invalid/missing
                    </span>
                  )}
                </div>
              </div>

              {invalidPhoneCount > 0 && (
                <div
                  style={{
                    padding: 10,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#92400e',
                  }}
                >
                  ⚠️ <strong>Notice:</strong> {invalidPhoneCount} customer(s) have unverified or missing phone numbers. The system will safely record them as failed without interrupting valid sends.
                </div>
              )}

              {/* Sample Rendered Message */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  Sample Rendered Message
                </div>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 160,
                    overflowY: 'auto',
                  }}
                >
                  {livePreviewText}
                </div>
              </div>

              {/* Safety Confirmation Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 10,
                  background: '#f0fdf4',
                  borderRadius: 6,
                  border: '1px solid #bbf7d0',
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={e => setConfirmedCheck(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ color: '#166534', fontWeight: 600 }}>
                  I confirm this broadcast. Messages will be dispatched to all selected recipients via the official MSG91 WhatsApp API.
                </span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!confirmedCheck || sending}
                  onClick={handleSendCampaign}
                >
                  {sending ? 'Dispatching via MSG91…' : `Confirm & Send to ${selectedIds.size} Recipients`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Logs Modal */}
      {viewingCampaign && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setViewingCampaign(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>
                  Recipient Dispatch Details
                </h3>
                <div className="text-caption text-muted">
                  Campaign: <strong>{viewingCampaign.campaign_name}</strong>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setViewingCampaign(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
              {(viewingCampaign.recipients || []).map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: r.status === 'sent' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${r.status === 'sent' ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <strong>{r.customer_name}</strong> • <code>{r.phone}</code>
                    {r.error && (
                      <div style={{ color: '#dc2626', fontSize: 11, marginTop: 2 }}>
                        Error: {r.error}
                      </div>
                    )}
                  </div>
                  <span
                    className={`badge ${r.status === 'sent' ? 'badge-success' : 'badge-error'}`}
                    style={{ fontWeight: 700 }}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
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
            background: 'var(--color-success, #059669)',
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
    </div>
  )
}

