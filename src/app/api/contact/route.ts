import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateContactInquiry, rateLimited, POLICY_VERSION } from '@/lib/legal/validation'
import { getSignedInUser } from '@/lib/legal/auth'

// ============================================================
// POST /api/contact — Public consultation callback inquiry
// Validates inputs, records explicit consent, stores lead record,
// and enforces anti-abuse rate-limiting and bot honeypotting.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    if (rateLimited(`contact:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later or call our helpline.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const err = validateContactInquiry(body)
    if (err) return NextResponse.json({ error: err }, { status: 400 })

    const user = await getSignedInUser()
    const svc = await createServiceRoleClient()

    // 1. Store inquiry record
    const { data, error } = await (svc as any)
      .from('contact_inquiries')
      .insert({
        full_name: String(body.name).trim(),
        phone: String(body.phone).trim(),
        health_focus: String(body.health_focus).trim(),
        message: body.message ? String(body.message).trim() : null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Could not record your inquiry. Please call our helpline.' }, { status: 500 })
    }

    // 2. Record affirmative consent
    await (svc as any).from('consent_records').insert({
      user_id: user?.id ?? null,
      customer_id: null,
      purpose: 'contact_enquiry',
      granted: true,
      policy_version: POLICY_VERSION,
      source: 'contact_form',
    })

    // 3. Log audit event
    await (svc as any).from('audit_logs').insert({
      user_id: user?.id ?? null,
      action: 'contact_inquiry.received',
      table_name: 'contact_inquiries',
      record_id: data?.id ?? null,
      new_data: { health_focus: body.health_focus },
    })

    const referenceId = String(data?.id ?? '').slice(0, 8).toUpperCase() || 'DRF-INQ'

    return NextResponse.json({
      success: true,
      reference: referenceId,
      message: 'Thank you! Your consultation request has been received. A medical coordinator will contact you within 24 hours.',
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please call our helpline.' }, { status: 500 })
  }
}
