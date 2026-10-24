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
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
        content: counter(page);
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    line-height: 1.55;
    font-size: 9.5pt;
    margin: 0;
    padding: 0;
}

.header-banner {
    border-bottom: 2.5px solid #0f766e;
    padding-bottom: 12px;
    margin-bottom: 20px;
}

.brand-title {
    font-size: 19pt;
    font-weight: 800;
    color: #0f766e;
    margin: 0 0 2px 0;
    letter-spacing: -0.5px;
}

.brand-sub {
    font-size: 8.5pt;
    color: #475569;
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 700;
}

.doc-meta {
    display: flex;
    justify-content: space-between;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #334155;
    margin-bottom: 16px;
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
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 10px 0;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 6px;
}

h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #0f766e;
    margin: 16px 0 6px 0;
    page-break-after: avoid;
}

p {
    margin: 0 0 8px 0;
}

ul, ol {
    margin: 0 0 10px 0;
    padding-left: 18px;
}

li {
    margin-bottom: 4px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
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
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
}

td {
    padding: 7px 9px;
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
    padding: 10px 12px;
    margin: 12px 0;
    font-size: 8.5pt;
    color: #78350f;
    border-radius: 0 4px 4px 0;
}

.confirm-box strong {
    color: #b45309;
}

.statute-tag {
    display: inline-block;
    background-color: #e0f2fe;
    color: #0369a1;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid #bae6fd;
    margin-bottom: 4px;
}

.signoff-box {
    margin-top: 28px;
    border: 1.5px solid #0f766e;
    background-color: #f0fdf4;
    border-radius: 6px;
    padding: 14px 18px;
    page-break-inside: avoid;
}

.signoff-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f766e;
    margin-bottom: 8px;
    border-bottom: 1px solid #a7f3d0;
    padding-bottom: 4px;
}

.signoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    font-size: 8.5pt;
}

.signoff-field {
    border-bottom: 1px dashed #64748b;
    padding-bottom: 3px;
    margin-top: 14px;
}

.signoff-label {
    font-weight: 600;
    color: #334155;
    font-size: 7.5pt;
    text-transform: uppercase;
}

.page-break {
    page-break-before: always;
}

.lead-text {
    font-size: 9.5pt;
    color: #334155;
    font-style: italic;
    background: #f8fafc;
    padding: 9px 12px;
    border-radius: 4px;
    border-left: 3px solid #0f766e;
    margin-bottom: 14px;
}
"""

def wrap_html(title, doc_code, effective_date, body_content, signoff_title="Indian Advocate / Legal Counsel Sign-Off"):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title} — Dr Fit Veda (India Compliance)</title>
    <style>
        {COMMON_CSS}
    </style>
</head>
<body>
    <div class="header-banner">
        <div class="brand-title">DR FIT VEDA</div>
        <div class="brand-sub">Holistic Health & Wellness Platform | Corporate Regulatory Compliance (India)</div>
        <div class="doc-meta">
            <div class="doc-meta-col">
                <strong>Operating Entity:</strong> Dr Fit Veda Holistic Health Services Ltd.<br>
                <strong>Principal Place of Business:</strong> Bangalore, Karnataka, India<br>
                <strong>Governing Law:</strong> Republic of India / Courts at Bangalore<br>
                <strong>Compliance Officer Contact:</strong> care@drfitveda.com
            </div>
            <div class="doc-meta-col" style="text-align: right;">
                <strong>Document Ref:</strong> {doc_code}<br>
                <strong>Status:</strong> <span class="status-tag">Draft For Advocate Approval</span><br>
                <strong>Effective / Review Date:</strong> {effective_date}<br>
                <strong>Jurisdiction:</strong> India (DPDP Act 2023, IT SPDI 2011, CPA 2019)
            </div>
        </div>
    </div>

    <h1>{title}</h1>

    {body_content}

    <div class="signoff-box">
        <div class="signoff-title">{signoff_title}</div>
        <p style="font-size: 8pt; color: #334155; margin-bottom: 8px;">
            By executing below, reviewing Advocate / Legal Counsel approves the terms, statutory disclosures, and compliance provisions set forth in this document as compliant with applicable Indian statutes (including DPDP Act 2023, IT Act 2000, CPA 2019, Telemedicine Guidelines 2020) for commercial publication on <strong>drfitveda.com</strong>.
        </p>
        <div class="signoff-grid">
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Advocate / Legal Counsel Name</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Bar Council Enrollment Number (State Bar)</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Law Chambers / Firm Name</div>
            </div>
            <div>
                <div class="signoff-field"></div>
                <div class="signoff-label">Review Date & Place</div>
            </div>
            <div style="grid-column: span 2;">
                <div class="signoff-field" style="margin-top: 18px;"></div>
                <div class="signoff-label">Advocate Signature & Official Seal</div>
            </div>
            <div style="grid-column: span 2; margin-top: 4px;">
                <div style="font-size: 8pt; color: #475569;">
                    <strong>Recommendation:</strong> &nbsp;&nbsp;
                    [ &nbsp; ] Approved without modification &nbsp;&nbsp;&nbsp;&nbsp;
                    [ &nbsp; ] Approved subject to confirmed modifications noted herein
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
    This Privacy Policy explains how Dr Fit Veda Holistic Health Services Ltd. ("Dr Fit Veda", "we", "us") collects, uses, stores, secures, and discloses personal data and Sensitive Personal Data or Information (SPDI) of visitors, registered clients, and healthcare professionals on drfitveda.com. It is formulated in strict accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules).
</div>

<div class="confirm-box">
    <strong>Advocate Review Checklist (Indian DPDP Act & IT SPDI Rules):</strong> Please review the items flagged <code>[CONFIRM]</code>, specifically: (1) Mandatory formal designation of the Indian Grievance Officer under Section 5 of the DPDP Act and Rule 5(9) of the SPDI Rules; (2) Data retention periods for clinical consultation records under the Telemedicine Practice Guidelines, 2020; and (3) Physical location of primary server infrastructure (confirming data storage within India).
</div>

<h2>1. Data Fiduciary Identity and Statutory Responsibility</h2>
<p>
    Dr Fit Veda Holistic Health Services Ltd., having its principal place of business at Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India, operates as the <strong>Data Fiduciary</strong> under Section 2(i) of the Digital Personal Data Protection Act, 2023. We determine the purpose and means of personal data processing. Contact: <strong>care@drfitveda.com</strong>.
</p>

<h2>2. Inventory of Data Collected, Purposes, and Retention Schedules</h2>
<p>
    In compliance with Section 5 of the DPDP Act and Rule 5 of the IT SPDI Rules, we collect only personal data necessary for specified and legitimate wellness services:
</p>
<table>
    <thead>
        <tr>
            <th style="width: 28%;">Data Category</th>
            <th style="width: 27%;">Lawful Purpose</th>
            <th style="width: 20%;">Storage & Security</th>
            <th style="width: 25%;">Retention Schedule (India)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Account Identifiers:</strong> Name, phone number, email address, role, secure authentication UUID.</td>
            <td>User account registration, multi-factor authentication, service notifications, customer care.</td>
            <td>PostgreSQL Database (Supabase instance with Row Level Security)</td>
            <td>While user account remains active, then up to <strong>[CONFIRM: 12 months]</strong> post-closure unless required longer by Indian tax or corporate statutes.</td>
        </tr>
        <tr>
            <td><strong>Lifestyle & Biometric Profiles:</strong> Date of birth, gender, height, weight, BMI, occupation, sleep cycles, stress score, activity level, health goals; women's wellness details (strictly restricted).</td>
            <td>Enable assigned multi-disciplinary care team (doctors, nutritionists, trainers) to formulate customised regimens.</td>
            <td>Encrypted Database (Role-restricted access)</td>
            <td>Duration of active wellness subscription + <strong>[CONFIRM]</strong> clinical record retention period.</td>
        </tr>
        <tr>
            <td><strong>Food & Dietary Profile:</strong> Diet preferences (Vegetarian, Vegan, Non-Veg), meal schedules, food allergies, intolerances, clinical restrictions.</td>
            <td>Formulate safe naturopathic diet plans and prevent adverse allergic reactions.</td>
            <td>Encrypted Database</td>
            <td>Active subscription duration + statutory record retention period.</td>
        </tr>
        <tr>
            <td><strong>Health Documents & Diagnostic Reports (SPDI):</strong> Uploaded blood lab tests, prescriptions, clinical imaging, medical notes.</td>
            <td>Doctor review, clinical evaluation, and health risk assessment.</td>
            <td>Private Encrypted Cloud Storage (Encrypted at rest)</td>
            <td>Retained until customer deletion or account termination, subject to mandatory medical record retention under Indian Telemedicine Guidelines.</td>
        </tr>
        <tr>
            <td><strong>Clinical Consultation Records:</strong> Appointment schedules, consultation topics, doctor assessment notes, dietary prescriptions, weekly clinical reviews.</td>
            <td>Document professional health care delivery and ensure continuity of clinical oversight.</td>
            <td>Restricted Database (Access limited to assigned doctor)</td>
            <td><strong>[CONFIRM: Minimum 3 years]</strong> as prescribed under the Telemedicine Practice Guidelines, 2020 issued by the National Medical Commission.</td>
        </tr>
        <tr>
            <td><strong>Exercise & Adherence Logs:</strong> Daily check-in metrics, workout logs, yoga adherence, uploaded progress media.</td>
            <td>Monitor client progress and iteratively adjust training regimens.</td>
            <td>Encrypted Database / Media Storage</td>
            <td>Active subscription duration + <strong>[CONFIRM: 3 years]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Live Training Session Recordings:</strong> Virtual 1-on-1 fitness coaching or yoga sessions where recording is explicitly opted into.</td>
            <td>Client form review, posture correction, and exercise replay.</td>
            <td>Private Storage accessible via short-lived, time-limited signed URLs</td>
            <td><strong>Single-Active Recording Architecture:</strong> Only the single latest recording is retained; prior sessions are queued for automated permanent deletion after a 24-hour grace period.</td>
        </tr>
        <tr>
            <td><strong>Financial & Billing Records:</strong> Subscription tier, invoice amount, currency (₹ INR), transaction timestamp, payment gateway reference ID.</td>
            <td>Reconciliation, subscription activation, GST tax invoicing, statutory financial audits.</td>
            <td>Platform Database (Card, UPI PIN, and banking credentials are handled entirely by RBI-licensed payment gateways; never stored by Dr Fit Veda)</td>
            <td><strong>8 Years</strong> as mandated under the Indian Income Tax Act, 1961 and Companies Act, 2013 <strong>[CONFIRM]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Contact Inquiries:</strong> Full name, phone number, health focus, callback message.</td>
            <td>Respond to user callback requests and consultation queries.</td>
            <td>Platform Database (Table: <code>contact_inquiries</code>)</td>
            <td>Retained for <strong>[CONFIRM: 90 days]</strong> post-resolution, then permanently expunged.</td>
        </tr>
        <tr>
            <td><strong>Consent Logs & DSR Records:</strong> Specific consent purpose, policy version, timestamp, DSR request tracking.</td>
            <td>Demonstrate evidentiary compliance with DPDP Act Section 6 and IT SPDI Rules.</td>
            <td>Platform Database (Append-only audit tables)</td>
            <td>Active duration + 3 years after closure of consent/request <strong>[CONFIRM]</strong>.</td>
        </tr>
        <tr>
            <td><strong>Security Audit Logs:</strong> Access logs, administrative action logs, session security tokens.</td>
            <td>Platform security, unauthorized access detection, incident investigation.</td>
            <td>Restricted Database</td>
            <td>Retained for <strong>[CONFIRM: 12 to 24 months]</strong>.</td>
        </tr>
    </tbody>
</table>

<h2>3. Consent Framework under DPDP Act 2023 and SPDI Rules 2011</h2>
<p>
    In accordance with Section 6 of the DPDP Act 2023, consent must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action:
</p>
<ul>
    <li><strong>Granular Affirmative Opt-In:</strong> The platform maintains distinct, non-pre-ticked opt-in checkboxes for: (a) Health document upload & sensitive health data processing; (b) Live session recording; and (c) Consultation inquiry callbacks.</li>
    <li><strong>Unbundled Terms:</strong> Acceptance of general commercial Terms & Conditions is never conflated with consent for medical data processing.</li>
    <li><strong>Right of Withdrawal:</strong> Clients have the statutory right to withdraw consent at any time via the client dashboard or by emailing our Grievance Officer. Withdrawal does not affect the lawfulness of processing conducted prior to withdrawal. Where withdrawal of consent renders it impossible to deliver health or training plans safely, services requiring such data may be terminated.</li>
</ul>

<h2>4. Third-Party Service Providers and Data Processing</h2>
<p>
    Dr Fit Veda does not sell, rent, or trade personal data. We engage contracted data processors solely to deliver platform functionality:
</p>
<ul>
    <li><strong>Assigned Care Professionals:</strong> Doctors, clinical nutritionists, and certified trainers. Access is strictly compartmentalised via database Row Level Security (RLS).</li>
    <li><strong>Cloud Database Infrastructure (Supabase):</strong> Hosting database engine and private file storage. <em>[CONFIRM: Cloud region, e.g., AWS Mumbai / ap-south-1].</em></li>
    <li><strong>Video Teleconsultation (Zoho Meeting):</strong> Integrated teleconsultation provider. Client name and email are transmitted strictly to provision encrypted video rooms.</li>
    <li><strong>Payment Gateway (Razorpay):</strong> Authorised payment aggregator licensed by the Reserve Bank of India (RBI). Processes payments under PCI-DSS compliance. <em>[CONFIRM]</em></li>
    <li><strong>Transactional Communications (Resend):</strong> System notifications, booking confirmations, OTP dispatch. <em>[CONFIRM]</em></li>
    <li><strong>Statutory Authorities:</strong> Disclosed only where mandatory under judicial warrant, police notice under Section 91 CrPC / BNSS, or statutory regulatory summons.</li>
</ul>

<h2>5. Domestic Data Storage and Sovereign Compliance</h2>
<p>
    Dr Fit Veda is an Indian corporate enterprise. Primary server infrastructure, databases, and customer records are hosted within the territory of India <em>[CONFIRM: Server hosting in Mumbai, India]</em>. Cross-border processing of data complies with central government notifications issued under Section 16 of the DPDP Act, 2023.
</p>

<h2>6. Technical and Organisational Security Measures</h2>
<p>
    In compliance with Section 8(5) of the DPDP Act and Rule 8 of the IT SPDI Rules (Reasonable Security Practices):
</p>
<ul>
    <li><strong>Encryption:</strong> All digital communications are encrypted in transit using TLS 1.3. Stored diagnostic documents and recordings reside in encrypted private storage buckets.</li>
    <li><strong>Access Isolation:</strong> Multi-tenant database separation enforced via PostgreSQL Row Level Security (RLS), ensuring no client can access another client's health records.</li>
    <li><strong>Temporary Media Links:</strong> Media recordings and clinical files are accessed exclusively via cryptographically signed, short-lived URLs expiring within minutes.</li>
    <li><strong>Security Incident Response:</strong> In the event of a personal data breach, Dr Fit Veda will notify the Data Protection Board of India and affected individuals in accordance with Section 8(6) of the DPDP Act.</li>
</ul>

<h2>7. Minors and Eligibility (Age of Majority)</h2>
<p>
    Pursuant to Section 9 of the DPDP Act and the Indian Contract Act, 1872, platform services are restricted to individuals aged <strong>18 years and above</strong>. Dr Fit Veda does not knowingly collect personal data from minors or conduct behavioural tracking of children. Accounts identified as belonging to an unauthorised minor will be terminated immediately and associated records expunged.
</p>

<h2>8. Statutory Data Principal Rights (DPDP Act, 2023)</h2>
<p>Registered clients ("Data Principals") enjoy the following enforceable rights under Chapter III of the DPDP Act:</p>
<ul>
    <li><strong>Right to Summary & Identity of Data Fiduciaries (Section 11):</strong> Request a summary of personal data processed and identities of all entities with whom data has been shared.</li>
    <li><strong>Right to Correction & Erasure (Section 12):</strong> Request correction of inaccurate data, completion of incomplete records, or erasure of personal data that is no longer necessary for the original purpose.</li>
    <li><strong>Right of Grievance Redressal (Section 13):</strong> Right to have grievances redressed by the Data Fiduciary within the prescribed timeline before escalating to the Data Protection Board.</li>
    <li><strong>Right to Nominate (Section 14):</strong> Right to nominate another individual to exercise data rights in the event of death or incapacity.</li>
</ul>
<p>
    <strong>How to Exercise:</strong> Data Principals may exercise these rights via the dedicated Data Subject Request portal at <code>drfitveda.com/data-request</code> or by writing to <strong>care@drfitveda.com</strong>.
</p>

<h2>9. Mandatory Indian Grievance Redressal Mechanism</h2>
<p>
    In strict compliance with Section 5 of the DPDP Act, 2023, Rule 5(9) of the IT SPDI Rules, 2011, and the Consumer Protection (E-Commerce) Rules, 2020, Dr Fit Veda has appointed an Indian Grievance Officer:
</p>
<div style="background: #f8fafc; border: 1.5px solid #0f766e; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 8.5pt;">
    <strong>Statutory Grievance Officer:</strong> [CONFIRM: Name of Appointed Indian Resident Officer]<br>
    <strong>Designation:</strong> Data Protection & Grievance Officer<br>
    <strong>Corporate Entity:</strong> Dr Fit Veda Holistic Health Services Ltd.<br>
    <strong>Office Address:</strong> Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India<br>
    <strong>Dedicated Grievance Email:</strong> grievance@drfitveda.com / care@drfitveda.com<br>
    <strong>Acknowledgment Timeline:</strong> Within 48 hours of receipt<br>
    <strong>Resolution Timeline:</strong> Within 30 days of receipt (as mandated by Indian IT / E-Commerce Rules) [CONFIRM]
</div>
"""

# 2. Terms and Conditions
TERMS_BODY = """
<div class="lead-text">
    These Terms & Conditions constitute a legally binding electronic contract executed under the provisions of the Indian Contract Act, 1872, the Information Technology Act, 2000, and the Consumer Protection (E-Commerce) Rules, 2020. They govern your access to and use of drfitveda.com and associated digital health and wellness portals.
</div>

<div class="confirm-box">
    <strong>Advocate Review Checklist (Indian Contract Law & E-Commerce Rules):</strong> Please review: (1) Pricing GST disclosure and tax status (Section 5); (2) Commercial liability limitation cap (Section 10); and (3) Dispute resolution forum, confirming exclusive jurisdiction of Courts in Bangalore, Karnataka (Section 12).
</div>

<h2>1. Contracting Parties and Electronic Execution</h2>
<p>
    This agreement is entered into between <strong>Dr Fit Veda Holistic Health Services Ltd.</strong>, a company incorporated under the laws of India, having its principal place of business at Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India ("Dr Fit Veda", "we", "us"), and the registered user ("Client", "you").
</p>
<p>
    By registering an account, purchasing a wellness membership, or booking a clinical consultation, you agree to be bound by these Terms. This electronic record is generated by a computer system and does not require physical signatures pursuant to Section 10A of the Information Technology Act, 2000.
</p>

<h2>2. Eligibility and Capacity to Contract</h2>
<p>
    You affirm that you are at least <strong>18 years of age</strong> and possess full legal capacity to enter into a binding contract under Section 11 of the Indian Contract Act, 1872. You agree to provide true, current, and accurate disclosures during intake. Accounts are personal, non-transferable, and non-assignable.
</p>

<h2>3. Scope of Digital Health, Naturopathy, and Fitness Services</h2>
<p>
    Dr Fit Veda provides doctor-guided naturopathy consultations, dietary planning, yoga therapy, and personal fitness training delivered via digital tools. All services are wellness, lifestyle modification, and supportive health programmes.
</p>
<p>
    <strong>Emergency Care Exclusion:</strong> The platform does not deliver emergency medical services, ICU care, acute trauma management, or hospital care. Complete clinical boundaries are set forth in our Medical, Fitness & Nutrition Disclaimer.
</p>

<h2>4. Virtual Sessions and Video Recording Policies</h2>
<ul>
    <li>All live virtual sessions are conducted via our integrated video provider, <strong>Zoho Meeting</strong>.</li>
    <li><strong>Consent for Recording:</strong> Live fitness training sessions are recorded only where client explicit consent is recorded. A client may revoke recording consent at any time without terminating live access.</li>
    <li><strong>Strict Privacy Architecture:</strong> To prevent data proliferation, only the single latest recording is maintained in client storage; prior sessions are permanently deleted after a 24-hour grace period.</li>
    <li><strong>Intellectual Property & Non-Recording:</strong> Clients shall not record, capture, screen-record, screenshot, or distribute sessions or training materials without prior written consent.</li>
</ul>

<h2>5. Pricing, Invoicing, and Statutory Taxes (GST)</h2>
<p>
    All prices on drfitveda.com are denominated in <strong>Indian Rupees (₹ INR)</strong>. <em>[CONFIRM: Whether listed package prices are inclusive of 18% Goods and Services Tax (GST) under Indian tax laws].</em> Invoices reflecting applicable GSTIN details are issued upon transaction completion.
</p>
<p>
    <strong>No Auto-Debit / Dark Patterns:</strong> In compliance with Consumer Protection (E-Commerce) Rules, 2020, memberships are fixed-term contracts paid in advance and do not renew automatically without explicit affirmative authorization.
</p>

<h2>6. Client Health Disclosures and Adherence Obligations</h2>
<ul>
    <li>Clients are legally obligated to provide complete and accurate medical histories, current prescription medications, clinical diagnoses, and physiological limitations.</li>
    <li>Clients must immediately notify their assigned care team of any emerging medical condition, surgery, acute pain, or pregnancy, and immediately cease any physical movement causing pain.</li>
    <li>Clients shall not submit forged medical documents or diagnostic records belonging to other individuals without lawful authority.</li>
</ul>

<h2>7. Prohibited Platform Conduct</h2>
<p>
    Clients shall not: (a) reverse-engineer, decompile, scrape, or extract platform software; (b) introduce malicious code, bots, or automated scrapers; (c) verbally abuse, harass, or demean healthcare professionals or fitness trainers; (d) use consultation services for defamatory, fraudulent, or unlawful purposes under the Indian Penal Code / Bharatiya Nyaya Sanhita. Violations will result in immediate termination of account access and referral to authorities where appropriate.
</p>

<h2>8. Intellectual Property and Proprietary Rights</h2>
<p>
    All diet formulations, yoga sequences, proprietary software, design layouts, and trademarks are the exclusive intellectual property of Dr Fit Veda Holistic Health Services Ltd., protected under the Indian Copyright Act, 1957 and Trade Marks Act, 1999. Clients are granted a limited, personal, revocable, non-exclusive licence for personal wellness consumption.
</p>

<h2>9. Data Privacy and Regulatory Rights</h2>
<p>
    All processing of personal and health data is governed by our Privacy Policy in compliance with the DPDP Act 2023. Data Subject Requests for access, correction, or erasure may be initiated at <code>drfitveda.com/data-request</code>.
</p>

<h2>10. Limitation of Liability and Statutory Warranties</h2>
<p>
    Nothing in these Terms limits liability for gross negligence, willful misconduct, or personal injury that cannot be limited under applicable Indian consumer jurisprudence. Subject to statutory limitations, Dr Fit Veda and its contracted professionals shall not be liable for indirect, incidental, or consequential damages resulting from platform use.
</p>
<p>
    <strong>Liability Cap:</strong> <em>[CONFIRM: Total aggregate liability for commercial claims under this agreement shall be capped at the total subscription fees actually paid by the client to Dr Fit Veda in the twelve (12) months preceding the claim].</em>
</p>

<h2>11. Service Availability and Modifications</h2>
<p>
    We reserve the right to upgrade or modify platform features with reasonable advance notice. Where a prepaid service is permanently discontinued prior to full utilization, a pro-rata refund for the unconsumed duration will be disbursed pursuant to our Refund Policy.
</p>

<h2>12. Governing Law, Dispute Resolution, and Jurisdiction</h2>
<p>
    This electronic agreement is governed by and construed in accordance with the substantive laws of the <strong>Republic of India</strong>. All legal disputes, claims, or proceedings arising out of this agreement shall be subject to the exclusive jurisdiction of the competent civil courts situated at <strong>Bangalore, Karnataka, India</strong>, following prior informal escalation to our Grievance Officer. <em>[CONFIRM with legal counsel].</em>
</p>

<h2>13. Modifications to Agreement</h2>
<p>
    We will provide at least 15 days' advance notification of material amendments to these Terms via email or prominent platform banners. Continued use of the platform after the effective date of revised terms constitutes acceptance thereof.
</p>
"""

# 3. Cookie Policy
COOKIES_BODY = """
<div class="lead-text">
    This Cookie Policy details the use of browser cookies and local storage technologies on drfitveda.com. It is based on a technical audit of the active Next.js production codebase and aligns with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
</div>

<div class="confirm-box">
    <strong>Advocate Review Checklist (Indian IT & Privacy Regulations):</strong> Please confirm our technical assessment that because the platform deploys strictly necessary first-party cookies and zero third-party advertising/tracking cookies, an intrusive consent popup banner is not mandated under Indian law.
</div>

<h2>1. Zero-Tracking Commitment and Architectural Summary</h2>
<p>
    Dr Fit Veda operates on a strict privacy-first foundation. The platform deploys <strong>only strictly necessary, functional first-party cookies</strong> required to authenticate users, enforce role-based access control, and protect against cross-site request forgery.
</p>
<p>
    <strong>Absence of Third-Party Advertising & Behavioural Pixels:</strong> We do not deploy third-party advertising networks, behavioural retargeting trackers (e.g., Meta Pixel, Google Ads remarketing), commercial beacons, or browser fingerprinting scripts. Because functional security cookies do not track user behaviour across external websites and are essential to deliver requested digital services, a separate cookie consent banner is not mandated under Indian privacy and IT regulations.
</p>

<h2>2. Complete Inventory of Active Cookies</h2>
<table>
    <thead>
        <tr>
            <th style="width: 25%;">Cookie Identifier</th>
            <th style="width: 35%;">Technical Purpose</th>
            <th style="width: 15%;">Classification</th>
            <th style="width: 12%;">Duration</th>
            <th style="width: 13%;">Issuer</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>drf_session</code></td>
            <td>Maintains encrypted session state, verifies authenticated user role (customer, doctor, trainer, admin), and protects against session hijacking. Configured with <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Lax</code> flags.</td>
            <td>Strictly Necessary</td>
            <td>7 Days</td>
            <td>Dr Fit Veda (First-Party)</td>
        </tr>
        <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>Manages secure authentication handshakes and token refresh cycles with the Supabase database instance.</td>
            <td>Strictly Necessary</td>
            <td>Session / Refresh cycle</td>
            <td>Dr Fit Veda / Supabase</td>
        </tr>
    </tbody>
</table>

<h2>3. Self-Hosted Static Assets and Third-Party IP Isolation</h2>
<p>
    To eliminate passive tracking and IP address leakage, all web typography (Nunito Sans) is self-hosted directly from our first-party origin (<code>/fonts/</code>). No connections are established with Google Fonts servers. All UI icons, sample video demonstrations, and SVG assets are served directly from our origin server.
</p>
<p>
    When a customer joins an encrypted teleconsultation or live training session via Zoho Meeting, the connection is handed off to Zoho's video bridge, whereupon Zoho's independent security policies govern the real-time media transmission.
</p>

<h2>4. Browser Management and Deletion</h2>
<p>
    Users can inspect, delete, or block cookies through browser preferences. However, disabling strictly necessary cookies will inhibit user login and prevent access to the authenticated customer and professional dashboards.
</p>
"""

# 4. Cancellation & Non-Refund Policy
REFUND_BODY = """
<div class="lead-text">
    This Cancellation & Non-Refund Policy sets forth the commercial terms and conditions governing digital membership subscriptions and standalone clinical/wellness consultations offered on drfitveda.com. All purchases are strictly non-refundable, as set forth herein, pursuant to the Indian Contract Act, 1872 and the Consumer Protection (E-Commerce) Rules, 2020.
</div>

<div class="confirm-box">
    <strong>Advocate Review Checklist (Indian Consumer Protection & E-Commerce Law):</strong> Please confirm that our strict non-refundable policy is legally compliant under Indian law when clearly and conspicuously disclosed prior to payment, and approve the removal/redefinition of any conflicting promotional claims (e.g., "100% Satisfaction Guarantee") to prevent exposure under the Consumer Protection Act, 2019.
</div>

<h2>1. Strictly Non-Refundable Commercial Policy</h2>
<p>
    Dr Fit Veda delivers personalized lifestyle modification regimens, multi-disciplinary professional care (doctors, nutritionists, yoga therapists, fitness coaches), and dedicated consultation slots. Due to the customized allocation of professional time, proprietary diet plans, and infrastructure resources upon subscription:
</p>
<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 10px 14px; margin: 12px 0; font-size: 9pt; color: #991b1b; border-radius: 0 4px 4px 0;">
    <strong>MANDATORY NON-REFUNDABLE NOTICE:</strong> All subscription fees, membership packages, and consultation fees paid to Dr Fit Veda are <strong>strictly non-refundable and non-transferable under any circumstances</strong> once the transaction is completed. By making a payment, you expressly acknowledge and agree that no refunds, credits, or chargebacks will be issued for partially used, unused, or abandoned subscriptions.
</div>

<h2>2. Standalone Consultations: Rescheduling vs. Monetary Refund</h2>
<ul>
    <li><strong>Rescheduling Guidelines:</strong> Clients may reschedule an upcoming scheduled consultation (Yoga Doctor, PCOD Specialist, Wellness Doctor) without penalty by providing at least <strong>24 hours' prior written notice</strong> via the client dashboard or email to <strong>care@drfitveda.com</strong>. The booking credit will be transferred to a mutually agreeable available slot.</li>
    <li><strong>Late Cancellations & No-Shows:</strong> Cancellations made with less than 24 hours' notice, or failure to attend a scheduled video session ("no-show"), will result in immediate forfeiture of the consultation session with <strong>zero monetary refund or credit</strong>.</li>
    <li><strong>Cancellations Initiated by Dr Fit Veda:</strong> In the rare event that an assigned healthcare professional is unavailable due to sudden illness, technical emergency, or outage, Dr Fit Veda will provide an expedited rescheduled slot at the client's earliest convenience.</li>
</ul>

<h2>3. Sole Technical Exceptions to Non-Refundable Rule</h2>
<p>
    In compliance with statutory electronic transaction guidelines, monetary refunds are disbursed strictly and solely under the following verified technical anomalies:
</p>
<ul>
    <li><strong>Duplicate / Erroneous Billing:</strong> Where a verified technical glitch causes multiple identical charges for a single order transaction.</li>
    <li><strong>Payment Gateway Deduction without Service Creation:</strong> Where funds are debited from the client's bank account / card / UPI, but technical failure prevents user account creation or service activation on Dr Fit Veda.</li>
</ul>
<p>
    In such instances, verified duplicate or un-activated debits will be reversed to the original payment instrument within <strong>5 to 7 business days</strong> via our RBI-licensed payment gateway.
</p>

<h2>4. Mid-Term Discontinuation and Account Termination</h2>
<p>
    Clients may discontinue participation in a wellness programme at any time. However, voluntary mid-term discontinuation, relocation, change of personal schedule, or unilateral cessation of adherence does not entitle the client to any pro-rata refund or monetary reimbursement for the remaining contract duration.
</p>

<h2>5. Promotional Claims and Satisfaction Warranties (Consumer Protection Act)</h2>
<p>
    Dr Fit Veda delivers doctor-guided lifestyle guidance. Because biological outcomes, metabolic responses, and weight changes depend substantially on individual genetics, underlying pathologies, and daily adherence, <strong>Dr Fit Veda does not guarantee specific clinical or weight-loss results</strong>. Any promotional marketing reference to a "Satisfaction Guarantee" refers exclusively to our professional commitment to deliver scheduled consultations and customized regimens, and does <strong>not</strong> confer any contractual right to a monetary refund.
</p>

<h2>6. Grievance Redressal and Contact</h2>
<p>
    For any billing disputes or payment verification inquiries, write to <strong>care@drfitveda.com</strong>. Unresolved billing discrepancies may be escalated to our statutory Grievance Officer: <strong>[CONFIRM: grievance@drfitveda.com]</strong>.
</p>
"""

# 5. Medical Disclaimer
DISCLAIMER_BODY = """
<div class="lead-text">
    This Medical, Fitness & Nutrition Disclaimer sets forth the clinical boundaries, emergency exclusions, and risk warnings governing guidance provided through drfitveda.com. It is formulated in accordance with the Telemedicine Practice Guidelines, 2020 (issued by the National Medical Commission), professional codes of medical ethics, and the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954.
</div>

<div class="confirm-box">
    <strong>Advocate Review Checklist (Medical & Advertising Compliance):</strong> Please review the disclaimer terms for compliance with Indian Telemedicine Guidelines and confirm that advertising copy conforms to the statutory prohibitions under the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954.
</div>

<h2>1. Supportive Wellness Guidance — Strict Exclusion of Emergency Care</h2>
<p>
    Dr Fit Veda provides doctor-guided naturopathy consultations, dietary lifestyle planning, yoga therapy, and fitness training delivered through electronic media. Services provided on this platform constitute <strong>supportive wellness and lifestyle guidance only</strong>.
</p>
<p>
    <strong>Not an Emergency Medical Service:</strong> This platform is strictly not an emergency medical facility, critical care service, or hospital. It does not replace physical, in-person clinical diagnosis, clinical examination, pathology verification, or emergency hospital admission by a licensed primary care physician. Never ignore, disregard, or delay obtaining professional in-person medical advice because of recommendations or information received through this platform.
</p>

<h2>2. Emergency Medical Protocol (Immediate Action Required)</h2>
<p>
    If you or someone under your care experiences acute, critical, or life-threatening symptoms — including crushing chest pain or pressure, severe shortness of breath, sudden numbness, loss of consciousness, uncontrolled hemorrhage, symptoms of stroke, acute allergic anaphylaxis, or psychiatric crisis — <strong>immediately contact emergency emergency services or proceed to the nearest hospital emergency room</strong>:
</p>
<div style="background: #fef2f2; border: 1.5px solid #dc2626; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 9pt; color: #991b1b;">
    <strong>National Emergency Number (India):</strong> Dial <strong>112</strong><br>
    <strong>Ambulance Emergency Helpline (India):</strong> Dial <strong>108</strong> / <strong>102</strong><br>
    <strong>Immediate Hospital Transfer:</strong> Transport the patient immediately to the nearest tertiary hospital casualty / emergency department.
</div>

<h2>3. Pre-Existing Clinical Conditions and Treating Physician Clearance</h2>
<p>
    Clients are legally and medically obligated to seek prior written clearance from their primary treating medical doctor before commencing any wellness or fitness regimen if they:
</p>
<ul>
    <li>Have diagnosed cardiovascular, endocrine, renal, hepatic, or metabolic disorders (including Type 1/Type 2 Diabetes, Hypertension, Coronary Artery Disease, Thyroid disease, Chronic Kidney Disease, PCOD/PCOS);</li>
    <li>Take daily prescription medications, including insulin, oral hypoglycaemics, antihypertensives, anticoagulants, or psychiatric medications;</li>
    <li>Are pregnant, planning pregnancy, breastfeeding, recovering from surgical procedures, or managing eating disorders;</li>
    <li>Are over the age of 60 and commencing physical training for the first time.</li>
</ul>
<p>
    <strong>Prescription Medication Inviolability:</strong> Never adjust, taper, reduce, or stop prescription medications or clinical therapies without the express written direction of your treating licensed physician.
</p>

<h2>4. Physical Fitness and Yoga Asana Safety</h2>
<p>
    Physical exercise, movement rehabilitation, and yoga asanas carry inherent physiological risks of muscle sprain, joint strain, ligament tear, or cardiovascular stress. Clients must exercise in a clear, hazard-free physical environment, maintain proper hydration, adhere strictly to trainer instructions, and immediately cease any activity that causes sharp pain, dizziness, or chest discomfort.
</p>

<h2>5. Nutritional Plans and Allergen Disclosures</h2>
<p>
    Nutritional regimens are formulated based exclusively on client-provided dietary disclosures. Clients bear sole responsibility for verifying all meal recommendations against personal allergies, food intolerances, and clinical restrictions. Herbal or nutritional supplements must be cleared with treating doctors to avoid drug-nutrient cross-interactions.
</p>

<h2>6. Non-Guarantee of Biological Outcomes (DMR Act Compliance)</h2>
<p>
    In compliance with the Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954 and ASCI Guidelines, Dr Fit Veda explicitly clarifies that physiological responses vary widely across individuals. <strong>Dr Fit Veda makes no claim, promise, or guarantee of complete disease cure, permanent reversal of chronic metabolic illnesses, or specific kilograms of weight loss.</strong> Testimonials on the website describe individual experiences and do not represent guaranteed or typical outcomes.
</p>

<h2>7. Artificial Intelligence and Professional Standards</h2>
<p>
    The platform does not deploy autonomous generative artificial intelligence to issue medical diagnoses or generate prescriptions. All health consultations and regimens are evaluated and prepared by qualified human professionals (BNYS Naturopathic Doctors, certified nutritionists, certified yoga therapists, and fitness coaches). All professionals are required to maintain valid registrations and adhere to professional standards.
</p>
"""

# Master Package Executive Cover and Index
MASTER_COVER = """
<div style="text-align: center; padding: 35px 0 25px 0; border-bottom: 2.5px solid #0f766e;">
    <div style="font-size: 24pt; font-weight: 800; color: #0f766e; letter-spacing: -0.5px; margin-bottom: 6px;">DR FIT VEDA</div>
    <div style="font-size: 12pt; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Corporate Legal & Regulatory Compliance Dossier (India)</div>
    <div style="font-size: 9.5pt; color: #64748b;">Comprehensive Legal Governance Policies Prepared for Review, Approval, and Execution by Indian Advocate</div>
    <div style="margin-top: 14px;">
        <span class="status-tag" style="font-size: 8.5pt; padding: 4px 12px;">Version 0.2-DRAFT (Statutory Indian Jurisprudence Scope)</span>
    </div>
</div>

<div style="margin: 25px 0; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px;">
    <h2 style="margin-top: 0; color: #0f766e; font-size: 11pt;">Executive Legal Context & Regulatory Alignment</h2>
    <p style="font-size: 9pt; color: #334155; margin-bottom: 8px;">
        This document bundle contains the complete, authoritative legal policies and regulatory governance frameworks drafted for <strong>Dr Fit Veda Holistic Health Services Ltd.</strong> (operating <strong>drfitveda.com</strong>).
    </p>
    <p style="font-size: 9pt; color: #334155; margin-bottom: 0;">
        <strong>Jurisdictional Mandate:</strong> Dr Fit Veda is an Indian corporate enterprise. All company registrations, digital service transactions, customer contracts, personal data processing, and compliance protocols are governed primarily and strictly by <strong>applicable laws of the Republic of India and Government of India regulations</strong>. Foreign legal regimes are not presumed to apply merely due to the geographical location of visitors or referral clients.
    </p>
</div>

<h2>Statutory Matrix & Governing Indian Laws</h2>
<table>
    <thead>
        <tr>
            <th style="width: 28%;">Statutory Legislation</th>
            <th style="width: 27%;">Regulatory Authority</th>
            <th style="width: 25%;">Compliance Governance Scope</th>
            <th style="width: 20%;">Implementation Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong></td>
            <td>Data Protection Board of India / MeitY</td>
            <td>Data Fiduciary notice, consent logs, Data Principal rights, breach reporting</td>
            <td><strong>Implemented in Policies & DB</strong></td>
        </tr>
        <tr>
            <td><strong>Information Technology Act, 2000 & SPDI Rules, 2011</strong></td>
            <td>Ministry of Electronics and Information Technology (MeitY)</td>
            <td>Sensitive personal data protection, mandatory Grievance Officer, security practices</td>
            <td><strong>Implemented in Policies & System</strong></td>
        </tr>
        <tr>
            <td><strong>Consumer Protection Act, 2019 & E-Commerce Rules, 2020</strong></td>
            <td>Central Consumer Protection Authority (CCPA)</td>
            <td>Transparent pricing, no dark patterns, cancellation & refund rules, unfair trade practice bar</td>
            <td><strong>Implemented in Terms & Refund</strong></td>
        </tr>
        <tr>
            <td><strong>Telemedicine Practice Guidelines, 2020</strong></td>
            <td>National Medical Commission (NMC) / Ministry of AYUSH</td>
            <td>RMP digital consultation norms, record-keeping, non-emergency care boundaries</td>
            <td><strong>Implemented in Disclaimer</strong></td>
        </tr>
        <tr>
            <td><strong>Drugs & Magic Remedies (Objectionable Advertisements) Act, 1954</strong></td>
            <td>Ministry of Health and Family Welfare</td>
            <td>Prohibition of misleading medical claims, non-guarantee of chronic condition cure</td>
            <td><strong>Implemented in Disclaimer & Audit</strong></td>
        </tr>
        <tr>
            <td><strong>Indian Contract Act, 1872 & IT Act §10A</strong></td>
            <td>Judicial Courts of India</td>
            <td>Valid electronic agreement formation, age of majority (18+), exclusive Bangalore forum</td>
            <td><strong>Implemented in Terms</strong></td>
        </tr>
    </tbody>
</table>

<div class="confirm-box" style="margin-top: 20px;">
    <h3 style="margin: 0 0 6px 0; color: #b45309; font-size: 10pt;">Advocate Review Action Items (Checklist of [CONFIRM] Tags):</h3>
    <ol style="margin: 0; padding-left: 18px; font-size: 8.5pt; color: #78350f;">
        <li><strong>Grievance Officer Designation:</strong> Review and insert the formal name, physical office address, and contact telephone/email of the appointed Indian Grievance Officer in Privacy Policy §9 and Terms §12 (mandatory under DPDP Act §5 and IT SPDI Rule 5(9)).</li>
        <li><strong>Commercial Non-Refund Policy:</strong> Confirm that the strict non-refundable terms meet statutory disclosure mandates under the Consumer Protection (E-Commerce) Rules, 2020 and approve the redefinition of any conflicting promotional satisfaction guarantees.</li>
        <li><strong>Clinical Record Retention Duration:</strong> Confirm exact mandatory preservation period for consultation clinical records under the Telemedicine Practice Guidelines, 2020 (recommended: 3 years).</li>
        <li><strong>Tax & GST Disclosures:</strong> Confirm corporate GSTIN registration details and whether stated prices are inclusive of 18% GST.</li>
    </ol>
</div>
"""

DOCUMENTS = [
    {
        "filename": "01_DrFitVeda_Privacy_Policy_India_DRAFT.pdf",
        "title": "Privacy Policy",
        "code": "DFV-IND-POL-001",
        "body": PRIVACY_BODY,
    },
    {
        "filename": "02_DrFitVeda_Terms_and_Conditions_India_DRAFT.pdf",
        "title": "Terms & Conditions",
        "code": "DFV-IND-POL-002",
        "body": TERMS_BODY,
    },
    {
        "filename": "03_DrFitVeda_Cookie_Policy_India_DRAFT.pdf",
        "title": "Cookie Policy",
        "code": "DFV-IND-POL-003",
        "body": COOKIES_BODY,
    },
    {
        "filename": "04_DrFitVeda_Cancellation_and_Non_Refund_Policy_India_DRAFT.pdf",
        "title": "Cancellation & Non-Refund Policy",
        "code": "DFV-IND-POL-004",
        "body": REFUND_BODY,
    },
    {
        "filename": "05_DrFitVeda_Medical_and_Wellness_Disclaimer_India_DRAFT.pdf",
        "title": "Medical, Fitness & Nutrition Disclaimer",
        "code": "DFV-IND-POL-005",
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
    print("DR FIT VEDA - INDIAN LAW COMPLIANCE PDF GENERATOR")
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
            signoff_title=f"Indian Advocate Sign-Off -- {doc['title']}"
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
            <strong style="text-transform: uppercase; letter-spacing: 1px; font-size: 8.5pt;">Document {i:02d} of 05 -- Indian Statutory Scope</strong>
            <div style="font-size: 14pt; font-weight: 700; margin-top: 4px;">{doc['title']}</div>
        </div>
        {doc['body']}
        """

    master_html = wrap_html(
        title="Complete Corporate Legal & Compliance Dossier",
        doc_code="DFV-IND-PKG-MASTER-001",
        effective_date="11 October 2026",
        body_content=master_body,
        signoff_title="Master Corporate Legal Counsel Package Sign-Off & Approval (India)"
    )

    master_html_path = os.path.join(OUTPUT_DIR, "DrFitVeda_Indian_Law_Compliance_Package_v0.2_DRAFT.html")
    master_pdf_path = os.path.join(OUTPUT_DIR, "DrFitVeda_Indian_Law_Compliance_Package_v0.2_DRAFT.pdf")

    with open(master_html_path, "w", encoding="utf-8") as f:
        f.write(master_html)

    print("Generating Master Package PDF: DrFitVeda_Indian_Law_Compliance_Package_v0.2_DRAFT.pdf...")
    generate_pdf_from_html(master_html_path, master_pdf_path)
    master_size_kb = os.path.getsize(master_pdf_path) / 1024
    print(f"  [OK] Created Master Package: {master_pdf_path} ({master_size_kb:.1f} KB)")

    print("\nAll 6 Indian Law compliance PDFs generated successfully!")

if __name__ == "__main__":
    main()
