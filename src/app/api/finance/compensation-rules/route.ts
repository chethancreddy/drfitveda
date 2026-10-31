import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { recordAdminAuditLog, verifyAdminAccess } from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
    }

    await loadPersistedState()
    const ruleVersions: any[] = (mockDb.state as any).compensation_rule_versions || []
    const allComponents: any[] = (mockDb.state as any).payout_rule_components || []

    const enriched = [...ruleVersions]
      .sort((a, b) => String(b.effective_from || '').localeCompare(String(a.effective_from || '')))
      .map(rv => ({
        ...rv,
        payout_rule_components: allComponents.filter(c => c.rule_version_id === rv.id),
      }))

    return NextResponse.json({ rules: enriched })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Forbidden' }, { status: auth.status })
    }

    await loadPersistedState()
    const body = (await req.json()) as {
      name: string
      effective_from: string
      effective_to?: string
      is_active?: boolean
      components?: Array<{
        component_code: string
        component_name: string
        role?: string
        amount_type?: string
        amount: number
        applicability?: string
        is_active?: boolean
      }>
    }

    if (!body.name || !body.effective_from) {
      return NextResponse.json({ error: 'name and effective_from are required' }, { status: 400 })
    }

    if (!(mockDb.state as any).compensation_rule_versions) {
      ;(mockDb.state as any).compensation_rule_versions = []
    }
    if (!(mockDb.state as any).payout_rule_components) {
      ;(mockDb.state as any).payout_rule_components = []
    }

    const nowIso = new Date().toISOString()
    const ruleId = `crv-${Date.now()}`
    const ruleVersion = {
      id: ruleId,
      name: body.name.trim(),
      effective_from: body.effective_from,
      effective_to: body.effective_to || null,
      is_active: body.is_active ?? true,
      is_archived: false,
      created_by: auth.userId,
      created_at: nowIso,
      updated_at: nowIso,
    }

    ;(mockDb.state as any).compensation_rule_versions.push(ruleVersion)

    const components: any[] = []
    if (Array.isArray(body.components) && body.components.length > 0) {
      body.components.forEach((c, idx) => {
        const comp = {
          id: `prc-${Date.now()}-${idx}`,
          rule_version_id: ruleId,
          component_code: c.component_code || `comp_${idx + 1}`,
          component_name: c.component_name || c.component_code || `Component ${idx + 1}`,
          role: c.role || null,
          amount_type: c.amount_type || 'fixed',
          amount: Number(c.amount || 0),
          applicability: c.applicability || null,
          is_active: c.is_active !== undefined ? Boolean(c.is_active) : true,
          created_at: nowIso,
        }
        ;(mockDb.state as any).payout_rule_components.push(comp)
        components.push(comp)
      })
    }

    await savePersistedState(['compensation_rule_versions', 'payout_rule_components'])

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'compensation_rules',
      recordId: ruleVersion.id,
      recordName: ruleVersion.name,
      previousStatus: 'none',
      newStatus: ruleVersion.is_active ? 'active' : 'inactive',
      actionType: 'create',
      detail: `Compensation rule "${ruleVersion.name}" created with ${components.length} payout component(s).`,
    })

    return NextResponse.json(
      {
        rule: { ...ruleVersion, payout_rule_components: components },
        components,
      },
      { status: 201 }
    )
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
