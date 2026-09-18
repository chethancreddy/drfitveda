// ============================================================
// /professional/reviews/[id] — Doctor: conduct weekly review
// TRD §20 — complete + approve flow
// ============================================================
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReviewForm from '@/components/professional/ReviewForm'

export const metadata: Metadata = { title: 'Weekly Review — Professional Portal' }

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals').select('id, full_name').eq('user_id', user.id).single() as
    { data: { id: string; full_name: string } | null }
  if (!professional) redirect('/login')

  const { data: review } = await (supabase as any)
    .from('weekly_reviews')
    .select(`
      id, review_date, status, adherence_notes, doctor_notes, outcome,
      next_review_date, completed_at, approved_at, new_plan_version_id,
      customers:customer_id(id, user_profiles(full_name)),
      plan_versions:plan_version_id(version_number, status, plan_items(category, instruction, display_order)),
      new_version:new_plan_version_id(version_number)
    `)
    .eq('id', id)
    .eq('doctor_id', professional.id)
    .single() as {
      data: {
        id: string; review_date: string; status: string
        adherence_notes: string | null; doctor_notes: string | null; outcome: string | null
        next_review_date: string | null; completed_at: string | null; approved_at: string | null
        new_plan_version_id: string | null
        customers: { id: string; user_profiles: { full_name: string } | null } | null
        plan_versions: { version_number: number; status: string; plan_items: { category: string; instruction: string; display_order: number }[] } | null
        new_version: { version_number: number } | null
      } | null
    }

  if (!review) notFound()

  // Last 7 check-ins for this customer
  const { data: checkIns } = await (supabase as any)
    .from('daily_check_ins')
    .select('check_in_date, workout_status, diet_status, yoga_status, water_status, energy_level, note')
    .eq('customer_id', review.customers?.id)
    .order('check_in_date', { ascending: false })
    .limit(7) as {
      data: { check_in_date: string; workout_status: string | null; diet_status: string | null; yoga_status: string | null; water_status: string | null; energy_level: number | null; note: string | null }[] | null
    }

  const customerName = review.customers?.user_profiles?.full_name ?? '—'

  function se(s: string | null) { return s === 'yes' ? '✅' : s === 'partial' ? '🔶' : s === 'no' ? '❌' : '—' }

  return (
    <div className="app-layout">
      <aside className="sidebar hide-mobile">
        <div className="logo" style={{ padding: '8px 0', marginBottom: 'var(--space-sm)' }}>
          <div className="logo-mark">DV</div>
          <div className="logo-text">Dr Fit Veda</div>
        </div>
        <Link href="/professional" className="sidebar-item">🏠 Dashboard</Link>
        <Link href="/professional/reviews" className="sidebar-item active">📋 Weekly Reviews</Link>
      </aside>

      <main className="app-main">
        <div className="page-header">
          <Link href="/professional/reviews" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-xs)' }}>← Back to Reviews</Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-headline-md">Review: {customerName}</h1>
              <p className="text-body-md text-muted">
                {new Date(review.review_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`badge badge-${sc(review.status)}`} style={{ textTransform: 'capitalize', fontSize: '0.85rem', padding: '4px 10px' }}>{review.status}</span>
          </div>
        </div>

        {/* Check-in summary */}
        {(checkIns?.length ?? 0) > 0 && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Last 7 Check-Ins</h2>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>💪</th><th>🥗</th><th>🧘</th><th>💧</th><th>⚡</th><th>Notes</th></tr></thead>
                <tbody>
                  {checkIns!.map((ci, i) => (
                    <tr key={i}>
                      <td className="text-body-sm" style={{ whiteSpace: 'nowrap' }}>{new Date(ci.check_in_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td>{se(ci.workout_status)}</td>
                      <td>{se(ci.diet_status)}</td>
                      <td>{se(ci.yoga_status)}</td>
                      <td>{se(ci.water_status)}</td>
                      <td className="text-body-sm">{ci.energy_level ?? '—'}/5</td>
                      <td className="text-body-sm text-muted">{ci.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Current plan */}
        {review.plan_versions && (
          <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Current Plan (v{review.plan_versions.version_number})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {review.plan_versions.plan_items.sort((a, b) => a.display_order - b.display_order).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span>{catIcon(item.category)}</span>
                  <span className="text-body-sm" style={{ lineHeight: 1.4 }}>{item.instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review form / completed view */}
        <ReviewForm reviewId={review.id} status={review.status}
          existingNotes={{ adherence: review.adherence_notes, doctor: review.doctor_notes, outcome: review.outcome, nextReviewDate: review.next_review_date }}
        />
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'approved' ? 'success' : s === 'completed' ? 'info' : s === 'due' ? 'warning' : 'neutral' }
function catIcon(cat: string) { const m: Record<string, string> = { nutrition: '🥗', workout: '💪', yoga: '🧘', sleep: '😴', water: '💧', lifestyle: '✨' }; return m[cat] ?? '📌' }
