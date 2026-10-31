import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import {
  inspectRecordDependencies,
  recordAdminAuditLog,
  verifyAdminAccess,
} from '@/lib/services/admin-record-governance'

export interface CmsContentItem {
  id: string
  slug: string
  title: string
  content_type: 'section' | 'banner' | 'article' | 'page' | 'faq' | 'image'
  summary: string
  body: string
  target_url?: string
  image_url?: string
  is_core_section?: boolean
  is_active: boolean
  is_archived?: boolean
  deleted_at?: string | null
  created_at: string
  updated_at?: string
}

export const DEFAULT_CMS_CONTENT_ITEMS: CmsContentItem[] = [
  {
    id: 'cms-sec-hero',
    slug: 'home-hero-banner',
    title: 'Homepage Hero — Physician-Led Holistic Health System',
    content_type: 'banner',
    summary: 'Primary homepage hero headline, CTA buttons, and patient/doctor quick-login bar.',
    body: 'Your health story, guided by doctors. A synchronized team of doctors, trainers, and clinical nutritionists diagnoses your body, builds your custom regimen, guides live workouts, and fine-tunes your plan every week.',
    target_url: '/',
    image_url: '/logo.png',
    is_core_section: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cms-sec-7step',
    slug: 'clinical-7-step-journey',
    title: 'The 7-Step Clinical Transformation Story',
    content_type: 'section',
    summary: 'Step-by-step clinical methodology displayed on Homepage and /how-it-works.',
    body: 'From Day 1 blood diagnostics and naturopathy assessment to Week 12 sustainable metabolic vitality with weekly doctor reviews.',
    target_url: '/how-it-works',
    is_core_section: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cms-sec-video',
    slug: 'movement-portfolio-video-showcase',
    title: 'Movement Portfolio & Rolling Video Replay Section',
    content_type: 'section',
    summary: 'Explains live Zoho Meeting session recording retention and patient form-check uploads.',
    body: 'Every 1-on-1 session is automatically recorded with rolling retention so patients can practice on-demand and upload 30-second technique clips.',
    target_url: '/customer/gallery',
    is_core_section: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cms-faq-zoho',
    slug: 'faq-zoho-meeting-sessions',
    title: 'FAQ: How do live 1-on-1 Zoho Meeting sessions work?',
    content_type: 'faq',
    summary: 'Answers how customers join scheduled trainer and doctor sessions and receive WhatsApp reminders.',
    body: 'Each customer receives a dedicated Zoho Meeting room link and an automated WhatsApp reminder 15 minutes before every confirmed session.',
    target_url: '/memberships',
    is_core_section: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cms-faq-consult',
    slug: 'faq-standalone-consultations',
    title: 'FAQ: Can I book a Doctor or PCOD/Yoga Consultation without a membership?',
    content_type: 'faq',
    summary: 'Clarifies that standalone specialist consultations can be booked independently of membership plans.',
    body: 'Yes! Standalone consultations (Doctor, Nutrition, Yoga, PCOD/PCOS, General Wellness) can be booked directly from the Consultations page without an active membership plan.',
    target_url: '/memberships',
    is_core_section: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cms-art-metabolic',
    slug: 'article-naturopathy-metabolic-reset',
    title: 'Clinical Article: Reversing Insulin Resistance with Therapeutic Yoga & Nutrition',
    content_type: 'article',
    summary: 'Educational guide on combining circadian nutrition, pranayama, and strength training.',
    body: 'Evidence-based clinical protocol used by DrFitVeda physicians to improve HbA1c, fasting insulin, and hormonal balance over 90 days.',
    target_url: '/how-it-works',
    is_core_section: false,
    is_active: true,
    is_archived: false,
    created_at: '2026-01-15T00:00:00.000Z',
  },
]

function ensureCmsContentSeeded() {
  if (
    !(mockDb.state as any).cms_content_items ||
    !Array.isArray((mockDb.state as any).cms_content_items) ||
    (mockDb.state as any).cms_content_items.length === 0
  ) {
    ;(mockDb.state as any).cms_content_items = [...DEFAULT_CMS_CONTENT_ITEMS]
  }
}

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    ensureCmsContentSeeded()
    const { searchParams } = new URL(req.url)
    const publicOnly = searchParams.get('public') === 'true'

    let items: CmsContentItem[] = (mockDb.state as any).cms_content_items || []
    if (publicOnly) {
      items = items.filter(i => i.is_active !== false && !i.is_archived)
    }

    return NextResponse.json({
      success: true,
      content_items: items,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load CMS content' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    ensureCmsContentSeeded()

    const body = await req.json()
    const { title, slug, content_type, summary, body: contentBody, target_url, image_url, is_active } = body

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Content title is required' }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const newItem: CmsContentItem = {
      id: `cms-${Date.now()}`,
      slug:
        slug ||
        String(title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
      title: String(title).trim(),
      content_type: content_type || 'section',
      summary: String(summary || '').trim(),
      body: String(contentBody || '').trim(),
      target_url: target_url || '/',
      image_url: image_url || '',
      is_core_section: false,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_archived: false,
      created_at: nowIso,
      updated_at: nowIso,
    }

    ;(mockDb.state as any).cms_content_items.push(newItem)
    await savePersistedState('cms_content_items' as any)

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'cms_content',
      recordId: newItem.id,
      recordName: newItem.title,
      previousStatus: 'none',
      newStatus: newItem.is_active ? 'active' : 'inactive',
      actionType: 'create',
    })

    return NextResponse.json({ success: true, content_item: newItem }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create CMS content item' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    ensureCmsContentSeeded()

    const body = await req.json()
    const { id, restore } = body
    if (!id) return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 })

    const items: CmsContentItem[] = (mockDb.state as any).cms_content_items
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Content item not found' }, { status: 404 })

    const existing = items[idx]
    const prevStatus = existing.is_archived ? 'archived' : existing.is_active !== false ? 'active' : 'inactive'
    const nowIso = new Date().toISOString()

    if (restore === true) {
      items[idx] = {
        ...existing,
        is_archived: false,
        deleted_at: null,
        is_active: true,
        updated_at: nowIso,
      }
    } else {
      items[idx] = {
        ...existing,
        ...body,
        id: existing.id,
        updated_at: nowIso,
      }
    }

    await savePersistedState('cms_content_items' as any)

    const updated = items[idx]
    const newStatus = updated.is_archived ? 'archived' : updated.is_active !== false ? 'active' : 'inactive'
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
      module: 'cms_content',
      recordId: updated.id,
      recordName: updated.title,
      previousStatus: prevStatus,
      newStatus,
      actionType,
    })

    return NextResponse.json({ success: true, content_item: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update CMS content item' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()
    ensureCmsContentSeeded()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const forceArchive = searchParams.get('mode') === 'archive'

    if (!id) return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 })

    const items: CmsContentItem[] = (mockDb.state as any).cms_content_items
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Content item not found' }, { status: 404 })

    const target = items[idx]
    const prevStatus = target.is_archived ? 'archived' : target.is_active !== false ? 'active' : 'inactive'
    const dep = await inspectRecordDependencies('cms_content', id)
    const nowIso = new Date().toISOString()

    if (dep?.canPermanentDelete && !forceArchive) {
      items.splice(idx, 1)
      await savePersistedState('cms_content_items' as any)

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'cms_content',
        recordId: target.id,
        recordName: target.title,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `CMS content "${target.title}" permanently deleted.`,
      })
    }

    // Soft Delete / Archive — ensures published or core website sections never cause broken links or missing data
    items[idx] = {
      ...target,
      is_active: false,
      is_archived: true,
      deleted_at: nowIso,
      updated_at: nowIso,
    }
    await savePersistedState('cms_content_items' as any)

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'cms_content',
      recordId: target.id,
      recordName: target.title,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      content_item: items[idx],
      message: `CMS content "${target.title}" safely archived without breaking public website routes.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete CMS content item' }, { status: 400 })
  }
}

