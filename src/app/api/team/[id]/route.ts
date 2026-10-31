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

    const members = mockDb.state.team_members || []
    const member = members.find((m: any) => m.id === id || m.user_id === id)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const dep = await inspectRecordDependencies('team', member.id)
    const dispatched = (mockDb.state.professional_assignments || []).filter(
      (a: any) => a.assigned_by_coordinator_id === member.id || a.assigned_by_name === member.full_name
    )

    return NextResponse.json({
      member,
      dependencyCheck: dep,
      dispatched_assignments: dispatched,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch member' }, { status: 500 })
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

    const members = mockDb.state.team_members || []
    const idx = members.findIndex((m: any) => m.id === id || m.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const prevStatus = members[idx].is_archived
      ? 'archived'
      : members[idx].is_active !== false
        ? 'active'
        : 'inactive'

    const nowIso = new Date().toISOString()

    if (body.restore === true) {
      members[idx] = {
        ...members[idx],
        is_archived: false,
        deleted_at: null,
        access_revoked_at: null,
        is_active: true,
        updated_at: nowIso,
      }
    } else {
      members[idx] = {
        ...members[idx],
        ...body,
        id: members[idx].id,
        updated_at: nowIso,
      }
      if (members[idx].is_active === false) {
        members[idx].access_revoked_at = nowIso
      } else {
        members[idx].access_revoked_at = null
      }
    }

    // Synchronize user_profiles to enforce immediate access revocation or restoration
    if (!mockDb.state.user_profiles) mockDb.state.user_profiles = []
    const uIdx = mockDb.state.user_profiles.findIndex(
      (up: any) =>
        (members[idx].user_id && up.id === members[idx].user_id) ||
        (members[idx].email && up.email?.toLowerCase() === members[idx].email.toLowerCase())
    )
    if (uIdx !== -1) {
      mockDb.state.user_profiles[uIdx] = {
        ...mockDb.state.user_profiles[uIdx],
        full_name: members[idx].full_name,
        email: members[idx].email,
        phone: members[idx].phone || '',
        role: members[idx].role,
        is_active: members[idx].is_active !== false && !members[idx].is_archived,
        is_archived: Boolean(members[idx].is_archived),
        updated_at: nowIso,
      }
    }

    await savePersistedState(['team_members', 'user_profiles'])

    const newStatus = members[idx].is_archived
      ? 'archived'
      : members[idx].is_active !== false
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
      module: 'team',
      recordId: members[idx].id,
      recordName: members[idx].full_name,
      previousStatus: prevStatus,
      newStatus,
      actionType,
      detail:
        newStatus === 'inactive' || newStatus === 'archived'
          ? `Staff member "${members[idx].full_name}" ${actionType}d and system dispatch permissions revoked.`
          : `Staff member "${members[idx].full_name}" ${actionType}d.`,
    })

    return NextResponse.json({ success: true, member: members[idx] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update member' }, { status: 400 })
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
    const forceArchive = searchParams.get('mode') === 'archive'

    const members = mockDb.state.team_members || []
    const idx = members.findIndex((m: any) => m.id === id || m.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const target = members[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const dep = await inspectRecordDependencies('team', target.id)
    const nowIso = new Date().toISOString()

    if (dep?.canPermanentDelete && !forceArchive) {
      members.splice(idx, 1)
      if (mockDb.state.user_profiles) {
        mockDb.state.user_profiles = mockDb.state.user_profiles.filter(
          (up: any) =>
            up.id !== target.user_id &&
            (!target.email || up.email?.toLowerCase() !== target.email.toLowerCase())
        )
      }
      await savePersistedState(['team_members', 'user_profiles'])

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'team',
        recordId: target.id,
        recordName: target.full_name,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Staff member "${target.full_name}" permanently deleted and access revoked (0 historical dispatch records).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `Staff member "${target.full_name}" permanently deleted and access revoked.`,
      })
    }

    // Soft Delete / Archive — preserve historical dispatch attribution while revoking access
    members[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      access_revoked_at: nowIso,
      updated_at: nowIso,
    }

    if (mockDb.state.user_profiles) {
      const uIdx = mockDb.state.user_profiles.findIndex(
        (up: any) =>
          (target.user_id && up.id === target.user_id) ||
          (target.email && up.email?.toLowerCase() === target.email.toLowerCase())
      )
      if (uIdx !== -1) {
        mockDb.state.user_profiles[uIdx].is_active = false
        mockDb.state.user_profiles[uIdx].is_archived = true
        mockDb.state.user_profiles[uIdx].updated_at = nowIso
      }
    }

    await savePersistedState(['team_members', 'user_profiles'])

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'team',
      recordId: target.id,
      recordName: target.full_name,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Staff member "${target.full_name}" archived safely and access revoked. Historical dispatch records preserved.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      member: members[idx],
      message: `Staff member "${target.full_name}" archived and access revoked.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete member' }, { status: 400 })
  }
}
