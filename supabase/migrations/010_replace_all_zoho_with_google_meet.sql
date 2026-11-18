-- ============================================================
-- Dr Fit Veda — Migration 010: Replace All Zoho References with Google Meet
-- Idempotent, safe migration ensuring all consultation services,
-- membership plan descriptions, appointments, and training sessions
-- strictly use 'Google Meet' instead of 'Zoho Meeting'.
-- ============================================================

-- 1. Update Consultation Services
UPDATE public.consultation_services
SET consultation_type = REPLACE(REPLACE(consultation_type, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE consultation_type ILIKE '%zoho%';

UPDATE public.consultation_services
SET short_description = REPLACE(REPLACE(short_description, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE short_description ILIKE '%zoho%';

UPDATE public.consultation_services
SET full_description = REPLACE(REPLACE(full_description, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE full_description ILIKE '%zoho%';

UPDATE public.consultation_services
SET description = REPLACE(REPLACE(description, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE description ILIKE '%zoho%';

-- Set modern default for future records
ALTER TABLE public.consultation_services
  ALTER COLUMN consultation_type SET DEFAULT 'Online Video (Google Meet)';

-- 2. Update Appointments
UPDATE public.appointments
SET consultation_type = REPLACE(REPLACE(consultation_type, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE consultation_type ILIKE '%zoho%';

UPDATE public.appointments
SET meeting_provider = 'google_meet'
WHERE meeting_provider = 'zoho_meeting';

-- 3. Update Customers meeting provider
UPDATE public.customers
SET meeting_provider = 'google_meet'
WHERE meeting_provider = 'zoho_meeting';

-- 4. Update Website Settings (Persisted state JSON)
-- Any consultation_services, memberships, or appointments JSON stored in website_settings
UPDATE public.website_settings
SET value = REPLACE(REPLACE(value, 'Zoho Meeting', 'Google Meet'), 'zoho meeting', 'Google Meet')
WHERE value ILIKE '%zoho meeting%';
