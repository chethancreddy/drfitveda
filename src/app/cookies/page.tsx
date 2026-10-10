import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section, Table } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy (Draft) | Dr Fit Veda',
  description: 'The cookies and similar technologies Dr Fit Veda uses, and why no consent banner is currently needed.',
}

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      intro="This page lists the cookies and similar technologies our site uses today. It is based on a review of the code, not on assumptions."
    >
      <Section title="1. Summary">
        <p>
          At present Dr Fit Veda sets <strong>only strictly necessary cookies</strong> that keep you signed in and
          secure. We do not use advertising, analytics, social-media or other tracking cookies or pixels. Because
          strictly necessary cookies are exempt from consent under ePrivacy rules and not treated as tracking under
          Indian or UAE law, we do not show a cookie consent banner. If we add any non-essential cookie in future we
          will first add a consent banner (with equally prominent Accept and Reject options and a preferences
          panel), ensure the tool does not load before consent, and update this page.
        </p>
      </Section>

      <Section title="2. Cookies in use">
        <Table
          head={['Name', 'Purpose', 'Type', 'Duration', 'Set by']}
          rows={[
            ['drf_session', 'Keeps you signed in and identifies your role (HttpOnly, SameSite=Lax)', 'Strictly necessary', '7 days', 'Dr Fit Veda'],
            ['sb-*-auth-token (Supabase)', 'Secure sign-in session once production authentication is enabled', 'Strictly necessary', 'Session / refresh period', 'Dr Fit Veda via Supabase'],
          ]}
        />
        <p>The browser may also store ordinary technical data (for example cached files) that is not used to track you.</p>
      </Section>

      <Section title="3. Third-party requests">
        <p>
          Our fonts and demonstration media (including sample video and vector thumbnails) are served directly from
          our own origin, so browsing public pages and customer galleries does not transmit your IP address to third-party
          media networks. When you join a live session, you connect to our meeting provider (Zoho Meeting), where the
          meeting provider&apos;s own privacy and cookie policies govern the video room connection.
        </p>
      </Section>

      <Section title="4. Managing cookies">
        <p>
          You can delete or block cookies in your browser settings; blocking necessary cookies will prevent sign-in.
          Signing out removes the session cookie. See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalLayout>
  )
}
