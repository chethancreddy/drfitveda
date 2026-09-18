import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Dr Fit Veda',
  description: 'Everything you need to know about Dr Fit Veda medical guidance, live training recordings, and membership.',
}

export default function FaqPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="faq" />

      <main style={{flex:1}}>
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:700}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              ❓ Common Questions
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Frequently Asked Questions
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              Find answers regarding doctor appointments, live session recordings, and our clinical philosophy.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:800}}>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-md)'}}>
              {FAQS.map((faq, i) => (
                <div key={i} className="card" style={{padding:'var(--space-md)'}}>
                  <div className="flex items-center gap-xs" style={{marginBottom:8}}>
                    <span className="badge badge-neutral" style={{fontSize:11}}>{faq.category}</span>
                  </div>
                  <h2 className="text-headline-sm" style={{fontSize:18,marginBottom:8}}>{faq.q}</h2>
                  <p className="text-body-md text-muted" style={{lineHeight:1.6}}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="card" style={{marginTop:'var(--space-xl)',textAlign:'center',padding:'var(--space-lg)'}}>
              <h3 className="text-headline-sm" style={{marginBottom:6}}>Still have questions?</h3>
              <p className="text-body-sm text-muted" style={{marginBottom:16}}>Our medical intake coordinators are available to help.</p>
              <Link href="/contact" className="btn btn-primary btn-sm">Contact Support Team</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

const FAQS = [
  {
    category: 'Doctor Guidance',
    q: 'Are the doctors and trainers certified and licensed?',
    a: "Yes. All our consulting physicians hold verified BNYS (Bachelor of Naturopathy & Yogic Sciences) medical degrees or clinical nutrition credentials from recognized universities and possess active council registrations. Our personal trainers are Gold's Gym certified coaches."
  },
  {
    category: 'Live Training',
    q: 'How does the Live Training Recording feature work?',
    a: 'Every 1-on-1 session with your trainer is recorded and delivered to your portal. Under our rolling retention policy, your latest active session recording is always available to watch and practice until your subsequent session is published.'
  },
  {
    category: 'Video Gallery',
    q: 'What is the Video Gallery in the customer portal?',
    a: 'The Video Gallery allows you to record and upload short movement clips—such as your squat technique, yoga asana alignment, or weekly posture check. Your doctor and trainer review these videos and provide targeted clinical feedback directly in your portal.'
  },
  {
    category: 'Daily Tracking',
    q: 'How long does the daily check-in take?',
    a: 'Only 30 seconds. You tap quick pills (Yes / Partial / No) for workout, diet, yoga, and water, rate your energy and mood on a simple 1-5 slider, and submit. There is no complicated calorie measuring or weighing every gram of food.'
  },
  {
    category: 'Weekly Reviews',
    q: 'What happens during the weekly doctor review?',
    a: 'Every 7 days, your doctor reviews your 7-day adherence trends, weight progression, and uploaded logs. They record clinical notes and formulate the next version of your plan (e.g. adding resistance, tweaking herbs, adjusting sleep timings) to ensure steady progress.'
  },
  {
    category: 'Memberships',
    q: 'Is the ₹9,999 fee all-inclusive for the full 90 days?',
    a: 'Yes! The ₹9,999 membership fee completely covers your initial doctor assessment, 90 days of personalized plan formulations, 1-on-1 live trainer sessions with rolling video replay, and all 12 weekly clinical doctor reviews.'
  },
]
