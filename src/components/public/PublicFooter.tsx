import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer style={{
      background:'var(--color-secondary)',
      color:'rgba(255,255,255,0.85)',
      padding:'var(--space-xl) 0 var(--space-md)',
      marginTop:'auto'
    }}>
      <div className="container">
        <div className="grid-4" style={{marginBottom:'var(--space-lg)',gap:'var(--space-md)'}}>
          <div>
            <div style={{marginBottom:'var(--space-sm)'}}>
              <Link href="/" style={{display:'inline-flex',background:'rgba(255,255,255,0.95)',padding:'6px 14px',borderRadius:'10px',boxShadow:'0 4px 12px rgba(0,0,0,0.2)'}}>
                <img
                  src="/logo.png"
                  alt="Dr Fit Veda"
                  style={{height:40,width:'auto',maxWidth:200,objectFit:'contain'}}
                />
              </Link>
            </div>
            <p className="text-body-sm" style={{color:'rgba(255,255,255,0.65)',maxWidth:260,lineHeight:1.6}}>
              Science-backed, doctor-monitored holistic health transformation combining Naturopathy, therapeutic yoga, clinical nutrition, and Gold&apos;s Gym certified training.
            </p>
          </div>

          <div>
            <div className="text-label-md" style={{color:'white',marginBottom:12}}>Programs</div>
            {[
              { label:'Fitness & Strength', href:'/programs' },
              { label:'Therapeutic Yoga', href:'/yoga' },
              { label:'Clinical Nutrition', href:'/nutrition' },
              { label:"Women's Wellness (PCOD)", href:'/womens-wellness' },
            ].map(l => (
              <div key={l.label} style={{marginBottom:8}}>
                <Link href={l.href} className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                  {l.label}
                </Link>
              </div>
            ))}
          </div>

          <div>
            <div className="text-label-md" style={{color:'white',marginBottom:12}}>The Journey</div>
            {[
              { label:'How It Works', href:'/how-it-works' },
              { label:'Membership Plans', href:'/memberships' },
              { label:'Patient Transformations', href:'/testimonials' },
              { label:'Frequently Asked Questions', href:'/faq' },
            ].map(l => (
              <div key={l.label} style={{marginBottom:8}}>
                <Link href={l.href} className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                  {l.label}
                </Link>
              </div>
            ))}
          </div>

          <div>
            <div className="text-label-md" style={{color:'white',marginBottom:12}}>Platform Access</div>
            <div style={{marginBottom:8}}>
              <Link href="/login" className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                Patient &amp; Doctor Sign In
              </Link>
            </div>
            <div style={{marginBottom:8}}>
              <Link href="/contact" className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                Contact Medical Support
              </Link>
            </div>
            <div style={{marginBottom:8}}>
              <Link href="/privacy" className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                Health Data Privacy
              </Link>
            </div>
            <div style={{marginBottom:8}}>
              <Link href="/terms" className="text-body-sm" style={{color:'rgba(255,255,255,0.7)',textDecoration:'none'}}>
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>

        <hr style={{border:'none',borderTop:'1px solid rgba(255,255,255,0.12)',marginBottom:'var(--space-sm)'}} />

        <div className="flex justify-between items-center" style={{flexWrap:'wrap',gap:8}}>
          <p className="text-caption" style={{color:'rgba(255,255,255,0.45)'}}>
            © 2026 Dr Fit Veda. All rights reserved. Clinical guidance by certified doctors and medical professionals only.
          </p>
          <div className="flex gap-sm">
            <Link href="/privacy" className="text-caption" style={{color:'rgba(255,255,255,0.45)'}}>Privacy Policy</Link>
            <Link href="/terms" className="text-caption" style={{color:'rgba(255,255,255,0.45)'}}>Terms &amp; Conditions</Link>
            <Link href="/contact" className="text-caption" style={{color:'rgba(255,255,255,0.45)'}}>Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
