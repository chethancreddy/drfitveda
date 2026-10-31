import { NextRequest, NextResponse } from 'next/server'
import { mockDb, DEFAULT_PROFESSIONAL_ROLES, ProfessionalRoleOption } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import {
  inspectRecordDependencies,
  recordAdminAuditLog,
  verifyAdminAccess,
} from '@/lib/services/admin-record-governance'

export async function GET() {
  try {
    await loadPersistedState()
    if (!mockDb.state.professional_roles || mockDb.state.professional_roles.length === 0) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }
    const roles = [...mockDb.state.professional_roles].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    )
    return NextResponse.json({ roles })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch professional roles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    const body = await req.json()
    const { label, value, category, description, icon, is_active, display_order } = body

    if (!label || !label.trim()) {
      return NextResponse.json({ error: 'Role label is required' }, { status: 400 })
    }

    const slug = (value || label)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')

    if (!mockDb.state.professional_roles) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }

    const existing = mockDb.state.professional_roles.find(
      (r: ProfessionalRoleOption) => r.value === slug
    )
    if (existing) {
      return NextResponse.json(
        { error: `A role with identifier "${slug}" already exists.` },
        { status: 409 }
      )
    }

    const newRole: any = {
      id: `role-${Date.now()}`,
      value: slug,
      label: label.trim(),
      category: category || 'doctor',
      description: description?.trim() || '',
      icon: icon?.trim() || '🩺',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_archived: false,
      display_order: display_order || mockDb.state.professional_roles.length + 1,
      created_at: new Date().toISOString(),
    }

    mockDb.state.professional_roles.push(newRole)
    await savePersistedState('professional_roles')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'professional_roles',
      recordId: newRole.id,
      recordName: newRole.label,
      previousStatus: 'none',
      newStatus: newRole.is_active ? 'active' : 'inactive',
      actionType: 'create',
    })

    return NextResponse.json({ role: newRole, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create professional role' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    const body = await req.json()
    const { id, label, value, category, description, icon, is_active, display_order, restore } = body

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    if (!mockDb.state.professional_roles) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }

    const idx = mockDb.state.professional_roles.findIndex(
      (r: any) => r.id === id || r.value === id
    )
    if (idx === -1) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const existing: any = mockDb.state.professional_roles[idx]
    const prevStatus = existing.is_archived
      ? 'archived'
      : existing.is_active !== false
        ? 'active'
        : 'inactive'
    const nowIso = new Date().toISOString()

    if (restore === true) {
      mockDb.state.professional_roles[idx] = {
        ...existing,
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: nowIso,
      } as any
    } else {
      mockDb.state.professional_roles[idx] = {
        ...existing,
        label: label !== undefined ? label.trim() : existing.label,
        value: value !== undefined ? value.trim() : existing.value,
        category: category || existing.category,
        description: description !== undefined ? description.trim() : existing.description,
        icon: icon !== undefined ? icon.trim() : existing.icon,
        is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
        is_archived:
          body.is_archived !== undefined ? Boolean(body.is_archived) : Boolean(existing.is_archived),
        display_order: display_order !== undefined ? display_order : existing.display_order,
        updated_at: nowIso,
      } as any
    }

    await savePersistedState('professional_roles')

    const updated: any = mockDb.state.professional_roles[idx]
    const newStatus = updated.is_archived
      ? 'archived'
      : updated.is_active !== false
        ? 'active'
        : 'inactive'
    const actionType =
      restore === true
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
      module: 'professional_roles',
      recordId: updated.id,
      recordName: updated.label,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ role: updated, success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const reassignToRole = searchParams.get('reassign_to_id')
    const forceArchive = searchParams.get('mode') === 'archive'

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    if (!mockDb.state.professional_roles) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }

    const idx = mockDb.state.professional_roles.findIndex(
      (r: any) => r.id === id || r.value === id
    )
    if (idx === -1) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const target: any = mockDb.state.professional_roles[idx]
    const prevStatus = target.is_archived
      ? 'archived'
      : target.is_active !== false
        ? 'active'
        : 'inactive'
    const nowIso = new Date().toISOString()

    // Optional reassignment of dependent professionals before deletion
    if (reassignToRole) {
      const targetRoleObj = mockDb.state.professional_roles.find(
        (r: any) => r.id === reassignToRole || r.value === reassignToRole
      )
      const newRoleValue = targetRoleObj ? targetRoleObj.value : reassignToRole
      for (const pro of mockDb.state.professionals || []) {
        if (pro.role === target.value) {
          pro.role = newRoleValue
          pro.updated_at = nowIso
        }
      }
      await savePersistedState('professionals')
    }

    const dep = await inspectRecordDependencies('professional_roles', target.id)

    if (dep?.canPermanentDelete && !forceArchive) {
      mockDb.state.professional_roles.splice(idx, 1)
      await savePersistedState('professional_roles')

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'professional_roles',
        recordId: target.id,
        recordName: target.label,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Professional role "${target.label}" (${target.value}) permanently deleted (0 dependent professionals or assignments).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `Role "${target.label}" permanently deleted.`,
      })
    }

    // Soft Delete / Archive — never break existing professional profiles or historical assignments
    mockDb.state.professional_roles[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    } as any
    await savePersistedState('professional_roles')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'professional_roles',
      recordId: target.id,
      recordName: target.label,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Professional role "${target.label}" (${target.value}) safely archived/deactivated to protect dependent professional profiles and historical records.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      role: mockDb.state.professional_roles[idx],
      message: `Role "${target.label}" has dependent profiles/records and was safely archived instead of permanently deleted.`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
