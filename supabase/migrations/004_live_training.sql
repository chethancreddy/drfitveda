-- ============================================================
-- Dr Fit Veda — Migration 004: Live Training Recording
-- Database Engineer Agent
-- TRD §8 (Live Training group), §47.3, §47.8
-- ============================================================

-- ─── training_sessions ──────────────────────────────────────
-- One row per scheduled / live / completed session.

create table if not exists public.training_sessions (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  trainer_id    uuid not null references public.professionals(id),
  scheduled_at  timestamptz,
  started_at    timestamptz,
  ended_at      timestamptz,
  status        session_status not null default 'scheduled',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_training_sessions_customer  on public.training_sessions(customer_id);
create index idx_training_sessions_trainer   on public.training_sessions(trainer_id);
create index idx_training_sessions_status    on public.training_sessions(status);
create index idx_training_sessions_scheduled on public.training_sessions(scheduled_at desc);

-- ─── training_recordings ────────────────────────────────────
-- Only ONE row per customer may have is_active = true at any time
-- (enforced by unique partial index).

create table if not exists public.training_recordings (
  id                   uuid primary key default uuid_generate_v4(),
  session_id           uuid not null references public.training_sessions(id) on delete cascade,
  customer_id          uuid not null references public.customers(id),
  storage_key          text not null,
  recording_status     recording_status not null default 'uploading',
  is_active            boolean not null default false,
  file_size_bytes      bigint,
  duration_seconds     int,
  activated_at         timestamptz,
  deactivated_at       timestamptz,
  deletion_queued_at   timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Enforce: at most 1 active recording per customer at any time
create unique index idx_training_recordings_one_active
  on public.training_recordings(customer_id)
  where is_active = true;

create index idx_training_recordings_customer on public.training_recordings(customer_id);
create index idx_training_recordings_session  on public.training_recordings(session_id);
create index idx_training_recordings_cleanup  on public.training_recordings(deletion_queued_at)
  where deleted_at is null and recording_status = 'inactive';

-- ─── training_retention_config ──────────────────────────────

create table if not exists public.training_retention_config (
  id                uuid primary key default uuid_generate_v4(),
  config_key        text not null unique,
  retention_mode    retention_mode not null default 'grace_period',
  grace_period_hours int,
  updated_by        uuid references auth.users(id),
  updated_at        timestamptz not null default now()
);

-- Seed default policy
insert into public.training_retention_config (config_key, retention_mode, grace_period_hours)
values ('default_retention_policy', 'grace_period', 24)
on conflict (config_key) do nothing;

-- ─── Row Level Security ─────────────────────────────────────

alter table public.training_sessions         enable row level security;
alter table public.training_recordings       enable row level security;
alter table public.training_retention_config enable row level security;

-- training_sessions RLS --

create policy "admin_all_training_sessions"
  on public.training_sessions for all
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "trainer_own_sessions"
  on public.training_sessions for all
  using (
    exists (select 1 from public.professionals p where p.user_id = auth.uid() and p.id = training_sessions.trainer_id)
  );

create policy "customer_read_own_sessions"
  on public.training_sessions for select
  using (
    exists (select 1 from public.customers c where c.user_id = auth.uid() and c.id = training_sessions.customer_id)
  );

-- training_recordings RLS --

create policy "admin_all_recordings"
  on public.training_recordings for all
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "trainer_own_recordings"
  on public.training_recordings for all
  using (
    exists (
      select 1 from public.training_sessions s
      join public.professionals p on p.id = s.trainer_id
      where s.id = training_recordings.session_id and p.user_id = auth.uid()
    )
  );

create policy "customer_read_own_recordings"
  on public.training_recordings for select
  using (
    exists (select 1 from public.customers c where c.user_id = auth.uid() and c.id = training_recordings.customer_id)
  );

-- training_retention_config RLS --

create policy "admin_retention_config"
  on public.training_retention_config for all
  using (
    exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','super_admin'))
  );
