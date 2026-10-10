# Data Inventory, Cookie & Third-Party Inventory

_DRAFT — compiled from code review on 9 Oct 2026 (schema `supabase/migrations/001–005`, API routes, components). "Planned" = present in schema/config but not yet active in running code._

> **Important context:** the app currently runs on an **in-memory mock database** (`src/lib/mock-db.ts`) with demo login whenever Supabase env vars are not set. Nothing persists across restarts in that mode. The inventory below describes the production design (Supabase) the code is built for.

## 1. Data inventory

| # | Data type | Fields (source) | Purpose | Storage | Recipients | Retention (proposed — [CONFIRM]) | Sensitivity |
|---|---|---|---|---|---|---|---|
| 1 | Account | `user_profiles`: full_name, display_name, phone, avatar_url, role, is_active; `auth.users` email | Identity, access control | Supabase DB/Auth | Admins; own user | Account life + 12 mo | Personal |
| 2 | Profile & lifestyle | `customer_profiles`: DOB, gender, height, weight, BMI, occupation, work schedule, sleep, activity, stress, exercise history, goals, `women_wellness` (jsonb, restricted) | Personalised plan | Supabase DB | Assigned professionals; admins | Account life + [CONFIRM] | **Health / sensitive** |
| 3 | Food profile | `food_profiles`: diet type, meals, allergies, restrictions, water intake | Nutrition plan safety | Supabase DB | Assigned professionals | Same as #2 | **Health** |
| 4 | Medical documents | `medical_documents`: doc_type, file_name, size, notes, storage_key (files in private storage — **file upload is simulated in the current UI; only names/notes are stored**) | Doctor review | Supabase DB + private bucket | Assigned doctor; admins | Until deleted by user / [CONFIRM] clinical period | **Health / sensitive** |
| 5 | Consultation records | `appointments` (reason in `notes`, meeting_url), `consultation_notes`, `doctor_assessments` (incl. `internal_notes`), `weekly_reviews` | Deliver/document care | Supabase DB | Assigned professionals; admins | [CONFIRM] clinical-record period (counsel) | **Health** |
| 6 | Plans & tracking | `plans`, `plan_versions`, `plan_items`, `workout_*`, `yoga_*`, `daily_check_ins` (mood/energy), `progress_records` (weight, measurements, notes) | Programme delivery | Supabase DB | Assigned professionals | Account life + [CONFIRM] | **Health** |
| 7 | Session recordings | `training_recordings` (storage_key, duration, status) + video in private bucket `training-recordings` | Replay/form check | Supabase Storage; signed URLs (1 h) | Customer; admins; trainer | Latest only; previous deleted after grace period (default 24 h, admin-set) | Biometric-adjacent / sensitive |
| 8 | Video gallery | `/api/gallery` (customer-submitted video/thumbnail URLs) | Form checks | Mock/DB | Customer + team | [CONFIRM] | Sensitive (images of person) |
| 9 | Orders & payments | `orders`, `payments` (provider id, signature, raw_event jsonb), `subscriptions`, `financial_transactions` | Billing, accounting, refunds | Supabase DB; Razorpay holds card data (**planned — no Razorpay call exists in code**) | Admins/finance; Razorpay | 6–8 yrs (tax law) [CONFIRM] | Financial |
| 10 | Professional/staff data | `professionals`, `team_members` (name, email, phone, qualification, bio), `payouts`, `compensation_*` | Operations, payroll | Supabase DB | Admins | Employment/contract + statutory | Personal |
| 11 | Notifications | `notifications` | In-app messages | DB | User | 12 mo | Personal |
| 12 | Audit logs | `audit_logs`: user_id, action, old/new data, ip_address | Security/accountability | DB | Admins | 12–24 mo [CONFIRM] | Personal |
| 13 | **Consent records (new)** | `consent_records`: purpose, granted, policy_version, source, timestamp, user/customer id. **No IP/UA/free text.** | Prove consent | DB | Admins; own user | Relevant period + 3 yrs [CONFIRM] | Personal |
| 14 | **Data requests (new)** | `data_subject_requests`: type, name, email, optional details, status, verification flag, resolution note | Handle rights requests | DB (service-role writes; admin read via RLS) | Admins | 3 yrs after closure [CONFIRM] | Personal |
| 15 | Website enquiry | Contact form: name, phone, health focus, message | Callback | **Not transmitted/stored (form is non-functional)** | — | — | May contain health data |
| 16 | Session cookie | `drf_session` (user_id, email, role, full_name) | Login | Browser, HttpOnly | — | 7 days | Personal |

Data **not** collected (confirmed absent): analytics IDs, ad pixels, geolocation, device fingerprinting, government IDs, card numbers, AI-model prompts.

## 2. Cookie & storage inventory

| Name | Purpose | Category | Duration | Consent needed? |
|---|---|---|---|---|
| `drf_session` | Demo/session login (HttpOnly, SameSite=Lax) | Strictly necessary | 7 d | No |
| `sb-<ref>-auth-token` (+chunks) | Supabase auth session (production mode) | Strictly necessary | refresh period | No |
| localStorage/sessionStorage | **None used** (grep of `src`) | — | — | — |

**Determination:** only strictly necessary cookies are set → no consent banner is legally required under ePrivacy/GDPR, UAE PDPL or Indian law *as the site stands*. Adding a banner now would be decorative. Triggers to revisit: adding analytics, ads, chat widgets, embedded YouTube/Maps, or Razorpay checkout scripts (check its cookies).

## 3. Third-party services

| Service | Role | Status in code | Data sent | Terms/DPA reviewed? | Notes |
|---|---|---|---|---|---|
| Supabase | DB, auth, storage | Wired (falls back to mock) | All app data | **Not verified** — DPA + region [CONFIRM] | Region matters for UAE health-data rules |
| Zoho Meeting | Video sessions | Wired (`zoho-meeting.service.ts`) | Customer name/email for room | **Not verified** | Confirmed standard video platform; copy reconciled across entire site |
| Google Meet | Formerly mentioned in copy/defaults | **Eliminated** | None | — | Replaced throughout with Zoho Meeting |
| Razorpay | Payments | **Env only; no code calls** | — | Not reviewed | PCI scope stays with Razorpay if hosted checkout |
| Resend | Email | **Env only; no code calls** | — | Not reviewed | No email is sent today |
| Vercel | Hosting (`vercel.json`) | Config | Request logs/IPs | Not verified | |
| Google Fonts | Fonts | **Removed** — now self-hosted | — | — | Fixed in this audit (`public/fonts/` + `OFL.txt`) |
| Unsplash / w3schools | Placeholder gallery media | **Removed** — now self-hosted | — | — | Replaced with local static assets (`public/images/`, `public/videos/`) |
| AI services | — | **None found** | — | — | Disclaimer states none; update policy if added |
