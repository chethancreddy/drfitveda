'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingMeetUrl, setEditingMeetUrl] = useState(false)
  const [meetUrlInput, setMeetUrlInput] = useState('')
  const [savingMeet, setSavingMeet] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadCustomer()
  }, [id])

  async function loadCustomer() {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data.customer)
        setMeetUrlInput(data.customer?.google_meet_url || '')
      }
    } catch {
      showToast('Failed to load customer profile')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function saveGoogleMeetUrl() {
    setSavingMeet(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_meet_url: meetUrlInput }),
      })
      if (!res.ok) throw new Error()
      setCustomer((prev: any) => ({ ...prev, google_meet_url: meetUrlInput }))
      showToast('Google Meet link updated successfully!')
      setEditingMeetUrl(false)
    } catch {
      showToast('Failed to save Google Meet link')
    }
    setSavingMeet(false)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    showToast('Link copied to clipboard!')
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <Link href="/admin/customers" className="btn btn-ghost btn-sm" style={{ marginBottom: 6 }}>
              ← Back to Customers
            </Link>
            <h1 className="text-headline-md">{customer?.full_name || 'Customer Profile'}</h1>
            <p className="text-body-md text-muted">
              {customer?.email || 'No email'} · {customer?.phone || 'No phone'}
            </p>
          </div>
          {customer && (
            <span className={`badge badge-${customer.is_active ? 'success' : 'neutral'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              {customer.is_active ? 'Active Patient' : 'Inactive'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-state">Loading customer details...</div>
        ) : !customer ? (
          <div className="empty-state">
            <p>Customer record not found.</p>
            <Link href="/admin/customers" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Return to Customer List
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* 🎥 Dedicated Google Meet Link Hero Card */}
            <div className="card" style={{
              padding: 'var(--space-lg)',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)',
              border: '2px solid var(--color-primary)',
            }}>
              <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>📹</span>
                    <h2 className="text-headline-sm" style={{ margin: 0 }}>Dedicated Google Meet Room</h2>
                    <span className="badge badge-primary" style={{ fontSize: 11 }}>Live Care Link</span>
                  </div>
                  <p className="text-body-sm text-muted" style={{ margin: '4px 0 12px', lineHeight: 1.5 }}>
                    This unique meeting link is assigned exclusively to <strong>{customer.full_name}</strong>. Their assigned doctor and trainer connect here for all live 1-on-1 consultations and training sessions.
                  </p>

                  {!editingMeetUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{
                        background: 'white',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'var(--color-primary)',
                      }}>
                        {customer.google_meet_url || 'No Google Meet URL set'}
                      </div>

                      {customer.google_meet_url && (
                        <>
                          <a
                            href={customer.google_meet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            🎥 Join Room
                          </a>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => copyToClipboard(customer.google_meet_url)}
                          >
                            📋 Copy Link
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setMeetUrlInput(customer.google_meet_url || '')
                          setEditingMeetUrl(true)
                        }}
                      >
                        ✏️ Change Link
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 600, flexWrap: 'wrap' }}>
                      <input
                        className="form-input"
                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                        value={meetUrlInput}
                        onChange={e => setMeetUrlInput(e.target.value)}
                        style={{ flex: 1, minWidth: 260 }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={saveGoogleMeetUrl}
                        disabled={savingMeet}
                      >
                        {savingMeet ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingMeetUrl(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Membership & Care Team */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-md)' }}>
              {/* Membership Details */}
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>💳</span>
                  <h3 className="text-headline-sm" style={{ margin: 0 }}>Membership &amp; Plan</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                    <span className="text-body-sm text-muted">Current Plan</span>
                    <strong>{customer.plan?.name || 'No Active Plan'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                    <span className="text-body-sm text-muted">Status</span>
                    <span className={`badge badge-${customer.membership_status === 'active' ? 'success' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                      {customer.membership_status}
                    </span>
                  </div>
                  {customer.plan && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                      <span className="text-body-sm text-muted">Duration &amp; Price</span>
                      <span>{customer.plan.duration_label} · <strong>₹{customer.plan.price?.toLocaleString('en-IN')}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Care Team */}
              <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>👨‍⚕️</span>
                    <h3 className="text-headline-sm" style={{ margin: 0 }}>Assigned Care Team</h3>
                  </div>
                  <Link href="/admin/assignments" className="btn btn-ghost btn-sm">
                    Reassign →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {customer.assignments && customer.assignments.length > 0 ? customer.assignments.map((pa: any) => (
                    <div key={pa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {pa.role.includes('doctor') ? '🩺' : '🏋️'} {pa.full_name}
                        </div>
                        <div className="text-caption text-muted" style={{ textTransform: 'capitalize' }}>
                          {pa.role.replace('_', ' ')} {pa.specialization ? `· ${pa.specialization}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: 11 }}>Active</span>
                    </div>
                  )) : (
                    <div className="text-body-sm text-muted" style={{ padding: 12, background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                      No professionals currently assigned.{' '}
                      <Link href="/admin/assignments" className="text-primary font-semibold">Assign a doctor or trainer</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Profile & Biometrics */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Health Profile &amp; Biometrics</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={{ padding: '10px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Gender</div>
                  <div className="text-body-md" style={{ textTransform: 'capitalize', fontWeight: 600, marginTop: 2 }}>
                    {customer.profile?.gender || 'Unspecified'}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Height</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>
                    {customer.profile?.height_cm ? `${customer.profile.height_cm} cm` : 'Not recorded'}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Weight</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>
                    {customer.profile?.weight_kg ? `${customer.profile.weight_kg} kg` : 'Not recorded'}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="text-label-md text-muted">Calculated BMI</div>
                  <div className="text-body-md" style={{ fontWeight: 600, marginTop: 2 }}>
                    {customer.profile?.bmi || '—'}
                  </div>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--color-neutral)', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                  <div className="text-label-md text-muted">Health Goals &amp; Onboarding Notes</div>
                  <div className="text-body-md" style={{ marginTop: 2 }}>
                    {customer.profile?.goals || 'Improve strength, vitality, and lifestyle adherence.'}
                  </div>
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
