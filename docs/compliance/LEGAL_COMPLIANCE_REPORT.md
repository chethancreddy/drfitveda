# Legal Compliance & Regulatory Audit Report — Dr Fit Veda

_Version 0.2-DRAFT · 11 October 2026 · Prepared for review, approval, and execution by Indian Advocate / High Court Counsel._  
_Operating Profile: **India-based corporate entity; operations, customer contracts, personal data processing, and compliance assessed primarily and strictly under applicable Indian laws and Government of India regulations.**_

---

## 1. Statutory Applicability & Regulatory Framework (India)

| Statutory Act / Regulation | Regulatory Authority | Applicability & Legal Significance | Priority Action for Advocate |
|---|---|---|---|
| **Digital Personal Data Protection Act, 2023 (DPDP Act)** | Data Protection Board of India / MeitY | **Directly Applicable.** Entity operates in India as a Data Fiduciary processing personal data of Indian Data Principals. Rules commence in phased notifications. | Approve plain-language consent notice wording (§5), verify Data Principal rights mechanisms (§11-14), confirm personal data breach notification procedure (§8(6)), and verify children's data restrictions (§9, 18+ threshold). |
| **Information Technology Act, 2000 & SPDI Rules, 2011** | Ministry of Electronics & IT (MeitY) | **Directly Applicable.** Health metrics, physiological disclosures, and diagnostic records constitute Sensitive Personal Data or Information (SPDI). Requires written/electronic consent, published privacy policy, and statutory Grievance Officer. | **Mandatory:** Formally designate and publish details of the Indian **Grievance Officer** (name, office address, contact) in policy documents pursuant to Rule 5(9). |
| **Consumer Protection Act, 2019 & E-Commerce Rules, 2020** | Central Consumer Protection Authority (CCPA) | **Directly Applicable.** Governs digital subscription sales, standalone consultation bookings, pricing transparency, cancellation/refund timelines, and bar on unfair trade practices/dark patterns. | Formally approve cancellation notice window (24 hours), cooling-off refund window (7 days), GST tax breakdown transparency, and verify commercial terms of the "100% Satisfaction Guarantee". |
| **Telemedicine Practice Guidelines, 2020 (NMC / AYUSH)** | National Medical Commission / Ministry of AYUSH | **Directly Applicable to Clinical Consultations.** Governs virtual consultations by Registered Medical Practitioners (RMPs) and BNYS Naturopathic Doctors. | Confirm mandatory clinical record retention period (minimum 3 years recommended), prescription guidelines, and emergency care exclusions. Verify professional council registrations of all onboarding doctors. |
| **Drugs & Magic Remedies (Objectionable Advertisements) Act, 1954** | Ministry of Health & Family Welfare | **Directly Applicable to Advertising Copy.** Section 3 strictly bars advertisements claiming to diagnose, cure, mitigate, or reverse conditions specified in the statutory schedule (including Diabetes, menstrual disorders). | Review landing page copy claiming "PCOD Reversal" and "HbA1c Reversal" to ensure alignment with statutory prohibitions and ASCI guidelines. |
| **Indian Contract Act, 1872 & IT Act §10A** | Civil Courts of India | **Directly Applicable.** Governs electronic contract formation, capacity to contract (age 18+), unbundled consent, limitation of liability, and jurisdiction. | Approve standard electronic contract terms, confirm commercial liability limitation cap, and confirm exclusive jurisdiction of Courts in Bangalore, Karnataka. |
| **Copyright Act, 1957 & Trade Marks Act, 1999** | Controller General of Patents, Designs and Trade Marks | **Directly Applicable.** Protects proprietary diet charts, workout algorithms, website code, and brand marks. | Confirm ownership and trademark applications for "Dr Fit Veda" and verify rights to corporate brand assets. |

---

## 2. Technical Audit Findings & Remediation Matrix

### 2.1 Remediated Architectural & Privacy Items (Verified)
| Ref | Identified Risk / Issue | Architectural Remediation Implemented | Verification Status |
|---|---|---|:---:|
| **C1** | Legal routes (`/privacy`, `/terms`) redirected unauthenticated visitors to `/login` | Added legal routes to public proxy allowances in `src/proxy.ts` (Next.js 16 standard) | **VERIFIED (HTTP 200)** |
| **C2** | Terms contained inaccurate product descriptions (e.g., claiming sessions run on Google Meet and no recordings stored) | Completely rewritten from real database schemas: reflects Zoho Meeting and single-active-recording retention | **VERIFIED** |
| **C3** | Privacy page cited unsubstantiated claims ("never sold", unverified TLS levels) | Restructured with verifiable, factual technical disclosures aligned with DPDP Act §5 | **VERIFIED** |
| **C4** | Hardcoded Zoho OAuth client secret fallback in `zoho-meeting.service.ts` | Removed from codebase; rotated in Zoho Developer Console; strictly managed via environment variables | **VERIFIED & ROTATED** |
| **C5** | External Google Fonts loaded from third-party servers (IP leakage) | Self-hosted Nunito Sans typography directly from `/public/fonts/`; eliminated external preconnects | **VERIFIED** |
| **C6** | Absence of consent checkboxes on health intake and consultation booking forms | Implemented explicit, non-pre-ticked opt-in checkboxes on document upload, consultation bookings, and contact forms | **VERIFIED** |
| **C7** | Absence of statutory Data Subject Rights mechanism under DPDP Act | Built `/data-request` public intake portal, rate limiter, anti-bot honeypots, and `/admin/privacy-requests` queue | **VERIFIED** |
| **C8** | Absence of transparent cookie inventory | Published `/cookies` documenting strictly necessary first-party cookies and total absence of tracking pixels | **VERIFIED** |
| **C9** | Video provider inconsistency across customer, professional, and admin portals | Standardized exclusively on Zoho Meeting across code, UI, database seeds, and legal policies | **VERIFIED** |
| **C10** | External hotlinks (Unsplash, W3Schools) in customer video demo gallery | Localized all assets to self-hosted SVGs in `/public/images/` and local MP4 in `/public/videos/` | **VERIFIED** |
| **C11** | Supabase Production RLS & Auth Configuration | Confirmed active in production: RLS enforced across all tables (`user_profiles`, `customers`, `professionals`, `medical_documents`, `contact_inquiries`), Supabase JWT auth enforced | **VERIFIED (ACTIVE IN PROD)** |

---

### 2.2 Operational Checklist (For Final Advocate & Management Sign-Off)
*Note: Technical security controls are verified and active. The items below represent final business parameters for advocate and management execution.*

| Ref | Severity | Operational Parameter | Status & Verification |
|---|---|---|---|
| **S1** | Medium | Scheduled cron cleanup endpoint requires strong secret | `CRON_SECRET` populated in production environment variables to authorize recording cleanup calls. |
| **S2** | Low | Production audit logging retention duration | Configured in Supabase; retention window to be confirmed with counsel (recommended: 12–24 months). |

---

## 3. Marketing & Clinical Claims Review (For Indian Advocate Review)

The following claims currently appear in public website copy and require legal guidance under the **Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954**, **Consumer Protection Act, 2019**, and **ASCI Guidelines**:

| Website Copy Claim | Page Location | Legal Concern / Statutory Risk | Recommended Advocate Guidance |
|---|---|---|---|
| **"PCOD Reversal", "Reversing PCOD symptoms", "HbA1c dropped from 7.1 to 5.8"** | Home, Women's Wellness, Testimonials | DMR(OA) Act Section 3 strictly prohibits claims of cure/reversal for scheduled metabolic conditions (including Diabetes and menstrual disorders). | Soften marketing text to *"PCOD Symptom Management"*, *"Lifestyle Support for Hormonal Balance"*, and include typicality disclaimers. |
| **"100% Satisfaction Guarantee"** | Membership pricing cards | Consumer Protection Act bar on misleading representations; may conflict with pro-rata administrative fee deductions upon cancellation. | Formally define qualifying criteria (e.g., minimum 85% adherence for 30 consecutive days) or amend to *"Doctor-Guided Care Guarantee"*. |
| **"HIPAA-Grade Hosting"** | Memberships page | HIPAA is a US federal health law not applicable to an Indian entity. Unsubstantiated claims violate advertising standards. | Replace with *"Bank-Grade 256-Bit Encrypted Infrastructure hosted in India"*. |
| **"Gold's Gym certified trainers"** | Home, Programs, FAQ | Third-party trademark; risk of trademark infringement unless formal partnership exists. | Confirm certificates of individual trainers or amend to *"Certified Elite Fitness Coaches"*. |
| **"BNYS… active council registrations"** | FAQ | Statutory medical compliance requirement. | Ensure verified registration certificates for all BNYS doctors are held on corporate record. |

---

## 4. Specific Items for Indian Advocate Sign-Off & Execution

Your advocate should review and confirm the following specific parameters in the sign-off PDFs:

1. **Grievance Officer Designation:** Provide full legal name, physical office address, and direct email of the appointed Indian Grievance Officer (mandatory under DPDP Act §5 and IT SPDI Rule 5(9)).
2. **Corporate Registration Credentials:** Confirm Corporate Identity Number (CIN / LLPIN) and registered corporate office address for Dr Fit Veda Holistic Health Services Ltd.
3. **Goods & Services Tax (GST) Treatment:** Confirm GSTIN registration number and verify whether listed package prices are inclusive of 18% GST.
4. **Commercial Refund Windows:** Approve the 24-hour consultation cancellation notice window and 7-day cooling-off membership refund policy.
5. **Clinical Record Retention Duration:** Confirm the 3-year mandatory preservation period for digital consultation notes under the Telemedicine Practice Guidelines, 2020.
6. **Dispute Jurisdiction:** Confirm exclusive jurisdiction of the competent Courts at Bangalore, Karnataka, India.

---

> **Notice:** All five policy documents carry a visible **DRAFT** designation and `[CONFIRM]` markers. They are prepared for formal review, amendment, and execution by your Indian Advocate.
