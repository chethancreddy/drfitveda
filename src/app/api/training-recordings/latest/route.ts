// ============================================================
// GET /api/training-recordings/latest
// Customer fetches latest recording status + signed URL (if available).
// TRD §47.7 — watch_url included only when recording_status = 'available'
// ============================================================
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrainingRecordingService } from '@/lib/services/recording.service'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve customer record
    const { data: customer } = await (supabase as any)
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!customer) return NextResponse.json({ error: 'Not a customer' }, { status: 403 })

    const info = await TrainingRecordingService.getLatestRecordingStatus(customer.id)

    if (!info.hasRecording || !info.recordingStatus) {
      return NextResponse.json({
        recording_status: null,
        session: null,
        watch_url: null,
      })
    }

    let watchUrl: string | null = null
    if (info.recordingStatus === 'available') {
      try {
        const { signedUrl } = await TrainingRecordingService.generateSignedUrl(customer.id, user.id)
        watchUrl = signedUrl
      } catch {
        // Recording available but signed URL failed — return status without URL
      }
    }

    return NextResponse.json({
      recording_status: info.recordingStatus,
      session: info.session
        ? {
            date: (info.session as { scheduled_at: string | null }).scheduled_at,
            trainer_name: (info.session as { trainer: { full_name: string } | null }).trainer?.full_name ?? null,
          }
        : null,
      watch_url: watchUrl,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
