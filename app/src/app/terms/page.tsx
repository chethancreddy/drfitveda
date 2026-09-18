import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Dr Fit Veda',
  description: 'Terms and conditions for using the Dr Fit Veda platform, including membership, live sessions, and health consultation services.',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center',
        }}>
          <div className="container" style={{ maxWidth: 680 }}>
            <span className="chip chip-accent" style={{ marginBottom: 12, display: 'inline-flex' }}>📋 Legal</span>
            <h1 className="text-display" style={{ color: 'white', marginBottom: 12 }}>Terms & Conditions</h1>
            <p className="text-body-md" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Last updated: September 2026 &nbsp;·&nbsp; These terms govern your use of the Dr Fit Veda platform.
            </p>
          </div>
        </section>

        {/* Under Construction Notice */}
        <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface-page)' }}>
          <div className="container" style={{ maxWidth: 760 }}>

            <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)', fontSize: 14 }}>
              <span>⚠️</span>
              <div>
                <strong>Document In Progress</strong>
                <p style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                  Our full Terms & Conditions are being finalized by our legal team. The outline below represents the key areas that will be covered. Please check back soon for the complete document.
                </p>
              </div>
            </div>

            {/* Key sections outline */}
            {TERMS_SECTIONS.map((section) => (
              <div key={section.title} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{section.icon}</span>
                  <h2 className="text-headline-sm" style={{ margin: 0 }}>{section.title}</h2>
                </div>
                <p className="text-body-sm text-muted" style={{ lineHeight: 1.65, marginBottom: section.points ? 12 : 0 }}>
                  {section.description}
                </p>
                {section.points && (
                  <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.points.map((p, i) => (
                      <li key={i} className="text-body-sm" style={{ lineHeight: 1.55 }}>{p}</li>
                    ))}
                  </ul>
                )}
                {section.comingSoon && (
                  <div style={{ marginTop: 12, display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: 'var(--color-neutral)', fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>
                    Full detail coming soon
                  </div>
                )}
              </div>
            ))}

            {/* Contact */}
            <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center', border: '1px dashed var(--color-border)' }}>
              <p className="text-body-md" style={{ marginBottom: 12 }}>
                Have questions about our terms or privacy practices?
              </p>
              <Link href="/contact" className="btn btn-primary btn-sm">Contact Us</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const TERMS_SECTIONS = [
  {
    icon: '🤝',
    title: '1. Acceptance of Terms',
    description: 'By registering on the Dr Fit Veda platform, purchasing a membership, or using any of our services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.',
    comingSoon: true,
  },
  {
    icon: '💳',
    title: '2. Membership Plans & Payments',
    description: 'Dr Fit Veda offers multiple membership tiers. By purchasing a plan, you agree to the following:',
    points: [
      'Membership fees are collected upfront for the selected duration.',
      'Prices displayed at time of purchase are locked for your current membership period.',
      'Future plan changes by the admin do not affect your existing active membership.',
      'Refunds are subject to our refund policy (detailed in the full document).',
      'Membership does not auto-renew without explicit consent.',
    ],
    comingSoon: false,
  },
  {
    icon: '📹',
    title: '3. Live Sessions & Google Meet',
    description: 'All live training, doctor consultations, and monitoring sessions are conducted via Google Meet. By using these sessions, you acknowledge:',
    points: [
      'Sessions are scheduled and linked via the Dr Fit Veda platform but conducted on Google Meet.',
      'Google Meet may record sessions depending on your plan. You consent to recording when joining a session.',
      'Recording links are provided by Google Meet and accessible via your dashboard after the session.',
      'Dr Fit Veda does not host or store video files independently. All recordings are on Google\'s infrastructure.',
      'Super Plan members have recording and overwrite access as defined by their plan.',
    ],
    comingSoon: false,
  },
  {
    icon: '🩺',
    title: '4. Medical Disclaimer & Health Consultations',
    description: 'Dr Fit Veda provides naturopathic, nutritional, and wellness guidance. This does not replace emergency or acute medical care.',
    points: [
      'Our doctors are qualified naturopaths and nutritionists — not emergency physicians.',
      'Always consult a qualified emergency doctor for acute or life-threatening conditions.',
      'Health plans and recommendations are personalized and intended as lifestyle guidance.',
      'Individual results may vary.',
    ],
    comingSoon: false,
  },
  {
    icon: '🔒',
    title: '5. Privacy & Medical Data',
    description: 'We take your health data seriously. How we handle your personal and medical information is outlined in our Privacy Policy.',
    points: [
      'Health and fitness data is collected solely to provide personalized care.',
      'Data is not sold to third parties.',
      'You may request deletion of your data at any time via your account settings.',
    ],
    comingSoon: false,
  },
  {
    icon: '🚫',
    title: '6. Prohibited Conduct',
    description: 'Users agree not to misuse the platform, share accounts, reverse-engineer the service, or harass professionals or other users. Violation may result in immediate account termination without refund.',
    comingSoon: true,
  },
  {
    icon: '⚖️',
    title: '7. Governing Law & Disputes',
    description: 'These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of courts in the relevant city of operation. Detailed arbitration procedures will be covered in the full document.',
    comingSoon: true,
  },
  {
    icon: '✏️',
    title: '8. Changes to Terms',
    description: 'Dr Fit Veda reserves the right to update these terms. Registered users will be notified of material changes via email or in-app notification. Continued use after notification implies acceptance.',
    comingSoon: true,
  },
]
