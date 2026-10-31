'use client'

import { useState, useEffect } from 'react'

export interface DeleteModalProps {
  isOpen: boolean
  module?: string
  moduleKey?: string
  moduleLabel: string
  recordId: string
  recordName: string
  onClose: () => void
  onConfirm: (options?: { forceArchive?: boolean; reassignToId?: string; resolveActive?: boolean }) => Promise<void>
  reassignmentLabel?: string
  reassignmentOptions?: Array<{ id: string; label: string }>
}

interface DependencyInfo {
  module: string
  recordId: string
  recordName: string
  canPermanentDelete: boolean
  canSoftDelete: boolean
  blockingReasons: string[]
  linkedRecords: Array<{ label: string; count: number; blocking?: boolean }>
  recommendedAction: 'permanent_delete' | 'soft_delete' | 'blocked_requires_reassignment'
  consequenceWarning: string
}

export default function AdminRecordDeleteModal({
  isOpen,
  module,
  moduleKey,
  moduleLabel,
  recordId,
  recordName,
  onClose,
  onConfirm,
  reassignmentLabel,
  reassignmentOptions,
}: DeleteModalProps) {
  const activeModule = module || moduleKey || ''
  const [loading, setLoading] = useState(true)
  const [depInfo, setDepInfo] = useState<DependencyInfo | null>(null)
  const [confirmedCheck, setConfirmedCheck] = useState(false)
  const [resolveActive, setResolveActive] = useState(false)
  const [reassignToId, setReassignToId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !recordId || !activeModule) return
    setLoading(true)
    setConfirmedCheck(false)
    setResolveActive(false)
    setReassignToId(reassignmentOptions?.[0]?.id || '')
    setError(null)

    fetch(`/api/admin/dependencies?module=${encodeURIComponent(activeModule)}&id=${encodeURIComponent(recordId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.dependencyCheck) {
          setDepInfo(data.dependencyCheck)
        } else {
          setDepInfo({
            module: activeModule,
            recordId,
            recordName,
            canPermanentDelete: false,
            canSoftDelete: true,
            blockingReasons: [],
            linkedRecords: [],
            recommendedAction: 'soft_delete',
            consequenceWarning: 'This record will be safely archived or removed according to platform retention rules.',
          })
        }
      })
      .catch(() => {
        setDepInfo({
          module: activeModule,
          recordId,
          recordName,
          canPermanentDelete: false,
          canSoftDelete: true,
          blockingReasons: [],
          linkedRecords: [],
          recommendedAction: 'soft_delete',
          consequenceWarning: 'This record will be safely archived or removed according to platform retention rules.',
        })
      })
      .finally(() => setLoading(false))
  }, [isOpen, activeModule, recordId, recordName, reassignmentOptions])

  if (!isOpen) return null

  const isPermanent = depInfo?.recommendedAction === 'permanent_delete'
  const isBlocked = depInfo?.recommendedAction === 'blocked_requires_reassignment'

  async function handleConfirm() {
    if (!confirmedCheck) {
      setError('Please check the confirmation box before proceeding.')
      return
    }
    if (isBlocked && !resolveActive && !reassignToId) {
      setError('Please select a reassignment option or confirm resolving active assignments before proceeding.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onConfirm({
        forceArchive: !isPermanent,
        reassignToId: reassignToId || undefined,
        resolveActive,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 'var(--space-lg)',
          borderTop: `4px solid ${isPermanent ? '#dc2626' : '#f59e0b'}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{isPermanent ? '🗑️' : '📦'}</span>
              <h3 className="text-headline-sm" style={{ margin: 0 }}>
                {isPermanent ? 'Confirm Permanent Deletion' : 'Confirm Archive / Safe Removal'}
              </h3>
            </div>
            <div className="text-caption text-muted">
              Module: <strong>{moduleLabel}</strong> • Record ID: <code>{recordId}</code>
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            🔍 Inspecting database relationships and historical dependencies...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Target Record Card */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--color-neutral)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div className="text-caption text-muted">Target Record</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-on-surface)' }}>
                  {depInfo?.recordName || recordName}
                </div>
              </div>
              <span
                className={`badge ${isPermanent ? 'badge-error' : 'badge-warning'}`}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: isPermanent ? '#fee2e2' : '#fef3c7',
                  color: isPermanent ? '#991b1b' : '#92400e',
                }}
              >
                {isPermanent ? 'PERMANENT DELETE' : 'SOFT DELETE / ARCHIVE'}
              </span>
            </div>

            {/* Linked Dependencies Breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 6 }}>
                Linked Records &amp; Dependencies Check
              </div>
              {depInfo?.linkedRecords && depInfo.linkedRecords.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {depInfo.linkedRecords.map((lr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: lr.blocking ? '#fef2f2' : '#f8fafc',
                        border: `1px solid ${lr.blocking ? '#fecaca' : '#e2e8f0'}`,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: lr.blocking ? '#991b1b' : '#334155' }}>
                        {lr.blocking ? '⚠️ ' : '🔗 '}
                        {lr.label}
                      </span>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        {lr.count} record{lr.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: 13,
                  }}
                >
                  ✓ Zero historical or active dependencies detected. Safe for permanent removal.
                </div>
              )}
            </div>

            {/* Blocking Reassignment Options (if applicable) */}
            {isBlocked && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
                  Action Required for Active Assignments / Sessions:
                </div>
                {reassignmentOptions && reassignmentOptions.length > 0 && (
                  <label className="form-field" style={{ marginBottom: 8 }}>
                    <span className="form-label" style={{ fontSize: 12 }}>
                      Reassign active records to another professional/role:
                    </span>
                    <select
                      className="form-input"
                      value={reassignToId}
                      onChange={e => setReassignToId(e.target.value)}
                    >
                      <option value="">-- Select Reassignment Target (or Cancel Active below) --</option>
                      {reassignmentOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12.5 }}>
                  <input
                    type="checkbox"
                    checked={resolveActive}
                    onChange={e => setResolveActive(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    Automatically deactivate/cancel active assignments or upcoming sessions so historical records are preserved and this profile can be archived.
                  </span>
                </label>
              </div>
            )}

            {/* Consequence Warning Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: isPermanent ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${isPermanent ? '#fecaca' : '#cbd5e1'}`,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: isPermanent ? '#991b1b' : '#334155',
              }}
            >
              <strong>Consequence Warning:</strong> {depInfo?.consequenceWarning}
            </div>

            {/* Explicit Confirmation Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--color-neutral)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={confirmedCheck}
                onChange={e => setConfirmedCheck(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>
                I confirm that I want to {isPermanent ? 'permanently delete' : 'archive / soft-delete'}{' '}
                <strong>{depInfo?.recordName || recordName}</strong> and record this action in the Admin Audit Log.
              </span>
            </label>

            {error && (
              <div className="alert alert-error" style={{ fontSize: 12.5, padding: '8px 12px' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="flex justify-end" style={{ gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: isPermanent ? '#dc2626' : '#d97706',
                  borderColor: isPermanent ? '#dc2626' : '#d97706',
                }}
                onClick={handleConfirm}
                disabled={submitting || !confirmedCheck}
              >
                {submitting
                  ? 'Processing…'
                  : isPermanent
                    ? '🗑️ Permanently Delete'
                    : '📦 Archive / Soft Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

