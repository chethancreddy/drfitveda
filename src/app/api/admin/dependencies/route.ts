import { NextRequest, NextResponse } from 'next/server'
import {
  inspectRecordDependencies,
  verifyAdminAccess,
  type GovernanceModule,
} from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, [
      'admin',
      'super_admin',
      'operations_manager',
      'care_coordinator',
      'staff',
    ])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const moduleName = searchParams.get('module') as GovernanceModule | null
    const recordId = searchParams.get('id')

    if (!moduleName || !recordId) {
      return NextResponse.json({ error: 'module and id query parameters are required' }, { status: 400 })
    }

    const result = await inspectRecordDependencies(moduleName, recordId)
    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ dependencyCheck: result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to inspect dependencies' }, { status: 500 })
  }
}

