'use client'

import { useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
type DayOfWeek = (typeof DAYS)[number]

const DEFAULT_SLOTS = [
  '07:00 AM - 09:00 AM',
  '11:00 AM - 01:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
]

interface AdminProfessionalAvailabilityModalProps {
  isOpen: boolean
  professional: any
  onClose: () => void
  onSaveSuccess: (updatedPro: any) => void
}

export default function AdminProfessionalAvailabilityModal({
  isOpen,
  professional,
  onClose,
  onSaveSuccess,
}: AdminProfessionalAvailabilityModalProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon')
  const [workingDays, setWorkingDays] = useState<string[]>(() => {
    return Array.isArray(professional?.working_days) && professional.working_days.length > 0
      ? professional.working_days
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  })

  const [dayWiseSlots, setDayWiseSlots] = useState<Record<string, string[]>>(() => {
    if (professional?.day_wise_slots) {
      return { ...professional.day_wise_slots }
    }
    const defaultSlots = professional?.working_slots || DEFAULT_SLOTS
    return {
      Mon: [...defaultSlots],
      Tue: [...defaultSlots],
      Wed: [...defaultSlots],
      Thu: [...defaultSlots],
      Fri: [...defaultSlots],
      Sat: ['08:00 AM - 12:00 PM'],
      Sun: [],
    }
  })

  const [slotDuration, setSlotDuration] = useState<number>(professional?.slot_duration_mins || 30)
  const [blockedDates, setBlockedDates] = useState<string[]>(() => {
    return Array.isArray(professional?.blocked_dates) ? [...professional.blocked_dates] : []
  })
  const [newBlockedDate, setNewBlockedDate] = useState('')

  // New slot entry inputs
  const [newSlotStart, setNewSlotStart] = useState('09:00 AM')
  const [newSlotEnd, setNewSlotEnd] = useState('11:00 AM')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<any[] | null>(null)

  if (!isOpen || !professional) return null

  const isCurrentDayActive = workingDays.includes(selectedDay)
  const currentSlots = dayWiseSlots[selectedDay] || []

  const toggleDayActive = (day: DayOfWeek) => {
    setWorkingDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  const addSlotToDay = (day: DayOfWeek) => {
    const formatted = `${newSlotStart.trim()} - ${newSlotEnd.trim()}`
    if (currentSlots.includes(formatted)) {
      setError(`Slot "${formatted}" is already added for ${day}.`)
      return
    }
    setError(null)
    setDayWiseSlots(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), formatted],
    }))
  }

  const removeSlotFromDay = (day: DayOfWeek, slotToRemove: string) => {
    setDayWiseSlots(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(s => s !== slotToRemove),
    }))
  }

  const copyToAllWeekdays = () => {
    const template = currentSlots
    setDayWiseSlots(prev => ({
      ...prev,
      Mon: [...template],
      Tue: [...template],
      Wed: [...template],
      Thu: [...template],
      Fri: [...template],
    }))
    setWorkingDays(prev => Array.from(new Set([...prev, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'])))
    setError(null)
  }

  const addBlockedDate = () => {
    if (!newBlockedDate) return
    if (blockedDates.includes(newBlockedDate)) {
      setError(`Date ${newBlockedDate} is already in the blocked list.`)
      return
    }
    setBlockedDates(prev => [...prev, newBlockedDate].sort())
    setNewBlockedDate('')
    setError(null)
  }

  const removeBlockedDate = (date: string) => {
    setBlockedDates(prev => prev.filter(d => d !== date))
  }

  const handleSave = async (confirmConflicts = false) => {
    setSaving(true)
    setError(null)
    setConflicts(null)

    try {
      const payload = {
        working_days: workingDays,
        day_wise_slots: dayWiseSlots,
        working_slots: dayWiseSlots[selectedDay] || DEFAULT_SLOTS,
        slot_duration_mins: Number(slotDuration),
        blocked_dates: blockedDates,
        confirm_conflicts: confirmConflicts,
      }

      const res = await fetch(`/api/professionals/${professional.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.status === 409 && data.has_conflicts) {
        setConflicts(data.conflicts || [])
        setError(data.error || 'Schedule conflicts with existing appointments.')
        setSaving(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update professional availability')
      }

      onSaveSuccess(data.professional || { ...professional, ...payload })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error saving availability slots')
    } finally {
      setSaving(false)
    }
  }

  return (
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
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 14,
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🗓️</span>
              <h2 className="text-headline-sm" style={{ margin: 0, fontSize: 19, color: '#0f172a' }}>
                Customize Availability Slots
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Configure customized working hours, multiple slot intervals, and holidays for{' '}
              <strong>{professional.full_name}</strong> ({professional.role.replace(/_/g, ' ')}).
            </p>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            style={{ fontSize: 16, color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              borderRadius: 8,
              marginBottom: 14,
              fontSize: 13,
            }}
          >
            <strong>⚠️ {error}</strong>
          </div>
        )}

        {/* Conflict Warning & Confirmation */}
        {conflicts && conflicts.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              background: '#fffbeb',
              border: '1.5px solid #fcd34d',
              color: '#92400e',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12.5,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Existing Confirmed Appointments Affected ({conflicts.length}):
            </div>
            <ul style={{ margin: '0 0 10px 0', paddingLeft: 18 }}>
              {conflicts.map((c, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  <strong>{c.customer_name}</strong>: {c.date} at {c.time} — {c.reason}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0 0 8px 0', fontSize: 12 }}>
              Existing appointments will <strong>NOT</strong> be deleted. Confirm below to update availability while preserving historical and current bookings.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{ background: '#d97706', borderColor: '#b45309' }}
            >
              {saving ? 'Saving...' : '✓ Confirm & Preserve Existing Appointments'}
            </button>
          </div>
        )}

        {/* General Settings: Duration */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '12px 14px',
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            marginBottom: 16,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              Slot Consultation Duration
            </label>
            <select
              value={slotDuration}
              onChange={e => setSlotDuration(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: 'white',
              }}
            >
              <option value={15}>15 Minutes per session</option>
              <option value={30}>30 Minutes (Standard)</option>
              <option value={45}>45 Minutes per session</option>
              <option value={60}>60 Minutes (Comprehensive)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              Specialist Timezone
            </label>
            <input
              type="text"
              readOnly
              value={professional.timezone || 'Asia/Kolkata (IST)'}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#f1f5f9',
                fontSize: 13,
                color: '#64748b',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Day-Wise Tabs */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Weekly Recurring Schedule:
          </div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
            {DAYS.map(day => {
              const active = workingDays.includes(day)
              const selected = selectedDay === day
              const slotCount = (dayWiseSlots[day] || []).length
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    flex: '1 0 70px',
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1.5px solid ${selected ? '#059669' : '#e2e8f0'}`,
                    background: selected ? '#ecfdf5' : active ? '#ffffff' : '#f8fafc',
                    color: selected ? '#047857' : active ? '#0f172a' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: 12.5,
                    fontWeight: selected ? 700 : 600,
                  }}
                >
                  <div>{day}</div>
                  <div style={{ fontSize: 11, color: active ? '#059669' : '#94a3b8' }}>
                    {active ? `${slotCount} slots` : 'Off'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div
          style={{
            padding: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isCurrentDayActive}
                onChange={() => toggleDayActive(selectedDay)}
              />
              Available on {selectedDay}
            </label>

            {isCurrentDayActive && currentSlots.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={copyToAllWeekdays}
                style={{ fontSize: 12, color: '#059669' }}
                title="Copy current slots to Mon, Tue, Wed, Thu, Fri"
              >
                📋 Copy to Mon–Fri
              </button>
            )}
          </div>

          {isCurrentDayActive ? (
            <div>
              {/* Existing Slots */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Configured Timing Slots ({currentSlots.length}):
                </span>
                {currentSlots.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>
                    No slots added yet for {selectedDay}. Add your first slot below.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {currentSlots.map(slot => (
                      <span
                        key={slot}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px',
                          background: '#f0fdf4',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        🕒 {slot}
                        <button
                          type="button"
                          onClick={() => removeSlotFromDay(selectedDay, slot)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#dc2626',
                            fontWeight: 700,
                            padding: '0 2px',
                          }}
                          title="Remove slot"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Slot Interval */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>From:</span>
                  <input
                    type="text"
                    value={newSlotStart}
                    onChange={e => setNewSlotStart(e.target.value)}
                    placeholder="07:00 AM"
                    style={{
                      width: 90,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>To:</span>
                  <input
                    type="text"
                    value={newSlotEnd}
                    onChange={e => setNewSlotEnd(e.target.value)}
                    placeholder="09:00 AM"
                    style={{
                      width: 90,
                      padding: '5px 8px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => addSlotToDay(selectedDay)}
                  style={{ height: 32, fontSize: 12 }}
                >
                  + Add Slot Interval
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {selectedDay} is currently configured as a regular day off for this specialist.
            </div>
          )}
        </div>

        {/* Blocked Dates / Holidays Section */}
        <div
          style={{
            padding: '14px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>
            🏖️ Blocked Dates / Holidays ({blockedDates.length})
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#c2410c' }}>
            Bookings will be completely disabled for this professional on blocked dates.
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input
              type="date"
              value={newBlockedDate}
              onChange={e => setNewBlockedDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #fed7aa',
                fontSize: 12.5,
                background: 'white',
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={addBlockedDate}
              disabled={!newBlockedDate}
              style={{ fontSize: 12 }}
            >
              + Block Date
            </button>
          </div>

          {blockedDates.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {blockedDates.map(date => (
                <span
                  key={date}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    background: '#ffffff',
                    border: '1px solid #fdba74',
                    color: '#c2410c',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  🚫 {date}
                  <button
                    type="button"
                    onClick={() => removeBlockedDate(date)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#dc2626',
                      fontWeight: 700,
                    }}
                    title="Remove blocked date"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? 'Saving Availability…' : 'Save Availability Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

