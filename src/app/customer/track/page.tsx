// ============================================================
// /customer/track — Full Daily Check-In Page with 30-day history
// TRD §19, §29 (Mobile-first, large touch targets)
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DailyCheckIn from '@/components/customer/DailyCheckIn'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'Daily Check-In — Dr Fit Veda' }

type CheckIn = {
  id: string; check_in_date: string
  workout_status: string | null; diet_status: string | null; yoga_status: string | null
  water_status: string | null; energy_level: number | null; mood_level: number | null; note: string | null
}

function statusEmoji(s: string | null) {
  if (s === 'yes') return '✅'
  if (s === 'partial') return '🔶'
  if (s === 'no') return '❌'
  if (s === 'skip') return '⏭'
  return '—'
}
function energyBar(e: number | null) {
  if (!e) return '—'
  const filled = '●'.repeat(e)
  const empty  = '○'.repeat(5 - e)
  return filled + empty
}

export default async function TrackPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers').select('id').eq('user_id', user.id).single() as
    { data: { id: string } | null }
  if (!customer) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [todayCheckInRes, historyRes] = await Promise.all([
    (supabase as any).from('daily_check_ins').select('id').eq('customer_id', customer.id).eq('check_in_date', today).single(),
    (supabase as any).from('daily_check_ins').select('id, check_in_date, workout_status, diet_status, yoga_status, water_status, energy_level, mood_level, note')
      .eq('customer_id', customer.id)
      .gte('check_in_date', thirtyDaysAgo)
      .order('check_in_date', { ascending: false }),
  ])

  const hasDoneToday = !!todayCheckInRes.data
  const history = (historyRes.data as CheckIn[] | null) ?? []

  // Adherence stats
  const adherence = history.length
    ? Math.round(history.filter(c => ['yes', 'partial'].includes(c.workout_status ?? '') || ['yes', 'partial'].includes(c.diet_status ?? '')).length / history.length * 100)
    : 0

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="text-headline-sm" style={{ fontWeight: 600 }}>Daily Check-In</div>
          <div className="badge badge-neutral">{today}</div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-lg)' }}>
        {/* Today's check-in widget */}
        <DailyCheckIn customerId={customer.id} hasDoneToday={hasDoneToday} todayDate={today} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', margin: 'var(--space-sm) 0' }}>
          <div className="stat-card">
            <div className="stat-label">30-Day Adherence</div>
            <div className="stat-value">{adherence}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Days Logged</div>
            <div className="stat-value">{history.length}</div>
          </div>
        </div>

        {/* History table */}
        {history.length > 0 && (
          <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
            <div className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Check-In History</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>💪</th>
                    <th>🥗</th>
                    <th>🧘</th>
                    <th>💧</th>
                    <th>⚡</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(ci => (
                    <tr key={ci.id}>
                      <td className="text-body-sm" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {new Date(ci.check_in_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td>{statusEmoji(ci.workout_status)}</td>
                      <td>{statusEmoji(ci.diet_status)}</td>
                      <td>{statusEmoji(ci.yoga_status)}</td>
                      <td>{statusEmoji(ci.water_status)}</td>
                      <td className="text-body-sm text-muted" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{energyBar(ci.energy_level)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <CustomerBottomNav active="track" />
    </div>
  )
}
