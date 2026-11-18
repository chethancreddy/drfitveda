import { NextRequest, NextResponse } from 'next/server'
import { mockDb, VitalityRoadmapStep } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest) {
  try {
    await loadPersistedState()
    const { searchParams } = new URL(req.url)
    const publicOnly = searchParams.get('public') === 'true'

    let steps: VitalityRoadmapStep[] = mockDb.state.vitality_roadmap_steps || []
    if (publicOnly) {
      steps = steps.filter(s => s.is_active)
    }

    steps.sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))

    return NextResponse.json({
      success: true,
      roadmap_steps: steps,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load roadmap steps' }, { status: 500 })
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
      return NextResponse.json({ error: 'Step title is required' }, { status: 400 })
    }

    const currentSteps: VitalityRoadmapStep[] = mockDb.state.vitality_roadmap_steps || []
    const stepNumber = body.step || String(currentSteps.length + 1).padStart(2, '0')

    const newStep: VitalityRoadmapStep = {
      id: `vstep-${Date.now()}`,
      step: String(stepNumber),
      timing: String(body.timing || 'Day ' + (currentSteps.length + 1)).trim(),
      icon: String(body.icon || '✨').trim(),
      title: String(body.title).trim(),
      accentColor: String(body.accentColor || '#245744').trim(),
      description: String(body.description || '').trim(),
      deliverable: String(body.deliverable || '').trim(),
      highlightTitle: String(body.highlightTitle || 'Key Focus Areas').trim(),
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      display_order: Number(body.display_order) || currentSteps.length + 1,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    }

    currentSteps.push(newStep)
    mockDb.state.vitality_roadmap_steps = currentSteps

    await savePersistedState(['vitality_roadmap_steps'])

    return NextResponse.json({
      success: true,
      step: newStep,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create roadmap step' }, { status: 500 })
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

    if (!body.id) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    const steps: VitalityRoadmapStep[] = mockDb.state.vitality_roadmap_steps || []
    const idx = steps.findIndex(s => s.id === body.id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    steps[idx] = {
      ...steps[idx],
      step: body.step !== undefined ? String(body.step) : steps[idx].step,
      timing: body.timing !== undefined ? String(body.timing) : steps[idx].timing,
      icon: body.icon !== undefined ? String(body.icon) : steps[idx].icon,
      title: body.title !== undefined ? String(body.title) : steps[idx].title,
      accentColor: body.accentColor !== undefined ? String(body.accentColor) : steps[idx].accentColor,
      description: body.description !== undefined ? String(body.description) : steps[idx].description,
      deliverable: body.deliverable !== undefined ? String(body.deliverable) : steps[idx].deliverable,
      highlightTitle: body.highlightTitle !== undefined ? String(body.highlightTitle) : steps[idx].highlightTitle,
      highlights: Array.isArray(body.highlights) ? body.highlights : steps[idx].highlights,
      display_order: body.display_order !== undefined ? Number(body.display_order) : steps[idx].display_order,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : steps[idx].is_active,
    }

    mockDb.state.vitality_roadmap_steps = steps
    await savePersistedState(['vitality_roadmap_steps'])

    return NextResponse.json({
      success: true,
      step: steps[idx],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update roadmap step' }, { status: 500 })
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
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    let steps: VitalityRoadmapStep[] = mockDb.state.vitality_roadmap_steps || []
    steps = steps.filter(s => s.id !== id)
    mockDb.state.vitality_roadmap_steps = steps

    await savePersistedState(['vitality_roadmap_steps'])

    return NextResponse.json({
      success: true,
      message: 'Roadmap step deleted',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete roadmap step' }, { status: 500 })
  }
}
