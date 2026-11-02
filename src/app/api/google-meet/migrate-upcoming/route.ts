import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, recordAdminAuditLog } from '@/lib/services/admin-record-governance'
import { GoogleMeetService } from '@/lib/services/google-meet.service'

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Only Admin can run migration.' }, { status: auth.status })
    }

    const result = await GoogleMeetService.migrateUpcomingZohoMeetings()

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'meeting_provider',
      recordId: 'zoho-to-google-meet-migration',
      recordName: 'Zoho to Google Meet Migration',
      previousStatus: 'zoho_meeting',
      newStatus: 'google_meet',
      actionType: 'update',
      detail: `Migrated ${result.migratedAppointments} upcoming appointments and ${result.migratedCustomers} active customers from Zoho to Google Meet. Historical Zoho records preserved for auditing.`,
    })

    return NextResponse.json({
      success: true,
      result,
      message: `Successfully migrated ${result.migratedAppointments} upcoming appointments and ${result.migratedCustomers} customers to Google Meet.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

