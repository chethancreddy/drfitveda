import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/lib/legal/config'

export const metadata: Metadata = {
  title: 'Terms & Conditions (Draft) | Dr Fit Veda',
  description: 'Terms governing use of the Dr Fit Veda platform: memberships, live sessions, consultations, payments and acceptable use.',
}

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro="These terms govern your use of the Dr Fit Veda website and portals. Please read them with our Privacy Policy, Cookie Policy, Refund & Cancellation Policy and Medical, Fitness & Nutrition Disclaimer."
    >
      <Section title="1. Who we are and acceptance">
        <p>
          The service is provided by {LEGAL.entityName}, {LEGAL.address}. By creating an account, buying a
          membership or consultation, or otherwise using the platform you agree to these terms. If you do not agree,
          please do not use the platform. These terms are an agreement about the service only; they are{' '}
          <strong>not</strong> your consent to the processing of health data, session recordings or marketing, which
          we ask for separately (see the <Link href="/privacy">Privacy Policy</Link>).
        </p>
      </Section>

      <Section title="2. Eligibility and accounts">
        <p>
          You must be at least {LEGAL.minimumAge} years old and able to enter a binding contract. Provide accurate
          information, keep your login details confidential, and do not share your account. You are responsible for
          activity under your account; tell us promptly if you suspect misuse.
        </p>
      </Section>

      <Section title="3. Services">
        <p>
          Dr Fit Veda offers doctor-guided lifestyle, naturopathy, nutrition, yoga and fitness programmes through
          memberships and separately bookable consultations, delivered online. Services are wellness and lifestyle
          guidance — see the <Link href="/disclaimer">Medical, Fitness &amp; Nutrition Disclaimer</Link>. Available
          plans, inclusions, session frequency and prices are those shown on the{' '}
          <Link href="/memberships">memberships page</Link> and at purchase.
        </p>
      </Section>

      <Section title="4. Live sessions and recordings">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Live training and consultations are held on a secure third-party video platform (Zoho Meeting).</li>
          <li>Where recording is part of your plan, we ask for your consent before it is used. You can ask us to stop recording future sessions; this may limit replay features.</li>
          <li>Only the most recent active recording is kept; earlier recordings are deleted after a grace period (see Privacy Policy).</li>
          <li>You may not record, copy or share sessions or other users&apos; content without permission.</li>
        </ul>
      </Section>

      <Section title="5. Prices, payment and renewal">
        <p>
          Prices are shown in Indian Rupees (₹) and are the price at the time of purchase [CONFIRM: tax-inclusive
          or exclusive, and handling of UAE customers&apos; currency]. Membership fees are payable in advance for the
          chosen duration. Memberships are fixed-term and the current platform does not renew them automatically; if
          automatic renewal is ever introduced we will ask for your explicit consent first and state renewal price and
          cancellation steps clearly. Price changes by us do not affect a membership you have already purchased.
          Refunds and cancellations are covered by the <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.
        </p>
      </Section>

      <Section title="6. Your responsibilities">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Give accurate, complete health and lifestyle information, including conditions, medicines, allergies, injuries and pregnancy.</li>
          <li>Tell your care team about any change in health and stop an activity that causes pain or distress.</li>
          <li>Do not upload unlawful content or other people&apos;s health records without their permission.</li>
        </ul>
      </Section>

      <Section title="7. Prohibited conduct">
        <p>
          Do not misuse the platform, attempt unauthorised access, reverse engineer it, share accounts, harass
          professionals or other users, or use the service for unlawful purposes. We may suspend or end accounts for
          serious or repeated breaches. Where we end an account without cause, we will refund the unused portion as set
          out in the Refund &amp; Cancellation Policy.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          The platform, its content, plans and branding belong to us or our licensors. Personalised plans are provided
          for your personal, non-commercial use. You keep ownership of content you upload and give us permission to
          use it only to provide the service. Third-party software and fonts are used under their own licences (see
          the repository notice file THIRD_PARTY_NOTICES.md).
        </p>
      </Section>

      <Section title="9. Privacy and your data">
        <p>
          How we use your data is explained in the <Link href="/privacy">Privacy Policy</Link>. You can request
          access, correction, export or deletion through the <Link href="/data-request">data request form</Link>,
          subject to records we must legally keep.
        </p>
      </Section>

      <Section title="10. Liability">
        <p>
          Nothing in these terms limits liability that cannot be limited by law, including for death or personal
          injury caused by negligence or for fraud, or removes rights you have as a consumer. Subject to that, we are
          not liable for indirect losses, or for outcomes that depend on how you follow guidance, your health
          condition, or the availability of third-party services (such as your internet connection). Results vary
          between individuals and are not guaranteed. [CONFIRM: financial liability cap, if any, with counsel.]
        </p>
      </Section>

      <Section title="11. Suspension and changes to the service">
        <p>
          We may modify or discontinue features with reasonable notice. If we discontinue a paid service you have
          not fully received, we will refund the unused portion.
        </p>
      </Section>

      <Section title="12. Governing law and disputes">
        <p>
          These terms are governed by the laws of {LEGAL.governingLaw}, with courts at Bangalore having jurisdiction
          [CONFIRM with counsel]. Consumers outside India keep any mandatory protections of their country of residence.
          Please first contact the Grievance Officer so we can try to resolve your complaint informally.
        </p>
      </Section>

      <Section title="13. Changes to these terms">
        <p>
          We will give notice of material changes before they take effect. If you do not accept a change you may stop
          using the service and request a refund of any unused prepaid period for changes that materially disadvantage
          you.
        </p>
      </Section>
    </LegalLayout>
  )
}
