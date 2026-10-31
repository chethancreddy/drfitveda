-- ============================================================
-- Migration 008: Consultation Services CMS Enhancement
-- Backward-compatible extension of public.consultation_services
-- to support full CMS fields and configurable categories.
-- ============================================================

ALTER TABLE public.consultation_services
  DROP CONSTRAINT IF EXISTS consultation_services_category_check;

ALTER TABLE public.consultation_services
  ADD COLUMN IF NOT EXISTS short_description       TEXT,
  ADD COLUMN IF NOT EXISTS full_description        TEXT,
  ADD COLUMN IF NOT EXISTS specialist_designation  TEXT DEFAULT 'Specialist Doctor',
  ADD COLUMN IF NOT EXISTS icon                    TEXT DEFAULT '🩺',
  ADD COLUMN IF NOT EXISTS image_url               TEXT,
  ADD COLUMN IF NOT EXISTS consultation_type       TEXT DEFAULT 'Online Video (Zoho Meeting)',
  ADD COLUMN IF NOT EXISTS currency                TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS is_archived             BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.consultation_categories (
  id            TEXT PRIMARY KEY,
  key           TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '🩺',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

