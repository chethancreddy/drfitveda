'use client'

import React, { useState, useEffect } from 'react'

interface AppointmentRecord {
  id: string
  customer_id: string
  professional_id: string
  scheduled_at: string
  duration_min: number
  status: string
  notes?: string
  meeting_url?: string
  meeting_provider?: string
  booking_type?: 'standard' | 'priority'
  service_name?: string
  service_price?: number
  priority_surcharge?: number
  total_price?: number
  requested_date?: string
  requested_time?: string
  created_at?: string
  customers?: {
    id: string
    user_profiles?: {
      full_name?: string
      phone?: string
      email?: string
    }
  }
}

export default function AdminPriorityBookingManager() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'priority' | 'standard'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Priority Settings
  const [priorityEnabled, setPriorityEnabled] = useState(true)
  const [surchargePercent, setSurchargePercent] = useState(40)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState<string | null>(null)

  // Modal for action
  const [selectedAppt, setSelectedAppt] = useState<AppointmentRecord | null>(null)
  const [actionType, setActionType] = useState<'confirm' | 'propose_alternative' | 'reject' | null>(null)
  const [confirmedDate, setConfirmedDate] = useState('')
  const [confirmedTime, setConfirmedTime] = useState('')
  const [alternativeTime, setAlternativeTime] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/appointments')
      const data = await res.json()
      if (data.appointments) {
        setAppointments(data.appointments)
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.settings) {
        if (data.settings.priority_consultation_enabled !== undefined) {
          setPriorityEnabled(Boolean(data.settings.priority_consultation_enabled))
        }
        if (data.settings.priority_consultation_surcharge_percent !== undefined) {
          setSurchargePercent(Number(data.settings.priority_consultation_surcharge_percent))
        }
      }
    } catch {}
  }

  useEffect(() => {
    fetchBookings()
    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsStatus(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority_consultation_enabled: priorityEnabled,
          priority_consultation_surcharge_percent: Number(surchargePercent),
        }),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      setSettingsStatus('Priority consultation settings saved!')
      setTimeout(() => setSettingsStatus(null), 3000)
    } catch (err: any) {
      setSettingsStatus(err.message || 'Error saving settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleOpenAction = (appt: AppointmentRecord, type: 'confirm' | 'propose_alternative' | 'reject') => {
    setSelectedAppt(appt)
    setActionType(type)
    setActionMessage(null)
    setAdminNotes('')
    const dateStr = appt.requested_date || (appt.scheduled_at ? appt.scheduled_at.split('T')[0] : '')
    setConfirmedDate(dateStr)
    setConfirmedTime(appt.requested_time || '10:00')
    setAlternativeTime('14:00')
  }

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppt || !actionType) return

    setSubmittingAction(true)
    setActionMessage(null)

    try {
      let confirmedScheduledAt = selectedAppt.scheduled_at
      if (actionType === 'confirm' && confirmedDate && confirmedTime) {
        confirmedScheduledAt = new Date(`${confirmedDate}T${confirmedTime}:00`).toISOString()
      }

      const res = await fetch(`/api/appointments/${selectedAppt.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          confirmed_scheduled_at: confirmedScheduledAt,
          alternative_time: alternativeTime,
          admin_notes: adminNotes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update appointment')

      setActionMessage({ type: 'success', text: `Appointment status updated to ${actionType}!` })
      setTimeout(() => {
        setSelectedAppt(null)
        setActionType(null)
        fetchBookings()
      }, 1500)
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error executing action' })
    } finally {
      setSubmittingAction(false)
    }
  }

  const filteredAppointments = appointments.filter(a => {
    const isPriority = a.booking_type === 'priority'
    if (filterType === 'priority' && !isPriority) return false
    if (filterType === 'standard' && isPriority) return false
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    return true
  })

  return (
    <div className="card" style={{ padding: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 className="text-headline-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span> Consultation Bookings &amp; Priority Requests Manager
          </h2>
          <p className="text-body-sm text-muted">
            Manage Standard appointments and Priority flexible-scheduling consultation requests with transparent surcharge tracking.
          </p>
        </div>
      </div>

      {/* Priority Settings Card */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={priorityEnabled}
              onChange={e => setPriorityEnabled(e.target.checked)}
            />
            <span>Enable Priority Consultation (+40% Flexible Scheduling)</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Priority Surcharge:</span>
            <input
              type="number"
              value={surchargePercent}
              min={10}
              max={100}
              onChange={e => setSurchargePercent(Number(e.target.value))}
              style={{ width: 64, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
            />
            <span style={{ fontWeight: 700 }}>%</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {settingsStatus && (
            <span style={{ fontSize: 12.5, color: '#15803d', fontWeight: 700 }}>{settingsStatus}</span>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            className="btn btn-outline btn-sm"
            disabled={savingSettings}
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
        >
          All Bookings ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('priority')}
          className={`btn btn-sm ${filterType === 'priority' ? 'btn-primary' : 'btn-outline'}`}
        >
          ⚡ Priority Requests ({appointments.filter(a => a.booking_type === 'priority').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('standard')}
          className={`btn btn-sm ${filterType === 'standard' ? 'btn-primary' : 'btn-outline'}`}
        >
          📅 Standard Bookings ({appointments.filter(a => a.booking_type !== 'priority').length})
        </button>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="form-input"
          style={{ width: 'auto', marginLeft: 'auto', padding: '6px 12px', fontSize: 13 }}
        >
          <option value="all">All Statuses</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="scheduled">Scheduled / Confirmed</option>
          <option value="alternative_proposed">Alternative Proposed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading bookings...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          No bookings match the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Ref / Customer</th>
                <th style={{ padding: '10px 12px' }}>Consultation</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Pricing Breakdown</th>
                <th style={{ padding: '10px 12px' }}>Requested vs Confirmed</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(appt => {
                const isPriority = appt.booking_type === 'priority'
                const basePrice = appt.service_price || 999
                const surcharge = appt.priority_surcharge || (isPriority ? Math.round(basePrice * 0.40) : 0)
                const totalPrice = appt.total_price || (basePrice + surcharge)
                const customerName = appt.customers?.user_profiles?.full_name || 'Patient'

                return (
                  <tr key={appt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {/* Ref / Customer */}
                    <td style={{ padding: '12px 12px' }}>
                      <strong style={{ display: 'block', color: 'var(--color-foreground)' }}>{customerName}</strong>
                      <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>ID: #{appt.id.slice(0, 8)}</span>
                    </td>

                    {/* Consultation */}
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontWeight: 600 }}>{appt.service_name || 'Consultation'}</span>
                      <div style={{ fontSize: 11.5, color: '#0d9488' }}>⏱️ {appt.duration_min} mins • Google Meet</div>
                    </td>

                    {/* Booking Type */}
                    <td style={{ padding: '12px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isPriority ? '#fef3c7' : '#ecfdf5',
                          color: isPriority ? '#92400e' : '#065f46',
                        }}
                      >
                        {isPriority ? '⚡ Priority' : '📅 Standard'}
                      </span>
                    </td>

                    {/* Pricing Breakdown */}
                    <td style={{ padding: '12px 12px' }}>
                      <div>
                        <strong style={{ color: isPriority ? '#453421' : '#1F1A17' }}>₹{totalPrice.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Base: ₹{basePrice.toLocaleString('en-IN')} {isPriority && `+ ₹${surcharge} (40%)`}
                      </div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '12px 12px' }}>
                      {isPriority && (
                        <div style={{ fontSize: 11.5, color: '#b45309', marginBottom: 2 }}>
                          Req: {appt.requested_date || appt.scheduled_at?.split('T')[0]} {appt.requested_time}
                        </div>
                      )}
                      <div style={{ fontSize: 12 }}>
                        Conf: {new Date(appt.scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background:
                            appt.status === 'scheduled'
                              ? '#dcfce7'
                              : appt.status === 'pending_confirmation'
                              ? '#fef3c7'
                              : appt.status === 'rejected'
                              ? '#fee2e2'
                              : '#e0f2fe',
                          color:
                            appt.status === 'scheduled'
                              ? '#166534'
                              : appt.status === 'pending_confirmation'
                              ? '#92400e'
                              : appt.status === 'rejected'
                              ? '#991b1b'
                              : '#0369a1',
                        }}
                      >
                        {appt.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      {appt.status === 'pending_confirmation' ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(appt, 'confirm')}
                            className="btn btn-sm btn-primary"
                            style={{ padding: '4px 8px', fontSize: 11.5 }}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(appt, 'propose_alternative')}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '4px 8px', fontSize: 11.5 }}
                          >
                            Propose Time
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(appt, 'reject')}
                            className="btn btn-sm btn-ghost"
                            style={{ padding: '4px 8px', fontSize: 11.5, color: '#dc2626' }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(appt, 'confirm')}
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: 11.5 }}
                        >
                          Update Slot
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {selectedAppt && actionType && (
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
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, color: 'var(--color-foreground)' }}>
              {actionType === 'confirm'
                ? 'Confirm & Schedule Priority Appointment'
                : actionType === 'propose_alternative'
                ? 'Propose Alternative Appointment Time'
                : 'Decline Priority Appointment Request'}
            </h3>

            {actionMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 14,
                  fontSize: 13,
                  backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
                }}
              >
                {actionMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {actionType === 'confirm' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label">Confirmed Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={confirmedDate}
                      onChange={e => setConfirmedDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Confirmed Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={confirmedTime}
                      onChange={e => setConfirmedTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {actionType === 'propose_alternative' && (
                <div>
                  <label className="form-label">Proposed Alternative Time Slot *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tomorrow at 15:00 IST or Friday 11:30 AM"
                    value={alternativeTime}
                    onChange={e => setAlternativeTime(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="form-label">Clinical / Admin Notes</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Notes sent to patient or internal records..."
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppt(null)
                    setActionType(null)
                  }}
                  className="btn btn-outline btn-sm"
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-sm ${actionType === 'reject' ? 'btn-ghost' : 'btn-primary'}`}
                  style={actionType === 'reject' ? { color: '#dc2626' } : {}}
                  disabled={submittingAction}
                >
                  {submittingAction ? 'Processing...' : 'Submit Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
