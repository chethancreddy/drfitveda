-- ============================================================
-- Dr Fit Veda — Migration 005: Privacy & Compliance
-- Minimal consent records + data-subject request handling.
-- DRAFT: retention periods below are placeholders pending legal review.
-- ============================================================

-- ─── Consent records (append-only: a withdrawal is a new row) ─────
create table if not exists public.consent_records (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete set null,
  customer_id    uuid references public.customers(id) on delete set null,
  purpose        text not null check (purpose in
                   ('health_data_processing','session_recording','contact_enquiry','marketing')),
  granted        boolean not null,
  policy_version text not null,           -- version of the Privacy Policy shown
  source         text not null,           -- e.g. 'document_upload', 'booking', 'contact_form'
  created_at     timestamptz not null default now()
  -- Deliberately NOT stored: IP address, user agent, free text.
);

create index if not exists idx_consent_user    on public.consent_records(user_id, purpose, created_at desc);
create index if not exists idx_consent_created on public.consent_records(created_at);

-- ─── Data-subject requests ────────────────────────────────────────
create table if not exists public.data_subject_requests (
  id                  uuid primary key default uuid_generate_v4(),
  request_type        text not null check (request_type in
                        ('access','correction','export','deletion','withdraw_consent','complaint')),
  requester_name      text not null,
  requester_email     text not null,
  details             text,               -- users are told NOT to include health data here
  user_id             uuid references auth.users(id) on delete set null,
  status              text not null default 'received'
                        check (status in ('received','verifying','in_progress','completed','partially_completed','rejected')),
  identity_verified   boolean not null default false,
  due_at              timestamptz not null default (now() + interval '30 days'),
  handled_by          uuid references auth.users(id),
  resolution_note     text,               -- includes what was retained and why
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  closed_at           timestamptz
);

create index if not exists idx_dsr_status on public.data_subject_requests(status, due_at);

-- ─── Row Level Security ───────────────────────────────────────────
alter table public.consent_records       enable row level security;
alter table public.data_subject_requests enable row level security;

-- Users may read and add their own consent rows; never edit/delete.
drop policy if exists "consent_own_select" on public.consent_records;
create policy "consent_own_select" on public.consent_records
  for select using (user_id = auth.uid());

drop policy if exists "consent_own_insert" on public.consent_records;
create policy "consent_own_insert" on public.consent_records
  for insert with check (user_id = auth.uid());

drop policy if exists "consent_admin_select" on public.consent_records;
create policy "consent_admin_select" on public.consent_records
  for select using (public.is_admin());

-- Requests: inserted server-side only (service role bypasses RLS).
-- Anonymous/authenticated clients get no direct table access; admins manage them.
drop policy if exists "dsr_admin_all" on public.data_subject_requests;
create policy "dsr_admin_all" on public.data_subject_requests
  for all using (public.is_admin());

-- Retention (to be enforced by a scheduled job once periods are confirmed):
--   consent_records       : keep while relevant + 3 years       [CONFIRM]
--   data_subject_requests : keep 3 years after closed_at        [CONFIRM]
