import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section } from '@/components/legal/LegalLayout'
import DataRequestForm from '@/components/legal/DataRequestForm'
import { LEGAL } from '@/lib/legal/config'

export const metadata: Metadata = {
  title: 'Data Requests (Draft) | Dr Fit Veda',
  description: 'Request access to, correction, export or deletion of your personal data, withdraw consent, or make a privacy complaint.',
}

export default function DataRequestPage() {
  return (
    <LegalLayout
      title="Your Data Requests"
      intro="Use this form to exercise your privacy rights. You can also email us at the address below."
    >
      <Section title="How it works">
        <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong>Submit</strong> the form. We record only what you enter here.</li>
          <li><strong>Verify:</strong> we contact you on the phone/email already on your account, or ask you to sign in. We never ask for your password or card number.</li>
          <li><strong>Action:</strong> we complete the request within 30 days [CONFIRM] and tell you the outcome.</li>
          <li><strong>Limits:</strong> we may need to keep some data (payment/tax records, clinical records we must retain, legal-claim records). We will tell you what was kept and why instead of promising total deletion. See the <Link href="/privacy">Privacy Policy</Link>.</li>
        </ol>
      </Section>

      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)' }}>
        <DataRequestForm />
      </div>

      <Section title="Prefer email?">
        <p>Write to <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> from the email address registered on your account.</p>
      </Section>
    </LegalLayout>
  )
}
