import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateConsent, POLICY_VERSION } from '@/lib/legal/validation'
import { getSignedInUser } from '@/lib/legal/auth'

// ============================================================
// POST /api/consents — record a consent grant or withdrawal for the
//   signed-in user (append-only). Stores purpose, yes/no, policy version,
//   source and timestamp only — no IP address or free text.
// GET  /api/consents — the signed-in user's latest decision per purpose.
// ============================================================

export async function POST(req: NextRequest) {
  const user = await getSignedInUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const err = validateConsent(b)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: cust } = await (supabase as any).from('customers').select('id').eq('user_id', user.id).single()

  const { error } = await (supabase as any).from('consent_records').insert({
    user_id: user.id,
    customer_id: cust?.id ?? null,
    purpose: b.purpose,
    granted: b.granted,
    policy_version: POLICY_VERSION,
    source: b.source,
  })
  if (error) return NextResponse.json({ error: 'Could not save consent.' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET() {
  const user = await getSignedInUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase as any)
    .from('consent_records').select('purpose, granted, policy_version, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false })

  const latest: Record<string, any> = {}
  for (const r of data ?? []) if (!latest[r.purpose]) latest[r.purpose] = r
  return NextResponse.json({ consents: latest })
}
