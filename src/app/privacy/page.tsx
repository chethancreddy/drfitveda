import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section, Table } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/lib/legal/config'

export const metadata: Metadata = {
  title: 'Privacy Policy (Draft) | Dr Fit Veda',
  description: 'How Dr Fit Veda collects, uses, stores, shares and protects personal and health data, and how to exercise your rights.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={`This policy explains how ${LEGAL.entityName} ("Dr Fit Veda", "we") handles personal data of visitors, customers and professionals on drfitveda.com and the Dr Fit Veda portals. It describes only data our platform is built to collect.`}
    >
      <Section title="1. Who is responsible">
        <p>
          {LEGAL.entityName} ({LEGAL.address}) decides why and how your personal data is processed (the &quot;data
          fiduciary&quot; under Indian law and &quot;controller&quot; under other laws). Contact:{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
        </p>
      </Section>

      <Section title="2. Data we collect, why, and how long we keep it">
        <Table
          head={['Data', 'Purpose', 'Where stored', 'Retention']}
          rows={[
            ['Account: name, phone, email, role, login identifiers', 'Create and secure your account; contact you about your service', 'Platform database (Supabase)', 'While your account is active, then up to [CONFIRM: 12 months] unless law requires longer'],
            ['Profile & lifestyle: date of birth, gender, height, weight, BMI, occupation, sleep, stress, activity, goals; women\'s wellness details (optional, restricted)', 'Let your care team prepare your plan', 'Platform database', 'While account active + [CONFIRM] period; clinical records per section 9'],
            ['Food profile: diet type, meals, allergies, restrictions', 'Prepare nutrition plans safely', 'Platform database', 'Same as profile'],
            ['Health documents you upload (lab reports, prescriptions, scans) and your notes', 'Doctor review and plan preparation', 'Private document storage / database', 'Until you delete them or your account closes, subject to section 9'],
            ['Consultation records: appointments, topics, doctor notes, recommendations, assessments, weekly reviews', 'Deliver and document care', 'Platform database', 'Per section 9 ([CONFIRM] clinical record period)'],
            ['Plans & tracking: diet/workout/yoga plans, daily check-ins, progress records, progress photos/videos you upload', 'Deliver, monitor and adjust your programme', 'Platform database / private storage', 'While account active + [CONFIRM]'],
            ['Session recordings (live training/consultations) where enabled for your plan', 'Replay and form review', 'Private storage with short-lived signed links', 'Only the latest recording is kept; the previous one is deleted after a grace period (default 24 hours, set by admin)'],
            ['Orders & payment records: plan, amount, currency, payment status, provider payment ID', 'Process and account for payments, refunds', 'Platform database; card details are handled by the payment provider, not stored by us', 'As required by tax/accounting law (typically 6–8 years in India) [CONFIRM]'],
            ['Contact enquiries: name, phone, health focus, optional message', 'Schedule and conduct consultation callbacks; triage health focus', 'Platform database (contact_inquiries, restricted to administrators via RLS)', 'Until enquiry is resolved, or up to [CONFIRM: 12 months]'],
            ['Consent records and privacy requests', 'Prove consent and handle your rights', 'Platform database', 'Consent: while relevant + 3 years; requests: 3 years after closure [CONFIRM]'],
            ['Security & audit logs, session cookie', 'Security, fraud prevention, accountability', 'Platform database', 'Audit logs [CONFIRM: 12–24 months]'],
          ]}
        />
        <p>
          <strong>Website enquiry form:</strong> When you submit the &quot;Request Consultation Callback&quot; form,
          we record your name, phone number, and primary health focus with your explicit consent so our medical
          coordinator can contact you. Please share clinical records or detailed medical histories only through your
          authenticated patient portal, not in open enquiry messages.
        </p>
        <p>
          We do not knowingly collect data beyond what is listed. We do not run advertising or analytics trackers
          at present (see the <Link href="/cookies">Cookie Policy</Link>).
        </p>
      </Section>

      <Section title="3. Legal bases and consent">
        <p>
          <strong>India:</strong> we process your data with your consent or for limited legitimate uses allowed by
          law (for example, to provide a service you requested, comply with law, or respond to a medical emergency).
          Health information is treated as sensitive personal data; we ask for your separate, explicit consent
          before you upload health documents or share health details, and for recording of sessions.
          Accepting the Terms &amp; Conditions is not treated as consent to every kind of processing. Marketing
          messages, if ever introduced, will need a separate optional consent that is never pre-ticked.
        </p>
        <p>
          <strong>UAE and EU/UK users:</strong> where those laws apply to you (see section 10), we rely on your
          explicit consent for health data, performance of our contract with you for service delivery, and legal
          obligation for records. You can withdraw consent at any time (see section 8); withdrawal does not affect
          earlier lawful processing, but we may no longer be able to provide services that need that data.
        </p>
      </Section>

      <Section title="4. Who we share data with">
        <p>We do not sell your personal or health data. We share it only as needed:</p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong>Your assigned care team</strong> (doctor, trainer, nutritionist, yoga professional) — access is limited by role to data needed for your care.</li>
          <li><strong>Platform administrators</strong> — limited operational and support access, logged.</li>
          <li><strong>Supabase</strong> — database, authentication and file storage (hosting region: [CONFIRM]).</li>
          <li><strong>Zoho Meeting</strong> — video sessions and live consultations; your name and email are used to provision meeting rooms and join links.</li>
          <li><strong>Razorpay</strong> — payment processing, if/when checkout is enabled; <strong>Resend</strong> — transactional email, if/when enabled. Both are configured in the codebase but not yet active. [CONFIRM]</li>
          <li><strong>Hosting provider</strong> (Vercel configuration present) — serves the website.</li>
          <li>Authorities, courts or professional regulators where legally required.</li>
        </ul>
        <p>Each provider acts under its own terms and privacy policy; data-processing agreements must be in place before launch [CONFIRM].</p>
      </Section>

      <Section title="5. International transfers">
        <p>
          Our providers may process data outside India (and outside the UAE for UAE customers). We will use
          contractual and technical safeguards and, where a country-specific rule restricts transferring health data
          abroad, we will take legal advice before transferring. The exact hosting regions are [CONFIRM].
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          Data is sent over encrypted connections (HTTPS). The database design restricts customer records by role and
          ownership, medical files are kept in private storage, recordings are served by short-lived signed links, and
          administrative actions are written to an audit log. No system is perfectly secure; if a breach affecting you
          occurs we will notify you and regulators as the law requires.
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          Our services are for adults aged {LEGAL.minimumAge} and over. We do not knowingly collect data from
          children. If you believe a child&apos;s data has been provided, contact us and we will delete it.
        </p>
      </Section>

      <Section title="8. Your rights and how to use them">
        <p>
          You may ask to <strong>access</strong>, <strong>correct</strong>, <strong>export</strong>, or{' '}
          <strong>delete</strong> your personal data, <strong>withdraw consent</strong>, or make a{' '}
          <strong>complaint</strong>. Use the <Link href="/data-request">data request form</Link> or email{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
        </p>
        <p>
          <strong>Verification:</strong> to protect you, we confirm identity before releasing or changing data — we
          contact you using the phone/email already on your account (not details typed in the request) and may ask you
          to sign in. We never ask for passwords or payment card numbers. Please do not put health data in the
          request form.
        </p>
        <p>
          <strong>Timing:</strong> we aim to acknowledge requests within 7 days and complete them within 30 days
          [CONFIRM], extending only where permitted and telling you why. Requests are free unless clearly excessive.
        </p>
        <p>
          <strong>Deletion limits:</strong> we cannot always delete everything. We must keep some records — for
          example payment and tax records, clinical/consultation records we are required to retain, and records
          needed to handle legal claims or fraud. Where we cannot delete, we will tell you what we are keeping and why,
          and restrict it from other use. Your right to complain to a regulator (in India, the Data Protection Board
          once operational; in the UAE, the UAE Data Office; in the EU, your local authority) is unaffected.
        </p>
      </Section>

      <Section title="9. Records we must keep">
        <p>
          Laws on medical/consultation records, taxes and accounting require us to retain some data for set periods
          (exact periods to be confirmed with counsel). After that period data is deleted or irreversibly anonymised.
        </p>
      </Section>

      <Section title="10. Which laws apply (summary of our assessment)">
        <Table
          head={['Law', 'Applies?', 'Reason / action']}
          rows={[
            ['India — Digital Personal Data Protection Act 2023 and Rules', 'Yes', 'We operate from India and process data of people in India. Rules are being phased in — track commencement dates.'],
            ['India — IT Act 2000 / SPDI Rules 2011', 'Yes', 'Health data is "sensitive personal data"; written consent and a published policy are required.'],
            ['India — Consumer Protection (E-Commerce) Rules 2020', 'Likely', 'Online sale of services: grievance officer, pricing and refund transparency.'],
            ['India — Telemedicine Practice Guidelines 2020', 'Counsel to confirm', 'Applies to registered medical practitioners; unclear for naturopathy/nutrition/fitness professionals.'],
            ['UAE — Federal Decree-Law 45/2021 (PDPL)', 'Likely for UAE-resident customers', 'We serve a few UAE customers referred by existing customers. Extra-territorial scope is plausible; executive regulations are still developing.'],
            ['UAE — health-data laws (e.g. Federal Law 2/2019 on ICT in health fields)', 'Counsel to confirm', 'May restrict storing/transferring UAE patients\' health data outside the UAE and may require licensing for health services.'],
            ['EU/UK GDPR and ePrivacy', 'Not currently', 'We do not target the EU/UK. Re-assess if EU/UK customers are accepted.'],
          ]}
        />
        <p>These are working assessments, not legal advice; a qualified lawyer must confirm them.</p>
      </Section>

      <Section title="11. Complaints">
        <p>
          Write to the Grievance Officer at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. We
          aim to acknowledge within 48 hours and resolve within 30 days [CONFIRM].
        </p>
      </Section>
    </LegalLayout>
  )
}
