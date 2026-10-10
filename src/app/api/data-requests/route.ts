import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdmin, getSignedInUser } from '@/lib/legal/auth'
import { validateDataRequest, rateLimited } from '@/lib/legal/validation'

// ============================================================
// POST /api/data-requests — public: submit an access / correction /
//   export / deletion / consent-withdrawal / complaint request.
// GET  /api/data-requests — admin only: list requests.
// PATCH /api/data-requests — admin only: update status / resolution.
// Request bodies are never logged. IPs are used only for in-memory
// rate limiting and are not stored.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    if (rateLimited(`dsr:${ip}`)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const err = validateDataRequest(body)
    if (err) return NextResponse.json({ error: err }, { status: 400 })

    const user = await getSignedInUser()
    const svc = await createServiceRoleClient()
    const { data, error } = await (svc as any)
      .from('data_subject_requests')
      .insert({
        request_type: body.request_type,
        requester_name: String(body.name).trim(),
        requester_email: String(body.email).trim().toLowerCase(),
        details: body.details ? String(body.details).trim() : null,
        user_id: user?.id ?? null,
        status: 'received',
        identity_verified: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Could not record your request. Please email us instead.' }, { status: 500 })

    await (svc as any).from('audit_logs').insert({
      user_id: user?.id ?? null,
      action: 'data_request.received',
      table_name: 'data_subject_requests',
      record_id: data?.id ?? null,
      new_data: { request_type: body.request_type },
    })

    return NextResponse.json({
      success: true,
      reference: String(data?.id ?? '').slice(0, 8).toUpperCase(),
      message: 'Request received. We will verify your identity using the contact details on your account before acting on it.',
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please email us instead.' }, { status: 500 })
  }
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const svc = await createServiceRoleClient()
  const { data } = await (svc as any).from('data_subject_requests').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ requests: data ?? [] })
}

const STATUSES = ['received', 'verifying', 'in_progress', 'completed', 'partially_completed', 'rejected']

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  if (!b.id || !STATUSES.includes(b.status)) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 })
  if (['partially_completed', 'rejected'].includes(b.status) && !String(b.resolution_note ?? '').trim()) {
    return NextResponse.json({ error: 'A note explaining what was retained or why is required.' }, { status: 400 })
  }

  const closed = ['completed', 'partially_completed', 'rejected'].includes(b.status)
  const svc = await createServiceRoleClient()
  const patch: Record<string, unknown> = {
    status: b.status,
    handled_by: admin.id,
    resolution_note: b.resolution_note ? String(b.resolution_note).slice(0, 2000) : null,
    updated_at: new Date().toISOString(),
    closed_at: closed ? new Date().toISOString() : null,
  }
  if (typeof b.identity_verified === 'boolean') patch.identity_verified = b.identity_verified
  if (closed && patch.identity_verified !== true) {
    // Do not close access/export/deletion requests without verified identity
    const { data: row } = await (svc as any).from('data_subject_requests').select('*').eq('id', b.id).single()
    if (row && !row.identity_verified && b.status !== 'rejected' && row.request_type !== 'complaint') {
      return NextResponse.json({ error: 'Verify identity before completing this request.' }, { status: 400 })
    }
  }

  const { error } = await (svc as any).from('data_subject_requests').update(patch).eq('id', b.id)
  if (error) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })

  await (svc as any).from('audit_logs').insert({
    user_id: admin.id,
    action: `data_request.${b.status}`,
    table_name: 'data_subject_requests',
    record_id: b.id,
    new_data: { status: b.status },
  })
  return NextResponse.json({ success: true })
}
