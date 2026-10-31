import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
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

    const pros = mockDb.state.professionals || []
    const pro = pros.find((p: any) => p.id === id || p.user_id === id)
    if (!pro) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

    const dep = await inspectRecordDependencies('professionals', pro.id)
    const assignments = (mockDb.state.professional_assignments || []).filter(
      (a: any) => a.professional_id === pro.id
    )
    const appointments = (mockDb.state.appointments || []).filter(
      (a: any) => a.professional_id === pro.id
    )
    const payouts = ((mockDb.state as any).payouts || []).filter(
      (p: any) => p.professional_id === pro.id
    )

    return NextResponse.json({
      professional: pro,
      dependencyCheck: dep,
      assignments,
      appointments,
      payouts,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch professional' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams
    const body = await req.json()

    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id || p.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

    const prevStatus = pros[idx].is_archived
      ? 'archived'
      : pros[idx].is_active !== false
        ? 'active'
        : 'inactive'

    const updatedEmail =
      body.email !== undefined ? String(body.email).trim().toLowerCase() : pros[idx].email
    const updatedPhone =
      body.phone !== undefined ? String(body.phone).trim() : pros[idx].phone

    if (body.restore === true) {
      pros[idx] = {
        ...pros[idx],
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
    } else {
      pros[idx] = {
        ...pros[idx],
        ...body,
        email: updatedEmail,
        phone: updatedPhone,
        id: pros[idx].id,
        user_id: pros[idx].user_id,
        updated_at: new Date().toISOString(),
      }
      if (pros[idx].is_active === false) {
        pros[idx].is_available = false
      }
    }

    // Synchronize linked user_profiles entry
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    const userProfiles = mockDb.state.user_profiles
    const uIdx = userProfiles.findIndex((up: any) => up.id === pros[idx].user_id)
    if (uIdx !== -1) {
      userProfiles[uIdx] = {
        ...userProfiles[uIdx],
        full_name: pros[idx].full_name || userProfiles[uIdx].full_name,
        role: pros[idx].role || userProfiles[uIdx].role,
        email: updatedEmail ?? userProfiles[uIdx].email ?? '',
        phone: updatedPhone ?? userProfiles[uIdx].phone ?? '',
        is_active: pros[idx].is_active !== undefined ? pros[idx].is_active : userProfiles[uIdx].is_active,
        is_archived: Boolean(pros[idx].is_archived),
      }
    } else {
      userProfiles.push({
        id: pros[idx].user_id,
        role: pros[idx].role || 'doctor',
        full_name: pros[idx].full_name || 'Specialist',
        email: updatedEmail || '',
        phone: updatedPhone || '',
        is_active: pros[idx].is_active !== undefined ? pros[idx].is_active : true,
        is_archived: Boolean(pros[idx].is_archived),
        created_at: new Date().toISOString(),
      })
    }

    await savePersistedState(['professionals', 'user_profiles'])

    const newStatus = pros[idx].is_archived
      ? 'archived'
      : pros[idx].is_active !== false
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
      module: 'professionals',
      recordId: pros[idx].id,
      recordName: pros[idx].full_name,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ professional: pros[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams
    const { searchParams } = new URL(req.url)
    const reassignToId = searchParams.get('reassign_to_id')
    const resolveActive = searchParams.get('resolve_active') === 'true'
    const forceArchive = searchParams.get('mode') === 'archive'

    const pros = mockDb.state.professionals || []
    const idx = pros.findIndex((p: any) => p.id === id || p.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Professional not found' }, { status: 404 })

    const pro = pros[idx]
    const prevStatus = pro.is_archived ? 'archived' : pro.is_active !== false ? 'active' : 'inactive'
    const initialDep = await inspectRecordDependencies('professionals', pro.id)

    if (initialDep?.blockingReasons && initialDep.blockingReasons.length > 0) {
      if (!reassignToId && !resolveActive) {
        return NextResponse.json(
          {
            error: initialDep.blockingReasons.join(' '),
            blockingReasons: initialDep.blockingReasons,
            dependencyCheck: initialDep,
          },
          { status: 409 }
        )
      }

      const nowIso = new Date().toISOString()
      const nowMs = Date.now()

      if (reassignToId) {
        // Reassign active customer assignments and upcoming scheduled appointments/sessions
        for (const pa of mockDb.state.professional_assignments || []) {
          if (pa.professional_id === pro.id && pa.is_active !== false && !pa.is_archived) {
            pa.professional_id = reassignToId
            pa.updated_at = nowIso
          }
        }
        for (const appt of mockDb.state.appointments || []) {
          if (
            appt.professional_id === pro.id &&
            appt.status === 'scheduled' &&
            new Date(appt.scheduled_at).getTime() >= nowMs
          ) {
            appt.professional_id = reassignToId
            appt.updated_at = nowIso
          }
        }
        for (const sess of mockDb.state.training_sessions || []) {
          if (
            sess.trainer_id === pro.id &&
            sess.status === 'scheduled' &&
            new Date(sess.scheduled_at).getTime() >= nowMs
          ) {
            sess.trainer_id = reassignToId
            sess.updated_at = nowIso
          }
        }
      } else if (resolveActive) {
        // Deactivate active assignments and cancel upcoming scheduled sessions while preserving historical records
        for (const pa of mockDb.state.professional_assignments || []) {
          if (pa.professional_id === pro.id && pa.is_active !== false) {
            pa.is_active = false
            pa.updated_at = nowIso
          }
        }
        for (const appt of mockDb.state.appointments || []) {
          if (
            appt.professional_id === pro.id &&
            appt.status === 'scheduled' &&
            new Date(appt.scheduled_at).getTime() >= nowMs
          ) {
            appt.status = 'cancelled'
            appt.updated_at = nowIso
          }
        }
        for (const sess of mockDb.state.training_sessions || []) {
          if (
            sess.trainer_id === pro.id &&
            sess.status === 'scheduled' &&
            new Date(sess.scheduled_at).getTime() >= nowMs
          ) {
            sess.status = 'cancelled'
            sess.updated_at = nowIso
          }
        }
      }

      await savePersistedState(['professional_assignments', 'appointments', 'training_sessions'])
    }

    // Re-check dependencies after resolving active items
    const finalDep = await inspectRecordDependencies('professionals', pro.id)

    if (finalDep?.canPermanentDelete && !forceArchive) {
      pros.splice(idx, 1)
      if (mockDb.state.user_profiles) {
        mockDb.state.user_profiles = mockDb.state.user_profiles.filter(
          (up: any) => up.id !== pro.user_id
        )
      }
      await savePersistedState(['professionals', 'user_profiles'])

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'professionals',
        recordId: pro.id,
        recordName: pro.full_name,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Professional "${pro.full_name}" (${pro.id}) permanently deleted (0 dependencies).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `Professional "${pro.full_name}" permanently deleted.`,
      })
    }

    // Soft Delete / Archive — preserve historical consultations, assignments, and compensation records
    const nowIso = new Date().toISOString()
    pros[idx] = {
      ...pro,
      is_active: false,
      is_available: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    }
    if (mockDb.state.user_profiles) {
      const uIdx = mockDb.state.user_profiles.findIndex((up: any) => up.id === pro.user_id)
      if (uIdx !== -1) {
        mockDb.state.user_profiles[uIdx].is_active = false
        mockDb.state.user_profiles[uIdx].is_archived = true
      }
    }

    await savePersistedState(['professionals', 'user_profiles'])

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'professionals',
      recordId: pro.id,
      recordName: pro.full_name,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Professional "${pro.full_name}" (${pro.id}) archived safely to preserve historical consultations and compensation records.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      professional: pros[idx],
      message: `Professional "${pro.full_name}" archived safely. Historical records remain intact.`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to delete or archive professional' }, { status: 400 })
  }
}
