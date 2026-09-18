import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'About Us — Doctor-Guided Wellness | Dr Fit Veda',
  description: "Our mission to bridge naturopathy, clinical nutrition, yoga doctor care, and Gold's Gym certified training.",
}

export default function AboutPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="about" />

      <main style={{flex:1}}>
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:720}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              🌿 The Dr Fit Veda Vision
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Naturopathy, Nutrition &amp; Certified Fitness
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6}}>
              We founded Dr Fit Veda with a singular conviction: chronic lifestyle diseases cannot be solved with random fad diets or unguided workouts. They require continuous, empathetic doctor care.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div className="card" style={{padding:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
              <h2 className="text-headline-md" style={{marginBottom:12}}>Why We Exist</h2>
              <p className="text-body-md text-muted" style={{lineHeight:1.7,marginBottom:16}}>
                Over 80% of modern health issues—type 2 diabetes, hypertension, PCOD, visceral obesity, chronic fatigue, and acid reflux—stem from chronic lifestyle misalignments. Yet our healthcare system only offers 5-minute prescription visits, while the fitness industry pushes generic, high-injury workout routines.
              </p>
              <p className="text-body-md text-muted" style={{lineHeight:1.7}}>
                Dr Fit Veda unites certified Naturopathic doctors, Yoga physicians, clinical nutritionists, and Gold&apos;s Gym certified personal trainers into one synchronized care team. We design your personalized protocol, guide your daily movement, and evaluate your body every single week.
              </p>
            </div>

            <div style={{textAlign:'center',marginBottom:'var(--space-lg)'}}>
              <h2 className="text-headline-md">Our Clinical Pillars</h2>
            </div>

            <div className="grid-3" style={{gap:'var(--space-md)'}}>
              <div className="card" style={{padding:'var(--space-md)'}}>
                <div style={{fontSize:32,marginBottom:8}}>🩺</div>
                <h3 className="text-headline-sm" style={{marginBottom:6}}>Physician-Led</h3>
                <p className="text-body-sm text-muted">Qualified Naturopathic &amp; Yoga doctors oversee every diagnosis, lab report review, and plan iteration.</p>
              </div>

              <div className="card" style={{padding:'var(--space-md)'}}>
                <div style={{fontSize:32,marginBottom:8}}>🎥</div>
                <h3 className="text-headline-sm" style={{marginBottom:6}}>Gold&apos;s Gym Coaches</h3>
                <p className="text-body-sm text-muted">Gold&apos;s Gym certified personal trainers guide your live workouts and provide rolling video recordings for practice.</p>
              </div>

              <div className="card" style={{padding:'var(--space-md)'}}>
                <div style={{fontSize:32,marginBottom:8}}>🤝</div>
                <h3 className="text-headline-sm" style={{marginBottom:6}}>Transparent Care</h3>
                <p className="text-body-sm text-muted">Transparent financial allocation ensures your medical team is fairly rewarded for your success.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
