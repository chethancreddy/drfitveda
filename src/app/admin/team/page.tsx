'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface TeamMember {
  id: string
  user_id?: string
  full_name: string
  email: string
  phone: string
  role: string
  department: string
  shift: string
  assigned_region: string
  is_active: boolean
  created_at?: string
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)
    try {
      const res = await fetch('/api/team')
      const data = await res.json()
      setMembers(data.team_members || [])
    } catch {
      showToast('Failed to load team members')
    }
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  function openNewMember() {
    setEditingMember({
      full_name: '',
      email: '',
      phone: '',
      role: 'care_coordinator',
      department: 'Patient Onboarding & Slot Dispatch',
      shift: 'General (09:00 AM - 06:00 PM)',
      assigned_region: 'National / All India',
      is_active: true,
    })
  }

  async function saveMember(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMember?.full_name || !editingMember?.email) {
      showToast('Name and Email are required')
      return
    }

    setSaving(true)
    try {
      const isNew = !editingMember.id
      const url = isNew ? '/api/team' : `/api/team/${editingMember.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
      })

      if (!res.ok) throw new Error('Failed to save member')
      showToast(isNew ? 'Staff member added successfully!' : 'Staff profile updated!')
      setEditingMember(null)
      await loadTeam()
    } catch (err: any) {
      showToast(err.message || 'Error saving team member')
    }
    setSaving(false)
  }

  async function toggleActive(member: TeamMember) {
    try {
      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !member.is_active }),
      })
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m))
        showToast(member.is_active ? 'Staff member deactivated' : 'Staff member activated')
      }
    } catch {
      showToast('Error toggling status')
    }
  }

  const roleLabel: Record<string, string> = {
    operations_manager: 'Care Operations Manager',
    care_coordinator: 'Care Coordinator / Dispatcher',
    staff: 'Operations Staff',
    doctor_lead: 'Clinical Doctor Lead',
    trainer_lead: 'Master Trainer Lead',
  }

  const roleBadge: Record<string, string> = {
    operations_manager: 'primary',
    care_coordinator: 'success',
    staff: 'info',
    doctor_lead: 'warning',
    trainer_lead: 'secondary',
  }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Operations Team &amp; Care Staff</h1>
            <p className="text-body-md text-muted">
              Add managers, care coordinators, and staff authorized to dispatch and assign customers to doctors and trainers.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openNewMember}>
            + Add Staff / Coordinator
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-label">Total Team Members</div>
            <div className="stat-value">{members.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Coordinators</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {members.filter(m => m.is_active && m.role === 'care_coordinator').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Operations Managers</div>
            <div className="stat-value" style={{ color: '#0d9488' }}>
              {members.filter(m => m.is_active && m.role === 'operations_manager').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Authorized Dispatchers</div>
            <div className="stat-value">{members.filter(m => m.is_active).length}</div>
          </div>
        </div>

        {/* Team Table */}
        {loading ? (
          <div className="empty-state">Loading team members...</div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name &amp; Contact</th>
                    <th>Role &amp; Title</th>
                    <th>Department</th>
                    <th>Shift &amp; Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length ? members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
                        <div className="text-caption text-muted">{m.email} • {m.phone || 'No phone'}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${roleBadge[m.role] || 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {roleLabel[m.role] || m.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-body-sm">{m.department}</td>
                      <td>
                        <div className="text-body-sm">{m.shift}</div>
                        <div className="text-caption text-muted">{m.assigned_region}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${m.is_active ? 'success' : 'neutral'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingMember({ ...m })}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn btn-sm ${m.is_active ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => toggleActive(m)}
                          >
                            {m.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                          No staff members found. Click &quot;+ Add Staff / Coordinator&quot; above to create your team.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="alert alert-info" style={{ marginTop: 'var(--space-md)' }}>
          <span>ℹ️</span>
          <span>
            <strong>Role Permissions:</strong> Operations Managers and Care Coordinators have authorization to assign customers to Doctors and Trainers based on their open working slots and active caseload capacity.
          </span>
        </div>

        {/* Modal: Add / Edit Staff */}
        {editingMember && (
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
            <div className="card" style={{ width: '100%', maxWidth: 540, padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                <h2 className="text-headline-sm">
                  {editingMember.id ? 'Edit Staff / Coordinator' : 'Add New Staff / Executive'}
                </h2>
                <button className="btn btn-icon btn-ghost" onClick={() => setEditingMember(null)}>✕</button>
              </div>

              <form onSubmit={saveMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label className="form-field">
                  <span className="form-label">Full Name *</span>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingMember.full_name ?? ''}
                    onChange={e => setEditingMember(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="e.g. Kavita Rao"
                  />
                </label>

                <div className="grid-2" style={{ gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Email Address *</span>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={editingMember.email ?? ''}
                      onChange={e => setEditingMember(p => ({ ...p, email: e.target.value }))}
                      placeholder="kavita@drfitveda.com"
                    />
                  </label>

                  <label className="form-field">
                    <span className="form-label">Phone Number</span>
                    <input
                      type="tel"
                      className="form-input"
                      value={editingMember.phone ?? ''}
                      onChange={e => setEditingMember(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98111 22334"
                    />
                  </label>
                </div>

                <div className="grid-2" style={{ gap: 12 }}>
                  <label className="form-field">
                    <span className="form-label">Role Designation *</span>
                    <select
                      className="form-input"
                      value={editingMember.role ?? 'care_coordinator'}
                      onChange={e => setEditingMember(p => ({ ...p, role: e.target.value }))}
                    >
                      <option value="care_coordinator">Care Coordinator / Dispatcher</option>
                      <option value="operations_manager">Operations Manager</option>
                      <option value="staff">Operations Staff</option>
                      <option value="doctor_lead">Clinical Doctor Lead</option>
                      <option value="trainer_lead">Master Trainer Lead</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-label">Working Shift</span>
                    <select
                      className="form-input"
                      value={editingMember.shift ?? 'General (09:00 AM - 06:00 PM)'}
                      onChange={e => setEditingMember(p => ({ ...p, shift: e.target.value }))}
                    >
                      <option value="Morning (07:00 AM - 03:00 PM)">Morning (07:00 AM - 03:00 PM)</option>
                      <option value="General (09:00 AM - 06:00 PM)">General (09:00 AM - 06:00 PM)</option>
                      <option value="Evening (01:00 PM - 09:00 PM)">Evening (01:00 PM - 09:00 PM)</option>
                    </select>
                  </label>
                </div>

                <label className="form-field">
                  <span className="form-label">Department</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editingMember.department ?? ''}
                    onChange={e => setEditingMember(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. Patient Onboarding & Slot Dispatch"
                  />
                </label>

                <label className="form-field">
                  <span className="form-label">Assigned Region / Scope</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editingMember.assigned_region ?? ''}
                    onChange={e => setEditingMember(p => ({ ...p, assigned_region: e.target.value }))}
                    placeholder="e.g. South & West Zones"
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={!!editingMember.is_active}
                    onChange={e => setEditingMember(p => ({ ...p, is_active: e.target.checked }))}
                  />
                  <strong>Active &amp; Authorized to Dispatch</strong>
                </label>

                <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingMember(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Staff Profile'}
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
