import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Our Programs — Doctor-Guided Holistic Care | Dr Fit Veda',
  description: 'Explore our specialized lifestyle programs: Fitness Training, Therapeutic Yoga, Clinical Nutrition, and Women\'s Wellness.',
}

export default function ProgramsPage() {
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
          <div className="container" style={{maxWidth:760}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              🌿 Multi-Disciplinary Health
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Our Specialized Programs
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)',maxWidth:580,marginInline:'auto'}}>
              Every program is physician-supervised and custom-engineered to your body type, blood work, and health objectives.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container">
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xl)'}}>
              {PROGRAMS.map((p, idx) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding:'var(--space-lg)',
                    display:'grid',
                    gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
                    gap:'var(--space-lg)',
                    alignItems:'center'
                  }}
                >
                  <div>
                    <div style={{fontSize:44,marginBottom:8}}>{p.icon}</div>
                    <span className="badge badge-neutral" style={{marginBottom:6}}>{p.category}</span>
                    <h2 className="text-headline-md" style={{marginBottom:8}}>{p.title}</h2>
                    <p className="text-body-md text-muted" style={{lineHeight:1.6,marginBottom:16}}>
                      {p.description}
                    </p>

                    <div style={{marginBottom:16}}>
                      <div className="text-label-md" style={{marginBottom:6}}>Ideal For:</div>
                      <p className="text-body-sm text-muted">{p.idealFor}</p>
                    </div>

                    <div className="flex gap-xs" style={{flexWrap:'wrap'}}>
                      <Link href="/memberships" className="btn btn-primary btn-sm">Enroll in Program</Link>
                      <Link href={p.learnMoreUrl} className="btn btn-secondary btn-sm">Explore Details →</Link>
                    </div>
                  </div>

                  <div style={{background:'var(--color-neutral)',padding:'var(--space-md)',borderRadius:'var(--radius-md)'}}>
                    <h3 className="text-label-lg" style={{marginBottom:12}}>What Is Included:</h3>
                    <ul style={{display:'flex',flexDirection:'column',gap:10,paddingLeft:20,margin:0}}>
                      {p.inclusions.map((inc, i) => (
                        <li key={i} className="text-body-sm" style={{lineHeight:1.4}}>
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const PROGRAMS = [
  {
    id: 'fitness',
    icon: '🏋️',
    category: 'Movement & Strength',
    title: 'Functional Fitness & Strength Training',
    learnMoreUrl: '/how-it-works',
    description: 'Certified trainer-delivered 1-on-1 live sessions tailored to your orthopedic profile and fitness level. Every session is recorded so you can practice on demand.',
    idealFor: 'Weight loss, lean muscle tone, joint stability, desk posture correction, and cardiovascular endurance.',
    inclusions: [
      "Live online training sessions with Gold's Gym certified trainers",
      'High-definition video recording delivered to your portal after each session',
      'Video Gallery: upload your exercise form for coach review',
      'Progressive overload programming adjusted on weekly doctor reviews',
    ],
  },
  {
    id: 'yoga',
    icon: '🧘',
    category: 'Therapeutic Yoga',
    title: 'Physician-Prescribed Therapeutic Yoga',
    learnMoreUrl: '/yoga',
    description: 'Evidence-based therapeutic yoga science prescribed by qualified Yoga Doctors (BNYS) and blended with modern biomechanics to relieve stress, improve spinal mobility, and regulate autonomic tone.',
    idealFor: 'Chronic lower back pain, anxiety, hypertension, stiffness, and sleep insomnia.',
    inclusions: [
      'Custom asana sequences calibrated to your musculoskeletal anatomy and posture',
      'Pranayama (breathwork) protocols for nervous system regulation',
      'Guided Yoga Nidra & meditation audio practices',
      'Spinal decompression and restorative joint flows',
    ],
  },
  {
    id: 'nutrition',
    icon: '🥗',
    category: 'Clinical Dietetics',
    title: 'Clinical Nutrition & Naturopathic Diet',
    learnMoreUrl: '/nutrition',
    description: 'Holistic nourishment designed by certified clinical nutritionists and naturopaths that respects your culture, kitchen, and gut health. No synthetic supplements or starvation diets—just real, healing whole foods.',
    idealFor: 'Digestive disorders (IBS, acidity, bloating), fatty liver, diabetes management, and natural fat loss.',
    inclusions: [
      'Personalized food profile accommodating vegetarian, vegan, and regional preferences',
      'Gut-healing anti-inflammatory whole foods and natural hydration infusions',
      'Circadian meal timing schedules synchronized with your biological clock',
      'Weekly grocery guide and healthy restaurant dining strategies',
    ],
  },
  {
    id: 'womens-wellness',
    icon: '🌸',
    category: "Women's Health",
    title: "Women's Hormonal Balance & PCOD Protocol",
    learnMoreUrl: '/womens-wellness',
    description: 'Specialized clinical care for women navigating hormonal fluctuations, menstrual irregularities, thyroid imbalances, and postpartum recovery.',
    idealFor: 'PCOD/PCOS, thyroid dysfunction, peri-menopause symptoms, chronic fatigue, and hormonal acne.',
    inclusions: [
      'Doctor-designed hormone-balancing nutrition & seed cycling guidance',
      'Low-cortisol strength and mobility training that protects adrenal health',
      'Confidential health tracking and symptom trend charting',
      'Dedicated female naturopathic doctor and clinical nutritionist support',
    ],
  },
]
