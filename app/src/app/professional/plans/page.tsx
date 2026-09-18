import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Personalized Plans Management' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalPlansPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single()

  // Get assigned customers
  const { data: assignments } = professional
    ? await (supabase as any)
        .from('professional_assignments')
        .select(`
          id,
          customer_id,
          customers (
            id,
            membership_status,
            user_profiles ( full_name, phone )
          )
        `)
        .eq('professional_id', professional.id)
        .eq('is_active', true)
    : { data: [] }

  const assignList: any[] = assignments ?? []

  // Fetch all plans for these customers
  const customerIds = assignList.map(a => a.customer_id)
  const { data: plans } = customerIds.length > 0
    ? await (supabase as any)
        .from('plans')
        .select(`
          id,
          customer_id,
          plan_versions (
            id,
            version_number,
            status,
            change_reason,
            effective_from,
            created_at
          )
        `)
        .in('customer_id', customerIds)
    : { data: [] }

  const plansByCustomer: Record<string, any> = {}
  ;(plans ?? []).forEach((p: any) => {
    plansByCustomer[p.customer_id] = p
  })

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Personalized Naturopathic Regimens</h1>
            <p className="text-body-md text-muted">
              Manage clinical nutrition, daily detox, workout, yoga, and fasting regimens for your assigned patients.
            </p>
          </div>
          <Link href="/professional/customers" className="btn btn-secondary btn-sm">
            🩺 Patient Intake Records
          </Link>
        </div>

        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Membership</th>
                  <th>Active Plan Version</th>
                  <th>Status</th>
                  <th>Effective Date</th>
                  <th>Doctor Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignList.length > 0 ? (
                  assignList.map(a => {
                    const cust = a.customers
                    const plan = plansByCustomer[a.customer_id]
                    const versions: any[] = plan?.plan_versions ?? []
                    versions.sort((x, y) => y.version_number - x.version_number)
                    const activeVer = versions.find(v => v.status === 'published') || versions[0]

                    return (
                      <tr key={a.id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{cust?.user_profiles?.full_name ?? 'Patient'}</span>
                          {cust?.user_profiles?.phone && (
                            <div className="text-caption text-muted">{cust.user_profiles.phone}</div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${cust?.membership_status === 'active' ? 'success' : 'neutral'}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {cust?.membership_status ?? 'Active'}
                          </span>
                        </td>
                        <td>
                          {activeVer ? (
                            <span className="text-label-md">v{activeVer.version_number}</span>
                          ) : (
                            <span className="text-caption text-muted">No plan drafted</span>
                          )}
                        </td>
                        <td>
                          {activeVer ? (
                            <span
                              className={`badge badge-${activeVer.status === 'published' ? 'success' : 'warning'}`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {activeVer.status}
                            </span>
                          ) : (
                            <span className="badge badge-neutral">Pending</span>
                          )}
                        </td>
                        <td className="text-body-sm text-muted">
                          {activeVer?.effective_from
                            ? new Date(activeVer.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td>
                          <div className="flex gap-xs">
                            <Link
                              href={`/professional/plans/${a.customer_id}`}
                              className="btn btn-primary btn-sm"
                            >
                              {activeVer ? 'Edit / New Version' : '+ Formulate Plan'}
                            </Link>
                            <Link
                              href={`/professional/customers/${a.customer_id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              Intake 360 →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">No assigned patients found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
