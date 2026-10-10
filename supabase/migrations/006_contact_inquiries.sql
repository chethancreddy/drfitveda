-- ============================================================
-- Dr Fit Veda — Migration 006: Contact Inquiries
-- Public lead intake and consultation callback requests
-- ============================================================

create table if not exists public.contact_inquiries (
  id             uuid primary key default uuid_generate_v4(),
  full_name      text not null,
  phone          text not null,
  health_focus   text not null,
  message        text,
  status         text not null default 'pending' check (status in ('pending', 'contacted', 'resolved', 'spam')),
  created_at     timestamptz not null default now()
);

create index if not exists idx_contact_inquiries_status on public.contact_inquiries(status, created_at desc);

alter table public.contact_inquiries enable row level security;

-- Inquiries are inserted server-side by service role
-- Only authenticated administrators can inspect or triage inquiries
drop policy if exists "contact_inquiries_admin_all" on public.contact_inquiries;
create policy "contact_inquiries_admin_all" on public.contact_inquiries
  for all using (public.is_admin());
