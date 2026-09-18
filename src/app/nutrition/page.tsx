import type { Metadata } from 'next'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export const metadata: Metadata = {
  title: 'Clinical Nutrition & Naturopathy | Dr Fit Veda',
  description: 'Evidence-based metabolic nutrition and naturopathic whole-food dietetics formulated by clinical nutritionists and doctors.',
}

export default function NutritionPage() {
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
              🥗 Clinical Nutrition &amp; Naturopathy
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Healing Through Food as Medicine
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              We don&apos;t do crash diets or synthetic meal shakes. We restore your gut microbiome, optimize metabolic efficiency, and stabilize energy through personalized, science-backed clinical nutrition.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div className="card" style={{padding:'var(--space-xl)',marginBottom:'var(--space-xl)'}}>
              <h2 className="text-headline-md" style={{marginBottom:12}}>The Naturopathic Gut-Metabolism Science</h2>
              <p className="text-body-md text-muted" style={{lineHeight:1.7,marginBottom:16}}>
                Health begins in the gut microbiome. When intestinal barrier integrity and metabolic enzymes are supported with real, whole foods, chronic inflammation drops and vitality rebounds. Our clinical nutritionists and naturopaths design a customized protocol respecting your home kitchen, work schedule, and biochemical needs.
              </p>
              <div className="grid-3" style={{gap:'var(--space-md)',marginTop:20}}>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Zero Starvation</h3>
                  <p className="text-body-sm text-muted">Nutrient-dense, high-satiety whole meals that stabilize blood glucose and eliminate sugar crashes.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Circadian Chrono-Nutrition</h3>
                  <p className="text-body-sm text-muted">Align meal timing with biological circadian rhythms to maximize metabolic insulin sensitivity.</p>
                </div>
                <div style={{background:'var(--color-neutral)',padding:'var(--space-sm)',borderRadius:'var(--radius-sm)'}}>
                  <h3 className="text-label-lg" style={{marginBottom:6}}>Anti-Inflammatory Care</h3>
                  <p className="text-body-sm text-muted">Targeted functional foods, botanical infusions, and hydration to reduce systemic gut inflammation.</p>
                </div>
              </div>
            </div>

            <div style={{textAlign:'center'}}>
              <Link href="/memberships" className="btn btn-primary btn-lg">Get Your Nutrition Plan</Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
