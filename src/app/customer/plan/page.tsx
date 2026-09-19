import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'My Personalized Plan' }

export default async function CustomerPlanPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('id, membership_status')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  // Fetch plan with all versions and items
  const { data: plan } = await (supabase as any)
    .from('plans')
    .select(`
      id,
      created_at,
      plan_versions (
        id,
        version_number,
        status,
        change_reason,
        effective_from,
        created_at,
        plan_items (
          id,
          category,
          instruction,
          internal_notes,
          display_order
        )
      )
    `)
    .eq('customer_id', customer.id)
    .limit(1)
    .single()

  const allVersions: any[] = plan?.plan_versions ?? []
  allVersions.sort((a, b) => b.version_number - a.version_number)

  const activeVersion = allVersions.find(v => v.status === 'published') || null
  const versions = allVersions.filter(v => v.status === 'published' || v.status === 'archived')
  const items: any[] = activeVersion?.plan_items ?? []
  items.sort((a, b) => a.display_order - b.display_order)

  // Group items by category
  const grouped: Record<string, any[]> = {}
  items.forEach(item => {
    const cat = item.category || 'lifestyle'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  // Parse structured meal items
  const nutritionItems = grouped['nutrition'] || []
  const parsedMeals: any[] = []
  nutritionItems.forEach(it => {
    if (it.internal_notes) {
      try {
        const parsed = JSON.parse(it.internal_notes)
        if (parsed.slot_name && parsed.food_items) {
          parsedMeals.push(parsed)
          return
        }
      } catch {}
    }
    // Fallback: parse from instruction string
    parsedMeals.push({
      slot_name: 'Nutritional Prescription',
      timing: 'Daily',
      food_items: it.instruction,
      purpose: 'Therapeutic Nutrition',
      portion: 'As Prescribed',
      alternatives: '',
    })
  })

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Personalized Regimen</div>
              <h1 className="text-headline-sm" style={{ fontWeight: 600 }}>My Health Plan</h1>
            </div>
          </div>
          {activeVersion && (
            <span className="badge badge-success">
              v{activeVersion.version_number} Active
            </span>
          )}
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-xl)' }}>
        {/* Version banner */}
        {activeVersion ? (
          <div className="card" style={{ marginBottom: 'var(--space-md)', background: 'linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(13,148,136,0.2)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
              <div className="text-label-md text-primary" style={{ fontWeight: 700 }}>
                Version {activeVersion.version_number} • Doctor Prescribed Naturopathic Regimen
              </div>
              <div className="text-caption text-muted">
                Effective: {activeVersion.effective_from ? new Date(activeVersion.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
              </div>
            </div>
            {activeVersion.change_reason && (
              <p className="text-body-md" style={{ fontWeight: 600, marginTop: 4, color: '#0f172a' }}>
                🎯 Focus: &quot;{activeVersion.change_reason}&quot;
              </p>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', marginBottom: 'var(--space-md)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-xs)' }}>📋</div>
            <h2 className="text-headline-sm" style={{ marginBottom: 8 }}>Plan Under Preparation</h2>
            <p className="text-body-md text-muted" style={{ maxWidth: 400, marginInline: 'auto', marginBottom: 'var(--space-md)' }}>
              Your assigned doctor is currently reviewing your medical documents and health assessment to craft your custom regimen.
            </p>
            <div className="flex justify-center gap-xs">
              <Link href="/customer/documents" className="btn btn-secondary btn-sm">Upload Reports</Link>
              <Link href="/customer/consult" className="btn btn-primary btn-sm">Book Doctor Consultation</Link>
            </div>
          </div>
        )}

        {/* SECTION 1: STRUCTURED MEAL-BY-MEAL SCHEDULE (If Available) */}
        {parsedMeals.length > 0 && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: 24 }}>🥗</span>
              <h2 className="text-headline-sm" style={{ margin: 0, fontWeight: 700 }}>
                Daily Naturopathic Meal Schedule
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {parsedMeals.map((meal, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '16px 18px',
                    borderLeft: '4px solid #0d9488',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>
                        {meal.slot_name?.includes('Morning Detox') ? '🌅' :
                         meal.slot_name?.includes('Breakfast') ? '🍳' :
                         meal.slot_name?.includes('Mid-Morning') ? '🍏' :
                         meal.slot_name?.includes('Lunch') ? '🥗' :
                         meal.slot_name?.includes('Evening') ? '🫖' :
                         meal.slot_name?.includes('Dinner') ? '🍲' :
                         meal.slot_name?.includes('Bedtime') ? '🌙' : '🍽️'}
                      </span>
                      <h3 className="text-label-lg" style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        {meal.slot_name}
                      </h3>
                    </div>
                    {meal.timing && (
                      <span className="badge badge-neutral" style={{ fontWeight: 600, fontSize: 12, padding: '4px 10px' }}>
                        🕒 {meal.timing}
                      </span>
                    )}
                  </div>

                  {/* Food Recipe */}
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 10, lineHeight: 1.4 }}>
                    {meal.food_items}
                  </div>

                  {/* Meta: Portion, Purpose, Alternatives */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, background: '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                    {meal.portion && (
                      <div className="text-caption" style={{ color: '#475569' }}>
                        ⚖️ <strong>Portion:</strong> {meal.portion}
                      </div>
                    )}
                    {meal.purpose && (
                      <div className="text-caption" style={{ color: '#0d9488' }}>
                        💡 <strong>Purpose:</strong> {meal.purpose}
                      </div>
                    )}
                    {meal.alternatives && (
                      <div className="text-caption" style={{ color: '#6366f1' }}>
                        🔄 <strong>Healthy Swap:</strong> {meal.alternatives}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: OTHER MULTIDISCIPLINARY SECTIONS (WORKOUT, YOGA, SLEEP, LIFESTYLE, WATER) */}
        {activeVersion && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            {CATEGORY_CONFIG.filter(c => c.key !== 'nutrition').map(cat => {
              const catItems = grouped[cat.key]
              if (!catItems || catItems.length === 0) return null

              return (
                <div key={cat.key} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="flex items-center gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                    <span style={{ fontSize: 24 }}>{cat.icon}</span>
                    <h3 className="text-label-lg" style={{ fontWeight: 600 }}>{cat.title}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 32 }}>
                    {catItems.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                        <span className="text-body-md" style={{ lineHeight: 1.5 }}>{it.instruction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Plan Version History */}
        {versions.length > 1 && (
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h3 className="text-label-lg" style={{ marginBottom: 12 }}>Plan Revision History</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Effective Date</th>
                    <th>Status</th>
                    <th>Focus / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map(v => (
                    <tr key={v.id}>
                      <td><strong>v{v.version_number}</strong></td>
                      <td className="text-body-sm text-muted">
                        {v.effective_from ? new Date(v.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${v.status === 'published' ? 'success' : v.status === 'draft' ? 'warning' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {v.status}
                        </span>
                      </td>
                      <td className="text-body-sm">{v.change_reason || 'Regular update'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <CustomerBottomNav active="plan" />
    </div>
  )
}

const CATEGORY_CONFIG = [
  { key: 'nutrition', title: 'Clinical Diet & Nutrition', icon: '🥗' },
  { key: 'workout',   title: 'Fitness & Physical Training', icon: '💪' },
  { key: 'yoga',      title: 'Therapeutic Yoga & Asanas',  icon: '🧘' },
  { key: 'sleep',     title: 'Sleep & Circadian Rhythm',   icon: '😴' },
  { key: 'lifestyle', title: 'Daily Lifestyle & Wellness', icon: '✨' },
  { key: 'water',     title: 'Hydration Protocol',         icon: '💧' },
]

