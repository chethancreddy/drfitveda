import type { Metadata } from 'next'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Health Data Privacy & Security | Dr Fit Veda',
  description: 'How Dr Fit Veda protects your medical documents, consultation notes, and personal health information.',
}

export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader />

      <main style={{flex:1,padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
        <div className="container" style={{maxWidth:780}}>
          <div className="card" style={{padding:'var(--space-xl)'}}>
            <h1 className="text-headline-lg" style={{marginBottom:12}}>Health Data Privacy &amp; Security Policy</h1>
            <p className="text-body-sm text-muted" style={{marginBottom:24}}>Effective Date: September 2026</p>

            <div style={{display:'flex',flexDirection:'column',gap:16,lineHeight:1.7}}>
              <p className="text-body-md">
                At <strong>Dr Fit Veda</strong>, protecting your personal health records, diagnostic lab reports, and consultation notes is our foremost ethical and legal priority.
              </p>

              <h2 className="text-headline-sm">1. Medical Information Confidentiality</h2>
              <p className="text-body-sm text-muted">
                Your health data is strictly restricted to your assigned clinical team (your doctor, personal trainer, and nutritionist). We will never sell, lease, or monetize your health information to pharmaceutical companies, advertisers, or third parties.
              </p>

              <h2 className="text-headline-sm">2. Video Recordings &amp; Rolling Retention</h2>
              <p className="text-body-sm text-muted">
                Live training sessions are captured strictly for your personal movement practice. Under our automated rolling retention policy (TRD §6.5 &amp; §33), recordings are stored with signed, short-lived URLs and expired video files are deleted after the designated grace period while retaining compliance audit logs.
              </p>

              <h2 className="text-headline-sm">3. Encryption &amp; Security Standards</h2>
              <p className="text-body-sm text-muted">
                All data transmission uses industry-standard TLS 1.3 encryption. Uploaded medical documents are stored in private, isolated object buckets with row-level security (RLS) policies preventing unauthorized cross-patient access.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
