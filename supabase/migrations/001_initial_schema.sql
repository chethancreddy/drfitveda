-- ============================================================
-- Dr Fit Veda — Migration 001: Initial Schema
-- Database Engineer Agent
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fuzzy text search

-- ─── Enums ────────────────────────────────────────────────

create type user_role as enum (
  'super_admin','admin','doctor','naturopathy_doctor',
  'nutritionist','trainer','yoga_doctor','yoga_consultant','customer'
);

create type membership_status as enum ('active','inactive','expired','cancelled','suspended');
create type order_status      as enum ('pending','paid','failed','refunded','cancelled');
create type payment_status    as enum ('pending','processing','success','failed','refunded');
create type payout_status     as enum ('pending','on_hold','approved','paid','cancelled');
create type plan_status       as enum ('draft','published','archived');
create type review_status     as enum ('due','in_progress','completed','approved','skipped','cancelled');
create type session_status    as enum ('scheduled','live','completed','cancelled');
create type recording_status  as enum ('uploading','processing','available','inactive','deleted');
create type retention_mode    as enum ('immediate','grace_period');
create type document_status   as enum ('pending','reviewed','archived');
create type gender_type       as enum ('male','female','other','prefer_not_to_say');
create type diet_pref         as enum ('vegetarian','vegan','non_vegetarian','eggetarian','jain','other');
create type check_in_status   as enum ('yes','partial','no','skip');
create type appointment_status as enum ('scheduled','completed','cancelled','no_show');

-- ─── Identity ─────────────────────────────────────────────

-- users is managed by Supabase Auth (auth.users)
-- We extend it with a profiles table

create table public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'customer',
  full_name     text,
  display_name  text,
  phone         text,
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index idx_user_profiles_phone on public.user_profiles(phone) where phone is not null;

-- ─── Professionals ────────────────────────────────────────

create table public.professionals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique references auth.users(id) on delete set null,
  role            user_role not null,
  full_name       text not null,
  qualification   text,
  specialization  text,
  experience_years int,
  bio             text,
  photo_url       text,
  is_available    boolean not null default true,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_professionals_role   on public.professionals(role);
create index idx_professionals_active on public.professionals(is_active);

-- ─── Customers ────────────────────────────────────────────

create table public.customers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique not null references auth.users(id) on delete cascade,
  membership_status membership_status not null default 'inactive',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_customers_user_id on public.customers(user_id);
create index idx_customers_status  on public.customers(membership_status);

create table public.customer_profiles (
  id               uuid primary key default uuid_generate_v4(),
  customer_id      uuid unique not null references public.customers(id) on delete cascade,
  date_of_birth    date,
  gender           gender_type,
  height_cm        numeric(5,2),
  weight_kg        numeric(5,2),
  bmi              numeric(5,2) generated always as (
                     case when height_cm > 0
                     then round((weight_kg / ((height_cm/100)^2))::numeric, 2)
                     else null end
                   ) stored,
  occupation       text,
  work_schedule    text,
  sleep_hours      numeric(4,2),
  activity_level   text,
  exercise_history text,
  stress_level     int check (stress_level between 1 and 10),
  lifestyle_notes  text,
  goals            text,
  women_wellness   jsonb,         -- restricted field
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.food_profiles (
  id                  uuid primary key default uuid_generate_v4(),
  customer_id         uuid unique not null references public.customers(id) on delete cascade,
  dietary_preference  diet_pref,
  meal_timing         text,
  typical_meals       text,
  snacks              text,
  preferences         text,
  dislikes            text,
  eating_out_freq     text,
  water_intake_liters numeric(4,2),
  restrictions        text,
  allergies           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Professional Assignments ─────────────────────────────

create table public.professional_assignments (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  professional_id uuid not null references public.professionals(id) on delete cascade,
  role            user_role not null,
  assigned_by     uuid references auth.users(id),
  assigned_at     timestamptz not null default now(),
  unassigned_at   timestamptz,
  is_active       boolean not null default true,
  notes           text
);

create index idx_assignments_customer    on public.professional_assignments(customer_id, is_active);
create index idx_assignments_professional on public.professional_assignments(professional_id, is_active);

-- ─── Memberships & Orders ─────────────────────────────────

create table public.memberships (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  description    text,
  duration_days  int not null default 90,
  original_price numeric(10,2) not null,
  current_price  numeric(10,2) not null,
  discount       numeric(5,2) default 0,
  benefits       jsonb,
  included_services jsonb,
  included_reviews  int default 12,
  is_featured    boolean default false,
  display_order  int default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.offers (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  description      text,
  discount_percent numeric(5,2),
  discount_amount  numeric(10,2),
  start_date       date,
  end_date         date,
  membership_ids   uuid[],
  banner_url       text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  customer_id       uuid not null references public.customers(id),
  membership_id     uuid not null references public.memberships(id),
  offer_id          uuid references public.offers(id),
  gross_amount      numeric(10,2) not null,
  discount_amount   numeric(10,2) not null default 0,
  net_amount        numeric(10,2) not null,
  currency          char(3) not null default 'INR',
  status            order_status not null default 'pending',
  provider_order_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status   on public.orders(status);

create table public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references public.orders(id),
  amount              numeric(10,2) not null,
  currency            char(3) not null default 'INR',
  status              payment_status not null default 'pending',
  provider            text not null default 'razorpay',
  provider_payment_id text,
  provider_signature  text,
  raw_event           jsonb,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_payments_order on public.payments(order_id);

create table public.subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.customers(id),
  membership_id uuid not null references public.memberships(id),
  order_id      uuid not null references public.orders(id),
  starts_at     date not null,
  ends_at       date not null,
  status        membership_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_subscriptions_customer on public.subscriptions(customer_id);
create index idx_subscriptions_status   on public.subscriptions(status);

-- ─── Plans & Versions ─────────────────────────────────────

create table public.plans (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id),
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table public.plan_versions (
  id            uuid primary key default uuid_generate_v4(),
  plan_id       uuid not null references public.plans(id),
  version_number int not null default 1,
  status        plan_status not null default 'draft',
  change_reason text,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  effective_from date,
  unique(plan_id, version_number)
);

create table public.plan_items (
  id              uuid primary key default uuid_generate_v4(),
  plan_version_id uuid not null references public.plan_versions(id),
  category        text not null, -- nutrition, workout, yoga, sleep, lifestyle, water, etc.
  instruction     text not null,
  internal_notes  text,
  display_order   int default 0
);

-- ─── Doctor Assessments ───────────────────────────────────

create table public.doctor_assessments (
  id                 uuid primary key default uuid_generate_v4(),
  customer_id        uuid not null references public.customers(id),
  doctor_id          uuid not null references public.professionals(id),
  lifestyle_notes    text,
  food_notes         text,
  what_to_add        text,
  what_to_reduce     text,
  what_to_modify     text,
  nutrition_guidance text,
  sleep_guidance     text,
  activity_guidance  text,
  internal_notes     text,
  follow_up_date     date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── Workouts ─────────────────────────────────────────────

create table public.workout_plans (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id),
  trainer_id      uuid not null references public.professionals(id),
  plan_version_id uuid references public.plan_versions(id),
  name            text not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table public.workout_sessions (
  id              uuid primary key default uuid_generate_v4(),
  workout_plan_id uuid not null references public.workout_plans(id),
  day_of_week     int check (day_of_week between 0 and 6),
  session_name    text,
  duration_min    int,
  instructions    text,
  display_order   int default 0
);

create table public.exercise_library (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  category     text,
  description  text,
  video_url    text,
  thumbnail_url text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.workout_exercises (
  id               uuid primary key default uuid_generate_v4(),
  workout_session_id uuid not null references public.workout_sessions(id),
  exercise_id      uuid references public.exercise_library(id),
  exercise_name    text,   -- fallback if not in library
  sets             int,
  reps             text,   -- e.g. "10-12" or "failure"
  duration_seconds int,
  rest_seconds     int,
  instructions     text,
  display_order    int default 0
);

-- ─── Yoga ─────────────────────────────────────────────────

create table public.yoga_programs (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.customers(id),
  professional_id uuid not null references public.professionals(id),
  name          text not null,
  frequency     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.yoga_sessions (
  id               uuid primary key default uuid_generate_v4(),
  yoga_program_id  uuid not null references public.yoga_programs(id),
  name             text,
  duration_min     int,
  asanas           jsonb,
  video_url        text,
  instructions     text,
  display_order    int default 0
);

-- ─── Daily Check-Ins ──────────────────────────────────────

create table public.daily_check_ins (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id),
  plan_version_id uuid references public.plan_versions(id),
  check_in_date   date not null,
  workout_status  check_in_status,
  diet_status     check_in_status,
  yoga_status     check_in_status,
  water_status    check_in_status,
  other_status    check_in_status,
  energy_level    int check (energy_level between 1 and 5),
  mood_level      int check (mood_level between 1 and 5),
  note            text,
  created_at      timestamptz not null default now(),
  unique(customer_id, check_in_date)
);

create index idx_check_ins_customer_date on public.daily_check_ins(customer_id, check_in_date);

-- ─── Progress Records ─────────────────────────────────────

create table public.progress_records (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.customers(id),
  recorded_by   uuid references auth.users(id),
  recorded_date date not null,
  weight_kg     numeric(5,2),
  height_cm     numeric(5,2),
  notes         text,
  measurements  jsonb,
  created_at    timestamptz not null default now()
);

-- ─── Weekly Reviews ───────────────────────────────────────

create table public.weekly_reviews (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id),
  doctor_id       uuid not null references public.professionals(id),
  plan_version_id uuid references public.plan_versions(id),
  review_date     date not null,
  status          review_status not null default 'due',
  adherence_notes text,
  doctor_notes    text,
  outcome         text,
  new_plan_version_id uuid references public.plan_versions(id),
  next_review_date date,
  completed_at    timestamptz,
  approved_at     timestamptz,
  approved_by     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_reviews_doctor_status   on public.weekly_reviews(doctor_id, status);
create index idx_reviews_customer_date   on public.weekly_reviews(customer_id, review_date);

-- ─── Consultations / Appointments ────────────────────────

create table public.appointments (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid not null references public.customers(id),
  professional_id uuid not null references public.professionals(id),
  scheduled_at    timestamptz not null,
  duration_min    int default 30,
  status          appointment_status not null default 'scheduled',
  notes           text,
  meeting_url     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_appointments_customer      on public.appointments(customer_id);
create index idx_appointments_professional  on public.appointments(professional_id, scheduled_at);

create table public.consultation_notes (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references public.appointments(id),
  notes           text,
  recommendations text,
  follow_up_date  date,
  created_at      timestamptz not null default now()
);

-- ─── Medical Documents ────────────────────────────────────

create table public.medical_documents (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references public.customers(id),
  uploaded_by  uuid not null references auth.users(id),
  doc_type     text not null,
  storage_key  text not null,
  file_name    text,
  file_size    bigint,
  status       document_status not null default 'pending',
  notes        text,
  uploaded_at  timestamptz not null default now()
);

create index idx_documents_customer on public.medical_documents(customer_id);

-- ─── Food Database ────────────────────────────────────────

create table public.foods (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  category              text,
  serving_size          numeric(8,2),
  serving_unit          text,
  calories_per_serving  numeric(8,2),
  protein_g             numeric(8,2),
  carbs_g               numeric(8,2),
  fat_g                 numeric(8,2),
  fibre_g               numeric(8,2),
  dietary_class         text,
  region                text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

create index idx_foods_name on public.foods using gin(name gin_trgm_ops);

-- ─── Finance ──────────────────────────────────────────────

create table public.compensation_rule_versions (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  effective_from date not null,
  effective_to   date,
  is_active    boolean not null default true,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);

create table public.payout_rule_components (
  id               uuid primary key default uuid_generate_v4(),
  rule_version_id  uuid not null references public.compensation_rule_versions(id),
  component_code   text not null,
  component_name   text not null,
  role             user_role,
  amount_type      text not null default 'fixed', -- fixed | percent
  amount           numeric(10,2) not null,
  applicability    text,
  is_active        boolean not null default true
);

create table public.service_events (
  id               uuid primary key default uuid_generate_v4(),
  event_type       text not null,
  customer_id      uuid references public.customers(id),
  professional_id  uuid references public.professionals(id),
  order_id         uuid references public.orders(id),
  reference_id     uuid,
  rule_version_id  uuid references public.compensation_rule_versions(id),
  amount           numeric(10,2),
  currency         char(3) default 'INR',
  notes            text,
  created_at       timestamptz not null default now()
);

create table public.payouts (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professionals(id),
  customer_id     uuid references public.customers(id),
  order_id        uuid references public.orders(id),
  service_event_id uuid references public.service_events(id),
  payout_type     text not null,
  amount          numeric(10,2) not null,
  currency        char(3) not null default 'INR',
  rule_version_id uuid references public.compensation_rule_versions(id),
  service_date    date,
  status          payout_status not null default 'pending',
  approved_by     uuid references auth.users(id),
  approved_at     timestamptz,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_payouts_professional_status on public.payouts(professional_id, status);

create table public.financial_transactions (
  id                         uuid primary key default uuid_generate_v4(),
  order_id                   uuid not null references public.orders(id),
  gross_amount               numeric(10,2) not null,
  discount_amount            numeric(10,2) not null default 0,
  net_paid_amount            numeric(10,2) not null,
  currency                   char(3) not null default 'INR',
  compensation_rule_version_id uuid references public.compensation_rule_versions(id),
  payout_components_snapshot jsonb not null,
  company_allocation         numeric(10,2) not null,
  transaction_status         text not null,
  effective_date             date not null,
  created_at                 timestamptz not null default now()
);

-- ─── CMS ──────────────────────────────────────────────────

create table public.website_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

create table public.website_pages (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  title        text not null,
  meta_title   text,
  meta_desc    text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.website_sections (
  id            uuid primary key default uuid_generate_v4(),
  page_id       uuid not null references public.website_pages(id),
  section_type  text not null,
  title         text,
  body          text,
  media_url     text,
  cta_text      text,
  cta_url       text,
  config        jsonb,
  display_order int not null default 0,
  is_active     boolean not null default true
);

create table public.testimonials (
  id            uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  content       text not null,
  rating        int check (rating between 1 and 5),
  avatar_url    text,
  is_featured   boolean default false,
  display_order int default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.faqs (
  id            uuid primary key default uuid_generate_v4(),
  question      text not null,
  answer        text not null,
  category      text,
  display_order int default 0,
  is_active     boolean not null default true
);

-- ─── Notifications ────────────────────────────────────────

create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id),
  title       text not null,
  body        text,
  type        text,
  is_read     boolean not null default false,
  action_url  text,
  created_at  timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);

-- ─── Audit Logs ───────────────────────────────────────────

create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id),
  action      text not null,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_user       on public.audit_logs(user_id);

-- ─── Live Training (Rolling Recording) ───────────────────

create table public.training_sessions (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references public.customers(id),
  trainer_id   uuid not null references public.professionals(id),
  scheduled_at timestamptz,
  started_at   timestamptz,
  ended_at     timestamptz,
  status       session_status not null default 'scheduled',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_training_sessions_customer on public.training_sessions(customer_id);
create index idx_training_sessions_trainer  on public.training_sessions(trainer_id);
create index idx_training_sessions_status   on public.training_sessions(status);

create table public.training_recordings (
  id                 uuid primary key default uuid_generate_v4(),
  session_id         uuid not null references public.training_sessions(id),
  customer_id        uuid not null references public.customers(id),
  storage_key        text not null,
  recording_status   recording_status not null default 'uploading',
  is_active          boolean not null default false,
  file_size_bytes    bigint,
  duration_seconds   int,
  activated_at       timestamptz,
  deactivated_at     timestamptz,
  deletion_queued_at timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Enforce: only one active recording per customer at DB level
create unique index idx_one_active_recording_per_customer
  on public.training_recordings(customer_id)
  where is_active = true;

create index idx_training_recordings_customer_status
  on public.training_recordings(customer_id, recording_status);

create index idx_training_recordings_deletion_queue
  on public.training_recordings(deletion_queued_at)
  where deleted_at is null;

create table public.training_retention_config (
  id                uuid primary key default uuid_generate_v4(),
  config_key        text unique not null default 'default_retention_policy',
  retention_mode    retention_mode not null default 'grace_period',
  grace_period_hours int default 24,
  updated_by        uuid references auth.users(id),
  updated_at        timestamptz not null default now()
);
