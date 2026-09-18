-- ============================================================
-- Dr Fit Veda — Migration 003: Row Level Security
-- Security & Performance Engineer Agent
-- ============================================================

-- Enable RLS on all sensitive tables
alter table public.user_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.food_profiles enable row level security;
alter table public.professional_assignments enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.plan_items enable row level security;
alter table public.doctor_assessments enable row level security;
alter table public.daily_check_ins enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.progress_records enable row level security;
alter table public.medical_documents enable row level security;
alter table public.appointments enable row level security;
alter table public.consultation_notes enable row level security;
alter table public.notifications enable row level security;
alter table public.payouts enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_recordings enable row level security;
alter table public.training_retention_config enable row level security;

-- ─── Helper functions ─────────────────────────────────────

create or replace function public.get_my_role()
returns user_role language sql security definer stable as $$
  select role from public.user_profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select get_my_role() in ('admin','super_admin')
$$;

create or replace function public.get_my_customer_id()
returns uuid language sql security definer stable as $$
  select id from public.customers where user_id = auth.uid()
$$;

create or replace function public.get_my_professional_id()
returns uuid language sql security definer stable as $$
  select id from public.professionals where user_id = auth.uid()
$$;

-- ─── user_profiles: users see own; admins see all ─────────

create policy "users_own_profile" on public.user_profiles
  for all using (id = auth.uid());

create policy "admins_all_profiles" on public.user_profiles
  for all using (public.is_admin());

-- ─── customers ────────────────────────────────────────────

create policy "customer_own" on public.customers
  for select using (user_id = auth.uid());

create policy "admin_all_customers" on public.customers
  for all using (public.is_admin());

create policy "assigned_professional_view" on public.customers
  for select using (
    exists (
      select 1 from public.professional_assignments pa
      where pa.customer_id = customers.id
        and pa.professional_id = public.get_my_professional_id()
        and pa.is_active = true
    )
  );

-- ─── customer_profiles ────────────────────────────────────

create policy "own_customer_profile" on public.customer_profiles
  for all using (customer_id = public.get_my_customer_id());

create policy "assigned_pro_view_profile" on public.customer_profiles
  for select using (
    exists (
      select 1 from public.professional_assignments pa
      where pa.customer_id = customer_profiles.customer_id
        and pa.professional_id = public.get_my_professional_id()
        and pa.is_active = true
    )
  );

create policy "admin_all_profiles" on public.customer_profiles
  for all using (public.is_admin());

-- ─── food_profiles: women_wellness restricted ─────────────

create policy "own_food_profile" on public.food_profiles
  for all using (customer_id = public.get_my_customer_id());

create policy "admin_food_profile" on public.food_profiles
  for all using (public.is_admin());

-- ─── daily_check_ins ──────────────────────────────────────

create policy "own_checkins" on public.daily_check_ins
  for all using (customer_id = public.get_my_customer_id());

create policy "assigned_pro_view_checkins" on public.daily_check_ins
  for select using (
    exists (
      select 1 from public.professional_assignments pa
      where pa.customer_id = daily_check_ins.customer_id
        and pa.professional_id = public.get_my_professional_id()
        and pa.is_active = true
    )
  );

create policy "admin_checkins" on public.daily_check_ins
  for all using (public.is_admin());

-- ─── training_sessions ────────────────────────────────────
-- Customers see their own; trainer sees assigned; admin sees all

create policy "customer_own_sessions" on public.training_sessions
  for select using (customer_id = public.get_my_customer_id());

create policy "trainer_own_sessions" on public.training_sessions
  for all using (trainer_id = public.get_my_professional_id());

create policy "admin_all_sessions" on public.training_sessions
  for all using (public.is_admin());

-- ─── training_recordings ──────────────────────────────────
-- CRITICAL: Customer A cannot access Customer B's recording
-- Signed URLs are generated server-side after this policy check

create policy "customer_own_recording" on public.training_recordings
  for select using (
    customer_id = public.get_my_customer_id()
    and is_active = true
    and recording_status = 'available'
  );

create policy "trainer_recording_manage" on public.training_recordings
  for all using (
    exists (
      select 1 from public.training_sessions ts
      where ts.id = training_recordings.session_id
        and ts.trainer_id = public.get_my_professional_id()
    )
  );

create policy "admin_all_recordings" on public.training_recordings
  for all using (public.is_admin());

-- ─── training_retention_config ────────────────────────────

create policy "admin_retention_config" on public.training_retention_config
  for all using (public.is_admin());

-- ─── notifications ────────────────────────────────────────

create policy "own_notifications" on public.notifications
  for all using (user_id = auth.uid());

create policy "admin_notifications" on public.notifications
  for all using (public.is_admin());

-- ─── payouts ──────────────────────────────────────────────

create policy "professional_own_payouts" on public.payouts
  for select using (professional_id = public.get_my_professional_id());

create policy "admin_all_payouts" on public.payouts
  for all using (public.is_admin());

-- ─── medical_documents ────────────────────────────────────

create policy "own_documents" on public.medical_documents
  for select using (customer_id = public.get_my_customer_id());

create policy "assigned_pro_documents" on public.medical_documents
  for select using (
    exists (
      select 1 from public.professional_assignments pa
      where pa.customer_id = medical_documents.customer_id
        and pa.professional_id = public.get_my_professional_id()
        and pa.is_active = true
    )
  );

create policy "admin_documents" on public.medical_documents
  for all using (public.is_admin());

-- Public tables (no RLS needed for reads)
alter table public.memberships enable row level security;
create policy "public_read_memberships" on public.memberships for select using (is_active = true);
create policy "admin_memberships"       on public.memberships for all using (public.is_admin());

alter table public.testimonials enable row level security;
create policy "public_read_testimonials" on public.testimonials for select using (is_active = true);
create policy "admin_testimonials"        on public.testimonials for all using (public.is_admin());

alter table public.faqs enable row level security;
create policy "public_read_faqs" on public.faqs for select using (is_active = true);
create policy "admin_faqs"        on public.faqs for all using (public.is_admin());

alter table public.website_settings enable row level security;
create policy "public_read_settings" on public.website_settings for select using (true);
create policy "admin_settings"        on public.website_settings for all using (public.is_admin());

alter table public.foods enable row level security;
create policy "authenticated_read_foods" on public.foods for select to authenticated using (is_active = true);
create policy "admin_foods"               on public.foods for all using (public.is_admin());
