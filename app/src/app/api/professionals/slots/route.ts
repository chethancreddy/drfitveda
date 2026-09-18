import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'

// GET /api/professionals/slots — returns professionals with capacity and free slot availability
export async function GET(req: NextRequest) {
  try {
    const professionals = mockDb.state.professionals || []
    const assignments = mockDb.state.professional_assignments || []

    const enriched = professionals
      .filter((p: any) => p.is_active)
      .map((pro: any) => {
        // Count active customer assignments
        const activeAssignments = assignments.filter((a: any) => a.professional_id === pro.id && a.is_active)
        const currentCaseload = activeAssignments.length
        const maxCaseload = pro.max_caseload || 25
        const remainingCapacity = Math.max(0, maxCaseload - currentCaseload)
        const loadPercent = Math.min(100, Math.round((currentCaseload / maxCaseload) * 100))

        // Get assigned slots currently taken
        const takenSlots = activeAssignments.map((a: any) => a.assigned_slot).filter(Boolean)
        const allSlots = pro.working_slots || [
          '07:00 AM - 08:00 AM',
          '08:00 AM - 09:00 AM',
          '10:00 AM - 11:00 AM',
          '04:00 PM - 05:00 PM',
          '06:00 PM - 07:00 PM',
        ]

        // Available free slots
        const freeSlots = allSlots.filter((slot: string) => !takenSlots.includes(slot))

        return {
          id: pro.id,
          full_name: pro.full_name,
          role: pro.role,
          qualification: pro.qualification || '',
          specialization: pro.specialization || '',
          is_available: pro.is_available && remainingCapacity > 0,
          current_caseload: currentCaseload,
          max_caseload: maxCaseload,
          remaining_capacity: remainingCapacity,
          load_percent: loadPercent,
          status: remainingCapacity === 0 ? 'Full' : remainingCapacity <= 3 ? 'Almost Full' : 'Available',
          working_days: pro.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          working_slots: allSlots,
          free_slots: freeSlots.length > 0 ? freeSlots : allSlots, // fallback to all if flexible
        }
      })

    return NextResponse.json({
      success: true,
      professionals: enriched,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch professional slots' }, { status: 500 })
  }
}
