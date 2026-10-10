import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/lib/legal/config'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy (Draft) | Dr Fit Veda',
  description: 'When and how you can cancel a Dr Fit Veda membership or consultation and receive a refund.',
}

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      intro="This policy describes how cancellations and refunds work for memberships and consultations. The business has not yet finalised its commercial refund rules; items marked [CONFIRM] are placeholders and must be decided by management before launch."
    >
      <Section title="1. What you pay for">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong>Memberships</strong> are fixed-term plans (durations and prices are shown on the <Link href="/memberships">memberships page</Link> and at purchase) paid in advance. The platform does not renew them automatically.</li>
          <li><strong>Separate consultations</strong> (for example Yoga, PCOD/PCOS and Wellness) are paid per session; the price and duration are shown when you book.</li>
          <li>Prices are in ₹ INR [CONFIRM tax treatment and currency for UAE customers].</li>
        </ul>
      </Section>

      <Section title="2. Cancelling">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li><strong>Membership:</strong> email {LEGAL.supportEmail} to cancel at any time. Cancellation stops future sessions; refunds follow section 3.</li>
          <li><strong>Consultation:</strong> you may reschedule or cancel up to [CONFIRM: 24] hours before the start time for a full refund or credit. Later cancellations and no-shows: [CONFIRM].</li>
          <li>If we or the professional cancel or cannot deliver a session, we will reschedule it or refund it, at your choice.</li>
        </ul>
      </Section>

      <Section title="3. Refunds">
        <p>You are entitled to a refund in these situations:</p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>You were charged twice or the wrong amount, or a payment succeeded but no service was activated.</li>
          <li>We cannot provide the service you paid for (for example, no suitable professional is available), or we discontinue the service.</li>
          <li>You cancel within [CONFIRM: cooling-off period, e.g. 7 days] of purchase and have not used more than [CONFIRM: number] sessions — refund of the fee less the value of sessions already delivered.</li>
          <li>Where consumer law in your country gives you a statutory right, that right applies.</li>
        </ul>
        <p>
          <strong>Mid-term cancellation:</strong> [CONFIRM: pro-rata refund of the unused portion, less the value of sessions
          already delivered and any non-refundable payment-gateway fee].
        </p>
        <p>
          <strong>Satisfaction guarantee:</strong> the memberships page currently shows &quot;100% Satisfaction
          Guarantee&quot;. [CONFIRM: its precise terms must be defined here or the wording removed.] We do not guarantee any
          particular health or weight-loss result.
        </p>
        <p>
          Refunds are not available where an account is closed for serious breach of the Terms, except for any
          unused portion we are required by law to return.
        </p>
      </Section>

      <Section title="4. How refunds are paid">
        <p>
          Approved refunds are returned to the original payment method through the payment provider, normally within
          [CONFIRM: 5–10] business days of approval; your bank may take additional time. Order and payment status are
          updated to &quot;refunded&quot; in our records.
        </p>
      </Section>

      <Section title="5. How to ask for a refund or complain">
        <p>
          Email <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> with your name, registered phone and
          the order details. We aim to reply within 2 business days and decide within [CONFIRM: 7] days. If you are not
          satisfied, escalate to the Grievance Officer: {LEGAL.grievanceOfficer}. See also{' '}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </Section>
    </LegalLayout>
  )
}
