// ============================================================
// /admin/reviews — Admin: all weekly reviews with status filter
// TRD §20
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Weekly Reviews — Admin' }

type Review = {
  id: string; review_date: string; status: string; next_review_date: string | null; completed_at: string | null
  customers: { user_profiles: { full_name: string } | null } | null
  doctors: { full_name: string } | null
}

import AdminSidebar from '@/components/admin/AdminSidebar'

function sc(s: string) { return s === 'approved' ? 'success' : s === 'completed' ? 'info' : s === 'due' ? 'warning' : 'neutral' }

export default async function AdminReviewsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await (supabase as any)
    .from('weekly_reviews')
    .select('id, review_date, status, next_review_date, completed_at, customers:customer_id(user_profiles(full_name)), doctors:doctor_id(full_name)')
    .order('review_date', { ascending: false })
    .limit(200)

  const reviews = (raw as Review[] | null) ?? []
  const due       = reviews.filter(r => r.status === 'due').length
  const completed = reviews.filter(r => r.status === 'completed').length
  const approved  = reviews.filter(r => r.status === 'approved').length

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Weekly Reviews</h1>
          <p className="text-body-md text-muted">Platform-wide review status</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Due',       value: due,       badge: 'warning' },
            { label: 'Completed', value: completed, badge: 'info' },
            { label: 'Approved',  value: approved,  badge: 'success' },
            { label: 'Total',     value: reviews.length, badge: 'neutral' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer</th><th>Doctor</th><th>Date</th><th>Status</th><th>Completed</th><th>Next Review</th></tr></thead>
              <tbody>
                {reviews.length ? reviews.map(r => (
                  <tr key={r.id}>
                    <td className="text-body-sm" style={{ fontWeight: 500 }}>{r.customers?.user_profiles?.full_name ?? '—'}</td>
                    <td className="text-body-sm text-muted">{r.doctors?.full_name ?? '—'}</td>
                    <td className="text-body-sm text-muted">{new Date(r.review_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><span className={`badge badge-${sc(r.status)}`} style={{ textTransform: 'capitalize' }}>{r.status}</span></td>
                    <td className="text-body-sm text-muted">{r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td className="text-body-sm text-muted">{r.next_review_date ? new Date(r.next_review_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                  </tr>
                )) : <tr><td colSpan={6}><div className="empty-state" style={{ padding: 'var(--space-sm)' }}>No reviews yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
