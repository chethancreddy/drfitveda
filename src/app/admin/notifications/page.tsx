'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface WhatsAppNotification {
  id: string
  idempotency_key: string
  notification_type:
    | 'customer_session_reminder'
    | 'trainer_session_reminder'
    | 'doctor_customer_assigned'
    | 'trainer_customer_assigned'
  template_name: string
  recipient_user_id: string
  recipient_name: string
  recipient_role: string
  recipient_phone: string
  customer_id: string
  customer_name: string
  session_id: string | null
  assignment_id: string | null
  scheduled_for: string
  session_scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  provider_message_id: string | null
  delivery_status: 'Pending' | 'Processing' | 'Sent' | 'Delivered' | 'Failed' | 'Cancelled'
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  permanent_failure: boolean
  error_details: string | null
  message_preview: string
  template_variables: string[]
  timezone: string
  created_at: string
  updated_at: string
}

interface NotificationStats {
  totalNotifications: number
  totalSent: number
  pendingCount: number
  sentProviderAcceptedCount: number
  deliveredCount: number
  failedCount: number
  cancelledCount: number
  customerSessionReminders: number
  trainerSessionReminders: number
  doctorAssignmentAlerts: number
  trainerAssignmentAlerts: number
}

interface SchedulerRun {
  runId: string
  executedAt: string
  scannedSessions: number
  newlyScheduledCount: number
  dispatchedCount: number
  retriedCount: number
  cancelledCount: number
  failedCount: number
}

interface LiveTemplateStatus {
  name: string
  category: string
  namespace: string | null
  status: string
  templateId: string | null
  msg91TemplateId: number | null
}

const TYPE_LABELS: Record<string, { label: string; icon: string; badge: string }> = {
  customer_session_reminder: {
    label: 'Customer 15m Session Reminder',
    icon: '⏰',
    badge: 'badge-primary',
  },
  trainer_session_reminder: {
    label: 'Trainer 15m Session Reminder',
    icon: '🏋️',
    badge: 'badge-info',
  },
  doctor_customer_assigned: {
    label: 'Doctor Assignment Alert',
    icon: '🩺',
    badge: 'badge-success',
  },
  trainer_customer_assigned: {
    label: 'Trainer Assignment Alert',
    icon: '🤝',
    badge: 'badge-warning',
  },
}

export default function AdminWhatsAppNotificationsPage() {
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    totalSent: 0,
    pendingCount: 0,
    sentProviderAcceptedCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    customerSessionReminders: 0,
    trainerSessionReminders: 0,
    doctorAssignmentAlerts: 0,
    trainerAssignmentAlerts: 0,
  })
  const [schedulerRuns, setSchedulerRuns] = useState<SchedulerRun[]>([])
  const [liveTemplates, setLiveTemplates] = useState<LiveTemplateStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [runningScheduler, setRunningScheduler] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<WhatsAppNotification | null>(null)
  const [toast, setToast] = useState('')

  // Filters
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  async function fetchNotifications(includeTemplates = false) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set('date', dateFilter)
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (recipientFilter) params.set('recipient', recipientFilter)
      if (includeTemplates) params.set('templates', '1')

      const res = await fetch(`/api/admin/whatsapp-notifications?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
        if (data.stats) setStats(data.stats)
        if (data.schedulerRuns) setSchedulerRuns(data.schedulerRuns)
        if (data.liveTemplates?.length) setLiveTemplates(data.liveTemplates)
      } else {
        showToast(data.error || 'Failed to load WhatsApp notifications')
      }
    } catch {
      showToast('Network error loading WhatsApp notifications')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications(true)
  }, [dateFilter, typeFilter, statusFilter])

  async function handleRunScheduler() {
    setRunningScheduler(true)
    try {
      const res = await fetch('/api/admin/whatsapp-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_scheduler' }),
      })
      const data = await res.json()
      if (res.ok) {
        const s = data.summary
        showToast(
          `✓ Scheduler completed: Scanned ${s.scannedSessions} sessions, Scheduled ${s.newlyScheduledCount}, Sent ${s.dispatchedCount}, Retried ${s.retriedCount}`
        )
        await fetchNotifications(false)
      } else {
        showToast(data.error || 'Failed to run scheduler')
      }
    } catch {
      showToast('Failed to trigger reminder scheduler')
    }
    setRunningScheduler(false)
  }

  async function handleRetryFailed(record: WhatsAppNotification) {
    if (record.delivery_status !== 'Failed') {
      showToast('Only Failed notifications are eligible for manual retry.')
      return
    }
    setRetryingId(record.id)
    try {
      const res = await fetch('/api/admin/whatsapp-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', notificationId: record.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast(`✓ Retry accepted by MSG91 (Message ID: ${data.notification?.provider_message_id || 'N/A'})`)
      } else {
        showToast(`Retry result: ${data.error || data.notification?.error_details || 'Provider rejected retry'}`)
      }
      await fetchNotifications(false)
      if (selectedRecord?.id === record.id && data.notification) {
        setSelectedRecord(data.notification)
      }
    } catch {
      showToast('Network error retrying notification')
    }
    setRetryingId(null)
  }

  const displayedNotifications = notifications.filter(r => {
    if (!recipientFilter.trim()) return true
    const q = recipientFilter.toLowerCase().trim()
    return (
      r.recipient_name?.toLowerCase().includes(q) ||
      r.recipient_phone?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.recipient_role?.toLowerCase().includes(q)
    )
  })

  function renderStatusBadge(status: WhatsAppNotification['delivery_status']) {
    switch (status) {
      case 'Delivered':
        return <span className="badge badge-success">✓✓ Delivered</span>
      case 'Sent':
        return <span className="badge badge-primary">✓ Sent (Provider Accepted)</span>
      case 'Pending':
        return <span className="badge badge-warning">⏳ Pending</span>
      case 'Processing':
        return <span className="badge badge-info">🔄 Processing</span>
      case 'Failed':
        return <span className="badge badge-error">⚠ Failed</span>
      case 'Cancelled':
        return <span className="badge badge-neutral">✕ Cancelled</span>
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        {/* Page Header */}
        <div
          className="page-header flex justify-between items-center"
          style={{ flexWrap: 'wrap', gap: 12 }}
        >
          <div>
            <h1 className="text-headline-md">WhatsApp Alerts &amp; Session Reminders</h1>
            <p className="text-body-md text-muted">
              Automated MSG91 WhatsApp delivery tracker for 15-minute session reminders and Doctor/Trainer customer assignment alerts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fetchNotifications(true)}
              disabled={loading}
            >
              🔄 Refresh Logs
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRunScheduler}
              disabled={runningScheduler}
            >
              {runningScheduler ? 'Running Scheduler…' : '⚡ Run 15m Reminder Scheduler Now'}
            </button>
          </div>
        </div>

        {/* Top Delivery Status KPIs */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-label">Total Sent (Accepted + Delivered)</div>
            <div className="stat-value" style={{ color: '#0d9488' }}>
              {stats.totalSent}
            </div>
            <div className="text-caption text-muted">
              {stats.sentProviderAcceptedCount} Provider Accepted · {stats.deliveredCount} Confirmed Receipt
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Pending Reminders</div>
            <div className="stat-value" style={{ color: '#d97706' }}>
              {stats.pendingCount}
            </div>
            <div className="text-caption text-muted">
              Queued for 15m pre-session dispatch
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Confirmed Delivered</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {stats.deliveredCount}
            </div>
            <div className="text-caption text-muted">
              Verified via MSG91 webhook receipt
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Failed Notifications</div>
            <div className="stat-value" style={{ color: stats.failedCount > 0 ? '#dc2626' : '#64748b' }}>
              {stats.failedCount}
            </div>
            <div className="text-caption text-muted">
              {stats.cancelledCount} Cancelled (rescheduled/aborted)
            </div>
          </div>
        </div>

        {/* Workflow Breakdown KPIs */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          <div
            className="card"
            style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: '4px solid #0d9488' }}
            onClick={() => setTypeFilter(typeFilter === 'customer_session_reminder' ? '' : 'customer_session_reminder')}
          >
            <div className="text-caption text-muted">⏰ Customer Session Reminders (15m)</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stats.customerSessionReminders}</div>
          </div>

          <div
            className="card"
            style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: '4px solid #0284c7' }}
            onClick={() => setTypeFilter(typeFilter === 'trainer_session_reminder' ? '' : 'trainer_session_reminder')}
          >
            <div className="text-caption text-muted">🏋️ Trainer Session Reminders (15m)</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stats.trainerSessionReminders}</div>
          </div>

          <div
            className="card"
            style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: '4px solid #059669' }}
            onClick={() => setTypeFilter(typeFilter === 'doctor_customer_assigned' ? '' : 'doctor_customer_assigned')}
          >
            <div className="text-caption text-muted">🩺 Doctor Assignment Alerts</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stats.doctorAssignmentAlerts}</div>
          </div>

          <div
            className="card"
            style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: '4px solid #d97706' }}
            onClick={() => setTypeFilter(typeFilter === 'trainer_customer_assigned' ? '' : 'trainer_customer_assigned')}
          >
            <div className="text-caption text-muted">🤝 Trainer Assignment Alerts</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stats.trainerAssignmentAlerts}</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <label className="form-field" style={{ margin: 0 }}>
              <span className="form-label">Filter by Date</span>
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </label>

            <label className="form-field" style={{ margin: 0 }}>
              <span className="form-label">Notification Type</span>
              <select
                className="form-input"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="">All Workflow Types</option>
                <option value="customer_session_reminder">⏰ Customer Session Reminder (15m)</option>
                <option value="trainer_session_reminder">🏋️ Trainer Session Reminder (15m)</option>
                <option value="doctor_customer_assigned">🩺 Doctor Customer Assigned</option>
                <option value="trainer_customer_assigned">🤝 Trainer Customer Assigned</option>
              </select>
            </label>

            <label className="form-field" style={{ margin: 0 }}>
              <span className="form-label">Delivery Status</span>
              <select
                className="form-input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Sent">Sent (Provider Accepted)</option>
                <option value="Delivered">Delivered (Confirmed)</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <label className="form-field" style={{ margin: 0 }}>
              <span className="form-label">Search Recipient / Customer</span>
              <input
                type="text"
                className="form-input"
                placeholder="Name, +91 phone, or role…"
                value={recipientFilter}
                onChange={e => setRecipientFilter(e.target.value)}
              />
            </label>

            {(dateFilter || typeFilter || statusFilter || recipientFilter) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ height: 42 }}
                onClick={() => {
                  setDateFilter('')
                  setTypeFilter('')
                  setStatusFilter('')
                  setRecipientFilter('')
                }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Notifications Table */}
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Workflow Type</th>
                  <th>Recipient</th>
                  <th>Customer</th>
                  <th>Scheduled / Sent Time</th>
                  <th>Delivery Status</th>
                  <th>Provider ID &amp; Retries</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                        Loading WhatsApp notification logs…
                      </div>
                    </td>
                  </tr>
                ) : displayedNotifications.length > 0 ? (
                  displayedNotifications.map(n => {
                    const meta = TYPE_LABELS[n.notification_type] || {
                      label: n.notification_type,
                      icon: '💬',
                      badge: 'badge-neutral',
                    }
                    return (
                      <tr key={n.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {meta.icon} {meta.label}
                          </div>
                          <div className="text-caption text-muted">
                            Template: <code>{n.template_name}</code>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.recipient_name}</div>
                          <div className="text-caption text-muted">
                            {n.recipient_phone || 'No Phone'} ·{' '}
                            <span style={{ textTransform: 'capitalize' }}>
                              {n.recipient_role?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{n.customer_name}</div>
                          {n.session_scheduled_at && (
                            <div className="text-caption text-muted">
                              Session: {new Date(n.session_scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 12.5 }}>
                            <strong>Scheduled:</strong>{' '}
                            {new Date(n.scheduled_for).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                          {n.sent_at && (
                            <div className="text-caption" style={{ color: '#0d9488', fontWeight: 600 }}>
                              Sent: {new Date(n.sent_at).toLocaleTimeString('en-IN', { timeStyle: 'medium' })}
                            </div>
                          )}
                          {n.delivered_at && (
                            <div className="text-caption" style={{ color: '#059669', fontWeight: 600 }}>
                              Delivered: {new Date(n.delivered_at).toLocaleTimeString('en-IN', { timeStyle: 'medium' })}
                            </div>
                          )}
                        </td>
                        <td>
                          {renderStatusBadge(n.delivery_status)}
                          {n.error_details && (
                            <div
                              className="text-caption"
                              style={{
                                color: n.delivery_status === 'Failed' ? '#dc2626' : '#64748b',
                                maxWidth: 220,
                                marginTop: 4,
                                lineHeight: 1.35,
                              }}
                            >
                              {n.error_details}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="text-caption" style={{ fontFamily: 'monospace' }}>
                            {n.provider_message_id || '—'}
                          </div>
                          <div className="text-caption text-muted">
                            Retries: {n.retry_count} / {n.max_retries}
                            {n.permanent_failure ? ' (Permanent)' : ''}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedRecord(n)}
                            >
                              Inspect
                            </button>
                            {n.delivery_status === 'Failed' && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={retryingId === n.id}
                                onClick={() => handleRetryFailed(n)}
                              >
                                {retryingId === n.id ? 'Retrying…' : '↻ Safe Retry'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                        No WhatsApp notifications match the selected filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live MSG91 Approved Templates & Scheduler Audit */}
        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 8 }}>
              ✅ MSG91 / Meta WhatsApp Templates Status
            </h2>
            <p className="text-caption text-muted" style={{ marginBottom: 12 }}>
              Integrated WhatsApp Business Number: <strong>17111240135</strong> · Namespace:{' '}
              <code>73d9201b_9c90_4716_9857_fb09589cb3bc</code>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(liveTemplates.length > 0
                ? liveTemplates.filter(t => t.name.startsWith('drfitveda_') || t.name === 'otp_verification')
                : [
                    { name: 'drfitveda_customer_session_reminder', category: 'UTILITY', status: 'approved', templateId: '1789133458873620', msg91TemplateId: 591020 },
                    { name: 'drfitveda_trainer_session_reminder', category: 'UTILITY', status: 'approved', templateId: '3405596222945675', msg91TemplateId: 591021 },
                    { name: 'drfitveda_doctor_customer_assigned', category: 'UTILITY', status: 'approved', templateId: '1855077042334465', msg91TemplateId: 591022 },
                    { name: 'drfitveda_trainer_customer_assigned', category: 'UTILITY', status: 'approved', templateId: '4476604995937191', msg91TemplateId: 591023 },
                  ]
              ).map((t, idx) => (
                <div
                  key={`${t.name}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div className="text-caption text-muted">
                      {t.category} · Meta ID: {t.templateId} · MSG91 ID: {t.msg91TemplateId}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${t.status === 'approved' ? 'success' : t.status === 'pending' ? 'warning' : 'error'}`}
                    style={{ textTransform: 'uppercase' }}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 8 }}>
              ⏱️ Recent Background Scheduler Executions
            </h2>
            <p className="text-caption text-muted" style={{ marginBottom: 12 }}>
              Cron Endpoint: <code>/api/cron/whatsapp-reminders</code> (Idempotent 15m pre-session scanner)
            </p>
            {schedulerRuns.length === 0 ? (
              <div className="text-body-sm text-muted">
                No scheduler runs recorded yet. Click &quot;Run 15m Reminder Scheduler Now&quot; above to trigger an immediate scan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {schedulerRuns.slice(0, 8).map(run => (
                  <div
                    key={run.runId}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: '#f8fafc',
                      border: '1px solid var(--color-border)',
                      fontSize: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <span>
                      <strong>{new Date(run.executedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' })}</strong>
                    </span>
                    <span className="text-muted">
                      Scanned: {run.scannedSessions} · Queued: {run.newlyScheduledCount} · Dispatched:{' '}
                      <strong style={{ color: '#0d9488' }}>{run.dispatchedCount}</strong> · Retried: {run.retriedCount} · Cancelled: {run.cancelledCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inspect Modal */}
        {selectedRecord && (
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
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="card"
              style={{ width: '100%', maxWidth: 620, padding: 'var(--space-lg)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                <h3 className="text-headline-sm">WhatsApp Notification Audit Record</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedRecord(null)}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 14 }}>
                <div>
                  <span className="text-muted">Notification ID:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedRecord.id}</div>
                </div>
                <div>
                  <span className="text-muted">Delivery Status:</span>
                  <div>{renderStatusBadge(selectedRecord.delivery_status)}</div>
                </div>
                <div>
                  <span className="text-muted">Recipient:</span>
                  <div style={{ fontWeight: 600 }}>
                    {selectedRecord.recipient_name} ({selectedRecord.recipient_phone || 'No Phone'})
                  </div>
                </div>
                <div>
                  <span className="text-muted">Provider Message ID:</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedRecord.provider_message_id || 'Not Assigned'}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Idempotency Key:</span>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                    {selectedRecord.idempotency_key}
                  </div>
                </div>
                <div>
                  <span className="text-muted">Retries / Timezone:</span>
                  <div>
                    {selectedRecord.retry_count} / {selectedRecord.max_retries} ({selectedRecord.timezone})
                  </div>
                </div>
              </div>

              {selectedRecord.error_details && (
                <div
                  className="alert alert-error"
                  style={{ marginBottom: 14, fontSize: 12.5 }}
                >
                  <strong>Provider / Validation Diagnostic:</strong> {selectedRecord.error_details}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div className="text-caption text-muted" style={{ fontWeight: 700, marginBottom: 6 }}>
                  Rendered WhatsApp Message Preview (Sent via Template <code>{selectedRecord.template_name}</code>):
                </div>
                <pre
                  style={{
                    background: '#f1f5f9',
                    padding: 14,
                    borderRadius: 8,
                    fontSize: 12.5,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {selectedRecord.message_preview}
                </pre>
              </div>

              <div className="text-caption text-muted" style={{ marginBottom: 14 }}>
                🔒 Historical delivery records are immutable. Sent or Delivered notifications cannot be edited or arbitrarily resent.
              </div>

              <div className="flex justify-end" style={{ gap: 8 }}>
                {selectedRecord.delivery_status === 'Failed' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={retryingId === selectedRecord.id}
                    onClick={() => handleRetryFailed(selectedRecord)}
                  >
                    {retryingId === selectedRecord.id ? 'Retrying…' : '↻ Retry Failed Notification'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 2000,
              background: '#0f172a',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 13.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {toast}
          </div>
        )}
      </main>
    </div>
  )
}

