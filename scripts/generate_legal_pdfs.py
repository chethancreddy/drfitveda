import os
import subprocess
import sys

OUTPUT_DIR = r"D:\DrFitVeda\docs\legal_signoff_pdfs"
EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

BROWSER_EXE = EDGE_EXE if os.path.exists(EDGE_EXE) else CHROME_EXE

os.makedirs(OUTPUT_DIR, exist_ok=True)

COMMON_CSS = """
@page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {
        content: counter(page);
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1a202c;
    line-height: 1.6;
    font-size: 10pt;
    margin: 0;
    padding: 0;
}

.header-banner {
    border-bottom: 2px solid #2d3748;
    padding-bottom: 15px;
    margin-bottom: 25px;
}

.brand-title {
    font-size: 20pt;
    font-weight: 700;
    color: #0f766e;
    margin: 0 0 4px 0;
    letter-spacing: -0.5px;
}

.brand-sub {
    font-size: 9pt;
    color: #4a5568;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
}

.doc-meta {
    display: flex;
    justify-content: space-between;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 8.5pt;
    color: #475569;
    margin-bottom: 20px;
}

.doc-meta-col {
    flex: 1;
}

.doc-meta strong {
    color: #0f172a;
}

.status-tag {
    display: inline-block;
    background-color: #fef3c7;
    color: #92400e;
    font-size: 8pt;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #fde68a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

h1 {
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px 0;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 8px;
}

h2 {
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f766e;
    margin: 20px 0 8px 0;
    page-break-after: avoid;
}

p {
    margin: 0 0 10px 0;
}

ul, ol {
    margin: 0 0 12px 0;
    padding-left: 20px;
}

li {
    margin-bottom: 5px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.5pt;
    page-break-inside: auto;
}

tr {
    page-break-inside: avoid;
    page-break-after: auto;
}

th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
}

td {
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
}

tr:nth-child(even) td {
    background-color: #f8fafc;
}

.confirm-box {
    background-color: #fffbeb;
    border-left: 4px solid #f59e0b;
    border-top: 1px solid #fef3c7;
    border-right: 1px solid #fef3c7;
    border-bottom: 1px solid #fef3c7;
    padding: 10px 14px;
    margin: 12px 0;
    font-size: 8.5pt;
    color: #78350f;
    border-radius: 0 4px 4px 0;
}

.confirm-box strong {
    color: #b45309;
}

.signoff-box {
    margin-top: 35px;
    border: 1.5px solid #0f766e;
    background-color: #f0fdf4;
    border-radius: 6px;
    padding: 16px 20px;
    page-break-inside: avoid;
}

.signoff-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0f766e;
    margin-bottom: 12px;
    border-bottom: 1px solid #a7f3d0;
    padding-bottom: 6px;
}

.signoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 9pt;
}

.signoff-field {
    border-bottom: 1px dashed #64748b;
    padding-bottom: 4px;
    margin-top: 16px;
}

.signoff-label {
    font-weight: 600;
    color: #334155;
    font-size: 8pt;
    text-transform: uppercase;
}

.page-break {
    page-break-before: always;
}

.lead-text {
    font-size: 10.5pt;
    color: #334155;
    font-style: italic;
    background: #f8fafc;
    padding: 10px 14px;
    border-radius: 4px;
    border-left: 3px solid #0f766e;
    margin-bottom: 16px;
}
"""

def wrap_html(title, doc_code, effective_date, body_content, signoff_title="Formal Legal Counsel Sign-Off"):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title} — Dr Fit Veda</title>
    <style>
        {COMMON_CSS}
    </style>
</head>
<body>
    <div class="header-banner">
        <div class="brand-title">DR FIT VEDA</div>
        <div class="brand-sub">Holistic Health & Wellness Platform | Corporate Compliance</div>
        <div class="doc-meta">
            <div class="doc-meta-col">
                <strong>Legal Entity:</strong> Dr Fit Veda Holistic Health Services Ltd.<br>
                <strong>Jurisdiction:</strong> Bangalore, Karnataka, India<br>
                <strong>Contact:</strong> care@drfitveda.com
            </div>
            <div class="doc-meta-col" style="text-align: right;">
                <strong>Document Ref:</strong> {doc_code}<br>
                <strong>Status:</strong> <span class="status-tag">Draft For Legal Sign-Off</span><br>
                <strong>Effective / Review Date:</strong> {effective_date}
            </div>
        </div>
    </div>

    <h1>{title}</h1>

    {body_content}

    <div class="signoff-box">
        <div class="signoff-title">{signoff_title}</div>
        <p style="font-size: 8.5pt; color: #334155; margin-bottom: 10px;">
            By signing below, reviewing legal counsel approves the terms, statutory disclosures, and compliance provisions set forth in this document for commercial publication on <strong>drfitveda.com</strong> and associated mobile/web portals.
        </p>
        <div class="signoff-grid">
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Reviewing Advocate / Counsel Name</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Bar Council / Enrollment Number</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Law Firm / Corporate Legal Dept</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Review Date</div>
            </div>
            <div style="grid-column: span 2;">
                <div class="signoff-field" style="margin-top: 24px;"></div>
                <div class="signoff-label">Signature & Official Seal / Stamp</div>
            </div>
            <div style="grid-column: span 2; margin-top: 6px;">
                <div style="font-size: 8.5pt; color: #475569;">
                    <strong>Decision:</strong> &nbsp;&nbsp;
                    [ &nbsp; ] Approved without modification &nbsp;&nbsp;&nbsp;&nbsp;
                    [ &nbsp; ] Approved with amendments noted on document
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""

# 1. Privacy Policy
PRIVACY_BODY = """
<div class="lead-text">
    This policy explains how Dr Fit Veda Holistic Health Services Ltd. ("Dr Fit Veda", "we") handles personal and sensitive data of visitors, customers and healthcare/fitness professionals on drfitveda.com and the Dr Fit Veda portals. It accurately reflects the actual technical architecture of the platform.
</div>

<div class="confirm-box">
    <strong>Instructions for Legal Counsel:</strong> Please inspect all callouts marked <code>[CONFIRM]</code> throughout this document, specifically regarding the designation of the statutory Grievance Officer, data retention thresholds for clinical records, and international health data transfer restrictions for UAE referral patients.
</div>

<h2>1. Who is Responsible (Data Fiduciary / Controller)</h2>
<p>
    Dr Fit Veda Holistic Health Services Ltd. (Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India) decides why and how your personal data is processed (the "Data Fiduciary" under the Indian Digital Personal Data Protection Act 2023 and "Data Controller" under international frameworks). Contact: <strong>care@drfitveda.com</strong>.
</p>

<h2>2. Data We Collect, Why, and Retention Periods</h2>
<table>
    <thead>
        <tr>
            <th style="width: 28%;">Data Category</th>
            <th style="width: 27%;">Purpose of Processing</th>
            <th style="width: 20%;">Storage System</th>
            <th style="width: 25%;">Retention Schedule</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Account Identifiers:</strong> Name, phone number, email, role, secure authentication UUID.</td>
            <td>Create and secure accounts; identity verification; service communications.</td>
            <td>Platform Database (Supabase PostgreSQL, RLS restricted)</td>
            <td>While account is active, then up to <strong>[CONFIRM: 12 months]</strong> unless law requires longer.</td>
        </tr>
        <tr>
            <td><strong>Profile & Lifestyle Data:</strong> Date of birth, gender, height, weight, BMI, occupation, sleep, stress score, activity level, health goals; women's wellness details (optional, strictly restricted).</td>
            <td>Enable assigned multi-disciplinary care team (doctors, trainers, nutritionists) to prepare clinical and wellness plans.</td>
            <td>Platform Database (Restricted access by professional role)</td>
            <td>While account is active + <strong>[CONFIRM]</strong> statutory retention period. Clinical records follow Section 9.</td>
        </tr>
        <tr>
            <td><strong>Food & Nutrition Profile:</strong> Diet type, meal timings, food allergies, intolerances, dietary restrictions.</td>
            <td>Prepare safe, effective naturopathic and dietary regimens.</td>
            <td>Platform Database</td>
            <td>Active subscription duration + statutory clinical duration.</td>
        </tr>
        <tr>
            <td><strong>Health Documents & Reports:</strong> Diagnostic lab tests, medical prescriptions, clinical scans, user notes.</td>
            <td>Doctor review, clinical evaluation, and health assessment.</td>
            <td>Private Encrypted Cloud Storage</td>
            <td>Until customer requests deletion or account termination, subject to Section 9 medical record retention mandates.</td>
        </tr>
        <tr>
            <td><strong>Consultation Records:</strong> Appointment schedules, consultation topics, doctor clinical notes, recommendations, weekly reviews.</td>
            <td>Deliver and document professional health care and continuity of treatment.</td>
            <td>Platform Database (Restricted)</td>
            <td>Retained per Section 9 <strong>[CONFIRM: Clinical record period under NMC / Telemedicine norms]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Plans & Adherence Tracking:</strong> Diet, workout, yoga routines, daily check-in logs, biometric progress records, uploaded photos/videos.</td>
            <td>Deliver, monitor, and adapt personalised wellness programmes.</td>
            <td>Platform Database / Private Encrypted Media Storage</td>
            <td>While account active + <strong>[CONFIRM: 3 years]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Session Recordings:</strong> Live 1-on-1 fitness training or clinical yoga sessions where recording is enabled.</td>
            <td>Replay access, form and posture correction review.</td>
            <td>Private Storage with short-lived time-bounded signed URLs</td>
            <td><strong>Strict 1-recording policy:</strong> Only the single latest recording is retained; the preceding recording is permanently queued for deletion after a grace period (default 24 hours).</td>
        </tr>
        <tr>
            <td><strong>Orders & Payment Records:</strong> Plan tier, amount, currency (INR), transaction status, payment gateway transaction ID.</td>
            <td>Process and reconcile subscription payments, statutory accounting, and tax audits.</td>
            <td>Platform Database (Card and bank credentials handled entirely by RBI-licensed payment gateway; never stored by Dr Fit Veda)</td>
            <td>Statutory tax and financial accounting requirement (typically 6–8 years under Indian tax regulations) <strong>[CONFIRM]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Contact Inquiries:</strong> Full name, phone number, health focus, callback message.</td>
            <td>Respond to user callback requests and consultation queries.</td>
            <td>Platform Database (Table: <code>contact_inquiries</code>)</td>
            <td>Retained for <strong>[CONFIRM: 90 days]</strong> post-resolution, then purged.</td>
        </tr>
        <tr>
            <td><strong>Consent Records & DSR Logs:</strong> Specific consent purpose, policy version, timestamp, DSR request tracking.</td>
            <td>Demonstrate evidentiary compliance with DPDP Act, IT Rules, and privacy regulations.</td>
            <td>Platform Database (Append-only <code>consent_records</code> and <code>data_subject_requests</code>)</td>
            <td>Consent logs: Active duration + 3 years. Privacy requests: 3 years after closure <strong>[CONFIRM]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Security Audit Logs & Session Cookies:</strong> Access logs, administrative action logs, session security tokens.</td>
            <td>Security monitoring, breach investigation, fraud prevention.</td>
            <td>Platform Database</td>
            <td>Audit logs retained for <strong>[CONFIRM: 12–24 months]</strong>.</td>
        </tr>
    </tbody>
</table>

<h2>3. Legal Bases and Consent Mechanisms</h2>
<p>
    <strong>India (DPDP Act 2023 & IT SPDI Rules 2011):</strong> We process personal data primarily on the basis of informed, explicit consent and for limited legitimate uses recognised by statute (e.g., fulfilling contracted services, complying with legal orders, or emergency medical response). Health information is classified as sensitive personal data. The platform enforces granular, separate, non-pre-ticked opt-in checkboxes prior to document uploads, consultation bookings, and session recordings. Acceptance of general Terms & Conditions is never conflated with consent for health data processing.
</p>
<p>
    <strong>UAE and International Clients:</strong> For clients residing in the UAE or other jurisdictions, we rely on explicit consent for special categories of health data, performance of contract for wellness services, and legal compliance for transaction records. Consent may be revoked at any time; revocation does not invalidate prior lawful processing.
</p>

<h2>4. Third-Party Service Providers and Data Disclosures</h2>
<p>Dr Fit Veda does not sell, rent, or trade personal or health data. Disclosures are strictly limited to necessary service partners:</p>
<ul>
    <li><strong>Assigned Care Professionals:</strong> Doctors, fitness trainers, yoga therapists, and clinical nutritionists. Access is restricted strictly to assigned customers via database Row Level Security (RLS).</li>
    <li><strong>Cloud Infrastructure & Database (Supabase):</strong> Secure database hosting, authentication, and file storage. <em>[CONFIRM: Cloud region, e.g., AWS Mumbai (ap-south-1)].</em></li>
    <li><strong>Video Teleconsultation & Live Training (Zoho Meeting):</strong> Customer name and email are transmitted strictly to provision encrypted video rooms and join links.</li>
    <li><strong>Payment Gateway (Razorpay):</strong> Tokenised processing of payment transactions; no raw card credentials touch Dr Fit Veda servers. <em>[CONFIRM]</em></li>
    <li><strong>Transactional Communications (Resend):</strong> System emails, booking confirmations, and password reset notifications. <em>[CONFIRM]</em></li>
    <li><strong>Judicial & Statutory Authorities:</strong> Disclosed only where mandatory by court order, statutory subpoena, or regulatory summons under Indian law.</li>
</ul>

<h2>5. International Data Transfers</h2>
<p>
    Primary platform data is hosted on secure cloud infrastructure located in <strong>[CONFIRM: Mumbai, India]</strong>. For international customers (such as referral clients residing in the United Arab Emirates), data is processed through encrypted channels. Transfer mechanisms comply with cross-border transfer provisions under India's DPDP Act and UAE Federal Decree-Law 45/2021. <em>[CONFIRM: Specific health data residency mandates under UAE Federal Law No. 2 of 2019].</em>
</p>

<h2>6. Technical and Organisational Security Measures</h2>
<p>
    All communications are encrypted in transit using Transport Layer Security (TLS 1.3 / HTTPS). Customer data is isolated at the database engine level using Row Level Security (RLS) policies. Diagnostic files and session recordings reside in private buckets accessed exclusively via temporary, cryptographically signed URLs. All administrative actions are recorded in immutable audit logs.
</p>

<h2>7. Minors and Eligibility</h2>
<p>
    Services are restricted to individuals aged <strong>18 years and older</strong>. We do not knowingly solicit or collect data from children under 18. Any account identified as belonging to an unauthorised minor will be terminated and associated data permanently expunged.
</p>

<h2>8. Data Subject Rights and Exercising Procedures</h2>
<p>Under applicable data privacy legislation, users enjoy the following actionable rights:</p>
<ul>
    <li><strong>Right of Access & Summary:</strong> Request a comprehensive export of all personal and health data stored on the platform.</li>
    <li><strong>Right to Correction & Rectification:</strong> Request correction of inaccurate, incomplete, or out-of-date personal information.</li>
    <li><strong>Right to Data Portability / Export:</strong> Receive personal data in a structured, commonly used, machine-readable JSON/PDF format.</li>
    <li><strong>Right to Erasure / Deletion:</strong> Request deletion of personal data, subject to mandatory statutory retention exemptions.</li>
    <li><strong>Right to Withdraw Consent:</strong> Revoke previously granted consents without retroactive penalty.</li>
    <li><strong>Right to Grievance Redressal:</strong> Submit privacy concerns directly to our appointed Grievance Officer.</li>
</ul>
<p>
    <strong>Verification Procedure:</strong> To prevent identity theft and unauthorized disclosure, identity verification is conducted via existing verified credentials before releasing or deleting any data.
</p>
<p>
    <strong>Statutory Deletion Exemptions:</strong> Where clinical, accounting, tax, or fraud prevention laws mandate record preservation, certain records cannot be immediately deleted. In such instances, records are segregated, access-restricted, and retained solely for statutory defense.
</p>

<h2>9. Mandatory Record Retention Policies</h2>
<p>
    Medical guidelines, accounting statutes, and electronic transaction laws impose strict retention periods. Consultation notes and medical histories are preserved in accordance with Indian medical regulatory norms <em>[CONFIRM: 3 years under Telemedicine Practice Guidelines / NMC regulations]</em> before automated anonymisation or deletion.
</p>

<h2>10. Statutory Grievance Redressal Mechanism</h2>
<p>
    In compliance with Section 5 of the Digital Personal Data Protection Act 2023, Rule 5(9) of the Information Technology (SPDI) Rules 2011, and the Consumer Protection (E-Commerce) Rules 2020, users may escalate complaints to our designated Grievance Officer:
</p>
<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin: 10px 0; font-size: 9pt;">
    <strong>Name of Grievance Officer:</strong> [CONFIRM: Full Name of Appointed Officer]<br>
    <strong>Designation:</strong> Data Protection & Grievance Officer<br>
    <strong>Office Address:</strong> Dr Fit Veda Holistic Health Services Ltd., Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India<br>
    <strong>Dedicated Grievance Email:</strong> grievance@drfitveda.com / care@drfitveda.com<br>
    <strong>Acknowledgement Timeline:</strong> Within 48 hours of receipt<br>
    <strong>Resolution Timeline:</strong> Within 30 days of receipt [CONFIRM]
</div>
"""

# 2. Terms and Conditions
TERMS_BODY = """
<div class="lead-text">
    These Terms & Conditions govern your access to and use of the Dr Fit Veda website (drfitveda.com) and associated client, professional, and administrative portals. Please read them thoroughly alongside our Privacy Policy, Cookie Policy, Refund & Cancellation Policy, and Medical Disclaimer.
</div>

<div class="confirm-box">
    <strong>Instructions for Legal Counsel:</strong> Please verify Section 5 (tax inclusivity of pricing and UAE currency provisions), Section 10 (statutory liability limitation cap), and Section 12 (exclusive jurisdiction and Bangalore dispute forum).
</div>

<h2>1. Entity Identification and Contractual Acceptance</h2>
<p>
    This platform is operated by <strong>Dr Fit Veda Holistic Health Services Ltd.</strong>, located at Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India ("Dr Fit Veda", "we", "us"). By registering an account, purchasing a membership package, booking a standalone consultation, or navigating the platform, you enter into a legally binding contract under these Terms. If you do not agree, you must cease using the platform immediately.
</p>
<p>
    <strong>Non-Conflation of Terms:</strong> Acceptance of these operational Terms does not constitute blanket consent to the processing of sensitive personal health data, recording of live sessions, or promotional marketing. All sensitive data processing is governed by independent, unbundled consents under our Privacy Policy.
</p>

<h2>2. Eligibility and Account Security</h2>
<p>
    You must be at least <strong>18 years of age</strong> and legally capable of executing contracts under the Indian Contract Act 1872. You agree to provide true, current, and complete information during onboarding. You are strictly responsible for maintaining credential secrecy and for all actions executed under your authenticated session. Account sharing, sub-licensing, or joint access is strictly prohibited.
</p>

<h2>3. Scope of Online Wellness Services</h2>
<p>
    Dr Fit Veda delivers online lifestyle modification, naturopathic consultation, nutrition planning, yoga therapy, and 1-on-1 fitness coaching. Our services constitute supportive wellness, nutritional, and physical training guidance delivered via digital tools. They do not constitute emergency medical care or hospital services. Full clinical limitations are set forth in our Medical, Fitness & Nutrition Disclaimer.
</p>

<h2>4. Live Training and Video Consultations</h2>
<ul>
    <li>All live virtual sessions are conducted via our integrated video partner, <strong>Zoho Meeting</strong>.</li>
    <li>Where session recording is included in your membership tier (such as 1-on-1 fitness training), recording requires explicit client consent. You may request to disable recording at any time; doing so may limit posture review features.</li>
    <li><strong>Retention of Recordings:</strong> To protect client privacy and storage hygiene, the platform enforces a strict single-active recording policy. Only the most recent recording is retained; prior sessions are queued for automated permanent deletion after a grace period.</li>
    <li><strong>User Conduct in Live Sessions:</strong> Recording, screenshotting, disseminating, or publicly publishing virtual consultations or training sessions without express written consent is strictly prohibited and constitutes grounds for immediate termination.</li>
</ul>

<h2>5. Pricing, Billing, and Currency</h2>
<p>
    All prices are denominated in <strong>Indian Rupees (₹ INR)</strong> <em>[CONFIRM: Whether listed prices are inclusive of 18% GST and how overseas transactions in AED/USD are billed]</em>. Membership subscriptions are fixed-term contracts paid in full in advance.
</p>
<p>
    <strong>No Hidden Auto-Renewals:</strong> Dr Fit Veda does not deploy deceptive recurring auto-debit dark patterns. Subscriptions terminate at the end of their contracted duration unless you manually renew.
</p>

<h2>6. User Health Disclosures and Obligations</h2>
<ul>
    <li>You warrant that all health histories, symptoms, lifestyle details, medications, allergies, and pregnancy statuses disclosed to our care team are accurate and complete.</li>
    <li>You must promptly inform your care team of any emerging medical conditions, acute pain, injuries, or adverse symptoms, and immediately halt any exercise causing physical distress.</li>
    <li>You shall not upload forged diagnostic documents or health records belonging to third parties without lawful proxy authority.</li>
</ul>

<h2>7. Prohibited Uses and Platform Integrity</h2>
<p>
    Users shall not: (a) reverse-engineer, decompile, scrape, or extract platform source code; (b) introduce malicious code, denial-of-service scripts, or automated spiders; (c) harass, demean, or abuse healthcare professionals, trainers, or personnel; (d) use platform consultations for illegal, defamatory, or deceptive purposes. Violations will result in immediate account suspension, forfeiture of access, and referral to law enforcement where warranted.
</p>

<h2>8. Intellectual Property and Proprietary Rights</h2>
<p>
    All platform design assets, custom software, fitness regimens, diet methodologies, logos, and digital educational materials remain the sole exclusive property of Dr Fit Veda Holistic Health Services Ltd. You are granted a personal, revocable, non-exclusive, non-transferable licence to consume personalised plans for personal wellness.
</p>

<h2>9. Data Privacy and Rights</h2>
<p>
    Our data handling procedures are governed by our Privacy Policy. Customers can submit data access, portability, rectification, and erasure requests at any time via the dedicated Data Subject Request form at <code>/data-request</code>.
</p>

<h2>10. Limitation of Liability and Warranties</h2>
<p>
    Nothing in these Terms excludes or limits liability for gross negligence, willful misconduct, intentional fraud, or personal injury that cannot be limited under applicable Indian consumer protection jurisprudence. Subject to the foregoing, Dr Fit Veda, its directors, employees, and contracted professionals shall not be liable for indirect, incidental, or consequential damages resulting from platform use.
</p>
<p>
    <strong>Liability Cap:</strong> <em>[CONFIRM: Total aggregate liability for commercial claims under this agreement shall be capped at the total subscription fees actually paid by the user to Dr Fit Veda in the twelve (12) months preceding the incident].</em>
</p>

<h2>11. Service Availability and Modifications</h2>
<p>
    We reserve the right to alter, enhance, or temporarily suspend aspects of the platform for maintenance or technical upgrades. Where a paid service is permanently discontinued prior to full utilization, a pro-rata refund for the unused duration will be issued pursuant to our Refund Policy.
</p>

<h2>12. Governing Law and Exclusive Dispute Forum</h2>
<p>
    These Terms are executed and governed in accordance with the substantive laws of <strong>India</strong>. The courts of competent jurisdiction located in <strong>Bangalore, Karnataka, India</strong> shall have exclusive jurisdiction to adjudicate disputes arising from these Terms, subject to prior informal escalation to our Grievance Officer. <em>[CONFIRM with legal counsel].</em>
</p>

<h2>13. Amendments to Terms</h2>
<p>
    We will provide at least 15 days' advance notification of material amendments to these Terms via email or prominent platform banners. Continued use of the platform after the effective date of revised terms constitutes acceptance thereof.
</p>
"""

# 3. Cookie Policy
COOKIES_BODY = """
<div class="lead-text">
    This Cookie Policy details how Dr Fit Veda uses cookies and local browser storage technologies on drfitveda.com and its authenticated portals. It is based on a comprehensive audit of the active Next.js production codebase.
</div>

<div class="confirm-box">
    <strong>Instructions for Legal Counsel:</strong> Please confirm that our current deployment of strictly necessary cookies exempts the platform from displaying an intrusive cookie consent banner under Indian SPDI Rules, DPDP Act 2023, and international ePrivacy guidelines.
</div>

<h2>1. Summary and Zero-Tracking Commitment</h2>
<p>
    Dr Fit Veda operates on a strict privacy-first foundation. The platform deploys <strong>only strictly necessary cookies</strong> required for user authentication, security verification, and role-based access control.
</p>
<p>
    <strong>Zero Advertising and Analytics Trackers:</strong> We do not deploy third-party advertising cookies, behavioural retargeting pixels (such as Meta Pixel or Google Ads), commercial tracking beacons, or cross-site fingerprinting scripts. Because strictly necessary cookies are exempt from prior consent requirements under ePrivacy guidelines and are not categorised as tracking under Indian or UAE data laws, no cookie consent banner is mandated at this time. Should non-essential analytics or marketing trackers be introduced in future releases, a compliant opt-in consent banner with granular controls will be deployed prior to firing any such scripts.
</p>

<h2>2. Inventory of Active Cookies</h2>
<table>
    <thead>
        <tr>
            <th style="width: 25%;">Cookie Name</th>
            <th style="width: 35%;">Technical Purpose</th>
            <th style="width: 15%;">Classification</th>
            <th style="width: 12%;">Duration</th>
            <th style="width: 13%;">Issuer</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>drf_session</code></td>
            <td>Maintains encrypted session state, verifies authenticated user role (customer, professional, admin), and protects against session hijacking. Configured with <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Lax</code> flags.</td>
            <td>Strictly Necessary</td>
            <td>7 Days</td>
            <td>Dr Fit Veda (First-Party)</td>
        </tr>
        <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Manages secure authentication tokens and session refresh handshakes with the Supabase database instance.</td>
            <td>Strictly Necessary</td>
            <td>Session / Refresh cycle</td>
            <td>Dr Fit Veda / Supabase</td>
        </tr>
    </tbody>
</table>

<h2>3. Self-Hosted Assets and Third-Party Isolation</h2>
<p>
    To eliminate passive tracking and IP address leakage, all web typography (Nunito Sans) is self-hosted directly from our first-party origin (<code>/fonts/</code>). No connections are established with Google Fonts servers. All UI icons, sample video demonstrations, and SVG assets are served directly from our origin server.
</p>
<p>
    When a customer joins an encrypted teleconsultation or live training session via Zoho Meeting, the connection is handed off to Zoho's video bridge, whereupon Zoho's independent security policies govern the real-time media transmission.
</p>

<h2>4. User Management of Browser Storage</h2>
<p>
    Users can inspect, delete, or block cookies through standard browser settings. However, disabling strictly necessary cookies will inhibit user login and prevent access to the authenticated customer and professional dashboards.
</p>
"""

# 4. Refund Policy
REFUND_BODY = """
<div class="lead-text">
    This Refund & Cancellation Policy outlines the conditions, timelines, and procedures governing membership terminations, consultation cancellations, and financial reimbursements for services offered by Dr Fit Veda.
</div>

<div class="confirm-box">
    <strong>Instructions for Legal Counsel & Management:</strong> Please review and finalize the placeholder terms marked <code>[CONFIRM]</code>, specifically: cooling-off period (e.g., 7 days vs 14 days), pro-rata cancellation deductions, and the commercial terms of the "100% Satisfaction Guarantee".
</div>

<h2>1. Scope of Purchased Services</h2>
<ul>
    <li><strong>Fixed-Term Memberships:</strong> Pre-paid packages (1 Month, 3 Months, 6 Months, 12 Months) delivering customised fitness training, clinical nutrition, yoga regimens, and ongoing professional supervision. Memberships terminate automatically at contract end without auto-debit.</li>
    <li><strong>Standalone Consultations:</strong> Per-session appointments with certified Doctors (Yoga, PCOD/PCOS, General Wellness) booked at fixed slot durations.</li>
    <li><strong>Currency:</strong> All transactions are conducted in Indian Rupees (₹ INR) <em>[CONFIRM: Foreign exchange conversion for UAE referral clients]</em>.</li>
</ul>

<h2>2. Cancellation Timelines and Guidelines</h2>
<ul>
    <li><strong>Membership Cancellations:</strong> Clients may initiate cancellation requests at any time by emailing <strong>care@drfitveda.com</strong> or via the client dashboard. Cancellation terminates upcoming scheduled sessions immediately.</li>
    <li><strong>Consultation Cancellations & Rescheduling:</strong> Standalone consultations may be rescheduled or cancelled up to <strong>[CONFIRM: 24 hours]</strong> prior to the appointed time without penalty, entitling the client to a full credit or refund. Cancellations made within less than 24 hours or no-shows are subject to <strong>[CONFIRM: 50% cancellation fee or slot forfeiture]</strong>.</li>
    <li><strong>Cancellations by Dr Fit Veda:</strong> If a scheduled professional is unavailable due to medical emergency or technical outage, the client will be offered an immediate rescheduled slot or a 100% full refund for the affected session.</li>
</ul>

<h2>3. Eligibility for Refund</h2>
<p>Clients are entitled to a full or partial refund under the following circumstances:</p>
<ul>
    <li><strong>Billing Errors & Technical Double Charges:</strong> Where an erroneous duplicate debit occurs or payment succeeds without service activation.</li>
    <li><strong>Service Inability:</strong> Where Dr Fit Veda is unable to assign a qualified professional or permanently discontinues a booked programme.</li>
    <li><strong>Cooling-Off Window:</strong> Where cancellation is submitted within <strong>[CONFIRM: 7 calendar days]</strong> of initial purchase and the user has consumed no more than <strong>[CONFIRM: 2 sessions]</strong>, refund is granted less the nominal fair value of delivered sessions.</li>
    <li><strong>Statutory Consumer Rights:</strong> Any non-waivable statutory refund rights guaranteed under the Indian Consumer Protection (E-Commerce) Rules 2020 or applicable consumer laws.</li>
</ul>
<p>
    <strong>Mid-Term Pro-Rata Deductions:</strong> <em>[CONFIRM: Where mid-term cancellation is approved on compassionate/medical grounds, refund will be computed pro-rata against unconsumed weeks, deducting a 5% administrative payment-gateway processing fee].</em>
</p>
<p>
    <strong>"100% Satisfaction Guarantee" Terms:</strong> <em>[CONFIRM: The landing page features a '100% Satisfaction Guarantee' badge. Counsel must formally validate the exact criteria: e.g., client must have maintained 85%+ adherence to daily check-ins and diet logs for 30 consecutive days, or this promotional claim must be modified].</em> Dr Fit Veda does not guarantee specific biological weight-loss or medical cure outcomes.
</p>

<h2>4. Refund Processing and Disbursement Timelines</h2>
<p>
    Approved refunds are disbursed exclusively to the original payment instrument (credit card, debit card, UPI, net banking) via our licensed payment gateway. Refunds are processed by Dr Fit Veda within <strong>[CONFIRM: 5 to 7 business days]</strong> of approval. Bank processing cycles may require an additional 3–5 working days to reflect on customer statements.
</p>

<h2>5. Escalation and Grievance Procedure</h2>
<p>
    To request a refund, submit an email to <strong>care@drfitveda.com</strong> with your registered phone number, order ID, and reason for refund. Inquiries are acknowledged within 2 business days. If unresolved within 7 days, disputes may be escalated directly to our Grievance Officer: <strong>[CONFIRM: grievance@drfitveda.com]</strong>.
</p>
"""

# 5. Medical Disclaimer
DISCLAIMER_BODY = """
<div class="lead-text">
    This Medical, Fitness & Nutrition Disclaimer outlines the clinical and legal boundaries of guidance provided through Dr Fit Veda. All users must read and acknowledge this notice prior to commencing programmes or scheduling consultations.
</div>

<div class="confirm-box">
    <strong>Instructions for Legal Counsel:</strong> Please confirm compliance of these disclaimers with the Telemedicine Practice Guidelines (2020) and statutory guidelines for AYUSH / Naturopathy / Dietetics professionals in India and cross-border telehealth advisory standards.
</div>

<h2>1. Supportive Wellness Care — Not Emergency or Hospital Care</h2>
<p>
    Dr Fit Veda delivers online lifestyle modification, naturopathic consultation, nutritional guidance, and yoga/fitness training. Our services are <strong>strictly not an emergency medical service</strong> and do not replace comprehensive physical in-person clinical diagnosis, hospital admission, acute disease treatment, or direct surgical intervention by a primary healthcare physician.
</p>
<p>
    Never ignore, disregard, or delay obtaining professional in-person medical advice because of recommendations, meal plans, or workout instructions received through this platform.
</p>

<h2>2. Emergency Medical Protocol (Immediate Action)</h2>
<p>
    If you or someone under your care experiences severe or acute symptoms — including chest pain, crushing pressure, shortness of breath, sudden numbness, severe hemorrhage, loss of consciousness, stroke symptoms, allergic anaphylaxis, or acute psychiatric crisis — <strong>immediately contact emergency services</strong>:
</p>
<div style="background: #fef2f2; border: 1.5px solid #f87171; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 9.5pt; color: #991b1b;">
    <strong>India Emergency Ambulance:</strong> Dial <strong>112</strong> or <strong>108</strong><br>
    <strong>United Arab Emirates Emergency Services:</strong> Dial <strong>998</strong> (Ambulance) or <strong>999</strong> (Police)<br>
    <strong>Immediate Hospital Transfer:</strong> Transport the patient immediately to the nearest tertiary emergency department.
</div>

<h2>3. Pre-Existing Clinical Conditions and Medical Clearance</h2>
<p>
    You are legally and medically obligated to consult your primary treating physician before commencing any programme if you:
</p>
<ul>
    <li>Have diagnosed cardiovascular, renal, metabolic, endocrine, or pulmonary conditions (e.g., Type 1/Type 2 Diabetes, Hypertension, Coronary Artery Disease, Thyroid disorders, Chronic Kidney Disease, PCOD/PCOS);</li>
    <li>Take daily prescription medications, including antihypertensives, insulin, oral hypoglycaemics, anticoagulants, or psychiatric medications;</li>
    <li>Are pregnant, planning pregnancy, breastfeeding, recovering from recent surgery, or managing eating disorders;</li>
    <li>Are over the age of 60 and initiating vigorous physical exercise for the first time.</li>
</ul>
<p>
    <strong>Prescription Medication Inviolability:</strong> Never adjust, reduce, taper, or terminate prescription medications without the express written approval of your treating licensed medical doctor.
</p>

<h2>4. Physical Exercise and Yoga Safety</h2>
<p>
    Physical exercise and yoga asanas carry inherent physiological risks of muscle strain, joint sprain, or cardiovascular stress. You must exercise in a hazard-free space, maintain adequate hydration, follow your trainer's instructions, and immediately cease any activity that produces acute pain, dizziness, or chest discomfort.
</p>

<h2>5. Nutritional Plans and Allergen Disclosures</h2>
<p>
    Nutritional regimens are prepared based exclusively on user-provided dietary disclosures. It is your sole responsibility to review meal suggestions against known food allergies, histamine intolerances, or clinical dietary restrictions. Dietary supplements or herbal preparations must be verified for cross-interactions with prescription medications.
</p>

<h2>6. Non-Guarantee of Clinical Results and Weight Loss</h2>
<p>
    Physiological outcomes vary substantially based on genetics, metabolic health, hormonal profiles, and adherence. Dr Fit Veda explicitly does not guarantee specific biological weight loss, chronic disease reversal, cure, or guaranteed clinical outcomes. Testimonials and success stories displayed on the platform reflect individual customer experiences and do not represent guaranteed outcomes.
</p>

<h2>7. Artificial Intelligence and Algorithmic Disclosures</h2>
<p>
    The platform currently does not deploy autonomous generative artificial intelligence for clinical diagnosis or prescription generation. All care plans, diet charts, and assessments are reviewed and created by certified human healthcare and fitness professionals.
</p>

<h2>8. Professional Standards and Duty of Care</h2>
<p>
    All contracted doctors, nutritionists, yoga therapists, and fitness coaches are credentialed professionals required to adhere to their respective statutory codes of ethics. Nothing in this disclaimer limits liability for medical negligence that cannot be excluded under applicable Indian law.
</p>
"""

# Master Package Executive Cover and Index
MASTER_COVER = """
<div style="text-align: center; padding: 40px 0 30px 0; border-bottom: 2px solid #0f766e;">
    <div style="font-size: 26pt; font-weight: 800; color: #0f766e; letter-spacing: -1px; margin-bottom: 8px;">DR FIT VEDA</div>
    <div style="font-size: 13pt; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px;">Corporate Legal & Compliance Audit Package</div>
    <div style="font-size: 10pt; color: #64748b;">Comprehensive Regulatory Documentation for Legal Counsel Formal Sign-Off</div>
    <div style="margin-top: 15px;">
        <span class="status-tag" style="font-size: 9pt; padding: 4px 12px;">Version 0.1-DRAFT (For Advocate Review & Formal Approval)</span>
    </div>
</div>

<div style="margin: 30px 0; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px;">
    <h2 style="margin-top: 0; color: #0f766e;">Executive Legal Overview & Background</h2>
    <p style="font-size: 9.5pt; color: #334155;">
        This document bundle contains the complete, authoritative legal policies and regulatory governance frameworks drafted for <strong>Dr Fit Veda Holistic Health Services Ltd.</strong> (operating <strong>drfitveda.com</strong>).
    </p>
    <p style="font-size: 9.5pt; color: #334155;">
        The policies have been crafted by expert software, privacy, and compliance auditors following a meticulous end-to-end review of the platform's active technical architecture, database schemas, and digital intake channels. They strictly avoid hypothetical representations and reflect real data flows.
    </p>
</div>

<h2>Table of Contents & Document Hierarchy</h2>
<table>
    <thead>
        <tr>
            <th style="width: 8%;">Doc #</th>
            <th style="width: 32%;">Document Title</th>
            <th style="width: 35%;">Governing Statutory Frameworks</th>
            <th style="width: 25%;">Legal Sign-Off Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>01</strong></td>
            <td><strong>Privacy Policy</strong></td>
            <td>DPDP Act 2023, IT SPDI Rules 2011, UAE Decree-Law 45/2021</td>
            <td>Draft — Pending Counsel Sign-Off</td>
        </tr>
        <tr>
            <td><strong>02</strong></td>
            <td><strong>Terms & Conditions</strong></td>
            <td>Indian Contract Act 1872, Consumer Protection (E-Commerce) Rules 2020</td>
            <td>Draft — Pending Counsel Sign-Off</td>
        </tr>
        <tr>
            <td><strong>03</strong></td>
            <td><strong>Cookie Policy</strong></td>
            <td>IT Act 2000, International ePrivacy Regulations</td>
            <td>Draft — Pending Counsel Sign-Off</td>
        </tr>
        <tr>
            <td><strong>04</strong></td>
            <td><strong>Refund & Cancellation Policy</strong></td>
            <td>Consumer Protection Act 2019, E-Commerce Rules 2020</td>
            <td>Draft — Pending Counsel Sign-Off</td>
        </tr>
        <tr>
            <td><strong>05</strong></td>
            <td><strong>Medical, Fitness & Nutrition Disclaimer</strong></td>
            <td>Telemedicine Practice Guidelines 2020, Medical Ethics Norms</td>
            <td>Draft — Pending Counsel Sign-Off</td>
        </tr>
    </tbody>
</table>

<div class="confirm-box" style="margin-top: 25px;">
    <h3 style="margin: 0 0 8px 0; color: #b45309; font-size: 10.5pt;">Mandatory Counsel Action Items (Checklist of [CONFIRM] Tags):</h3>
    <ol style="margin: 0; padding-left: 20px; font-size: 9pt; color: #78350f;">
        <li><strong>Grievance Officer Designation:</strong> Confirm the formal name, direct telephone, and email address of the appointed statutory Grievance Officer in Privacy Policy Section 10 and Terms Section 12.</li>
        <li><strong>Commercial Refund Parameters:</strong> Formally approve the cancellation notice window (24 hours), cooling-off duration (7 days), and commercial rules governing the "100% Satisfaction Guarantee".</li>
        <li><strong>Cross-Border Healthcare Transfers:</strong> Confirm data residency and telehealth licensing implications for referral clients residing in the United Arab Emirates under UAE Federal Law No. 2 of 2019.</li>
        <li><strong>Corporate Registration Credentials:</strong> Confirm corporate entity registration number (CIN / LLPIN) and registered office address.</li>
    </ol>
</div>
"""

DOCUMENTS = [
    {
        "filename": "01_DrFitVeda_Privacy_Policy_v0.1_DRAFT.pdf",
        "title": "Privacy Policy",
        "code": "DFV-LEG-POL-001",
        "body": PRIVACY_BODY,
    },
    {
        "filename": "02_DrFitVeda_Terms_and_Conditions_v0.1_DRAFT.pdf",
        "title": "Terms & Conditions",
        "code": "DFV-LEG-POL-002",
        "body": TERMS_BODY,
    },
    {
        "filename": "03_DrFitVeda_Cookie_Policy_v0.1_DRAFT.pdf",
        "title": "Cookie Policy",
        "code": "DFV-LEG-POL-003",
        "body": COOKIES_BODY,
    },
    {
        "filename": "04_DrFitVeda_Refund_and_Cancellation_Policy_v0.1_DRAFT.pdf",
        "title": "Refund & Cancellation Policy",
        "code": "DFV-LEG-POL-004",
        "body": REFUND_BODY,
    },
    {
        "filename": "05_DrFitVeda_Medical_and_Wellness_Disclaimer_v0.1_DRAFT.pdf",
        "title": "Medical, Fitness & Nutrition Disclaimer",
        "code": "DFV-LEG-POL-005",
        "body": DISCLAIMER_BODY,
    },
]

def generate_pdf_from_html(html_path, pdf_path):
    args = [
        BROWSER_EXE,
        "--headless",
        "--disable-gpu",
        f"--print-to-pdf={pdf_path}",
        "--no-pdf-header-footer",
        html_path
    ]
    subprocess.run(args, check=True)

def main():
    print("=" * 60)
    print("DR FIT VEDA - LEGAL & COMPLIANCE PDF GENERATOR")
    print(f"Browser Engine: {BROWSER_EXE}")
    print(f"Destination: {OUTPUT_DIR}")
    print("=" * 60)

    # 1. Generate Individual Policy PDFs
    for doc in DOCUMENTS:
        html_content = wrap_html(
            title=doc["title"],
            doc_code=doc["code"],
            effective_date="11 October 2026",
            body_content=doc["body"],
            signoff_title=f"Legal Counsel Sign-Off — {doc['title']}"
        )
        base_name = doc["filename"].replace(".pdf", "")
        html_path = os.path.join(OUTPUT_DIR, f"{base_name}.html")
        pdf_path = os.path.join(OUTPUT_DIR, doc["filename"])

        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        print(f"Generating PDF: {doc['filename']}...")
        generate_pdf_from_html(html_path, pdf_path)
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"  [OK] Created: {pdf_path} ({size_kb:.1f} KB)")

    # 2. Generate Master Combined Legal Package PDF
    master_body = MASTER_COVER
    for i, doc in enumerate(DOCUMENTS, 1):
        master_body += f"""
        <div class="page-break"></div>
        <div style="background: #0f766e; color: #ffffff; padding: 10px 16px; border-radius: 4px; margin-bottom: 20px;">
            <strong style="text-transform: uppercase; letter-spacing: 1px; font-size: 9pt;">Document {i:02d} of 05</strong>
            <div style="font-size: 15pt; font-weight: 700; margin-top: 4px;">{doc['title']}</div>
        </div>
        {doc['body']}
        """

    master_html = wrap_html(
        title="Complete Legal & Compliance Audit Package",
        doc_code="DFV-LEG-PKG-MASTER-001",
        effective_date="11 October 2026",
        body_content=master_body,
        signoff_title="Master Corporate Legal Counsel Package Sign-Off & Approval"
    )

    master_html_path = os.path.join(OUTPUT_DIR, "DrFitVeda_Complete_Legal_Compliance_Package_v0.1_DRAFT.html")
    master_pdf_path = os.path.join(OUTPUT_DIR, "DrFitVeda_Complete_Legal_Compliance_Package_v0.1_DRAFT.pdf")

    with open(master_html_path, "w", encoding="utf-8") as f:
        f.write(master_html)

    print("Generating Master Package PDF: DrFitVeda_Complete_Legal_Compliance_Package_v0.1_DRAFT.pdf...")
    generate_pdf_from_html(master_html_path, master_pdf_path)
    master_size_kb = os.path.getsize(master_pdf_path) / 1024
    print(f"  [OK] Created Master Package: {master_pdf_path} ({master_size_kb:.1f} KB)")

    print("\nAll 6 legal compliance PDFs generated successfully!")

if __name__ == "__main__":
    main()
