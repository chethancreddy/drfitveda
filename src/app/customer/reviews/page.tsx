// ============================================================
// /customer/reviews — Customer: view their past weekly reviews
// TRD §20
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'My Reviews — Dr Fit Veda' }

type Review = {
  id: string; review_date: string; status: string
  doctor_notes: string | null; outcome: string | null; next_review_date: string | null
  doctors: { full_name: string } | null
}

function sc(s: string) { return s === 'approved' ? 'success' : s === 'completed' ? 'info' : s === 'due' ? 'warning' : 'neutral' }

export default async function CustomerReviewsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers').select('id').eq('user_id', user.id).single() as { data: { id: string } | null }
  if (!customer) redirect('/login')

  const { data: raw } = await (supabase as any)
    .from('weekly_reviews')
    .select('id, review_date, status, doctor_notes, outcome, next_review_date, doctors:doctor_id(full_name)')
    .eq('customer_id', customer.id)
    .order('review_date', { ascending: false })
    .limit(50)

  const reviews = (raw as Review[] | null) ?? []

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="text-headline-sm" style={{ fontWeight: 600 }}>My Reviews</div>
          <span className="badge badge-neutral">{reviews.length} total</span>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-lg)' }}>
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
            <div className="empty-state-icon">📋</div>
            <p className="text-body-md text-muted">No reviews yet. Your doctor will create your first review.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {reviews.map(r => (
              <div key={r.id} className="card">
                <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="text-label-md" style={{ fontWeight: 600 }}>
                      {new Date(r.review_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-body-sm text-muted">by {r.doctors?.full_name ?? '—'}</div>
                  </div>
                  <span className={`badge badge-${sc(r.status)}`} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                </div>
                {r.doctor_notes && (
                  <div style={{ background: 'var(--color-neutral)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                    <div className="text-label-sm text-muted" style={{ marginBottom: 4 }}>Doctor&apos;s Notes</div>
                    <div className="text-body-sm">{r.doctor_notes}</div>
                  </div>
                )}
                {r.outcome && (
                  <div className="text-body-sm"><span className="text-label-sm text-muted">Outcome: </span>{r.outcome}</div>
                )}
                {r.next_review_date && (
                  <div className="text-body-sm text-muted" style={{ marginTop: 4 }}>
                    Next review: {new Date(r.next_review_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <CustomerBottomNav active="home" />
    </div>
  )
}
