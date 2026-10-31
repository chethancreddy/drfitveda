import { NextRequest, NextResponse } from 'next/server'
import { handleMsg91DeliveryWebhook } from '@/lib/services/whatsapp-notification.service'

// ============================================================
// POST /api/webhooks/msg91-whatsapp
// Receives MSG91 WhatsApp outbound delivery status callbacks
// Transitions provider-accepted ("Sent") records to "Delivered"
// or "Failed" based on actual WhatsApp delivery receipts.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const requestId =
      body.requestId ||
      body.request_id ||
      body.uuid ||
      body.data?.request_id ||
      undefined
    const notificationId = body.notificationId || body.notification_id || undefined
    const rawStatus = String(
      body.status || body.event || body.delivery_status || body.data?.status || ''
    )
      .toLowerCase()
      .trim()

    let mappedStatus: 'delivered' | 'read' | 'failed' | 'sent' = 'sent'
    if (rawStatus.includes('deliver')) mappedStatus = 'delivered'
    else if (rawStatus.includes('read')) mappedStatus = 'read'
    else if (rawStatus.includes('fail') || rawStatus.includes('reject') || rawStatus.includes('undeliver')) {
      mappedStatus = 'failed'
    }

    const errorReason = body.reason || body.error || body.message || body.data?.reason || undefined

    const res = await handleMsg91DeliveryWebhook({
      requestId,
      notificationId,
      status: mappedStatus,
      errorReason,
    })

    return NextResponse.json({
      success: true,
      updated: res.updated,
      status: res.record?.delivery_status || null,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid webhook payload' },
      { status: 400 }
    )
  }
}

