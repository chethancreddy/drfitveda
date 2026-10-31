import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { triggerCustomerAssignmentNotifications } from '@/lib/services/whatsapp-notification.service'
import {
  inspectRecordDependencies,
  recordAdminAuditLog,
  verifyAdminAccess,
} from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await loadPersistedState()
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const assignments = mockDb.state.professional_assignments || []
    const assign = assignments.find((a: any) => a.id === id)
    if (!assign) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    const dep = await inspectRecordDependencies('assignments', id)
    return NextResponse.json({ assignment: assign, dependencyCheck: dep })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, [
      'admin',
      'super_admin',
      'operations_manager',
      'care_coordinator',
      'staff',
    ])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const body = await req.json()
    const assignments = mockDb.state.professional_assignments || []
    const idx = assignments.findIndex((a: any) => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    const previousProfessionalId = assignments[idx].professional_id
    const wasActive = assignments[idx].is_active !== false && !assignments[idx].is_archived
    const prevStatus = assignments[idx].is_archived
      ? 'archived'
      : assignments[idx].is_active !== false
        ? 'active'
        : 'inactive'

    if (body.restore === true) {
      assignments[idx] = {
        ...assignments[idx],
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
    } else {
      assignments[idx] = {
        ...assignments[idx],
        ...body,
        id: assignments[idx].id,
        updated_at: new Date().toISOString(),
      }
    }

    await savePersistedState('professional_assignments')

    let whatsappNotification = null
    if (
      assignments[idx].is_active !== false &&
      !assignments[idx].is_archived &&
      (previousProfessionalId !== assignments[idx].professional_id || !wasActive)
    ) {
      const notifRes = await triggerCustomerAssignmentNotifications({
        customerId: assignments[idx].customer_id,
        professionalId: assignments[idx].professional_id,
        role: assignments[idx].role,
        assignmentId: assignments[idx].id,
        assignedSlot: assignments[idx].assigned_slot,
        previousProfessionalId:
          previousProfessionalId !== assignments[idx].professional_id ? previousProfessionalId : null,
      })
      whatsappNotification = notifRes.created
    } else if (assignments[idx].is_active === false && Array.isArray(mockDb.state.whatsapp_notifications)) {
      for (const n of mockDb.state.whatsapp_notifications) {
        if (n.assignment_id === id && n.delivery_status === 'Pending') {
          n.delivery_status = 'Cancelled'
          n.error_details = 'Assignment deactivated.'
          n.updated_at = new Date().toISOString()
        }
      }
      await savePersistedState('whatsapp_notifications')
    }

    const newStatus = assignments[idx].is_archived
      ? 'archived'
      : assignments[idx].is_active !== false
        ? 'active'
        : 'inactive'

    const actionType =
      body.restore === true
        ? 'restore'
        : prevStatus !== newStatus
          ? newStatus === 'active'
            ? 'activate'
            : newStatus === 'archived'
              ? 'archive'
              : 'deactivate'
          : 'update'

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'assignments',
      recordId: assignments[idx].id,
      recordName: `${assignments[idx].customer_id} ↔ ${assignments[idx].professional_id}`,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ assignment: assignments[idx], whatsappNotification, success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, [
      'admin',
      'super_admin',
      'operations_manager',
      'care_coordinator',
      'staff',
    ])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams
    const { searchParams } = new URL(req.url)
    const forceArchive = searchParams.get('mode') === 'archive'

    const assignments = mockDb.state.professional_assignments || []
    const idx = assignments.findIndex((a: any) => a.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

    const target = assignments[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const dep = await inspectRecordDependencies('assignments', id)
    const recordName = dep?.recordName || id

    // Cancel any pending WhatsApp dispatch notification for this assignment
    if (Array.isArray(mockDb.state.whatsapp_notifications)) {
      for (const n of mockDb.state.whatsapp_notifications) {
        if (n.assignment_id === id && n.delivery_status === 'Pending') {
          n.delivery_status = 'Cancelled'
          n.error_details = 'Assignment removed.'
          n.updated_at = new Date().toISOString()
        }
      }
      await savePersistedState('whatsapp_notifications')
    }

    if (dep?.canPermanentDelete && !forceArchive) {
      assignments.splice(idx, 1)
      await savePersistedState('professional_assignments')

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'assignments',
        recordId: id,
        recordName,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Slot assignment "${recordName}" permanently deleted (0 linked appointments/consultations/payouts).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: 'Slot assignment permanently deleted.',
      })
    }

    // Soft Delete / Archive — preserve all linked appointments, consultations, notifications, and payouts
    const nowIso = new Date().toISOString()
    assignments[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    }
    await savePersistedState('professional_assignments')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'assignments',
      recordId: id,
      recordName,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Slot assignment "${recordName}" archived safely without removing linked appointments or historical consultations.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      assignment: assignments[idx],
      message: 'Assignment archived safely. Linked appointments and consultations remain intact.',
    })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
