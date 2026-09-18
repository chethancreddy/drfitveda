import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'How It Works — The Transformation Story | Dr Fit Veda',
  description: 'Discover our 7-step doctor-guided wellness journey from initial clinical assessment to lasting lifestyle transformation.',
}

export default function HowItWorksPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="how-it-works" />

      <main style={{flex:1}}>
        {/* Hero Section */}
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:800}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              🌿 The Clinical Methodology
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)',lineHeight:1.1}}>
              How Dr Fit Veda Transforms Your Health
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6,maxWidth:640,marginInline:'auto',marginBottom:'var(--space-md)'}}>
              We replace crash diets and generic gym routines with a medical-grade, personalized lifestyle system. Here is the step-by-step story of your journey.
            </p>
            <div className="flex justify-center gap-xs">
              <Link href="/memberships" className="btn btn-primary btn-lg">Start Your Journey</Link>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{color:'white',borderColor:'rgba(255,255,255,0.4)'}}>Portal Sign In</Link>
            </div>
          </div>
        </section>

        {/* 7-Step Interactive Story Timeline */}
        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div style={{textAlign:'center',marginBottom:'var(--space-xl)'}}>
              <h2 className="text-headline-lg">Your 7-Step Roadmap to Vitality</h2>
              <p className="text-body-lg text-muted">A structured medical process that adapts as your body transforms.</p>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-lg)'}}>
              {STEPS.map((s, idx) => (
                <div
                  key={s.step}
                  className="card"
                  style={{
                    padding:'var(--space-lg)',
                    display:'grid',
                    gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
                    gap:'var(--space-md)',
                    alignItems:'center',
                    borderLeft:`5px solid ${s.accentColor}`
                  }}
                >
                  <div>
                    <div className="flex items-center gap-xs" style={{marginBottom:8}}>
                      <span className="badge badge-neutral" style={{fontSize:13,fontWeight:700,background:'rgba(92,140,181,0.15)',color:'var(--color-primary)'}}>
                        STEP {s.step}
                      </span>
                      <span className="text-caption text-muted">{s.timing}</span>
                    </div>

                    <h3 className="text-headline-sm" style={{marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                      <span>{s.icon}</span>
                      <span>{s.title}</span>
                    </h3>

                    <p className="text-body-md text-muted" style={{lineHeight:1.6,marginBottom:12}}>
                      {s.description}
                    </p>

                    <div style={{background:'var(--color-neutral)',padding:'10px 14px',borderRadius:'var(--radius-sm)'}}>
                      <span className="text-caption" style={{fontWeight:600,color:'var(--color-on-surface)'}}>Key Deliverable: </span>
                      <span className="text-body-sm text-muted">{s.deliverable}</span>
                    </div>
                  </div>

                  <div style={{
                    background:'var(--color-neutral)',
                    borderRadius:'var(--radius-md)',
                    padding:'var(--space-md)',
                    border:'1px dashed var(--color-border)'
                  }}>
                    <div className="text-label-md" style={{color:'var(--color-primary)',marginBottom:8}}>
                      {s.highlightTitle}
                    </div>
                    <ul style={{display:'flex',flexDirection:'column',gap:8,paddingLeft:18,margin:0}}>
                      {s.highlights.map((h, i) => (
                        <li key={i} className="text-body-sm text-muted" style={{lineHeight:1.4}}>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Box */}
            <div className="card" style={{
              marginTop:'var(--space-xl)',
              textAlign:'center',
              padding:'var(--space-xl)',
              background:'linear-gradient(135deg, rgba(92,140,181,0.1) 0%, rgba(200,149,109,0.1) 100%)',
              border:'2px solid var(--color-primary)'
            }}>
              <h3 className="text-headline-md" style={{marginBottom:8}}>Ready to Begin Your Story?</h3>
              <p className="text-body-lg text-muted" style={{maxWidth:500,marginInline:'auto',marginBottom:'var(--space-md)'}}>
                Join Dr Fit Veda today and experience continuous, doctor-led lifestyle guidance designed specifically for you.
              </p>
              <Link href="/memberships" className="btn btn-primary btn-lg">Explore Memberships (₹9,999)</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const STEPS = [
  {
    step: '01',
    timing: 'Day 1',
    icon: '📋',
    title: 'Comprehensive Health & Lifestyle Intake',
    accentColor: '#5c8cb5',
    description: 'You share your medical history, recent blood tests, sleep habits, dietary likes/dislikes, stress patterns, and personal goals through our secure patient portal.',
    deliverable: 'Complete Patient Profile & Medical Document Repository',
    highlightTitle: 'What We Assess',
    highlights: [
      'Height, weight, and live calculated body mass index (BMI)',
      'Circadian sleep rhythm and daily occupation demands',
      'Food preferences, allergies, and hydration status',
      'Blood chemistry (CBC, lipid profile, HbA1c, thyroid)',
    ],
  },
  {
    step: '02',
    timing: 'Days 2–3',
    icon: '🩺',
    title: '1-on-1 Doctor Clinical Assessment',
    accentColor: '#c8956d',
    description: 'Your assigned doctor reviews your diagnostic reports and conducts a teleconsultation to diagnose root causes rather than just masking symptoms.',
    deliverable: 'Clinical Findings Dossier & Treatment Trajectory',
    highlightTitle: 'Doctor Focus Areas',
    highlights: [
      'Naturopathic root-cause diagnosis & metabolic health evaluation',
      'Metabolic and hormonal review (insulin resistance, PCOD)',
      'Joint mobility, past injuries, and functional limitations',
      'Customized therapeutic goals for the 90-day cycle',
    ],
  },
  {
    step: '03',
    timing: 'Day 4',
    icon: '🥗',
    title: 'Personalized Regimen Formulation',
    accentColor: '#48a868',
    description: 'Your doctor, nutritionist, and trainer collaborate to build your custom, versioned regimen across six foundational pillars: Nutrition, Workout, Yoga, Sleep, Lifestyle, and Water.',
    deliverable: 'Plan Version 1 Published to your Customer Portal',
    highlightTitle: 'Your Daily Protocol Includes',
    highlights: [
      'Whole-food clinical nutrition, hydration protocols, and meal timings',
      'Tailored strength exercises and reps matching your fitness',
      'Therapeutic yoga asanas and breathwork (pranayama)',
      'Evening wind-down rituals for deep REM sleep',
    ],
  },
  {
    step: '04',
    timing: 'Days 5–90',
    icon: '🎥',
    title: 'Live 1-on-1 Training & Rolling Video Recordings',
    accentColor: '#9b59b6',
    description: "Train live with your Gold's Gym certified fitness trainer. Every live session is recorded and delivered to your portal with rolling retention, so you can re-watch and practice anytime.",
    deliverable: 'Live Coaching Sessions + On-Demand Session Replay',
    highlightTitle: 'Training Features',
    highlights: [
      'Real-time posture and movement correction',
      'Video recordings automatically available within hours',
      'Video Gallery: upload your form checks for coach feedback',
      'Secure signed streaming URLs for patient data privacy',
    ],
  },
  {
    step: '05',
    timing: 'Daily (30 seconds)',
    icon: '✅',
    title: 'Effortless 30-Second Daily Check-In',
    accentColor: '#e67e22',
    description: 'No overwhelming calorie counting or complicated logs. A simple 30-second daily check-in lets you log your workout, meals, yoga, hydration, energy, and mood.',
    deliverable: 'Continuous Adherence Tracking & Streak Metrics',
    highlightTitle: 'What You Track',
    highlights: [
      'Workout & Yoga adherence pills (yes / partial / no)',
      'Dietary compliance & water intake',
      'Subjective energy & mood levels on a 1-5 scale',
      'Daily notes to communicate directly with your care team',
    ],
  },
  {
    step: '06',
    timing: 'Every 7 Days',
    icon: '📊',
    title: 'Weekly Doctor Reviews & Plan Iterations',
    accentColor: '#3498db',
    description: 'Every week, your doctor analyzes your check-ins and weight trends, conducts a review, and updates your plan version so you never hit a plateau.',
    deliverable: 'Weekly Review Summary & Plan Version 2, 3, etc.',
    highlightTitle: 'The Review Engine',
    highlights: [
      'Doctor evaluates 7-day adherence and weight trajectory',
      'Detailed clinical notes and actionable modifications',
      'New plan version created without erasing historical logs',
      'Automatic doctor review compensation and payout tracking',
    ],
  },
  {
    step: '07',
    timing: 'Day 90 and Beyond',
    icon: '✨',
    title: 'Sustainable Vitality & Habit Rewiring',
    accentColor: '#27ae60',
    description: 'By the end of your 90-day journey, you have achieved sustainable metabolic health, rewiring your relationship with food, movement, and sleep for the rest of your life.',
    deliverable: '90-Day Transformation Report & Long-Term Maintenance Plan',
    highlightTitle: 'Measurable Outcomes',
    highlights: [
      'Normalized metabolic markers and healthy BMI reduction',
      'Increased physical strength, stamina, and posture balance',
      'Restored circadian rhythm and natural, deep sleep',
      'Confidence and self-sufficiency in managing your health',
    ],
  },
]
