import { NextRequest, NextResponse } from 'next/server'
import { runWhatsAppReminderScheduler } from '@/lib/services/whatsapp-notification.service'

// ============================================================
// GET / POST /api/cron/whatsapp-reminders
// Automated background scheduler for 15-minute WhatsApp session
// reminders and exponential-backoff retries.
// Runs automatically via Vercel Cron without any browser open.
// ============================================================

function isAuthorizedCronOrAdmin(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (cronSecret && headerSecret === cronSecret) return true

  // Also allow Vercel's internal cron user-agent header when CRON_SECRET is not set
  const ua = req.headers.get('user-agent') || ''
  if (!cronSecret && ua.includes('vercel-cron')) return true

  // Allow authenticated Admin / Operations Manager session
  const sessionCookie = req.cookies.get('drf_session')?.value
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie))
      if (['admin', 'super_admin', 'operations_manager', 'care_coordinator'].includes(parsed.role)) {
        return true
      }
    } catch {}
  }

  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronOrAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const summary = await runWhatsAppReminderScheduler()
    return NextResponse.json({
      ok: true,
      ...summary,
    })
  } catch (err: any) {
    console.error('[whatsapp-reminders cron] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Reminder scheduler error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}

