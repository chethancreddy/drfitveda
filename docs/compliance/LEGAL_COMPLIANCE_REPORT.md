# Legal Compliance Report — Dr Fit Veda

_DRAFT · 9 Oct 2026 · Not legal advice. Prepared from the code in `d:\DrFitVeda`. Business assumption confirmed by the owner: **India-based entity; UAE customers are a small group arriving via customer referral.**_

## 1. Applicability determinations

| Law | Applies? | Reasoning | Action / lawyer? |
|---|---|---|---|
| India DPDP Act 2023 + Rules | Yes | Entity in India, processes data of people in India (and abroad in connection with it). Rules commence in phases. | Lawyer: consent-notice wording, Data Protection Board grievance, breach notice, children's rules, retention |
| India IT Act 2000 / SPDI Rules 2011 | Yes | Health data = sensitive personal data → written consent, published policy, grievance officer | **Appoint Grievance Officer** |
| India Consumer Protection (E-Commerce) Rules 2020; CPA 2019 | Likely | Online service sales; refund/pricing transparency; misleading ads | Lawyer to confirm; set refund rules |
| India Drugs & Magic Remedies (Objectionable Advertisements) Act 1954 / ASCI code | Possible | Ads claiming to treat/"reverse" diabetes, PCOD etc. may be restricted | **Lawyer** — see claims below |
| India Telemedicine Practice Guidelines 2020 / professional-council rules | Unclear | Binds registered medical practitioners; status of BNYS/naturopaths, nutritionists, yoga staff unclear | **Lawyer**; verify council registrations of each professional |
| UAE Federal Decree-Law 45/2021 (PDPL) | Likely for UAE-resident customers | Extra-territorial reach where UAE residents' data is processed; executive regulations still evolving | **Lawyer**: representative/transfer requirements, consent form |
| UAE health-data law (Fed. Law 2/2019 ICT in Health Fields) & DHA/DoH licensing | Unclear | May restrict storing/transferring UAE patients' health data outside UAE; may regulate telehealth service to UAE patients | **Lawyer — highest priority for UAE customers**; consider geo-limiting or hosting decision |
| GDPR / UK GDPR / ePrivacy | Not now | Not targeting EU/UK; no EU establishment | Re-assess if EU customers accepted |
| Children | 18+ only | Stated in Terms/Privacy. **No age check exists in code** (DOB collected only in profile, not enforced) | Add DOB/age declaration at registration when built |

## 2. Confirmed issues

### Fixed in this change set
| ID | Issue | Fix |
|---|---|---|
| C1 | `/privacy` and `/terms` redirected logged-out visitors to `/login` (not in `PUBLIC_ROUTES`) | Added all legal routes to `src/proxy.ts` (migrated to Next.js 16 proxy convention) |
| C2 | Terms were an unfinished outline; contained statements not true of the product (deletion "via account settings"; sessions "on Google Meet… Dr Fit Veda does not store recordings") | New full draft Terms; Privacy rewritten from the real data model |
| C3 | Privacy page cited TLS 1.3, "never sold", etc. without basis | Replaced with verifiable statements only |
| C4 | Hardcoded Zoho OAuth client ID **and secret** fallbacks in `zoho-meeting.service.ts` | Removed from code. **Secret is in git history — rotate it in Zoho now.** |
| C5 | Google Fonts loaded from Google (visitor IP to third party before any consent; GDPR-relevant) | Nunito Sans self-hosted (`public/fonts`), `@import`/preconnect removed |
| C6 | No policy links in footer/forms; no consent on health-data forms | Footer links; consent on document upload, booking, contact; policy links on login & pricing |
| C7 | No way to exercise data rights | `/data-request` + `/api/data-requests` + admin queue + `consent_records` |
| C8 | No cookie/third-party disclosure | `/cookies` page; inventory doc |
| C9 | Inconsistent video provider references ("Google Meet" vs "Zoho Meeting") | Standardized on Zoho Meeting across code, UI, routes, database seeds, and policies |
| C10 | External media hotlinks (Unsplash, W3Schools) in demo gallery leaking IP | Replaced with local self-hosted assets in `/public/images/` and `/public/videos/` |

### Open — confirmed, **not** fixed (outside compliance-only scope or needs business/engineering decision)
| ID | Severity | Issue | Evidence |
|---|---|---|---|
| S1 | **Critical** (before real users) | Authentication is a demo: any unknown identifier logs in as the demo customer (`demo-login`); OTP `123456` always accepted and echoed in responses; `reset-password` changes a password with **no verification** (unknown ids default to the customer account); plaintext hardcoded passwords in `mock-db.ts` | `src/app/api/auth/*`, `src/lib/mock-db.ts` |
| S2 | **Critical** | `drf_session` is unsigned JSON; middleware and APIs trust its `role` → anyone can forge an admin cookie | `middleware.ts`, `demo-login` |
| S3 | High | APIs trust client-supplied `customer_id` (`/api/appointments`, `/api/customers/documents?customer_id=`) — in demo mode there is no RLS to stop cross-customer access; in Supabase mode RLS must be verified by test | route files |
| S4 | High | Whole app runs on an in-memory mock DB when Supabase env is absent; policies describe the intended Supabase design, not current persistence | `server.ts` |
| S5 | Medium | Contact form discards submissions (`alert` only) — customers may believe they were contacted | `contact/page.tsx` |
| S6 | Medium | Document "upload" stores file name + random simulated size; no file is stored | `DocumentUploadForm.tsx` |
| S7 | Medium | `CRON_SECRET` check passes if env var is unset and no header is sent (`undefined === undefined`) | `cron/cleanup-recordings/route.ts` |
| S8 | Medium | Admin "Audit Logs" page shows hardcoded synthetic entries | `admin/audit/page.tsx` |
| S9 | Low | `GET /api/consents` in mock mode returns internal fields (real Supabase select is limited) | mock adapter |

### Marketing & health claims to review (flagged, **not edited**)
| Claim | Where | Concern |
|---|---|---|
| "HIPAA-grade hosting" | Memberships page | HIPAA is US law; no evidence of certification/BAA. Remove or substantiate |
| "100% Satisfaction Guarantee" | Memberships cards | Conflicts with any refund limits; no terms defined (refund policy has a [CONFIRM]) |
| "PCOD Reversal", "Reversing PCOD symptoms", "HbA1c Reversal/dropped from 7.1 to 5.8", "lost 8.2 kg" | Home, Women's Wellness, Testimonials, Contact | Cure/reversal claims for diabetes/hormonal conditions; testimonials need documented consent, typicality disclosure; possible DMR(OA) Act/ASCI/CCPA issue |
| "Gold's Gym certified trainers" | Footer, home, programs, FAQ | Third-party trademark; verify real certification/permission |
| "BNYS… active council registrations" | FAQ | Verify for every professional; keep proof |
| "Every session is recorded" / "recorded and shared" | Memberships, Consult | Conflicts with consent-based recording; make recording opt-in per session |
| "Over 67% … to professionals; 33% HIPAA-grade hosting" | Memberships | Allocation figures must match finance rules; "HIPAA-grade" as above |
| Meeting provider: "Google Meet" vs "Zoho Meeting" | Many pages | **RESOLVED** — Standardized exclusively on Zoho Meeting across all site pages |

## 3. Dependency & asset licensing

| Item | Licence | Status / issue |
|---|---|---|
| All direct npm deps | MIT (typescript Apache-2.0) | OK; see `THIRD_PARTY_NOTICES.md` |
| `@img/sharp-*` (via Next) | LGPL-3.0-or-later (optional binaries) | Acceptable as unmodified dynamic libs; keep notice |
| `caniuse-lite` CC-BY-4.0; `axe-core` MPL-2.0 (dev); `argparse` Python-2.0 (dev) | — | OK; attribution in notices |
| Nunito Sans | SIL OFL 1.1 | Self-hosted in `public/fonts/` alongside `OFL.txt` |
| `public/logo.png`, `public/images/logo.png` | Unknown | **Ownership unconfirmed** — confirm artwork rights |
| Demonstration gallery media | Local SVGs & self-hosted video | Replaced third-party hotlinks; served from origin |
| `public/*.svg` starter files | MIT templates; logos are trademarks | Unused? Delete |
| Emoji UI icons | Unicode glyphs, OS fonts | No licence file needed |
| Zoho Meeting / Supabase / Razorpay / Resend / Vercel terms | — | **Not reviewed** — nothing in this report claims their compliance |
| AI-generated content | — | No AI service found in code; copy/images provenance unknown — confirm that site text and the three testimonial portraits/outcomes are original and genuine |

## 4. Items that require a qualified lawyer
1. Final entity name, registered address, governing law/venue, liability cap (Terms §10, §12).
2. UAE: PDPL applicability, health-data localisation, telehealth licensing, consent wording.
3. Refund & cancellation rules (all [CONFIRM] items) and "satisfaction guarantee".
4. Retention periods (clinical, tax, audit, consent, requests).
5. Whether naturopathy/nutrition/yoga professionals fall under Telemedicine Guidelines; professional registrations.
6. Health-claims review, testimonial releases, DMR(OA) Act.
7. Processor agreements (Supabase, Zoho, Razorpay, Resend, Vercel) and cross-border transfer mechanism.
8. DPDP Rules commencement dates, Grievance Officer appointment, breach-notification procedure.

> All five policy pages carry a visible **DRAFT** banner and `[CONFIRM]` markers. Do **not** treat the site as legally compliant or remove the banner until counsel has reviewed them.
