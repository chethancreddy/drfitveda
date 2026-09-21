import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import CustomerDayWisePlanView from '@/components/customer/CustomerDayWisePlanView'

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

  // Parse Day-wise Plan, Goal Summary & Plan Meta
  let dayPlans: any = null
  let goalSummary: any = null
  let planMeta: any = null
  const otherItems: any[] = []

  items.forEach(it => {
    if (it.category === 'day_wise_meal_plan' || it.category === 'nutrition') {
      if (it.internal_notes) {
        try {
          const parsed = JSON.parse(it.internal_notes)
          if (parsed.Monday && parsed.Tuesday) {
            dayPlans = parsed
          }
        } catch {}
      }
    } else if (it.category === 'goal_summary') {
      if (it.internal_notes) {
        try {
          goalSummary = JSON.parse(it.internal_notes)
        } catch {}
      }
    } else if (it.category === 'current_plan_meta') {
      if (it.internal_notes) {
        try {
          planMeta = JSON.parse(it.internal_notes)
        } catch {}
      }
    } else if (it.category !== 'lifestyle' && it.category !== 'water') {
      otherItems.push(it)
    }
  })

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Personalized Regimen</div>
              <h1 className="text-headline-sm" style={{ fontWeight: 600 }}>My Health &amp; Nutrition Plan</h1>
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
        {activeVersion ? (
          <CustomerDayWisePlanView
            activeVersionNumber={activeVersion.version_number}
            effectiveFrom={activeVersion.effective_from}
            changeReason={activeVersion.change_reason}
            dayPlans={dayPlans}
            goalSummary={goalSummary}
            planMeta={planMeta}
            otherItems={otherItems}
            versions={versions}
          />
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', marginBottom: 'var(--space-md)' }}>
            <div style={{ fontSize: 40, marginBottom: 'var(--space-xs)' }}>📋</div>
            <h2 className="text-headline-sm" style={{ marginBottom: 8 }}>Meal Plan Under Preparation</h2>
            <p className="text-body-md text-muted" style={{ maxWidth: 440, marginInline: 'auto', marginBottom: 'var(--space-md)' }}>
              Your assigned doctor is currently reviewing your medical documents and health assessment to craft your custom day-wise nutrition and macro regimen.
            </p>
            <div className="flex justify-center gap-xs">
              <Link href="/customer/documents" className="btn btn-secondary btn-sm">Upload Medical Reports</Link>
              <Link href="/customer/consult" className="btn btn-primary btn-sm">Book Doctor Consultation</Link>
            </div>
          </div>
        )}
      </main>

      <CustomerBottomNav active="plan" />
    </div>
  )
}
