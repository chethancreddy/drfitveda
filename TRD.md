# Dr Fit Veda — Technical Requirements Document (TRD)

**Version:** 1.1  
**Status:** Updated — Live Training Recording added

## 1. Technical Objective

Build a secure, scalable, maintainable, mobile-first platform supporting:

- Public website
- Customer app/portal
- Professional portal
- Admin portal
- CMS
- Memberships
- Payments
- Professional assignment
- Personalized plans
- Workout/Yoga
- Daily check-ins
- Weekly reviews
- Financial allocation
- Professional payouts
- Reporting
- Future food and AI integrations

## 2. Architecture

Use clear layers:

1. Presentation
2. API/application
3. Domain/business services
4. Data access
5. Storage
6. Notifications/integrations

Antigravity MUST inspect the existing project first and preserve working architecture wherever practical.

Do not replace a working stack without a clear reason.

## 3. Recommended Technology Baseline

Where not already fixed:

### Frontend
- React/Next.js
- TypeScript
- Responsive/mobile-first UI
- Reusable component system

### Backend
- Next.js server/API or appropriate existing backend
- TypeScript
- Centralized domain services

### Database
- PostgreSQL-compatible relational database
- Supabase PostgreSQL is acceptable where already used

### Storage
- Private object storage for customer reports/documents

### Authentication
- Established secure authentication provider/system

### Payments
- Provider abstraction layer

### Hosting
- Vercel or comparable modern cloud platform

## 4. Architectural Rules

1. Relational model.
2. Business rules outside UI components.
3. Centralized financial calculations.
4. Server-side authorization.
5. Historical data preservation.
6. Typed APIs.
7. Reusable components.
8. No duplicated business logic.
9. Separate public CMS data from sensitive customer data.
10. Modular future food/AI integrations.

## 5. Application Routes

Public:

- /
- /programs
- /memberships
- /how-it-works
- /yoga
- /nutrition
- /womens-wellness
- /about
- /testimonials
- /faq
- /contact
- /login

Customer namespace:

- /customer/*
- /customer/training — latest training recording + session history

Professional namespace:

- /professional/*
- /professional/training — live session management and recording controls

Admin namespace:

- /admin/*
- /admin/training — all sessions, recording status, retention settings

Exact routing may follow the existing project.

## 6. Identity and RBAC

Use one identity system.

Roles:

- super_admin
- admin
- doctor
- naturopathy_doctor
- nutritionist
- trainer
- yoga_doctor
- yoga_consultant
- customer

Use role/permission mappings rather than duplicate login systems.

Frontend hiding is not sufficient; server-side authorization is mandatory.

## 7. Data Access

### Customer
Own:
- Profile
- Membership
- Plans
- Check-ins
- Appointments
- Authorized documents
- Progress
- Notifications

### Professional
Assigned customers and only authorized fields.

### Admin
Operational access according to permissions.

### Super Admin
Full access.

## 8. Database Entities

Suggested groups:

### Identity
- users
- roles
- permissions
- user_roles
- role_permissions

### Customer
- customers
- customer_profiles
- customer_goals
- lifestyle_assessments
- food_profiles
- progress_records

### Professionals
- professionals
- professional_assignments
- professional_availability

### Membership
- memberships
- membership_features
- subscriptions
- orders
- order_items
- offers
- coupons

### Payments
- payments
- payment_events
- refunds

### Plans
- plans
- plan_versions
- plan_items
- plan_assignments

### Workout
- workout_plans
- workout_sessions
- workout_exercises
- exercise_library

### Yoga
- yoga_programs
- yoga_plans
- yoga_sessions

### Tracking
- daily_check_ins
- check_in_items

### Reviews
- weekly_reviews
- review_items

### Consultation
- appointments
- consultations
- consultation_notes

### Food
- foods
- food_nutrients
- meal_recommendations
- nutrition_logs

### Documents
- medical_documents
- document_access_logs

### Live Training
- training_sessions — session record (customer, trainer, scheduled_at, started_at, ended_at, status, notes)
- training_recordings — recording file reference, recording_status, is_active flag, deletion lifecycle timestamps
- training_retention_config — admin-configurable retention rules (mode, grace period)

### Finance
- compensation_rules
- compensation_rule_versions
- financial_transactions
- service_events
- payout_components
- payouts
- payout_payments

### CMS
- website_pages
- website_sections
- testimonials
- faqs
- articles
- media_assets
- website_settings

### Notifications
- notifications
- notification_preferences
- notification_events

### Audit
- audit_logs

## 9. Financial Data Model

This is a critical architecture area.

### 9.1 Compensation Rule Version

Conceptual fields:

- id
- name
- effective_from
- effective_to
- status
- created_by
- created_at

### 9.2 Payout Rule Component

Conceptual fields:

- id
- rule_version_id
- component_code
- component_name
- role
- amount_type
- amount
- applicability
- active

## 10. Initial Financial Configuration

Seed:

- Membership = ₹9,999
- Initial doctor plan = ₹999
- Trainer = ₹5,499
- Weekly doctor review = ₹199

Initial illustrative allocation:

**₹3,302**

Do NOT hard-code ₹3,302 in the UI. Calculate it.

## 11. Central Financial Service

Create one service, e.g.:

`FinancialAllocationService`

Responsibilities:

- Find applicable rule version
- Find applicable payout components
- Calculate gross
- Calculate professional allocations
- Calculate other configured costs
- Calculate company allocation
- Create financial snapshot

No page/component should calculate financial amounts independently.

## 12. Service Events

Use service events to connect operational actions with finance.

Examples:

- initial_doctor_plan_completed
- trainer_service_started
- weekly_doctor_review_completed
- yoga_session_completed
- nutrition_consultation_completed

Service events can create payout events according to the applicable compensation rule.

This makes new services and payout models extensible.

## 13. Financial Snapshot

When a transaction is finalized, store immutable/snapshot values:

- gross_amount
- discount_amount
- net_paid_amount
- currency
- compensation_rule_version_id
- payout_components_snapshot
- company_allocation
- effective_date
- transaction_status

Historical finalized records must not be recalculated using current rules.

## 14. Current Example

Default:

gross = 9999
initial_doctor_plan = 999
trainer = 5499
weekly_review = 199

company_allocation = gross - initial_doctor_plan - trainer - weekly_review

result = 3302

If trainer is changed to 5999:

company_allocation = 9999 - 999 - 5999 - 199
result = 2802

The old transaction remains based on its original snapshot.

## 15. Payout State

Recommended state:

Pending → Approved → Paid

Alternative:

Pending → On Hold → Approved → Paid

Cancellation:

Pending/Approved → Cancelled

Payout fields:

- id
- professional_id
- customer_id
- order_id/service_event_id
- payout_type
- amount
- currency
- rule_version_id
- service_date
- status
- approved_by
- approved_at
- paid_at
- notes

## 16. Membership Activation

Flow:

1. Customer selects membership.
2. Order is created.
3. Payment is initiated.
4. Payment provider verifies transaction.
5. Webhook is verified and processed idempotently.
6. Membership activates.
7. Financial snapshot is created.
8. Onboarding task is created.
9. Assignment can begin.
10. Notifications are generated.

Never trust only the client-side success page to activate a paid membership.

## 17. Doctor Workflow

Doctor dashboard should efficiently show:

- Assigned active customers
- Reviews due
- Recent check-ins
- Current plan version
- Relevant progress
- Pending assessments

Do not load full history on every dashboard request.

## 18. Plan Versioning

Each plan version should contain:

- plan_id
- version_number
- status
- created_by
- created_at
- effective_from
- change_reason

Plan items belong to a specific version.

Do not delete previous versions when a new version is published.

## 19. Daily Check-In

Use one compact save request instead of an API request per checkbox.

Conceptual payload:

```json
{
  "date": "YYYY-MM-DD",
  "workout_status": "completed",
  "diet_status": "completed",
  "yoga_status": "skipped",
  "water_status": "partial",
  "other_status": "completed",
  "energy": 4,
  "mood": 4,
  "note": "",
  "plan_version_id": "..."
}
```

Validate server-side.

Prevent duplicate customer/date records unless editing is explicitly supported.

## 20. Weekly Review

Review connects:

- Customer
- Doctor
- Previous plan
- Current plan
- Review date
- Outcome
- Changes
- New plan version where applicable

Completing/approving a review may create a ₹199 service-event payout using the compensation version effective for that review date.

## 21. File Storage

Customer reports must be private.

Recommended:
- Private object storage
- Database metadata
- Short-lived signed URLs after authorization

Never put sensitive reports in a public/static folder.

## 22. API Areas

Possible API boundaries:

- /api/auth
- /api/customers
- /api/professionals
- /api/memberships
- /api/orders
- /api/payments
- /api/plans
- /api/workouts
- /api/yoga
- /api/check-ins
- /api/reviews
- /api/consultations
- /api/foods
- /api/finance
- /api/payouts
- /api/cms
- /api/notifications
- /api/reports
- /api/training-sessions
- /api/training-recordings
- /api/training-recordings/signed-url
- /api/training-retention-config

Use typed contracts.

## 23. Payment Webhooks

Mandatory:
- Signature verification
- Idempotency
- Event storage
- Retry handling
- Failure recording
- Reconciliation

## 24. Database Indexing

Index frequently queried fields including:

- users.email
- users.mobile
- customer_profiles.customer_id
- professional_assignments.professional_id
- professional_assignments.customer_id
- subscriptions.customer_id
- subscriptions.status
- orders.customer_id
- payments.order_id
- daily_check_ins.customer_id + date
- weekly_reviews.doctor_id + status
- weekly_reviews.customer_id + review_date
- payouts.professional_id + status
- financial_transactions.created_at

Tune compound indexes according to actual production query patterns.

## 25. Data Integrity

Use:
- Foreign keys
- Unique constraints
- Check constraints where useful
- Database transactions for multi-record financial writes
- Server-side validation

## 26. Security

Mandatory:
- HTTPS/TLS
- Secure authentication
- RBAC
- Server-side authorization
- Validation
- Rate limiting where appropriate
- Secure file storage
- Audit logging
- Secure cookies/session settings
- Secrets in environment/secret manager only

Customer A must never access Customer B by changing an ID.

## 27. Privacy

The system can contain personal and potentially health-related information.

Use:
- Data minimization
- Role-restricted sensitive fields
- Appropriate privacy/consent mechanisms
- Appropriate retention/deletion controls

Do not log sensitive information unnecessarily.

## 28. Performance

Prioritize fast customer interactions.

Use:
- SSR/static generation for suitable public content
- Image optimization
- CDN/cache for public content
- Pagination
- Lazy loading
- Database indexes
- Efficient joins
- No N+1 queries
- Debounced search
- Cached CMS content where appropriate
- Lightweight customer dashboard
- One-request daily check-in

## 29. UI Standards

Customer:
- Mobile-first
- Large touch targets
- Clear actions
- Minimal typing
- Visual progress
- Fast check-in

Professional:
- Information-rich but clean

Admin:
- Tables
- Filters
- Finance dashboards
- Audit visibility

Every major page needs loading, empty, success and error states.

## 30. CMS Technical Design

Recommended tables:

- website_pages
- website_sections
- media_assets

Each page can contain ordered sections.

Section fields may include:
- type
- title
- body
- media_id
- CTA
- display_order
- status

## 31. Reporting

For initial scale, use optimized SQL queries.

For larger scale consider:
- Materialized views
- Aggregation tables
- Background jobs

Do not run expensive analytics queries on every dashboard request.

## 32. Notification Architecture

Use event-driven notifications.

Example:

`WEEKLY_REVIEW_DUE`

A notification service determines configured delivery channels.

Future:
- In-app
- Email
- SMS
- WhatsApp
- Push

## 33. Background Jobs

Prepare for:
- Weekly review generation
- Daily check-in reminders
- Membership expiry reminders
- Consultation reminders
- Notification retries
- Report generation
- **Training recording cleanup** — delete old video files from storage per configured retention policy after the grace period elapses; retain metadata row with `deleted_at` timestamp
- **Training recording signed-URL cache invalidation** — invalidate any cached signed URLs when a recording is deactivated or deleted

## 34. Observability

Implement:
- Application error logs
- Webhook/payment logs
- Audit logs
- Performance metrics

Avoid sensitive data in logs.

## 35. Testing

### Unit
- BMI
- Financial calculations
- Compensation rule version selection
- Company allocation
- Payout transitions
- Check-in validation
- **Rolling retention**: `activateRecording(sessionId)` deactivates previous recording, sets `is_active = true` on new one, only one active per customer at a time
- **Signed URL authorization**: URL not generated without valid customer-session ownership verification

### Integration
- Membership purchase
- Payment webhook
- Membership activation
- Assignment
- Plan publication
- Weekly review
- Payout creation
- **New recording activated** — previous recording set inactive, deletion queued per retention config
- **Customer accesses recording** — only visible after `available` status; processing/deleted states show correct UI messages
- **Background cleanup** — job deletes storage file, `deleted_at` set on metadata, video no longer accessible but session row retained

### Authorization
- Customer isolation
- Trainer restrictions
- Professional restrictions
- Admin permissions
- **Customer A cannot generate a signed URL for Customer B's recording**
- **Trainer can only access recordings for their assigned customers**

### UI
- Login
- Checkout
- Onboarding
- Daily check-in
- Doctor review
- Payout configuration
- **Latest Training Session widget**: available / processing / no-recording states all render correctly

## 36. Financial Test Cases

### Test A
Membership = 9999  
Doctor = 999  
Trainer = 5499  
Weekly = 199

Expected company allocation = **3302**

### Test B
Membership = 9999  
Doctor = 999  
Trainer = 5999  
Weekly = 199

Expected company allocation = **2802**

### Test C
Old transaction uses trainer = 5499.  
Admin changes current trainer rule to 5999.

Expected:
- Old transaction remains 5499.
- Future applicable transaction uses 5999.

### Test D
Review completed/approved.

Expected:
- Review service event created.
- Applicable ₹199 payout is generated.

Review not completed.

Expected:
- No completed/paid review payout.

## 37. Development Workflow

Before coding:

1. Inspect repository.
2. Identify framework.
3. Identify database.
4. Identify authentication.
5. Identify current routes.
6. Identify current APIs.
7. Identify reusable components.
8. Identify deployment.
9. Identify existing CMS/payment.
10. Create implementation plan.
11. Preserve working architecture where practical.

Do not blindly rebuild the application.

## 38. Development Phases

### Phase 1
Foundation:
- Database
- Authentication
- Roles
- Permissions

### Phase 2
Public website:
- CMS
- Programs
- Memberships
- Offers

### Phase 3
Commerce:
- Checkout
- Payment
- Membership activation

### Phase 4
Customer:
- Onboarding
- Profile
- Documents
- Goals

### Phase 5
Professionals:
- Assignment
- Doctor assessment
- Nutrition
- Plans
- Versioning

### Phase 6
Trainer/Yoga:
- Workout
- Yoga
- Session tracking

### Phase 6.5
Live Training Recording:
- `training_sessions` table
- `training_recordings` table (with rolling retention logic)
- `training_retention_config` table
- Trainer: live session management, recording upload/link, recording status
- Customer: **Latest Training Session** section (Watch Recording / processing / no-recording states)
- Admin: session list with recording status, retention settings configuration
- Background job: recording cleanup (delete old video files, retain metadata)
- Signed URL service: server-side generation after authorization check, short TTL
- Audit log entries for: session created, recording activated, recording deactivated, video deleted

### Phase 7
Tracking:
- Daily check-ins
- Progress

### Phase 8
Reviews:
- Weekly doctor review
- Plan changes

### Phase 9
Finance:
- Compensation rules
- Service events
- Payout ledger
- Company allocation
- Historical snapshots

### Phase 10
Consultation and notifications.

### Phase 11
Reports, audit and analytics.

### Phase 12
Future food/AI modules.

## 39. Code Quality

- TypeScript where possible
- Clear module boundaries
- Reusable components
- Domain/service functions
- Schema validation
- Centralized financial business logic
- No hard-coded business prices in UI
- No secrets in source control
- Meaningful naming
- Tests for critical financial/security logic

## 40. Environment Configuration

Use environment variables for:
- Database
- Authentication
- Payments
- Storage
- Notifications
- AI
- App URL

Provide `.env.example`.

## 41. Deployment

Support:
- Development
- Staging
- Production

Use database migrations.
Do not manually alter production schema outside migration/version control.

## 42. Backup and Recovery

Production should have:
- Automated backups where supported
- Recovery process
- Export capability
- Payment reconciliation
- Audit history

## 43. Future Food Module

Keep boundaries open for:
- food_products
- meal_plans
- meal_orders
- meal_subscriptions
- deliveries
- food_inventory

Do not tightly couple initial membership code to future food ordering.

## 44. Future AI

Use an integration/service layer, e.g.:

`AIService`

Possible capabilities:
- analyzeFood
- estimateProtein
- summarizeProgress

AI output must support professional review where relevant.

## 45. Definition of Done

A feature is complete only when:

- Functional behavior works.
- Authorization is tested.
- Loading/empty/error states exist.
- Mobile UI works.
- Data persists correctly.
- Audit events exist where required.
- Financial calculations use centralized logic.
- Historical records are protected.
- No raw database/server errors are shown to customers.
- Relevant tests pass.

## 46. Final Technical Principle

Connect customer, professional and finance workflows through structured **service events + versioned data + centralized domain logic**, not through hard-coded page calculations.

This allows Dr Fit Veda to expand from the initial ₹9,999 model to multiple programs, professionals, payout models, food services and AI-assisted capabilities without rebuilding the core platform.

---

## 47. Live Training Recording Architecture

### 47.1 Overview

Live training sessions are recorded and made available to the customer via a rolling retention model. Only the latest completed recording is active at any time per customer. All recordings are stored in private object storage and served via short-lived signed URLs.

### 47.2 Database Schema

#### `training_sessions`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| customer_id | UUID FK → customers | |
| trainer_id | UUID FK → professionals | |
| scheduled_at | timestamptz | |
| started_at | timestamptz | nullable |
| ended_at | timestamptz | nullable |
| status | enum | scheduled, live, completed, cancelled |
| notes | text | internal only |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `(customer_id)`, `(trainer_id)`, `(status)`, `(scheduled_at)`

#### `training_recordings`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| session_id | UUID FK → training_sessions | |
| customer_id | UUID FK → customers | denormalized for fast lookup |
| storage_key | text | private bucket path, never a public URL |
| recording_status | enum | uploading, processing, available, inactive, deleted |
| is_active | boolean | true on only one row per customer at a time |
| file_size_bytes | bigint | nullable |
| duration_seconds | int | nullable |
| activated_at | timestamptz | when this became the latest recording |
| deactivated_at | timestamptz | nullable, when replaced by newer recording |
| deletion_queued_at | timestamptz | nullable, when scheduled for background deletion |
| deleted_at | timestamptz | nullable, when video file was removed from storage |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Unique partial index: `(customer_id) WHERE is_active = true` — enforces only one active recording per customer at the database level.

Indexes: `(customer_id, recording_status)`, `(deletion_queued_at) WHERE deleted_at IS NULL`

#### `training_retention_config`

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| config_key | text UNIQUE | e.g. `default_retention_policy` |
| retention_mode | enum | immediate, grace_period |
| grace_period_hours | int | nullable, e.g. 24, 168 |
| updated_by | UUID FK → users | |
| updated_at | timestamptz | |

### 47.3 Recording State Machine

```
uploading → processing → available → inactive → deleted
                                   ↑               ↑
                              (becomes active)  (background job)
```

State transitions:

- `uploading` — file upload in progress
- `processing` — upload complete, encoding/processing
- `available` — ready; can be made active for customer
- `inactive` — replaced by a newer recording; video still in storage during grace period
- `deleted` — video file removed from storage; metadata row retained permanently

### 47.4 Rolling Retention Algorithm

When a new recording is activated for a customer:

1. BEGIN TRANSACTION
2. Set previous `is_active = true` row to `is_active = false`, `recording_status = inactive`, `deactivated_at = NOW()`
3. Set new recording `is_active = true`, `recording_status = available`, `activated_at = NOW()`
4. COMMIT TRANSACTION
5. Read retention config
6. If `retention_mode = immediate`: set `deletion_queued_at = NOW()` on previous recording
7. If `retention_mode = grace_period`: set `deletion_queued_at = NOW() + grace_period_hours`
8. Background job processes `deletion_queued_at` rows where `deleted_at IS NULL`

This algorithm ensures the unique partial index is never violated and no customer is left without their active recording during the transition.

### 47.5 Background Deletion Job

The job runs on a configurable schedule (e.g. every 15 minutes):

1. Query: `SELECT * FROM training_recordings WHERE deletion_queued_at <= NOW() AND deleted_at IS NULL AND recording_status = 'inactive'`
2. For each row:
   - Delete file from private object storage using `storage_key`
   - On storage success: set `recording_status = deleted`, `deleted_at = NOW()`
   - On storage failure: log error, retain row for retry on next run
3. Write audit log entry for each deleted file

The metadata row is **never deleted** from the database. Only the file is removed from storage.

### 47.6 Signed URL Service

A dedicated server-side service generates time-limited signed URLs:

```
SignedUrlService.generateForRecording(recordingId, requestingUserId)
```

Process:
1. Load recording by `recordingId`
2. Verify `recording_status = available` and `is_active = true`
3. Verify `requestingUserId` owns the `customer_id` on the recording
4. Generate signed URL from private object storage with TTL ≤ 1 hour
5. Return signed URL to client

Rules:
- Never store the signed URL permanently
- Never return a public/permanent URL
- If recording is `processing` or `inactive` or `deleted`, return appropriate status code — do not generate a URL
- Customer A's token must never produce a URL for Customer B's recording

### 47.7 API Contracts

#### GET /api/training-recordings/latest
- Auth: Customer (own only)
- Response: `{ session: { date, trainer_name }, recording_status, watch_url? }`
- `watch_url` is a freshly signed URL, included only when `recording_status = available`

#### POST /api/training-sessions
- Auth: Trainer (assigned to customer)
- Body: `{ customer_id, scheduled_at, notes? }`

#### PATCH /api/training-sessions/:id/status
- Auth: Trainer (assigned to customer)
- Body: `{ status: 'live' | 'completed' | 'cancelled' }`

#### POST /api/training-recordings
- Auth: Trainer (assigned to customer)
- Body: `{ session_id, storage_key, file_size_bytes?, duration_seconds? }`
- Creates recording in `uploading` state

#### PATCH /api/training-recordings/:id/activate
- Auth: Trainer (assigned to customer)
- Effect: Runs rolling retention algorithm, sets recording to `available` and `is_active = true`

#### GET /api/admin/training-sessions
- Auth: Admin / Super Admin
- Response: paginated list with customer, trainer, session date, session status, recording status

#### GET /api/admin/training-retention-config
#### PATCH /api/admin/training-retention-config
- Auth: Admin / Super Admin

### 47.8 Security Rules

- Storage bucket must be configured as **private** — no public access policy
- Storage keys must use non-guessable paths (e.g. UUID-based paths)
- Signed URLs must use the minimum required TTL (target: ≤ 1 hour)
- All API endpoints must verify authorization server-side before any storage operation
- Customer ID isolation must be enforced at the query level, not just the UI
- Trainer can only manage sessions where `trainer_id = their professional_id`
- Admin access is logged in audit_logs

### 47.9 Audit Log Events

| Event | Triggered by |
|---|---|
| `training_session.created` | Trainer creates session |
| `training_session.status_changed` | Session status update |
| `training_recording.uploaded` | New recording file stored |
| `training_recording.activated` | Recording made active for customer |
| `training_recording.deactivated` | Recording replaced by newer one |
| `training_recording.deletion_queued` | Old recording scheduled for cleanup |
| `training_recording.deleted` | Video file removed from storage |
| `training_retention_config.updated` | Admin changes retention settings |

### 47.10 Customer UI Specification

**Section title:** Latest Training Session

**State: available**
```
Latest Training Session
─────────────────────────────
📅  16 Sep 2026
👤  [Trainer Name]

[Watch Recording →]
```

**State: processing**
```
Latest Training Session
─────────────────────────────
Your training recording is being prepared.
```

**State: no recording**
```
Latest Training Session
─────────────────────────────
No recording available yet.
```

Rules:
- The Watch Recording button generates a fresh signed URL on each click (server-side)
- Do not cache or expose the raw signed URL in the DOM for longer than the session
- Do not show a Watch Recording button when `recording_status` is not `available`
- Do not expose storage keys, bucket names, or internal IDs in the UI

### 47.11 Trainer UI Specification

Session list shows per assigned customer:
- Session date/time
- Session status (Scheduled / Live / Completed / Cancelled)
- Recording status (Not started / Uploading / Processing / Available)

Actions available per session status:
- Scheduled → Mark as Live
- Live → Mark as Completed, Upload/Link Recording
- Completed (recording not yet uploaded) → Upload/Link Recording
- Recording uploaded → Publish to Customer (runs activation)

### 47.12 Admin UI Specification

**Training Sessions table:**

| Customer | Trainer | Session Date | Session Status | Recording Status |
|---|---|---|---|---|
| Name | Name | Date | Completed | Available |

Filters: date range, trainer, recording status

**Retention Settings:**
- Retention mode: Immediate / Grace Period
- Grace period: [N] hours
- Save button

Admin can also override individual recording availability (disable/enable).

### 47.13 PWA and Mobile Considerations

- The Latest Training Session widget must be touch-friendly with a clearly tappable Watch Recording button
- Video player should use the browser's native `<video>` element or a simple secure wrapper to preserve PWA compatibility
- Signed URL is short-lived; if the user opens the video after the URL expires, the UI should offer a Reload / Retry option
- No permanent video storage on the device; streaming only from signed URL

### 47.14 Future Considerations

- Multiple sessions per day (current model: one active recording per customer; can be extended to per-session viewing with a history list)
- Customer session history view (metadata always available; video only if within retention window)
- Downloadable recordings (disabled by default; Admin-configurable per membership tier)
- Live streaming integration (separate from recording storage)

