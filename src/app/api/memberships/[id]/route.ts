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

    const plans: any[] = mockDb.state.memberships ?? []
    const plan = plans.find((m: any) => m.id === id)
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dep = await inspectRecordDependencies('memberships', id)
    return NextResponse.json({ membership: plan, dependencyCheck: dep })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
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

    const plans: any[] = mockDb.state.memberships ?? []
    const idx = plans.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prevStatus = plans[idx].is_archived
      ? 'archived'
      : plans[idx].is_active !== false
        ? 'active'
        : 'inactive'

    if (body.restore === true) {
      plans[idx] = {
        ...plans[idx],
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
    } else {
      plans[idx] = {
        ...plans[idx],
        ...body,
        id,
        created_at: plans[idx].created_at,
        updated_at: new Date().toISOString(),
      }
    }

    await savePersistedState('memberships')

    const newStatus = plans[idx].is_archived
      ? 'archived'
      : plans[idx].is_active !== false
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
      module: 'memberships',
      recordId: id,
      recordName: plans[idx].name,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ membership: plans[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
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

    const plans: any[] = mockDb.state.memberships ?? []
    const idx = plans.findIndex((m: any) => m.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const target = plans[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const dep = await inspectRecordDependencies('memberships', id)

    if (dep?.canPermanentDelete && !forceArchive) {
      plans.splice(idx, 1)
      await savePersistedState('memberships')

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'memberships',
        recordId: id,
        recordName: target.name,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Membership plan "${target.name}" permanently deleted (0 subscribers/orders).`,
      })

      return NextResponse.json({
        ok: true,
        success: true,
        deleted: true,
        archived: false,
        message: `Membership plan "${target.name}" permanently deleted.`,
      })
    }

    // Soft-delete / Archive — preserve historical subscriptions and invoices
    const nowIso = new Date().toISOString()
    plans[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    }
    await savePersistedState('memberships')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'memberships',
      recordId: id,
      recordName: target.name,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Membership plan "${target.name}" archived safely. Existing subscribers retain historical plan details.`,
    })

    return NextResponse.json({
      ok: true,
      success: true,
      deleted: false,
      archived: true,
      membership: plans[idx],
      message: `Membership plan "${target.name}" archived safely.`,
    })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
