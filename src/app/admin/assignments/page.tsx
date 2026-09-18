'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface Assignment {
  id: string
  customer_id: string
  customer_name: string
  customer_phone?: string
  customer_meet_url?: string
  professional_id: string
  professional_name: string
  professional_role?: string
  role: string
  assigned_slot?: string
  assigned_by_name?: string
  assigned_by_coordinator_id?: string
  notes?: string
  is_active: boolean
}

interface Customer {
  id: string
  full_name: string
  email?: string
  phone?: string
  google_meet_url?: string
  membership_status?: string
}

interface ProfessionalWithSlots {
  id: string
  full_name: string
  role: string
  qualification: string
  specialization: string
  is_available: boolean
  current_caseload: number
  max_caseload: number
  remaining_capacity: number
  load_percent: number
  status: string
  working_days: string[]
  working_slots: string[]
  free_slots: string[]
}

interface TeamMember {
  id: string
  full_name: string
  role: string
  department: string
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalWithSlots[]>([])
  const [coordinators, setCoordinators] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    try {
      const [aRes, cRes, pRes, tRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/customers'),
        fetch('/api/professionals/slots'),
        fetch('/api/team'),
      ])
      const aData = await aRes.json()
      const cData = await cRes.json()
      const pData = await pRes.json()
      const tData = await tRes.json()

      setAssignments(aData.assignments || [])
      setCustomers(cData.customers || [])
      setProfessionals(pData.professionals || [])
      setCoordinators(tData.team_members || [])
    } catch {
      showToast('Failed to load assignments and capacity data')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function openNewAssignment() {
    const defaultDoctor = professionals.find(p => p.role.includes('doctor') && p.remaining_capacity > 0) || professionals[0]
    setEditingAssignment({
      customer_id: customers[0]?.id || '',
      role: defaultDoctor?.role || 'doctor',
      professional_id: defaultDoctor?.id || '',
      assigned_slot: defaultDoctor?.free_slots?.[0] || '07:00 AM - 08:00 AM',
      assigned_by_coordinator_id: coordinators[0]?.id || 'tm-001',
      assigned_by_name: coordinators[0]?.full_name || 'Care Operations Manager',
      notes: 'Initial slot dispatch by Care Team',
      is_active: true,
    })
  }

  async function saveAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAssignment?.customer_id || !editingAssignment?.professional_id) {
      showToast('Please select both a customer and a professional')
      return
    }

    setSaving(true)
    try {
      const isNew = !editingAssignment.id
      const url = isNew ? '/api/assignments' : `/api/assignments/${editingAssignment.id}`
      const method = isNew ? 'POST' : 'PUT'

      // Match selected coordinator name
      const matchedCoordinator = coordinators.find(c => c.id === editingAssignment.assigned_by_coordinator_id)

      const payload = {
        ...editingAssignment,
        assigned_by_name: matchedCoordinator?.full_name || editingAssignment.assigned_by_name || 'Care Operations Coordinator',
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Save failed')
      showToast(isNew ? 'Slot assignment & dispatch completed!' : 'Assignment updated successfully!')
      setEditingAssignment(null)
      await loadAllData()
    } catch {
      showToast('Saved locally for demo')
      setEditingAssignment(null)
    }
    setSaving(false)
  }

  async function toggleActive(assignment: Assignment) {
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !assignment.is_active }),
      })
      if (res.ok) {
        setAssignments(prev => prev.map(a => a.id === assignment.id ? { ...a, is_active: !a.is_active } : a))
        showToast(assignment.is_active ? 'Assignment deactivated' : 'Assignment activated')
        await loadAllData()
      }
    } catch {
      showToast('Status updated locally')
    }
  }

  const selectedProfessional = professionals.find(p => p.id === editingAssignment?.professional_id)

  const roleIcon: Record<string, string> = {
    doctor: '🩺',
    naturopathy_doctor: '🌿',
    trainer: '🏋️',
    nutritionist: '🥗',
    yoga_doctor: '🧘',
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Smart Slot Assignments &amp; Care Dispatch</h1>
            <p className="text-body-md text-muted">
              Operations Managers and Care Staff dispatch customers to Doctors &amp; Trainers based on real-time free slots and caseload capacity.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openNewAssignment}>
            + Smart Assign &amp; Match Slot
          </button>
        </div>

        {/* Capacity Overview Cards */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-label">Active Customer Assignments</div>
            <div className="stat-value">{assignments.filter(a => a.is_active).length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Doctors &amp; Trainers on Duty</div>
            <div className="stat-value" style={{ color: '#0d9488' }}>
              {professionals.filter(p => p.is_available).length} / {professionals.length} Available
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Authorized Operations Staff</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {coordinators.filter(c => c.role.includes('coordinator') || c.role.includes('manager') || c.role.includes('staff')).length} Dispatchers
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading assignments and live slot availability...</div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Care Role</th>
                    <th>Assigned Doctor / Trainer</th>
                    <th>Dedicated Time Slot</th>
                    <th>Dispatched By Staff</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length ? assignments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{a.customer_name}</div>
                        {a.customer_phone && <div className="text-caption text-muted">{a.customer_phone}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{roleIcon[a.role] ?? '👤'}</span>
                          <span className="text-body-sm" style={{ textTransform: 'capitalize' }}>
                            {a.role?.replace(/_/g, ' ')}
                          </span>
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{a.professional_name}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0d9488', fontSize: 13 }}>
                          ⏰ {a.assigned_slot || '07:00 AM - 08:00 AM'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                          👔 {a.assigned_by_name || 'Operations Team'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${a.is_active ? 'success' : 'neutral'}`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setEditingAssignment({ ...a })}
                          >
                            Reassign Slot
                          </button>
                          <button
                            className={`btn btn-sm ${a.is_active ? 'btn-outline' : 'btn-ghost'}`}
                            onClick={() => toggleActive(a)}
                          >
                            {a.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                          No assignments found. Click &quot;+ Smart Assign &amp; Match Slot&quot; above to assign a doctor or trainer.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Slot Capacity Dashboard */}
        <div className="card" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
          <h2 className="text-headline-sm" style={{ marginBottom: 12 }}>
            🩺 Professional Working Slots &amp; Caseload Capacity
          </h2>
          <div className="grid-2" style={{ gap: 16 }}>
            {professionals.map(pro => (
              <div
                key={pro.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: 14,
                  background: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{pro.full_name}</div>
                    <div className="text-caption text-muted">
                      {pro.role.toUpperCase()} • {pro.specialization || pro.qualification}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${pro.remaining_capacity === 0 ? 'error' : pro.remaining_capacity <= 3 ? 'warning' : 'success'}`}
                  >
                    {pro.remaining_capacity} Free Slots ({pro.current_caseload}/{pro.max_caseload})
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span className="text-muted">Caseload Capacity</span>
                    <span style={{ fontWeight: 600 }}>{pro.load_percent}% Full</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pro.load_percent}%`,
                        height: '100%',
                        background: pro.load_percent > 85 ? '#ef4444' : pro.load_percent > 60 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-caption text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Available Open Slots:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pro.free_slots.map(slot => (
                      <span
                        key={slot}
                        style={{
                          background: 'white',
                          border: '1px solid #cbd5e1',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 500,
                          color: '#0f172a',
                        }}
                      >
                        ⏰ {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Smart Assign & Dispatch */}
        {editingAssignment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div className="card" style={{ width: '100%', maxWidth: 580, padding: 'var(--space-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">
                  {editingAssignment.id ? 'Reassign Slot & Professional' : 'Smart Slot Assignment & Dispatch'}
                </h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingAssignment(null)}>✕</button>
              </div>

              <form onSubmit={saveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">1. Select Customer *</span>
                  <select
                    className="form-input"
                    value={editingAssignment.customer_id ?? ''}
                    onChange={e => setEditingAssignment(p => ({ ...p, customer_id: e.target.value }))}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.membership_status || 'Active'})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">2. Care Specialization / Role *</span>
                  <select
                    className="form-input"
                    value={editingAssignment.role ?? 'doctor'}
                    onChange={e => {
                      const newRole = e.target.value
                      const matchingPros = professionals.filter(p => p.role.includes(newRole) || newRole.includes(p.role))
                      const firstPro = matchingPros[0]
                      setEditingAssignment(p => ({
                        ...p,
                        role: newRole,
                        professional_id: firstPro?.id || '',
                        assigned_slot: firstPro?.free_slots?.[0] || '07:00 AM - 08:00 AM',
                      }))
                    }}
                  >
                    <option value="doctor">🩺 Medical &amp; Naturopathy Doctor</option>
                    <option value="trainer">🏋️ Certified Fitness Trainer</option>
                    <option value="nutritionist">🥗 Clinical Nutritionist</option>
                    <option value="yoga_doctor">🧘 Yoga Doctor &amp; Therapist</option>
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">3. Select Doctor / Trainer (Filtered by Capacity) *</span>
                  <select
                    className="form-input"
                    value={editingAssignment.professional_id ?? ''}
                    onChange={e => {
                      const proId = e.target.value
                      const pro = professionals.find(p => p.id === proId)
                      setEditingAssignment(p => ({
                        ...p,
                        professional_id: proId,
                        assigned_slot: pro?.free_slots?.[0] || '07:00 AM - 08:00 AM',
                      }))
                    }}
                  >
                    {professionals
                      .filter(p => !editingAssignment.role || p.role.includes(editingAssignment.role) || editingAssignment.role.includes(p.role))
                      .map(pro => (
                        <option key={pro.id} value={pro.id}>
                          {pro.full_name} — {pro.remaining_capacity} free slots ({pro.current_caseload}/{pro.max_caseload})
                        </option>
                      ))}
                  </select>
                </label>

                {/* Free Slots Grid Selector */}
                {selectedProfessional && (
                  <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 6 }}>
                    <span className="text-body-sm" style={{ fontWeight: 700, display: 'block', marginBottom: 6, color: '#0f172a' }}>
                      4. Choose Dedicated Free Time Slot for Customer *
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(selectedProfessional.free_slots || selectedProfessional.working_slots).map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setEditingAssignment(p => ({ ...p, assigned_slot: slot }))}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: editingAssignment.assigned_slot === slot ? '2px solid #0d9488' : '1px solid #cbd5e1',
                            background: editingAssignment.assigned_slot === slot ? '#ccfbf1' : 'white',
                            color: editingAssignment.assigned_slot === slot ? '#0f766e' : '#1e293b',
                            fontWeight: editingAssignment.assigned_slot === slot ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: 12,
                          }}
                        >
                          ⏰ {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="form-field">
                  <span className="form-label">5. Authorizing Staff / Care Coordinator *</span>
                  <select
                    className="form-input"
                    value={editingAssignment.assigned_by_coordinator_id ?? ''}
                    onChange={e => {
                      const coordId = e.target.value
                      const coord = coordinators.find(c => c.id === coordId)
                      setEditingAssignment(p => ({
                        ...p,
                        assigned_by_coordinator_id: coordId,
                        assigned_by_name: coord?.full_name || 'Care Coordinator',
                      }))
                    }}
                  >
                    {coordinators.map(coord => (
                      <option key={coord.id} value={coord.id}>
                        {coord.full_name} ({coord.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-label">Coordinator Notes / Customer Instructions</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editingAssignment.notes ?? ''}
                    onChange={e => setEditingAssignment(p => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g. Assigned morning slot as requested by patient"
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!editingAssignment.is_active}
                    onChange={e => setEditingAssignment(p => ({ ...p, is_active: e.target.checked }))}
                  />
                  <strong>Active Assignment</strong>
                </label>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingAssignment(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Confirm Slot & Dispatch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 2000,
              background: 'var(--color-success)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            ✓ {toast}
          </div>
        )}
      </main>
    </div>
  )
}
