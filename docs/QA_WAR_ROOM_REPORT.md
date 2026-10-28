# DrFitVeda — Production Readiness War Room Report
**Single Source of Truth: QA Lead & 10 Specialized Testing Agents**  
**Project:** DrFitVeda (`https://drfitveda.com`)  
**Stack:** Next.js 16.3.5 (App Router, React 19.2.8) + Supabase (`@supabase/ssr`, `@supabase/supabase-js`) + MSG91 (WhatsApp & Email OTP)  

---

## 1. Root Cause Report

### Incident A — Why Yesterday's Admin Portal Changes Disappeared
Four compounding defects caused Admin Portal and CMS changes to appear saved initially and then vanish after a refresh, logout/login, cold start, or cross-device visit:

1. **Ephemeral In-Memory `mockDb.state` on Serverless Vercel (`DEF-001` — Critical):**
   - 26 API routes (`/api/settings`, `/api/settings/roles`, `/api/admin/profile`, `/api/memberships`, `/api/consultation-services`, `/api/cms/biomarkers`, `/api/professionals`, `/api/team`, `/api/customers`, `/api/assignments`, `/api/foods`, `/api/diet-templates`, `/api/clinical-records`, `/api/gallery`) read and wrote exclusively to `mockDb.state` (`globalThis.__mockDbInstance` in `src/lib/mock-db.ts`).
   - In Vercel's serverless runtime, `globalThis` memory is isolated per Lambda instance and wiped whenever a container recycles or cold-starts (every few minutes). When an admin saved changes, the response returned `200 OK` from that single Lambda's RAM, but any subsequent request routed to another Lambda—or after container recycling—re-initialized `mockDb.reset()` with hardcoded defaults.
2. **Split-Brain Database Adapter (`src/lib/supabase/server.ts:27` — `DEF-002` — Critical):**
   - `createServerSupabaseClient()` checked `if (isPlaceholder || activeUser)` and returned `createMockSupabaseClient(activeUser)` whenever `drf_session` cookie was present, while returning the raw Supabase client when unauthenticated (`activeUser === null`).
   - Consequently, logged-in admins read from in-memory `mockDb.state`, while unauthenticated public API calls read from `public.memberships` (which contained 3 legacy `"Dr Fit Veda Standard"` rows), and `src/app/memberships/page.tsx` read `mockDb.state` without loading persisted data.
3. **Fake-Success Error Swallowing in Admin UI (`DEF-003` — High):**
   - `src/app/admin/settings/page.tsx`, `src/app/admin/memberships/page.tsx`, `src/app/admin/professionals/page.tsx`, and `src/app/admin/assignments/page.tsx` caught failed `fetch()` calls, mutated local React component state only, and displayed `"Settings saved!"` / `"Updated locally"`, misleading admins when an API call failed.
4. **Broken Client-Side Upsert in `AdminRetentionSettings.tsx` (`DEF-004` — High):**
   - `src/components/admin/AdminRetentionSettings.tsx` called `createClient().from('training_retention_config').upsert(...)` directly from the browser using the anon key (where `auth.uid()` is `null` because auth uses the `drf_session` cookie), failing RLS instead of calling `PATCH /api/admin/training-retention-config`.

### Incident B — Why Email OTP & Admin OTP Login Failed
1. **Serverless State Loss Prior to Stateless HMAC Token (`DEF-005` — Critical):**
   - Production commit `9acbef7e` verified Email OTP only against in-memory `this.store = new Map()`, which failed whenever `send_otp` and `verify_otp` hit different Vercel serverless instances. The stateless HMAC-SHA256 `otpToken` (`createOtpSessionToken` / `verifyOtpSessionToken` in `src/lib/services/otp-security.ts`) resolves cross-instance verification.
2. **Explicit 403 Block on Admin OTP Login (`src/app/api/auth/login-otp/route.ts:339-347` — `DEF-006` — Critical):**
   - `login-otp/route.ts` explicitly blocked `['admin', 'super_admin', 'operations_manager']` from logging in via Email OTP or WhatsApp OTP with HTTP `403`. Per product requirement, Admin accounts must also be able to sign in with OTP and route to `/admin`.
3. **Faulty Account Lookup Order Auto-Provisioning Admins as Customers (`src/app/api/auth/login-otp/route.ts:184-279` — `DEF-007` — Critical):**
   - When `!isPlaceholder` was true in production, `login-otp/route.ts` queried `public.user_profiles` (which had `0` rows) and immediately auto-created a new `'customer'` account before checking `mockDb.state.admin_profile`, `MOCK_USERS`, or `mockDb.state.team_members`. As a result, `admin@drfitveda.com` or `+91 98765 43213` was never matched as Admin in production.
4. **Hardcoded MSG91 Live API Key in Source Files (`DEF-008` — High):**
   - `src/lib/services/msg91-email.service.ts`, `src/lib/services/msg91-whatsapp.service.ts`, `src/lib/services/otp-security.ts`, and `scripts/test_msg91_whatsapp_otp.ts` contained a hardcoded fallback literal for `MSG91_AUTH_KEY`.

---

## 2. Agent Assignment & Execution Report (1 Lead + 10 QA Agents)

| Agent | Role & Scope | Key Findings | Status |
| :--- | :--- | :--- | :--- |
| **Agent 1 (Lead)** | QA Lead & Release Manager | Coordinated sequential audit across all 10 domains, verified root causes with live Supabase & MSG91 probes, enforced independent verification. | Completed |
| **Agent 2** | Admin Portal & CMS Testing | Audited all 13 Admin screens; identified `DEF-001`, `DEF-003`, `DEF-004`, `DEF-012` (`/admin/customers/new` 404), and Admin Dashboard `count: 'exact', head: true` returning `0`. | Completed |
| **Agent 3** | Database & Persistence Testing | Probed live Supabase (`kihyshlpzmpiyzvgmffr.supabase.co`); confirmed `website_settings` (`jsonb`) exists while `consultation_services` table was missing; verified `persistent-store.ts` durability across cold starts. | Completed |
| **Agent 4** | Backend API & Server Logic | Audited all 31 API routes; ensured every route loads and saves state via `loadPersistedState()` and `savePersistedState()`. | Completed |
| **Agent 5** | Authentication & Authorization | Audited WhatsApp OTP (19 country codes + custom), Email OTP, Password login, and Reset Password; verified Admin OTP login (`DEF-006`, `DEF-007`) and routing loop fix (`DEF-011`). | Completed |
| **Agent 6** | Customer Portal & E2E Workflows | Verified Customer Dashboard, Plan view, Check-in, Appointments, Training Recordings, Gallery, Chat, and Public `/memberships` synchronization with Admin edits. | Completed |
| **Agent 7** | UI, Responsive Design & PWA | Audited mobile/tablet/desktop layouts and `public/manifest.json`; fixed 8 broken `/icons/icon-*.png` 404 references (`DEF-014`). | Completed |
| **Agent 8** | Security & Privacy Testing | Identified and fixed missing password check in `demo-login` (`DEF-009`), unverified password reset & OTP preview leak in `reset-password` (`DEF-010`), hardcoded MSG91 key (`DEF-008`), and unauthenticated CMS biomarker POST (`DEF-013`). | Completed |
| **Agent 9** | Performance & Reliability | Verified 400ms request-tick deduplication cache in `persistent-store.ts` and clean `npm run build` compilation. | Completed |
| **Agent 10** | Independent Verification & Release | Executed `scripts/verify_war_room_fixes.ts`, `scripts/test_msg91_email_otp.ts`, `scripts/test_msg91_whatsapp_otp.ts`, and `npx jest`. | Completed |

---

## 3. Master Defect Register

| ID | Severity | Priority | Module | Description | Root Cause | Fix Implemented | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | Critical | P0 | Admin / Persistence | Admin & CMS changes disappear after refresh, cold start, or across devices. | 26 API routes mutated ephemeral in-memory `mockDb.state` on serverless Vercel. | Created `src/lib/persistent-store.ts` backing `mockDb.state` with Supabase `public.website_settings` (`drf_state:*`) and wired all API routes & `MockQueryBuilder`. | **VERIFIED** |
| **DEF-002** | Critical | P0 | Supabase Adapter | Split-brain reads between logged-in users and public pages; Admin Dashboard KPIs show `0`. | `createServerSupabaseClient()` switched adapters based on `activeUser`; `MockQueryBuilder` lacked `count` and `head` support. | Unified `createServerSupabaseClient()` and `createServiceRoleClient()` with `loadPersistedState()` + `MockQueryBuilder` count/filter/persist support; added `await loadPersistedState()` to `/memberships/page.tsx`. | **VERIFIED** |
| **DEF-003** | High | P1 | Admin UI | Admin Settings, Memberships, Professionals, and Assignments show fake `"Saved!"` toast when API fails. | `catch` blocks mutated local React state and displayed success messages. | Replaced fake-success `catch` blocks with real error messages in all 4 Admin pages. | **VERIFIED** |
| **DEF-004** | High | P1 | Admin Recordings | Saving Recording Retention Settings fails in production. | `AdminRetentionSettings.tsx` used browser anon client instead of `/api/admin/training-retention-config`. | Updated `AdminRetentionSettings.tsx` to call `PATCH /api/admin/training-retention-config` and added default `config_key: 'default_retention_policy'` row. | **VERIFIED** |
| **DEF-005** | Critical | P0 | Email & WhatsApp OTP | Email OTP verification fails across Vercel serverless instances in deployed build. | Deployed commit `9acbef7e` lacked stateless HMAC `otpToken`. | Stateless HMAC-SHA256 `otpToken` (`createOtpSessionToken` / `verifyOtpSessionToken`) wired across `msg91-email.service.ts`, `msg91-whatsapp.service.ts`, `login-otp/route.ts`, and `login/page.tsx`. | **VERIFIED** |
| **DEF-006** | Critical | P0 | Auth / Admin OTP | Admin accounts are blocked with HTTP `403` when logging in via Email OTP or WhatsApp OTP. | `login-otp/route.ts:339-347` rejected admin roles. | Enabled Admin roles (`admin`, `super_admin`, `operations_manager`, `care_coordinator`, `staff`) to log in via Email OTP and WhatsApp OTP and redirect to `/admin`. | **VERIFIED** |
| **DEF-007** | Critical | P0 | Auth / Account Mapping | Logging in with `admin@drfitveda.com` or `+91 98765 43213` via OTP in production auto-creates a `'customer'` account. | `login-otp/route.ts` auto-provisioned a customer when `public.user_profiles` was empty before checking `admin_profile` or `MOCK_USERS`. | Reordered lookup in `login-otp/route.ts` to load persisted state and check `admin_profile`, `MOCK_USERS`, `team_members`, and `user_profiles` before auto-provisioning. | **VERIFIED** |
| **DEF-008** | High | P1 | Security | Live `MSG91_AUTH_KEY` hardcoded as fallback in source files. | Literal key string left in `msg91-email.service.ts`, `msg91-whatsapp.service.ts`, `otp-security.ts`, and `test_msg91_whatsapp_otp.ts`. | Removed hardcoded key from all source and test files; read strictly from `process.env.MSG91_AUTH_KEY`. | **VERIFIED** |
| **DEF-009** | Critical | P0 | Security / Auth | `POST /api/auth/demo-login` never validates passwords and grants Admin access to any unknown string containing `"admin"`. | `password` was ignored and lines 66–71 had a substring fallback. | Enforced password verification and removed the wildcard substring fallback in `src/app/api/auth/demo-login/route.ts`. | **VERIFIED** |
| **DEF-010** | Critical | P0 | Security / Auth | `POST /api/auth/reset-password` allows resetting any user's password without verifying an OTP and leaks `otp_preview` in production. | Missing OTP verification check in `reset_password` branch. | Enforced OTP verification via stateless HMAC token, persisted updated passwords to Supabase, gated `otp_preview` to non-production, and added 2-step OTP UI in `login/page.tsx`. | **VERIFIED** |
| **DEF-011** | High | P1 | Routing / Middleware | Infinite redirect loop (`ERR_TOO_MANY_REDIRECTS`) for `operations_manager`, `care_coordinator`, `staff`, `ayurveda_doctor`, `physiotherapist`, `wellness_coach`. | `ROUTE_ROLES` and `getRoleHome` in `src/proxy.ts` omitted these roles. | Added all staff/admin roles to `/admin` and all clinical roles to `/professional` in `src/proxy.ts`. | **VERIFIED** |
| **DEF-012** | High | P2 | Admin Customers | Clicking `+ Customer` on Admin Dashboard navigates to `/admin/customers/new` and shows `"Customer record not found"`. | No `/admin/customers/new` page existed; dynamic `[id]` route treated `"new"` as a customer ID. | Updated link in `src/app/admin/page.tsx` to `/admin/customers?new=1` and auto-opened the onboard modal in `src/app/admin/customers/page.tsx`. | **VERIFIED** |
| **DEF-013** | High | P1 | AuthZ / API | Unauthenticated POST allowed on `/api/cms/biomarkers`; `requireAdmin` failed on Finance/Retention/Privacy routes. | `if (role && ...)` allowed null role in `biomarkers/route.ts`; `requireAdmin` ignored session metadata role. | Enforced strict role check in `biomarkers/route.ts` and unified `requireAdmin` across `legal/auth.ts`, `training-retention-config`, `compensation-rules`, and `payouts/[id]`. | **VERIFIED** |
| **DEF-014** | Medium | P2 | PWA / Assets | `public/manifest.json` references 8 missing `/icons/icon-*.png` files causing 404 network errors. | `public/icons/` directory did not exist. | Updated `public/manifest.json` icons to use `/logo.png`. | **VERIFIED** |

---

## 4. Code Change Summary

1. **`src/lib/persistent-store.ts` (New):** Durable state persistence engine reading/writing `drf_state:<collection>` rows in Supabase PostgreSQL `public.website_settings` (`jsonb`) with 400ms request-tick cache deduplication and runtime `MOCK_USERS.admin` synchronization.
2. **`src/lib/supabase/mock-adapter.ts` & `src/lib/supabase/server.ts`:** Unified server & service-role clients with `loadPersistedState()`, added full filter/pagination/count/head support and automatic `savePersistedState()` on `insert`, `update`, `upsert`, and `delete`.
3. **`src/lib/mock-db.ts`:** Added default `training_retention_config` (`config_key: 'default_retention_policy'`), `consent_records`, `data_subject_requests`, `financial_transactions`, and `contact_inquiries` collections.
4. **Admin, CMS, Customer & Clinical API Routes (18 route files + `zoho-meeting.service.ts`):** Wired `loadPersistedState()` and `savePersistedState()` across `/api/settings`, `/api/settings/roles`, `/api/admin/profile`, `/api/memberships`, `/api/memberships/[id]`, `/api/consultation-services`, `/api/consultation-services/[id]`, `/api/cms/biomarkers`, `/api/professionals`, `/api/professionals/[id]`, `/api/professionals/slots`, `/api/team`, `/api/team/[id]`, `/api/customers`, `/api/customers/[id]`, `/api/assignments`, `/api/assignments/[id]`, `/api/foods`, `/api/diet-templates`, `/api/clinical-records`, `/api/gallery`, `/api/admin/training-retention-config`, `/api/finance/compensation-rules`, `/api/finance/payouts/[id]`, and `src/lib/legal/auth.ts`.
5. **Authentication & Security (`src/app/api/auth/login-otp/route.ts`, `demo-login/route.ts`, `reset-password/route.ts`, `src/lib/services/msg91-email.service.ts`, `msg91-whatsapp.service.ts`, `otp-security.ts`, `src/app/login/page.tsx`, `src/proxy.ts`):**
   - Enabled Admin login via Email OTP and WhatsApp OTP redirecting to `/admin`.
   - Fixed account lookup order in `login-otp/route.ts` so existing Admin, Doctor, Trainer, and Team accounts are never overwritten as Customers.
   - Removed hardcoded `MSG91_AUTH_KEY` fallback strings.
   - Enforced password verification in `demo-login/route.ts` and OTP verification in `reset-password/route.ts`.
   - Fixed role redirect loops in `src/proxy.ts`.
6. **UI & Public Pages (`src/app/memberships/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/customers/page.tsx`, `src/app/admin/settings/page.tsx`, `src/app/admin/memberships/page.tsx`, `src/app/admin/professionals/page.tsx`, `src/app/admin/assignments/page.tsx`, `src/components/admin/AdminRetentionSettings.tsx`, `public/manifest.json`):**
   - Synchronized public `/memberships` page with persisted state, removed fake-success error swallowing, fixed `+ Customer` onboarding modal link, wired `AdminRetentionSettings` to the API route, and fixed PWA manifest icon paths.

---

## 5. Production Deployment Checklist

- [x] `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured in Vercel Production environment.
- [x] `MSG91_AUTH_KEY`, `MSG91_EMAIL_TEMPLATE_ID` (`global_otp_1622`), `MSG91_DOMAIN` (`drfitveda.com`), `MSG91_WHATSAPP_NUMBER` (`17111240135`), and `MSG91_WHATSAPP_TEMPLATE_NAME` (`otp_verification`) configured in Vercel Production environment.
- [x] Zero hardcoded secrets in repository source files.
- [x] Durable Supabase persistence verified across simulated cold starts (`scripts/verify_war_room_fixes.ts`).
- [x] Email OTP & WhatsApp OTP verified for Admin, Professional, and Customer roles.
- [ ] User approval required before running `git commit` / `git push` / Vercel production deployment.

