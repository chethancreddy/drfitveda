import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb, DEFAULT_PROFESSIONAL_ROLES, ProfessionalRoleOption } from '@/lib/mock-db'

function getAdminRole(req: NextRequest, user: any) {
  let role = (user as any)?.user_metadata?.role || (user as any)?.role
  if (!role) {
    const cookie = req.cookies.get('drf_session')?.value
    if (cookie) {
      try { role = JSON.parse(decodeURIComponent(cookie)).role } catch {
        try { role = JSON.parse(cookie).role } catch {}
      }
    }
  }
  return role
}

export async function GET() {
  try {
    if (!mockDb.state.professional_roles || mockDb.state.professional_roles.length === 0) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }
    const roles = [...mockDb.state.professional_roles].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    return NextResponse.json({ roles })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch professional roles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getAdminRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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

    // Check if role value already exists
    const existing = mockDb.state.professional_roles.find((r: ProfessionalRoleOption) => r.value === slug)
    if (existing) {
      return NextResponse.json({ error: `A role with identifier "${slug}" already exists.` }, { status: 409 })
    }

    const newRole: ProfessionalRoleOption = {
      id: `role-${Date.now()}`,
      value: slug,
      label: label.trim(),
      category: category || 'doctor',
      description: description?.trim() || '',
      icon: icon?.trim() || '🩺',
      is_active: is_active !== undefined ? is_active : true,
      display_order: display_order || mockDb.state.professional_roles.length + 1,
    }

    mockDb.state.professional_roles.push(newRole)

    return NextResponse.json({ role: newRole, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create professional role' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getAdminRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { id, label, value, category, description, icon, is_active, display_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    if (!mockDb.state.professional_roles) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }

    const idx = mockDb.state.professional_roles.findIndex((r: ProfessionalRoleOption) => r.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const updated: ProfessionalRoleOption = {
      ...mockDb.state.professional_roles[idx],
      label: label !== undefined ? label.trim() : mockDb.state.professional_roles[idx].label,
      value: value !== undefined ? value.trim() : mockDb.state.professional_roles[idx].value,
      category: category || mockDb.state.professional_roles[idx].category,
      description: description !== undefined ? description.trim() : mockDb.state.professional_roles[idx].description,
      icon: icon !== undefined ? icon.trim() : mockDb.state.professional_roles[idx].icon,
      is_active: is_active !== undefined ? is_active : mockDb.state.professional_roles[idx].is_active,
      display_order: display_order !== undefined ? display_order : mockDb.state.professional_roles[idx].display_order,
    }

    mockDb.state.professional_roles[idx] = updated

    return NextResponse.json({ role: updated, success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getAdminRole(req, user)
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    if (!mockDb.state.professional_roles) {
      mockDb.state.professional_roles = [...DEFAULT_PROFESSIONAL_ROLES]
    }

    mockDb.state.professional_roles = mockDb.state.professional_roles.filter(
      (r: ProfessionalRoleOption) => r.id !== id
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}
