import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Weekly Reviews — Professional Portal' }
export const dynamic = 'force-dynamic'

type Review = {
  id: string
  review_date: string
  status: string
  next_review_date: string | null
  customers: { user_profiles: { full_name: string } | null } | null
}

function sc(s: string) {
  return s === 'approved' ? 'success' : s === 'completed' ? 'info' : s === 'due' ? 'warning' : 'neutral'
}

export default async function ProfessionalReviewsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals').select('id, full_name, role').eq('user_id', user.id).single() as
    { data: { id: string; full_name: string; role: string } | null }
  if (!professional) redirect('/login')

  const { data: raw } = await (supabase as any)
    .from('weekly_reviews')
    .select('id, review_date, status, next_review_date, customers:customer_id(user_profiles(full_name))')
    .eq('doctor_id', professional.id)
    .order('review_date', { ascending: false })
    .limit(100)

  const reviews = (raw as Review[] | null) ?? []
  const due = reviews.filter(r => r.status === 'due')
  const completed = reviews.filter(r => r.status === 'completed')
  const approved = reviews.filter(r => r.status === 'approved')

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional.full_name}
        userRole={professional.role}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Weekly Doctor Reviews</h1>
            <p className="text-body-md text-muted">Weekly adherence evaluations and biomarker tracking by {professional.full_name}</p>
          </div>
          <Link href="/professional/customers" className="btn btn-secondary btn-sm">
            🩺 Patient Intake Records
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Reviews Due', value: due.length, badge: 'warning' },
            { label: 'Completed (Pending Approval)', value: completed.length, badge: 'info' },
            { label: 'Approved & Finalized', value: approved.length, badge: 'success' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Review list */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer / Patient</th>
                  <th>Review Date</th>
                  <th>Status</th>
                  <th>Next Review</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length ? reviews.map(r => {
                  const name = r.customers?.user_profiles?.full_name ?? '—'
                  return (
                    <tr key={r.id}>
                      <td><span className="text-body-sm" style={{ fontWeight: 600 }}>{name}</span></td>
                      <td className="text-body-sm text-muted">
                        {new Date(r.review_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`badge badge-${sc(r.status)}`} style={{ textTransform: 'capitalize' }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-body-sm text-muted">
                        {r.next_review_date ? new Date(r.next_review_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <Link href={`/professional/reviews/${r.id}`} className="btn btn-ghost btn-sm">
                          Evaluate →
                        </Link>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={5}><div className="empty-state">No reviews assigned yet.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
