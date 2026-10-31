import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { recordAdminAuditLog, verifyAdminAccess } from '@/lib/services/admin-record-governance'

function getCallerRole(req: NextRequest, user: any): string {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try {
        role = JSON.parse(decodeURIComponent(cookie)).role
      } catch {
        try {
          role = JSON.parse(cookie).role
        } catch {}
      }
    }
  }
  return String(role || '')
}

function isAuthorizedCmsAdmin(role: string): boolean {
  return ['admin', 'super_admin', 'operations_manager'].includes(role)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await loadPersistedState()
    const { id } = await params
    const services: any[] = mockDb.state.consultation_services ?? []
    const service = services.find((s: any) => s.id === id || s.key === id)
    if (!service) {
      return NextResponse.json({ error: 'Consultation service not found' }, { status: 404 })
    }
    return NextResponse.json({ consultation_service: service })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = getCallerRole(req, user)

    if (!isAuthorizedCmsAdmin(role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator permissions required.' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { id } = await params
    const services: any[] = mockDb.state.consultation_services ?? []
    const idx = services.findIndex((s: any) => s.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Consultation service not found' }, { status: 404 })
    }

    if (body.name !== undefined && String(body.name).trim().length < 2) {
      return NextResponse.json(
        { error: 'Consultation service name must be at least 2 characters.' },
        { status: 400 }
      )
    }

    if (body.price !== undefined && (isNaN(Number(body.price)) || Number(body.price) < 0)) {
      return NextResponse.json(
        { error: 'Price must be a valid non-negative number.' },
        { status: 400 }
      )
    }

    if (
      body.duration_min !== undefined &&
      (isNaN(Number(body.duration_min)) || Number(body.duration_min) < 5 || Number(body.duration_min) > 480)
    ) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 480 minutes.' },
        { status: 400 }
      )
    }

    const existing = services[idx]
    const prevStatus = existing.is_archived
      ? 'archived'
      : existing.is_active !== false
        ? 'active'
        : 'inactive'

    if (body.restore === true) {
      services[idx] = {
        ...existing,
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
      await savePersistedState('consultation_services')
      await recordAdminAuditLog({
        actorId: user?.id || 'admin',
        actorName: (user as any)?.user_metadata?.full_name || 'Admin',
        module: 'consultation_services',
        recordId: existing.id,
        recordName: existing.name,
        previousStatus: prevStatus,
        newStatus: 'active',
        actionType: 'restore',
      })
      return NextResponse.json({ consultation_service: services[idx], success: true })
    }

    const updatedShort =
      body.short_description !== undefined
        ? String(body.short_description).trim()
        : existing.short_description || existing.description || ''
    const updatedFull =
      body.full_description !== undefined
        ? String(body.full_description).trim()
        : body.description !== undefined
          ? String(body.description).trim()
          : existing.full_description || existing.description || updatedShort
    const updatedDesc =
      body.description !== undefined
        ? String(body.description).trim()
        : updatedFull || updatedShort

    services[idx] = {
      ...existing,
      ...body,
      id: existing.id,
      key: existing.key,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      category: body.category !== undefined ? String(body.category).trim() : existing.category,
      short_description: updatedShort,
      full_description: updatedFull,
      description: updatedDesc,
      specialist_designation:
        body.specialist_designation !== undefined
          ? String(body.specialist_designation).trim()
          : existing.specialist_designation || 'Certified Specialist Doctor',
      icon: body.icon !== undefined ? String(body.icon).trim() : existing.icon || '🩺',
      image_url: body.image_url !== undefined ? String(body.image_url).trim() : existing.image_url || '',
      consultation_type:
        body.consultation_type !== undefined
          ? String(body.consultation_type).trim()
          : existing.consultation_type || 'Online Video (Zoho Meeting)',
      price: body.price !== undefined ? Number(body.price) : existing.price,
      currency:
        body.currency !== undefined
          ? String(body.currency).trim().toUpperCase()
          : existing.currency || 'INR',
      duration_min:
        body.duration_min !== undefined ? Number(body.duration_min) : existing.duration_min,
      is_active:
        body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active,
      is_archived:
        body.is_archived !== undefined ? Boolean(body.is_archived) : Boolean(existing.is_archived),
      display_order:
        body.display_order !== undefined ? Number(body.display_order) : existing.display_order,
      created_at: existing.created_at,
      updated_at: new Date().toISOString(),
    }

    await savePersistedState('consultation_services')

    const newStatus = services[idx].is_archived
      ? 'archived'
      : services[idx].is_active !== false
        ? 'active'
        : 'inactive'
    const actionType =
      prevStatus !== newStatus
        ? newStatus === 'active'
          ? 'activate'
          : newStatus === 'archived'
            ? 'archive'
            : 'deactivate'
        : 'update'

    await recordAdminAuditLog({
      actorId: user?.id || 'admin',
      actorName: (user as any)?.user_metadata?.full_name || 'Admin',
      module: 'consultation_services',
      recordId: services[idx].id,
      recordName: services[idx].name,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ consultation_service: services[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = getCallerRole(req, user)

    if (!isAuthorizedCmsAdmin(role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator permissions required.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const services: any[] = mockDb.state.consultation_services ?? []
    const idx = services.findIndex((s: any) => s.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Consultation service not found' }, { status: 404 })
    }

    const target = services[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const { searchParams } = new URL(req.url)
    const archiveOnly = searchParams.get('archive') === '1' || searchParams.get('mode') === 'archive'

    // Check if any historical or upcoming appointments reference this service
    const appointments: any[] = mockDb.state.appointments ?? []
    const hasBookings = appointments.some(
      (a: any) =>
        a.consultation_service_id === id ||
        (a.service_name && a.service_name === target.name) ||
        (a.notes && typeof a.notes === 'string' && a.notes.includes(target.name))
    )

    // Core seeded IDs or services with booking history are safely archived rather than hard-deleted
    if (archiveOnly || hasBookings || ['cs-001', 'cs-002', 'cs-003'].includes(id)) {
      const nowIso = new Date().toISOString()
      services[idx] = {
        ...target,
        is_active: false,
        is_archived: true,
        deleted_at: nowIso,
        updated_at: nowIso,
      }
      await savePersistedState('consultation_services')

      await recordAdminAuditLog({
        actorId: user?.id || 'admin',
        actorName: (user as any)?.user_metadata?.full_name || 'Admin',
        module: 'consultation_services',
        recordId: target.id,
        recordName: target.name,
        previousStatus: prevStatus,
        newStatus: 'archived',
        actionType: 'archive',
        detail: `Consultation service "${target.name}" archived safely to preserve booking history.`,
      })

      return NextResponse.json({
        success: true,
        archived: true,
        deleted: false,
        reason: hasBookings
          ? 'Service has historical bookings and was safely archived to preserve booking history.'
          : 'Service archived and hidden from customer booking.',
        consultation_service: services[idx],
      })
    }

    mockDb.state.consultation_services.splice(idx, 1)
    await savePersistedState('consultation_services')

    await recordAdminAuditLog({
      actorId: user?.id || 'admin',
      actorName: (user as any)?.user_metadata?.full_name || 'Admin',
      module: 'consultation_services',
      recordId: target.id,
      recordName: target.name,
      previousStatus: prevStatus,
      newStatus: 'deleted',
      actionType: 'permanent_delete',
      detail: `Consultation service "${target.name}" permanently deleted (0 historical bookings).`,
    })

    return NextResponse.json({
      success: true,
      archived: false,
      deleted: true,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to delete or archive service' }, { status: 400 })
  }
}
