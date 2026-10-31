import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'

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

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = getCallerRole(req, user)
    const isAdmin = isAuthorizedCmsAdmin(role)

    const { searchParams } = new URL(req.url)
    const forcePublic = searchParams.get('public') === '1'
    const includeArchived = searchParams.get('includeArchived') === '1'

    const categories: any[] = [...(mockDb.state.consultation_categories ?? [])].sort(
      (a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)
    )
    const categoryMap = new Map(categories.map((c: any) => [c.key, c]))

    let services: any[] = (mockDb.state.consultation_services ?? []).map((s: any) => {
      const cat = categoryMap.get(s.category)
      return {
        ...s,
        category_label: cat?.name || s.category_label || s.category,
        icon: s.icon || cat?.icon || '🩺',
        short_description: s.short_description || s.description || '',
        full_description: s.full_description || s.description || s.short_description || '',
        description: s.description || s.short_description || s.full_description || '',
        specialist_designation: s.specialist_designation || 'Certified Specialist Doctor',
        consultation_type: s.consultation_type || 'Online Video (Zoho Meeting)',
        currency: s.currency || 'INR',
      }
    })

    if (!isAdmin || forcePublic) {
      services = services.filter((s: any) => s.is_active && !s.is_archived)
    } else if (!includeArchived) {
      services = services.filter((s: any) => !s.is_archived)
    }

    services.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))

    return NextResponse.json({
      consultation_services: services,
      consultation_categories: categories,
    })
  } catch {
    const services = (mockDb.state.consultation_services ?? []).filter(
      (s: any) => s.is_active && !s.is_archived
    )
    return NextResponse.json({
      consultation_services: services,
      consultation_categories: mockDb.state.consultation_categories ?? [],
    })
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 })
    }

    // Handle creating a new configurable service category
    if (body.action === 'add_category') {
      const catName = String(body.name || '').trim()
      if (!catName || catName.length < 2) {
        return NextResponse.json(
          { error: 'Category name must be at least 2 characters.' },
          { status: 400 }
        )
      }
      const catKey =
        String(body.key || catName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '') || `category_${Date.now()}`

      if (!Array.isArray(mockDb.state.consultation_categories)) {
        mockDb.state.consultation_categories = []
      }
      const existingCat = mockDb.state.consultation_categories.find(
        (c: any) => c.key === catKey || c.name.toLowerCase() === catName.toLowerCase()
      )
      if (existingCat) {
        return NextResponse.json({ category: existingCat, alreadyExists: true })
      }

      const newCategory = {
        id: `cc-${Date.now()}`,
        key: catKey,
        name: catName,
        icon: String(body.icon || '🩺').trim() || '🩺',
        is_active: true,
        display_order: mockDb.state.consultation_categories.length + 1,
        created_at: new Date().toISOString(),
      }
      mockDb.state.consultation_categories.push(newCategory)
      await savePersistedState('consultation_categories')
      return NextResponse.json({ category: newCategory, success: true }, { status: 201 })
    }

    // Validate new consultation service fields
    const name = String(body.name || '').trim()
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Consultation service name is required (minimum 2 characters).' },
        { status: 400 }
      )
    }

    const category = String(body.category || '').trim()
    if (!category) {
      return NextResponse.json(
        { error: 'Service category is required.' },
        { status: 400 }
      )
    }

    const priceNum = Number(body.price)
    if (body.price === undefined || body.price === null || body.price === '' || isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: 'Valid non-negative price is required.' },
        { status: 400 }
      )
    }

    const durationMin = body.duration_min !== undefined ? Number(body.duration_min) : 30
    if (isNaN(durationMin) || durationMin < 5 || durationMin > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 5 and 480 minutes.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(mockDb.state.consultation_services)) {
      mockDb.state.consultation_services = []
    }

    const baseKey =
      String(body.key || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || `consult_${Date.now()}`
    const keyExists = mockDb.state.consultation_services.some((s: any) => s.key === baseKey)
    const uniqueKey = keyExists ? `${baseKey}_${Date.now().toString().slice(-4)}` : baseKey

    const shortDesc = String(body.short_description || body.description || '').trim()
    const fullDesc = String(body.full_description || body.description || shortDesc).trim()
    const nowIso = new Date().toISOString()

    // Ensure the category exists in consultation_categories if a custom category key was passed
    if (!Array.isArray(mockDb.state.consultation_categories)) {
      mockDb.state.consultation_categories = []
    }
    const matchedCat = mockDb.state.consultation_categories.find((c: any) => c.key === category)
    if (!matchedCat) {
      mockDb.state.consultation_categories.push({
        id: `cc-${Date.now()}`,
        key: category,
        name: body.category_label || category.replace(/_/g, ' '),
        icon: body.icon || '🩺',
        is_active: true,
        display_order: mockDb.state.consultation_categories.length + 1,
      })
    }

    const newService = {
      id: `cs-${Date.now()}`,
      key: uniqueKey,
      name,
      category,
      short_description: shortDesc,
      full_description: fullDesc,
      description: fullDesc || shortDesc,
      specialist_designation: String(body.specialist_designation || 'Certified Specialist Doctor').trim(),
      icon: String(body.icon || matchedCat?.icon || '🩺').trim() || '🩺',
      image_url: String(body.image_url || '').trim(),
      consultation_type: String(body.consultation_type || 'Online Video (Zoho Meeting)').trim(),
      price: priceNum,
      currency: String(body.currency || 'INR').trim().toUpperCase() || 'INR',
      duration_min: durationMin,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_archived: false,
      display_order:
        body.display_order !== undefined
          ? Number(body.display_order)
          : mockDb.state.consultation_services.length + 1,
      created_at: nowIso,
      updated_at: nowIso,
    }

    mockDb.state.consultation_services.push(newService)
    await savePersistedState(['consultation_services', 'consultation_categories'])

    return NextResponse.json(
      { consultation_service: newService, success: true },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Bad request' },
      { status: 400 }
    )
  }
}
