import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Therapeutic Yoga & Pranayama | Dr Fit Veda',
  description: 'Doctor-prescribed yoga therapy, breathing techniques, and posture correction tailored to your health goals.',
}

export default function YogaPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="programs" />

      <main style={{flex:1}}>
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:740}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              🧘 Therapeutic Yoga Science
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Prescribed Yoga for Healing
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              More than stretching. Our certified yoga doctors design custom asana, pranayama, and restorative sequences to heal chronic pain, regulate cortisol, and rejuvenate vitality.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div className="card" style={{padding:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
              <h2 className="text-headline-md" style={{marginBottom:12}}>The Physician-Guided Yoga Approach</h2>
              <p className="text-body-md text-muted" style={{lineHeight:1.7,marginBottom:16}}>
                Generic yoga classes can often exacerbate joint strain or lumbar disc issues if not calibrated to your spinal anatomy. At Dr Fit Veda, your yoga sequence is formulated by a qualified doctor who reviews your medical diagnostics and past injuries before prescribing a single pose.
              </p>
              <div className="grid-3" style={{gap:'var(--space-md)',marginTop:20}}>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Spinal Mobility</h3>
                  <p className="text-body-sm text-muted">Decompress lumbar vertebra and restore pelvic alignment from desk sitting.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Pranayama</h3>
                  <p className="text-body-sm text-muted">Stimulate the vagus nerve and downregulate fight-or-flight stress hormones.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Yoga Nidra</h3>
                  <p className="text-body-sm text-muted">Restorative psychic sleep protocols for insomnia and cognitive fatigue.</p>
                </div>
              </div>
            </div>

            <div style={{textAlign:'center'}}>
              <Link href="/memberships" className="btn btn-primary btn-lg">Enroll in 90-Day Program</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
