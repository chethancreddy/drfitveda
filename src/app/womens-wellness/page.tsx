import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: "Women's Wellness & Hormonal Health | Dr Fit Veda",
  description: 'Specialized holistic and clinical protocol for PCOD, thyroid balance, postpartum recovery, and hormonal vitality.',
}

export default function WomensWellnessPage() {
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
              🌸 Specialized Care
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Women&apos;s Hormonal Wellness
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              Reversing PCOD symptoms, healing adrenal fatigue, and balancing thyroid hormones through low-cortisol movement, cyclical nutrition, and dedicated female physician guidance.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div className="card" style={{padding:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
              <h2 className="text-headline-md" style={{marginBottom:12}}>The Root-Cause Hormonal Protocol</h2>
              <p className="text-body-md text-muted" style={{lineHeight:1.7,marginBottom:16}}>
                High-intensity workouts and extreme caloric restrictions often shock the female endocrine system, causing cortisol spikes and worsening insulin resistance. Our protocol uses gentle progressive resistance, restorative yoga asanas, and seed-cycling nutrition that works in synergy with your monthly cycle.
              </p>
              <div className="grid-3" style={{gap:'var(--space-md)',marginTop:20}}>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>PCOD Reversal</h3>
                  <p className="text-body-sm text-muted">Restore ovulatory rhythm, clear cystic acne, and reduce stubborn abdominal weight.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Thyroid Support</h3>
                  <p className="text-body-sm text-muted">Metabolic temperature optimization and micronutrient replenishment for T3/T4 balance.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Restorative Rest</h3>
                  <p className="text-body-sm text-muted">Downregulate adrenal fatigue and regain emotional equilibrium and daily energy.</p>
                </div>
              </div>
            </div>

            <div style={{textAlign:'center'}}>
              <Link href="/memberships" className="btn btn-primary btn-lg">Start Women&apos;s Wellness Program</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
