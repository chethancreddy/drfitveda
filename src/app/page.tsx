import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Dr Fit Veda — Doctor-Guided Lifestyle Management',
  description: 'Personalized fitness, therapeutic yoga, clinical nutrition and lifestyle management supervised by certified doctors. Begin your 90-day transformation.',
}

export default function HomePage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader />

      <main style={{flex:1}}>
        {/* ── Hero ── */}
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0 var(--space-xl)',
          minHeight: '82vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          <div className="container">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:40,alignItems:'center'}}>
              <div style={{maxWidth:'620px'}}>
                <span className="chip chip-accent" style={{marginBottom:'var(--space-sm)',display:'inline-flex'}}>
                  🌿 Physician-Led Holistic Health System
                </span>
                <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)',lineHeight:1.08}}>
                  Your health story,<br/>guided by doctors.
                </h1>
                <p className="text-body-lg" style={{color:'rgba(255,255,255,0.85)',marginBottom:'var(--space-lg)',maxWidth:'540px',lineHeight:1.6}}>
                  No fads. No guesswork. A synchronized team of doctors, trainers, and clinical nutritionists diagnoses your body, builds your custom regimen, guides live workouts, and fine-tunes your plan every week.
                </p>
                <div className="flex gap-sm" style={{flexWrap:'wrap',marginBottom:'var(--space-lg)'}}>
                  <Link href="/memberships" className="btn btn-lg" style={{
                    background:'var(--color-tertiary)',
                    color:'var(--color-on-surface)',
                    border:'none',
                    fontWeight:600
                  }}>
                    Explore 90-Day Program (₹9,999)
                  </Link>
                  <Link href="/how-it-works" className="btn btn-lg btn-secondary" style={{color:'white',borderColor:'rgba(255,255,255,0.45)'}}>
                    The 7-Step Story →
                  </Link>
                </div>

                {/* Trust Badges */}
                <div style={{display:'flex',gap:24,alignItems:'center',flexWrap:'wrap',paddingTop:12,borderTop:'1px solid rgba(255,255,255,0.15)'}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'white'}}>1,200+</div>
                    <div className="text-caption" style={{color:'rgba(255,255,255,0.6)'}}>Patients Guided</div>
                  </div>
                  <div style={{width:1,height:28,background:'rgba(255,255,255,0.2)'}} />
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'white'}}>12 Weeks</div>
                    <div className="text-caption" style={{color:'rgba(255,255,255,0.6)'}}>Doctor Reviews</div>
                  </div>
                  <div style={{width:1,height:28,background:'rgba(255,255,255,0.2)'}} />
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:'white'}}>91.8%</div>
                    <div className="text-caption" style={{color:'rgba(255,255,255,0.6)'}}>Habit Adherence</div>
                  </div>
                </div>
              </div>

              {/* Hero Logo Card */}
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={{
                  background:'rgba(255,255,255,0.98)',
                  borderRadius:24,
                  padding:'32px 28px',
                  boxShadow:'0 24px 48px rgba(0,0,0,0.35)',
                  maxWidth:420,
                  width:'100%',
                  textAlign:'center',
                  color:'var(--color-on-surface)'
                }}>
                  <img
                    src="/logo.png"
                    alt="Dr Fit Veda Official Brand"
                    style={{width:'100%',height:'auto',maxHeight:150,objectFit:'contain',marginBottom:16}}
                  />
                  <div style={{height:1,background:'var(--color-border)',margin:'12px 0 16px'}} />
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,textAlign:'left'}}>
                    <div style={{background:'var(--color-neutral)',padding:'10px 12px',borderRadius:8}}>
                      <div className="text-caption text-muted" style={{fontSize:11}}>Clinical Team</div>
                      <div className="text-body-sm" style={{fontWeight:600}}>Doctor + Trainer + Dietitian</div>
                    </div>
                    <div style={{background:'var(--color-neutral)',padding:'10px 12px',borderRadius:8}}>
                      <div className="text-caption text-muted" style={{fontSize:11}}>Care Protocol</div>
                      <div className="text-body-sm" style={{fontWeight:600}}>Naturopathy &amp; Science</div>
                    </div>
                  </div>
                  <div style={{marginTop:14,display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:'var(--color-success)',fontSize:12,fontWeight:600}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:'var(--color-success)',display:'inline-block'}}></span>
                    Accepting New Registrations • Q1 2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The 7-Step Transformation Story ── */}
        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container">
            <div style={{textAlign:'center',marginBottom:'var(--space-xl)'}}>
              <span className="text-label-md text-primary" style={{letterSpacing:1,textTransform:'uppercase',fontWeight:700}}>
                The Clinical Journey
              </span>
              <h2 className="text-headline-lg" style={{marginTop:4,marginBottom:8}}>How Your Body Transforms</h2>
              <p className="text-body-lg text-muted" style={{maxWidth:600,marginInline:'auto'}}>
                From day one blood diagnostics to week 12 sustainable vitality, follow the complete roadmap.
              </p>
            </div>

            <div className="grid-3" style={{gap:'var(--space-md)'}}>
              {STORY_STEPS.map((s, i) => (
                <div key={i} className="card" style={{padding:'var(--space-md)',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                  <div>
                    <div className="flex justify-between items-center" style={{marginBottom:10}}>
                      <div style={{
                        width:44,height:44,
                        background:'rgba(92,140,181,0.12)',
                        borderRadius:'var(--radius-md)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:22
                      }}>{s.icon}</div>
                      <span className="badge badge-neutral" style={{fontSize:11,fontWeight:700}}>STEP {i+1}</span>
                    </div>
                    <div className="text-caption text-primary" style={{fontWeight:600,marginBottom:2}}>{s.timing}</div>
                    <h3 className="text-headline-sm" style={{fontSize:18,marginBottom:8}}>{s.title}</h3>
                    <p className="text-body-sm text-muted" style={{lineHeight:1.6}}>{s.body}</p>
                  </div>
                  <div style={{marginTop:16,paddingTop:10,borderTop:'1px solid var(--color-border)'}}>
                    <span className="text-caption text-muted"><strong>Deliverable: </strong>{s.deliverable}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{textAlign:'center',marginTop:'var(--space-lg)'}}>
              <Link href="/how-it-works" className="btn btn-secondary">
                Read the Detailed 7-Step Methodology →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Video Gallery & Movement Analysis Showcase ── */}
        <section style={{
          padding:'var(--space-xl) 0',
          background:'linear-gradient(135deg, #2a1f12 0%, #1a1208 100%)',
          color:'white'
        }}>
          <div className="container">
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',
              gap:'var(--space-xl)',
              alignItems:'center'
            }}>
              <div>
                <span className="chip chip-accent" style={{marginBottom:12}}>
                  🎥 Movement Portfolio &amp; Rolling Video Replay
                </span>
                <h2 className="text-headline-lg" style={{color:'white',marginBottom:12}}>
                  Live Training Recorded &amp; Video Form Review
                </h2>
                <p className="text-body-md" style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6,marginBottom:16}}>
                  Never worry about forgetting exercise cues. Every 1-on-1 session is automatically recorded with rolling retention so you can practice on-demand.
                </p>
                <p className="text-body-md" style={{color:'rgba(255,255,255,0.8)',lineHeight:1.6,marginBottom:20}}>
                  In your <strong>Customer Video Gallery</strong>, you can upload clips of your squats, yoga postures, and milestones for direct clinical review by your trainer and doctor.
                </p>

                <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{color:'var(--color-tertiary)',fontSize:18}}>✓</span>
                    <span className="text-body-sm"><strong>Rolling Video Retention:</strong> Only your latest active session is retained for focused, deliberate practice.</span>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{color:'var(--color-tertiary)',fontSize:18}}>✓</span>
                    <span className="text-body-sm"><strong>Technique Video Checks:</strong> Upload 30-second clips for coach technique feedback.</span>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{color:'var(--color-tertiary)',fontSize:18}}>✓</span>
                    <span className="text-body-sm"><strong>Medical Privacy:</strong> Private signed URLs protect your identity and health records.</span>
                  </div>
                </div>

                <Link href="/login" className="btn btn-primary">
                  Try Video Gallery in Portal →
                </Link>
              </div>

              {/* Visual Card / Mock Preview */}
              <div className="card" style={{padding:'var(--space-md)',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <span className="text-label-md" style={{color:'white'}}>Patient Video Portfolio Preview</span>
                  <span className="badge badge-success">Live Session Active</span>
                </div>

                <div style={{aspectRatio:'16/9',background:'#000',borderRadius:'var(--radius-sm)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',marginBottom:12,position:'relative'}}>
                  <div style={{fontSize:40,marginBottom:6}}>🎥</div>
                  <span className="text-body-sm" style={{color:'rgba(255,255,255,0.8)'}}>Latest Session: Functional Core &amp; Hip Mobility</span>
                  <span className="text-caption" style={{color:'rgba(255,255,255,0.5)'}}>Coach Vikram Singh • 30 mins • HD Replay</span>
                </div>

                <div style={{background:'rgba(0,0,0,0.3)',padding:'10px 12px',borderRadius:'var(--radius-sm)'}}>
                  <div className="text-caption text-primary" style={{fontWeight:600,marginBottom:2}}>Recent Trainer Review on Uploaded Clip:</div>
                  <p className="text-body-sm" style={{color:'rgba(255,255,255,0.85)',margin:0}}>
                    &quot;Great hip drive on reps 4-8. Keep core braced before starting descent.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The 4 Specialized Programs ── */}
        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container">
            <div style={{textAlign:'center',marginBottom:'var(--space-xl)'}}>
              <span className="text-label-md text-primary" style={{letterSpacing:1,textTransform:'uppercase',fontWeight:700}}>
                Expert Modalities
              </span>
              <h2 className="text-headline-lg" style={{marginTop:4,marginBottom:8}}>Comprehensive Lifestyle Care</h2>
              <p className="text-body-lg text-muted">Four medical disciplines working in harmony for your body.</p>
            </div>

            <div className="grid-4">
              {PROGRAMS.map((p, i) => (
                <div key={i} className="card" style={{padding:'var(--space-md)',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:38,marginBottom:10}}>{p.icon}</div>
                    <h3 className="text-headline-sm" style={{fontSize:18,marginBottom:6}}>{p.title}</h3>
                    <p className="text-body-sm text-muted" style={{lineHeight:1.5,marginBottom:12}}>{p.body}</p>
                  </div>
                  <Link href={p.href} className="text-caption text-primary" style={{fontWeight:600}}>
                    Learn more →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Membership Pricing CTA ── */}
        <section style={{padding:'var(--space-xl) 0', background:'var(--color-neutral)'}}>
          <div className="container container--sm" style={{textAlign:'center'}}>
            <h2 className="text-headline-lg" style={{marginBottom:'var(--space-xs)'}}>Simple, Transparent All-Inclusive Care</h2>
            <p className="text-body-lg text-muted" style={{marginBottom:'var(--space-lg)'}}>One 90-day membership covers your entire clinical &amp; fitness team.</p>

            <div className="card" style={{padding:'var(--space-xl)',border:'2px solid var(--color-primary)',textAlign:'left'}}>
              <div className="flex justify-between items-center" style={{marginBottom:12}}>
                <div className="chip chip-accent">Most Popular Program</div>
                <span className="badge badge-success">Only ₹111 / day</span>
              </div>

              <div style={{fontSize:44,fontWeight:700,marginBottom:4}}>₹9,999</div>
              <p className="text-body-md text-muted" style={{marginBottom:20}}>90-Day Complete Lifestyle Management Program</p>

              <div className="divider" style={{marginBottom:16}} />

              <ul style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24,padding:0,listStyle:'none'}}>
                {BENEFITS.map((b,i) => (
                  <li key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{color:'var(--color-success)',fontWeight:700,flexShrink:0}}>✓</span>
                    <span className="text-body-md">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex gap-sm" style={{flexWrap:'wrap'}}>
                <Link href="/memberships" className="btn btn-primary btn-lg" style={{flex:1,textAlign:'center'}}>
                  Join Today &amp; Book Doctor Intake
                </Link>
                <Link href="/how-it-works" className="btn btn-secondary btn-lg">
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials Preview ── */}
        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container">
            <div style={{textAlign:'center',marginBottom:'var(--space-lg)'}}>
              <h2 className="text-headline-lg" style={{marginBottom:8}}>Stories of Healing &amp; Vitality</h2>
              <p className="text-body-lg text-muted">What patients say about their doctor-guided 90 days.</p>
            </div>

            <div className="grid-3" style={{gap:'var(--space-md)',marginBottom:'var(--space-lg)'}}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="card" style={{padding:'var(--space-md)'}}>
                  <div style={{color:'#f1c40f',marginBottom:8}}>★★★★★</div>
                  <p className="text-body-sm" style={{lineHeight:1.6,marginBottom:12}}>
                    &quot;{t.quote}&quot;
                  </p>
                  <div>
                    <strong className="text-body-sm">{t.author}</strong>
                    <div className="text-caption text-muted">{t.tag}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{textAlign:'center'}}>
              <Link href="/testimonials" className="btn btn-secondary">
                Read All 1,200+ Patient Transformation Stories →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const STORY_STEPS = [
  { icon:'📋', timing:'Day 1', title:'Diagnostic Intake', body:'Upload blood work, sleep patterns, dietary habits, and lifestyle history into your private health portal.', deliverable:'Health Profile & Documents' },
  { icon:'🩺', timing:'Days 2–3', title:'Doctor Assessment', body:'1-on-1 teleconsultation with your assigned Naturopathic Doctor / Yoga Physician to diagnose root imbalances and establish clinical targets.', deliverable:'Diagnosis & Goals' },
  { icon:'🥗', timing:'Day 4', title:'Custom Regimen', body:'Your physician formulates Plan Version 1 across Nutrition, Strength, Yoga, Sleep, Lifestyle, and Hydration.', deliverable:'Published Plan v1' },
  { icon:'🎥', timing:'Days 5–90', title:'Live Coaching & Replay', body:"Gold's Gym certified trainer delivers live sessions. Recordings are immediately published to your portal for replay.", deliverable:'Video Recordings' },
  { icon:'✅', timing:'Daily (30s)', title:'Adherence Tracking', body:'One-touch check-in logs workouts, meals, water, and mood so your medical team can monitor progress.', deliverable:'Adherence Streaks' },
  { icon:'📊', timing:'Every 7 Days', title:'Weekly Doctor Reviews', body:'Doctor analyzes weekly check-in trends and updates your regimen so you never plateau.', deliverable:'Versioned Updates' },
]

const PROGRAMS = [
  { icon:'🏋️', title:'Functional Fitness', body:"Live sessions with Gold's Gym certified trainers, recorded for replay with Video Gallery form checks.", href:'/programs' },
  { icon:'🧘', title:'Therapeutic Yoga', body:'Yoga Doctor-prescribed asanas and breathwork (pranayama) for joint mobility and nervous system regulation.', href:'/yoga' },
  { icon:'🥗', title:'Clinical Nutrition', body:'Gut-healing metabolic nutrition and whole-food protocols customized to your kitchen and lifestyle.', href:'/nutrition' },
  { icon:'🌸', title:"Women's Wellness", body:'Specialized clinical protocols for PCOD, thyroid balance, adrenal fatigue, and hormonal vitality.', href:'/womens-wellness' },
]

const BENEFITS = [
  'Initial 1-on-1 doctor assessment + comprehensive diagnostic review',
  'Personalized 6-pillar regimen (Nutrition, Workout, Yoga, Sleep, Lifestyle, Water)',
  "Live training sessions with Gold's Gym certified fitness trainer (recorded for replay)",
  'Customer Video Gallery: upload exercise form checks for coach feedback',
  '12 weekly clinical reviews with doctor plan adjustments',
  '30-second daily adherence tracking & habit streak metrics',
  'Direct messaging with your assigned care team',
]

const TESTIMONIALS = [
  { quote:'Normalized my cycles in 60 days and lost 8.2 kg. Having my doctor and trainer on the same page was game-changing.', author:'Priya Mukherjee', tag:'PCOD Reversal • Bangalore' },
  { quote:'My HbA1c dropped from 7.1 to 5.8 in 90 days. Having recorded sessions meant I never missed a workout while traveling.', author:'Rahul Kulkarni', tag:'Metabolic Health • Mumbai' },
  { quote:'I struggled with severe acid reflux for 6 years. Dr Fit Veda healed my gut with natural whole-food nutrition and circadian meal timing.', author:'Ananya Sharma', tag:'Gut Health • Delhi' },
]
