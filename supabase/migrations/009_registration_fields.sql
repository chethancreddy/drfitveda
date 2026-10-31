-- ============================================================
-- Dr Fit Veda — Migration 009: Registration Mandatory Fields
-- Adds first_name, last_name, date_of_birth, gender to user_profiles
-- Ensures compatibility with existing users and customer profiles
-- ============================================================

-- 1. Extend user_profiles with explicit first_name, last_name, date_of_birth, and gender
alter table if exists public.user_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists email text;

-- 2. Ensure customer_profiles has matching first_name and last_name fields
alter table if exists public.customer_profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- 3. Create indexes for fast lookup and duplicate prevention
create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_phone on public.user_profiles(phone);
create index if not exists idx_user_profiles_dob on public.user_profiles(date_of_birth);

