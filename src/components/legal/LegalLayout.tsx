import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import { LEGAL, LEGAL_PAGES } from '@/lib/legal/config'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-lg)' }}>
      <h2 className="text-headline-sm" style={{ marginBottom: 8 }}>{title}</h2>
      <div className="text-body-sm" style={{ lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  )
}

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="table-wrapper" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 13 }}>
        <thead>
          <tr>{head.map(h => <th key={h} style={{ textAlign: 'left' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={{ verticalAlign: 'top' }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LegalLayout({
  title, intro, children,
}: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicHeader />
      <main style={{ flex: 1, padding: 'var(--space-xl) 0', background: 'var(--surface-page)' }}>
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)', fontSize: 13 }}>
            <span>⚠️</span>
            <div>
              <strong>DRAFT — pending legal review.</strong>
              <p style={{ margin: '4px 0 0', lineHeight: 1.55 }}>
                This document was prepared from the platform&apos;s current design and has not yet been reviewed by a
                qualified lawyer. Items marked [CONFIRM] require business or legal decisions.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h1 className="text-headline-lg" style={{ marginBottom: 8 }}>{title}</h1>
            <p className="text-body-sm text-muted" style={{ marginBottom: 16 }}>
              Effective date: {LEGAL.effectiveDate} · Version {LEGAL.version}
            </p>
            {intro && <p className="text-body-md" style={{ lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>{intro}</p>}

            {children}

            <Section title="Updates to this document">
              <p>
                We may update this document. For material changes we will update the effective date above and notify
                registered users in-app or by email before the change applies. Earlier versions are available on request
                from <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                {LEGAL.entityName}, {LEGAL.address}<br />
                Email: <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a> · Phone: {LEGAL.phone}<br />
                Grievance Officer: {LEGAL.grievanceOfficer}
              </p>
            </Section>

            <nav aria-label="Related policies" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <div className="text-label-md" style={{ marginBottom: 6 }}>Related policies</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                {LEGAL_PAGES.map(p => (
                  <Link key={p.href} href={p.href} className="text-body-sm">{p.label}</Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
