# Consent & Data-Subject Request Workflow

_DRAFT — describes what is implemented as of 9 Oct 2026._

## A. Consent

| Purpose (`consent_records.purpose`) | Where asked | Default | Mandatory for the action? | Recorded |
|---|---|---|---|---|
| `health_data_processing` | Medical document upload (`DocumentUploadForm`); consultation booking (`BookAppointmentModal`) | Unticked | Yes — upload/booking is blocked without it | `POST /api/consents` (append-only) before the action runs |
| `contact_enquiry` (+ health info in message) | `/contact` form | Unticked, `required` | Yes for callback request | Recorded in `consent_records` via `POST /api/contact` |
| `session_recording` | _Not yet asked in UI_ — no recording toggle exists in the product; add a per-session control before enabling recordings in production | — | — | Purpose reserved in schema |
| `marketing` | _Not asked_ — no marketing communications exist. When added: separate, optional, unticked, never bundled with Terms | — | No | Purpose reserved |

- Terms acceptance is **not** treated as consent to health data, recording or marketing (stated in Terms §1 and Privacy §3).
- Consent is a new row per decision; **withdrawal** = new row with `granted=false` (API supports it; UI path today is the data-request form → admin records withdrawal).
- Stored: purpose, yes/no, policy version, source, timestamp, user/customer id. **Not stored:** IP, user agent, free text.
- Access: users read only their own rows (RLS); admins read all; nobody can edit/delete via client.

## B. Data-subject requests (access, correction, export, deletion, withdraw consent, complaint)

```
User ──(form /data-request or email)──► POST /api/data-requests
   • validation, honeypot, per-IP rate limit (5/h, in-memory), body never logged
   • row in data_subject_requests (status=received, identity_verified=false, due 30 days)
   • audit_logs: data_request.received
Admin ──► /admin/privacy-requests  (admin/super_admin only; role read from user_profiles)
   1. Verify identity OUT-OF-BAND: phone/email already on the account (never from the form,
      never ask for password/card). Tick "Identity verified".
   2. Set status verifying → in_progress.
   3. Fulfil manually (no self-service export/delete yet):
        access/export → compile data from tables in DATA inventory, send via secure channel
        correction    → update records, notify user
        deletion      → delete/anonymise what is not under legal retention
        withdraw      → insert consent_records row granted=false; stop the processing
   4. Close: completed | partially_completed | rejected.
        • API refuses to close without verified identity (except rejection/complaint).
        • partially_completed / rejected REQUIRE a note saying what was kept and why.
   5. audit_logs entry for each status change.
```

**Retention carve-outs** (never promise full deletion): payment/tax records; clinical records subject to professional/statutory retention; records for legal claims/fraud. These are restricted from other use and listed in the resolution note.

**SLA targets** [CONFIRM]: acknowledge ≤ 7 days; complete ≤ 30 days; overdue requests are flagged in the admin table.

## C. Known gaps
- No automatic acknowledgement email (Resend is not wired). The confirmation is shown on-screen with a reference.
- No self-service export/delete inside the customer portal; process is admin-fulfilled.
- In-memory rate limiter resets on restart and is per-instance — use a shared store in production.
- Mock mode does not persist consents/requests across restarts.
