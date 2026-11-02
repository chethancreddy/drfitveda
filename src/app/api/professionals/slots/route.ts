import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

// GET /api/professionals/slots — returns professionals with capacity and customizable slot availability
export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const { searchParams } = new URL(req.url)
    const targetDate = searchParams.get('date') // YYYY-MM-DD
    const proIdFilter = searchParams.get('professional_id')

    const professionals = mockDb.state.professionals || []
    const assignments = mockDb.state.professional_assignments || []
    const appointments = mockDb.state.appointments || []

    let targetDayName = ''
    if (targetDate) {
      const parsedDate = new Date(`${targetDate}T12:00:00Z`)
      if (!isNaN(parsedDate.getTime())) {
        targetDayName = DAY_NAMES[parsedDate.getUTCDay()]
      }
    }

    const filteredPros = proIdFilter
      ? professionals.filter((p: any) => p.id === proIdFilter || p.user_id === proIdFilter)
      : professionals

    const enriched = filteredPros
      .filter((p: any) => p.is_active && !p.is_archived)
      .map((pro: any) => {
        // Active customer assignments count
        const activeAssignments = assignments.filter((a: any) => a.professional_id === pro.id && a.is_active)
        const currentCaseload = activeAssignments.length
        const maxCaseload = pro.max_caseload || 25
        const remainingCapacity = Math.max(0, maxCaseload - currentCaseload)
        const loadPercent = Math.min(100, Math.round((currentCaseload / maxCaseload) * 100))

        // Default fallback slots if nothing configured
        const fallbackSlots = [
          '07:00 AM - 08:00 AM',
          '08:00 AM - 09:00 AM',
          '10:00 AM - 11:00 AM',
          '04:00 PM - 05:00 PM',
          '06:00 PM - 07:00 PM',
        ]

        const workingDays = Array.isArray(pro.working_days) && pro.working_days.length > 0
          ? pro.working_days
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        const dayWiseSlots = pro.day_wise_slots || {
          Mon: pro.working_slots || fallbackSlots,
          Tue: pro.working_slots || fallbackSlots,
          Wed: pro.working_slots || fallbackSlots,
          Thu: pro.working_slots || fallbackSlots,
          Fri: pro.working_slots || fallbackSlots,
          Sat: ['08:00 AM - 12:00 PM'],
          Sun: [],
        }

        const blockedDates = Array.isArray(pro.blocked_dates) ? pro.blocked_dates : []
        const specialAvailability = Array.isArray(pro.special_availability) ? pro.special_availability : []

        let effectiveSlots: string[] = []
        let isDateBlocked = false
        let isSpecialDate = false

        if (targetDate) {
          if (blockedDates.includes(targetDate)) {
            isDateBlocked = true
            effectiveSlots = []
          } else {
            const special = specialAvailability.find((s: any) => s.date === targetDate)
            if (special && Array.isArray(special.slots)) {
              isSpecialDate = true
              effectiveSlots = special.slots
            } else if (targetDayName && workingDays.includes(targetDayName)) {
              effectiveSlots = dayWiseSlots[targetDayName] || pro.working_slots || fallbackSlots
            } else {
              effectiveSlots = []
            }
          }
        } else {
          // General / all configured slots
          effectiveSlots = pro.working_slots || fallbackSlots
        }

        // Identify already booked slots on targetDate to prevent double-bookings
        const bookedSlotsOnDate = appointments
          .filter((apt: any) => {
            if (apt.professional_id !== pro.id) return false
            if (apt.status === 'cancelled') return false
            if (targetDate) {
              const aptDate = (apt.appointment_date || apt.scheduled_at || '').split('T')[0]
              return aptDate === targetDate
            }
            return false
          })
          .map((apt: any) => apt.appointment_time || apt.time || '')
          .filter(Boolean)

        // Also check taken slots from active recurring assignments
        const takenAssignedSlots = activeAssignments.map((a: any) => a.assigned_slot).filter(Boolean)

        const freeSlots = effectiveSlots.filter(
          (slot: string) => !bookedSlotsOnDate.includes(slot) && (!targetDate ? !takenAssignedSlots.includes(slot) : true)
        )

        const isCurrentlyAvailable =
          Boolean(pro.is_available) &&
          !isDateBlocked &&
          remainingCapacity > 0 &&
          (targetDate ? freeSlots.length > 0 : true)

        return {
          id: pro.id,
          full_name: pro.full_name,
          role: pro.role,
          qualification: pro.qualification || '',
          specialization: pro.specialization || '',
          is_available: isCurrentlyAvailable,
          current_caseload: currentCaseload,
          max_caseload: maxCaseload,
          remaining_capacity: remainingCapacity,
          load_percent: loadPercent,
          status: isDateBlocked
            ? 'Blocked (Leave / Holiday)'
            : remainingCapacity === 0
            ? 'Full'
            : remainingCapacity <= 3
            ? 'Almost Full'
            : 'Available',
          working_days: workingDays,
          working_slots: pro.working_slots || fallbackSlots,
          day_wise_slots: dayWiseSlots,
          slot_duration_mins: pro.slot_duration_mins || 30,
          break_times: pro.break_times || [],
          blocked_dates: blockedDates,
          special_availability: specialAvailability,
          timezone: pro.timezone || 'Asia/Kolkata',
          is_date_blocked: isDateBlocked,
          is_special_date: isSpecialDate,
          effective_slots: effectiveSlots,
          booked_slots: bookedSlotsOnDate,
          free_slots: freeSlots,
        }
      })

    return NextResponse.json({
      success: true,
      target_date: targetDate || null,
      target_day: targetDayName || null,
      professionals: enriched,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch professional slots' }, { status: 500 })
  }
}
