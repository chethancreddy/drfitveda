import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrainingRecordingService } from '@/lib/services/recording.service'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const customerId = req.nextUrl.searchParams.get('customerId')
    if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 })

    const { signedUrl, expiresAt } = await TrainingRecordingService.generateSignedUrl(customerId, user.id)
    return NextResponse.json({ signedUrl, expiresAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    const status = msg.includes('Unauthorized') ? 403 : msg.includes('No active') ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
