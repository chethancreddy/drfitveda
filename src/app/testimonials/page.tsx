import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Transformations & Patient Reviews | Dr Fit Veda',
  description: 'Read inspiring stories of real health transformations achieved with doctor-guided lifestyle management.',
}

export default function TestimonialsPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="testimonials" />

      <main style={{flex:1}}>
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:760}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              ✨ Real Stories, Real Results
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Patient Transformations
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              Over 1,200+ individuals have reclaimed their health, energy, and body through our doctor-supervised 90-day programs.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:960}}>
            {/* Stats row */}
            <div className="grid-4" style={{marginBottom:'var(--space-xl)'}}>
              <div className="stat-card">
                <div className="stat-label">Patients Transformed</div>
                <div className="stat-value">1,200+</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Weight Reduction</div>
                <div className="stat-value">7.4 kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Habit Adherence Rate</div>
                <div className="stat-value">91.8%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Doctor Reviews Completed</div>
                <div className="stat-value">14,000+</div>
              </div>
            </div>

            {/* Testimonial Cards */}
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-lg)'}}>
              {REVIEWS.map((r, i) => (
                <div key={i} className="card" style={{padding:'var(--space-lg)'}}>
                  <div className="flex justify-between items-start" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
                    <div>
                      <div className="flex items-center gap-xs">
                        <strong className="text-headline-sm" style={{fontSize:18}}>{r.name}</strong>
                        <span className="badge badge-success">{r.program}</span>
                      </div>
                      <div className="text-caption text-muted">{r.location} • {r.duration}</div>
                    </div>

                    <div style={{display:'flex',gap:2,color:'#f1c40f',fontSize:18}}>
                      {'★'.repeat(r.rating)}
                    </div>
                  </div>

                  <div className="card" style={{
                    marginBottom:14,
                    padding:'8px 12px',
                    background:'var(--color-neutral)',
                    display:'inline-flex',
                    alignItems:'center',
                    gap:8,
                    borderRadius:'var(--radius-sm)'
                  }}>
                    <span style={{fontSize:18}}>🎯</span>
                    <strong className="text-body-sm text-primary">Result: {r.outcome}</strong>
                  </div>

                  <p className="text-body-md" style={{lineHeight:1.7,color:'var(--color-on-surface)'}}>
                    &quot;{r.quote}&quot;
                  </p>
                </div>
              ))}
            </div>

            <div style={{textAlign:'center',marginTop:'var(--space-xl)'}}>
              <Link href="/memberships" className="btn btn-primary btn-lg">Begin Your Transformation</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const REVIEWS = [
  {
    name: 'Priya Mukherjee',
    location: 'Bangalore',
    duration: '90-Day Standard Program',
    program: "Women's Wellness & PCOD",
    rating: 5,
    outcome: 'Normalized cycles in 60 days, lost 8.2 kg, resolved chronic fatigue',
    quote: 'For 4 years I struggled with irregular cycles, hair fall, and stubborn weight gain from PCOD. Dr. Ananya did not just tell me to eat less—she identified that my cortisol was spiking from high-intensity workouts and poor evening sleep. Switching to restorative yoga, hormone-balancing nutrition, and weekly doctor check-ins changed everything.'
  },
  {
    name: 'Rahul Kulkarni',
    location: 'Mumbai',
    duration: '90-Day Standard Program',
    program: 'Functional Fitness & Metabolic Health',
    rating: 5,
    outcome: 'HbA1c dropped from 7.1 to 5.8, reduced waist size by 4 inches',
    quote: 'As a software architect working 12 hours sitting down, my blood sugar was creeping up and I had constant lower back stiffness. Vikram my trainer was fantastic. Having the live session recordings was a lifesaver whenever I traveled for work. The weekly review kept me accountable every Sunday morning.'
  },
  {
    name: 'Ananya Sharma',
    location: 'Delhi NCR',
    duration: '90-Day Standard Program',
    program: 'Naturopathy & Clinical Nutrition',
    rating: 5,
    outcome: 'Overcame 6 years of severe acid reflux and IBS symptoms',
    quote: 'I used to take antacids almost daily. Dr Fit Veda addressed my gut microbiome and metabolic inflammation step by step. They adjusted my meal timings, gave me clinical whole-food hydration routines, and customized my desk posture. I am now completely medication-free and feel 10 years younger.'
  }
]
