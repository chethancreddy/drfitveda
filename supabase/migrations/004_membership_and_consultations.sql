-- ============================================================
-- Migration: 004_membership_and_consultations.sql
-- Dr Fit Veda — New membership tiers & standalone consultations
-- ============================================================

-- 1. Extend memberships table with new plan fields
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS duration_label         text            DEFAULT '1 Month',
  ADD COLUMN IF NOT EXISTS live_sessions_count    integer,
  ADD COLUMN IF NOT EXISTS session_frequency      text,
  ADD COLUMN IF NOT EXISTS extra_consultation_count integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_yoga_consultation  boolean         DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_yoga_plan          boolean         DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_super_plan          boolean         DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_meet_recording  boolean         DEFAULT true,
  ADD COLUMN IF NOT EXISTS benefits               text[]          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_order          integer         DEFAULT 99,
  ADD COLUMN IF NOT EXISTS original_price         numeric(10,2);

-- 2. Create standalone consultation services table
CREATE TABLE IF NOT EXISTS public.consultation_services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key              text UNIQUE NOT NULL,
  name             text NOT NULL,
  category         text NOT NULL CHECK (category IN ('yoga', 'pcod', 'wellness', 'other')),
  description      text,
  price            numeric(10,2) NOT NULL DEFAULT 499,
  duration_min     integer NOT NULL DEFAULT 30,
  is_active        boolean NOT NULL DEFAULT true,
  display_order    integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 3. Seed the 4 membership plans (upsert by name to stay idempotent)
INSERT INTO public.memberships (
  name, duration_label, duration_days, price, original_price,
  live_sessions_count, session_frequency,
  extra_consultation_count, has_yoga_consultation, has_yoga_plan,
  is_super_plan, google_meet_recording, benefits, is_active, display_order
) VALUES
  (
    'Starter Plan', '1 Month', 30, 9999, 14999,
    12, 'Total 12 live 1-on-1 sessions with trainers',
    0, false, false, false, true,
    ARRAY[
      '12 live 1-on-1 sessions with certified trainer',
      'Customized fitness & nutrition plan',
      'Daily check-in & adherence tracking',
      'Secure chat with care team',
      'Video gallery: upload & get coach feedback',
      'Google Meet sessions with recordings'
    ],
    true, 1
  ),
  (
    'Growth Plan', '6 Months', 180, 49999, 79999,
    72, 'Total 72 live 1-on-1 sessions with trainers',
    0, false, false, false, true,
    ARRAY[
      '72 live 1-on-1 sessions with certified trainer',
      'Customized fitness & nutrition plan',
      'Bi-weekly doctor plan review & iteration',
      'Daily check-in & adherence tracking',
      'Secure chat with care team',
      'Video gallery: upload & get coach feedback',
      'Google Meet sessions with recordings',
      'Progress tracking & monthly health reports'
    ],
    true, 2
  ),
  (
    'Elite Plan', '12 Months', 365, 89999, 149999,
    150, 'Total 150 live 1-on-1 sessions with trainers',
    0, false, false, false, true,
    ARRAY[
      '150 live 1-on-1 sessions with certified trainer',
      'Customized fitness & nutrition plan',
      'Bi-weekly doctor plan review & iteration',
      'Daily check-in & adherence tracking',
      'Secure chat with care team',
      'Video gallery: upload & get coach feedback',
      'Google Meet sessions with recordings',
      'Progress tracking & quarterly health reports',
      'Priority appointment scheduling'
    ],
    true, 3
  ),
  (
    'Super Plan', '12 Months', 365, 199999, 299999,
    NULL, 'Weekly 5 live 1-on-1 sessions with trainer + Weekly 1 doctor diagnosis & monitoring + Unlimited daily live doctor consultation (weekdays only)',
    NULL, true, true, true, true,
    ARRAY[
      'Weekly 5 live 1-on-1 sessions with certified trainer (Google Meet)',
      'Weekly 1 live doctor diagnosis & full activity monitoring session',
      'Unlimited live 1-on-1 doctor consultations (once per day, weekdays only)',
      'All Google Meet sessions recorded with overwrite access',
      'Customized fitness, nutrition & yoga plan',
      'Daily check-in & adherence tracking',
      'Dedicated care team: doctor + trainer + yoga specialist',
      'Video gallery: upload & get expert feedback',
      'Priority 24/7 secure chat with care team',
      'Quarterly full health assessments & reports',
      'Yoga consultation & personalized yoga plan'
    ],
    true, 4
  )
ON CONFLICT (name) DO UPDATE SET
  price                   = EXCLUDED.price,
  original_price          = EXCLUDED.original_price,
  live_sessions_count     = EXCLUDED.live_sessions_count,
  session_frequency       = EXCLUDED.session_frequency,
  benefits                = EXCLUDED.benefits,
  is_active               = EXCLUDED.is_active,
  display_order           = EXCLUDED.display_order,
  duration_label          = EXCLUDED.duration_label;

-- 4. Seed the 3 standalone consultation services
INSERT INTO public.consultation_services (key, name, category, description, price, duration_min, is_active, display_order)
VALUES
  ('yoga_consultation',    'Yoga Consultation',        'yoga',    'One-on-one session with a certified Yoga Doctor. Includes assessment, pranayama prescription, and personalised yoga asana plan.',                        499, 30, true, 1),
  ('pcod_consultation',    'PCOD / PCOS Consultation', 'pcod',    'Specialist clinical consultation for hormonal imbalances, PCOD & PCOS. Includes dietary guidance, lifestyle correction, and follow-up protocol.',   499, 30, true, 2),
  ('wellness_consultation','General Wellness Consultation', 'wellness', 'For thyroid, stress, gut health, immunity, and other general health concerns with a naturopathic doctor.',                                     499, 30, true, 3)
ON CONFLICT (key) DO UPDATE SET
  price       = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active   = EXCLUDED.is_active;

-- 5. Enable RLS on consultation_services
ALTER TABLE public.consultation_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "consultation_services_public_read"
  ON public.consultation_services FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "consultation_services_admin_all"
  ON public.consultation_services FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
  );
