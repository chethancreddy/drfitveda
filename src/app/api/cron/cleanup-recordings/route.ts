import { NextResponse } from 'next/server'
import { TrainingRecordingService } from '@/lib/services/recording.service'

// GET /api/cron/cleanup-recordings
// Called by Vercel Cron — protected by CRON_SECRET header
export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ','')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await TrainingRecordingService.runCleanupJob()
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    console.error('Cleanup cron error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
