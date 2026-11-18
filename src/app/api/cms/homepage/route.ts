import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { verifyAdminAccess } from '@/lib/services/admin-record-governance'

export async function GET() {
  try {
    await loadPersistedState()
    return NextResponse.json({
      success: true,
      settings: mockDb.state.homepage_settings,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load homepage settings' }, { status: 500 })
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

    mockDb.state.homepage_settings = {
      ...mockDb.state.homepage_settings,
      ...body,
    }

    await savePersistedState(['homepage_settings'])

    return NextResponse.json({
      success: true,
      message: 'Homepage CMS settings saved successfully',
      settings: mockDb.state.homepage_settings,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update homepage settings' }, { status: 500 })
  }
}
