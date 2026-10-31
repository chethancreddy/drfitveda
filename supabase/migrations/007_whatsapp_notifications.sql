-- ============================================================
-- Migration 007: Automated WhatsApp Notifications & Reminders
-- Tracks customer/trainer 15-minute session reminders and
-- doctor/trainer customer assignment notifications via MSG91.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'customer_session_reminder',
      'trainer_session_reminder',
      'doctor_customer_assigned',
      'trainer_customer_assigned'
    )
  ),
  template_name TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  session_id TEXT,
  assignment_id TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  session_scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  provider_message_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (
    delivery_status IN ('Pending', 'Processing', 'Sent', 'Delivered', 'Failed', 'Cancelled')
  ),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  permanent_failure BOOLEAN NOT NULL DEFAULT FALSE,
  error_details TEXT,
  message_preview TEXT,
  template_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status_scheduled
  ON public.whatsapp_notifications (delivery_status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_session_id
  ON public.whatsapp_notifications (session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id
  ON public.whatsapp_notifications (customer_id);

