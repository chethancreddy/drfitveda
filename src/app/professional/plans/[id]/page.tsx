import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import PlanEditor from '@/components/professional/PlanEditor'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Formulate Personalized Plan' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalPlanEditPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single()

  // Check if `id` is a customer_id or plan_id
  let customerId = id
  let planId: string | undefined = undefined
  let customerName = 'Patient'

  // 1. Try finding customer by id
  const { data: cust } = await (supabase as any)
    .from('customers')
    .select('id, user_profiles(full_name)')
    .eq('id', id)
    .single()

  if (cust) {
    customerId = cust.id
    customerName = cust.user_profiles?.full_name ?? 'Patient'
  } else {
    // Try finding plan by id
    const { data: planMaster } = await (supabase as any)
      .from('plans')
      .select('id, customer_id, customers(user_profiles(full_name))')
      .eq('id', id)
      .single()

    if (planMaster) {
      planId = planMaster.id
      customerId = planMaster.customer_id
      customerName = planMaster.customers?.user_profiles?.full_name ?? 'Patient'
    }
  }

  // 2. Fetch existing plan & versions
  const { data: plan } = await (supabase as any)
    .from('plans')
    .select(`
      id,
      plan_versions (
        id,
        version_number,
        status,
        plan_items (
          category,
          instruction,
          internal_notes,
          display_order
        )
      )
    `)
    .eq('customer_id', customerId)
    .limit(1)
    .single()

  if (plan) planId = plan.id

  const versions: any[] = plan?.plan_versions ?? []
  versions.sort((a, b) => b.version_number - a.version_number)
  const latestVer = versions[0]
  const currentVersionNumber = latestVer?.version_number ?? 0

  const initialItems = latestVer?.plan_items?.map((it: any) => ({
    category: it.category,
    instruction: it.instruction,
    internal_notes: it.internal_notes || '',
  })) || []

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/professional/plans" className="btn btn-ghost btn-sm" style={{ marginBottom: 4 }}>
              ← Back to Patient Plans
            </Link>
            <h1 className="text-headline-md">Formulate Personalized Regimen</h1>
            <p className="text-body-sm text-muted">Drafting plan for <strong>{customerName}</strong></p>
          </div>
          <Link href={`/professional/customers/${customerId}`} className="btn btn-secondary btn-sm">
            🩺 Patient Clinical Intake 360
          </Link>
        </div>

        <PlanEditor
          customerId={customerId}
          customerName={customerName}
          planId={planId}
          initialItems={initialItems}
          currentVersionNumber={currentVersionNumber}
        />
      </main>
    </div>
  )
}
