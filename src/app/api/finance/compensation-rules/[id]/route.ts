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
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
    }

    await loadPersistedState()
    const { id } = await Promise.resolve(context.params)

    const rules: any[] = (mockDb.state as any).compensation_rule_versions || []
    const rule = rules.find(r => r.id === id)
    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

    const comps = ((mockDb.state as any).payout_rule_components || []).filter(
      (c: any) => c.rule_version_id === id
    )
    const dep = await inspectRecordDependencies('compensation_rules', id)

    return NextResponse.json({
      rule: { ...rule, payout_rule_components: comps },
      dependencyCheck: dep,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
    }

    await loadPersistedState()
    const { id } = await Promise.resolve(context.params)
    const body = await req.json()

    const rules: any[] = (mockDb.state as any).compensation_rule_versions || []
    const idx = rules.findIndex(r => r.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

    const existing = rules[idx]
    const prevStatus = existing.is_archived
      ? 'archived'
      : existing.is_active !== false
        ? 'active'
        : 'inactive'
    const nowIso = new Date().toISOString()

    if (body.restore === true) {
      rules[idx] = {
        ...existing,
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: nowIso,
      }
    } else {
      rules[idx] = {
        ...existing,
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        effective_from: body.effective_from !== undefined ? body.effective_from : existing.effective_from,
        effective_to: body.effective_to !== undefined ? body.effective_to || null : existing.effective_to,
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active,
        is_archived: body.is_archived !== undefined ? Boolean(body.is_archived) : Boolean(existing.is_archived),
        updated_at: nowIso,
      }
    }

    // Update payout_rule_components for this rule if provided (never touching historical financial_transactions or payouts)
    if (Array.isArray(body.components)) {
      const otherComps = ((mockDb.state as any).payout_rule_components || []).filter(
        (c: any) => c.rule_version_id !== id
      )
      const updatedComps = body.components.map((c: any, cIdx: number) => ({
        id: c.id || `prc-${Date.now()}-${cIdx}`,
        rule_version_id: id,
        component_code: c.component_code || `comp_${cIdx + 1}`,
        component_name: c.component_name || c.component_code || `Component ${cIdx + 1}`,
        role: c.role || null,
        amount_type: c.amount_type || 'fixed',
        amount: Number(c.amount || 0),
        applicability: c.applicability || null,
        is_active: c.is_active !== undefined ? Boolean(c.is_active) : true,
        updated_at: nowIso,
      }))
      ;(mockDb.state as any).payout_rule_components = [...otherComps, ...updatedComps]
    }

    await savePersistedState(['compensation_rule_versions', 'payout_rule_components'])

    const newStatus = rules[idx].is_archived
      ? 'archived'
      : rules[idx].is_active !== false
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
      module: 'compensation_rules',
      recordId: id,
      recordName: rules[idx].name,
      previousStatus: prevStatus,
      newStatus,
      actionType,
      detail: `Compensation rule "${rules[idx].name}" ${actionType}d. Historical payouts and transactions remain unchanged.`,
    })

    const ruleComps = ((mockDb.state as any).payout_rule_components || []).filter(
      (c: any) => c.rule_version_id === id
    )

    return NextResponse.json({
      success: true,
      rule: { ...rules[idx], payout_rule_components: ruleComps },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update rule' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
    }

    await loadPersistedState()
    const { id } = await Promise.resolve(context.params)
    const { searchParams } = new URL(req.url)
    const forceArchive = searchParams.get('mode') === 'archive'

    const rules: any[] = (mockDb.state as any).compensation_rule_versions || []
    const idx = rules.findIndex(r => r.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

    const target = rules[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const dep = await inspectRecordDependencies('compensation_rules', id)
    const nowIso = new Date().toISOString()

    if (dep?.canPermanentDelete && !forceArchive) {
      rules.splice(idx, 1)
      if ((mockDb.state as any).payout_rule_components) {
        ;(mockDb.state as any).payout_rule_components = (
          (mockDb.state as any).payout_rule_components || []
        ).filter((c: any) => c.rule_version_id !== id)
      }
      await savePersistedState(['compensation_rule_versions', 'payout_rule_components'])

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'compensation_rules',
        recordId: id,
        recordName: target.name,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Compensation rule "${target.name}" permanently deleted (0 historical financial transactions or payouts).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `Compensation rule "${target.name}" permanently deleted.`,
      })
    }

    // Soft Delete / Archive — preserve historical calculation details and payouts
    rules[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    }
    await savePersistedState('compensation_rule_versions')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'compensation_rules',
      recordId: id,
      recordName: target.name,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Compensation rule "${target.name}" archived safely. Previously generated or paid compensation records remain 100% preserved.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      rule: rules[idx],
      message: `Compensation rule "${target.name}" archived safely. Historical calculations preserved.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete rule' }, { status: 400 })
  }
}

