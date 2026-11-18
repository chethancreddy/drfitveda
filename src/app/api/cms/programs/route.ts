import { NextRequest, NextResponse } from 'next/server'
import { mockDb, NormalProgram } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const { searchParams } = new URL(req.url)
    const publicOnly = searchParams.get('public') === 'true'

    let programs: NormalProgram[] = mockDb.state.normal_programs || []
    if (publicOnly) {
      programs = programs.filter(p => p.is_active)
    }

    programs.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))

    return NextResponse.json({
      success: true,
      normal_programs: programs,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load programs' }, { status: 500 })
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

    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Program title is required' }, { status: 400 })
    }

    const key = body.key || body.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32)
    const newProg: NormalProgram = {
      id: `prog-${Date.now()}`,
      key,
      title: String(body.title).trim(),
      category: String(body.category || 'Lifestyle Care').trim(),
      icon: String(body.icon || '🌿').trim(),
      image_url: String(body.image_url || '').trim(),
      short_description: String(body.short_description || '').trim(),
      full_description: String(body.full_description || body.short_description || '').trim(),
      ideal_for: String(body.ideal_for || '').trim(),
      duration_label: String(body.duration_label || '30–365 Days').trim(),
      duration_days: Number(body.duration_days) || 30,
      price: Number(body.price) || 9999,
      original_price: body.original_price ? Number(body.original_price) : undefined,
      inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
      specialist_role: String(body.specialist_role || 'Specialist Doctor').trim(),
      cta_label: String(body.cta_label || 'Enroll in Program').trim(),
      cta_href: String(body.cta_href || '/memberships').trim(),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      display_order: Number(body.display_order) || (mockDb.state.normal_programs?.length || 0) + 1,
    }

    if (!Array.isArray(mockDb.state.normal_programs)) {
      mockDb.state.normal_programs = []
    }

    mockDb.state.normal_programs.push(newProg)
    await savePersistedState(['normal_programs'])

    return NextResponse.json({
      success: true,
      message: 'Normal Program created successfully',
      program: newProg,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create program' }, { status: 500 })
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const programs: NormalProgram[] = mockDb.state.normal_programs || []
    const idx = programs.findIndex(p => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    programs[idx] = {
      ...programs[idx],
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : programs[idx].price,
      duration_days: updates.duration_days !== undefined ? Number(updates.duration_days) : programs[idx].duration_days,
      display_order: updates.display_order !== undefined ? Number(updates.display_order) : programs[idx].display_order,
    }

    await savePersistedState(['normal_programs'])

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
      program: programs[idx],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update program' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 })
    }

    const programs: NormalProgram[] = mockDb.state.normal_programs || []
    const idx = programs.findIndex(p => p.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Soft delete / archive
    programs[idx].is_active = false
    await savePersistedState(['normal_programs'])

    return NextResponse.json({
      success: true,
      message: 'Program archived successfully',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete program' }, { status: 500 })
  }
}
