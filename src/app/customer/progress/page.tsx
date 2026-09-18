// ============================================================
// /customer/progress — Weight & Measurement Progress Page
// TRD §7 (Customer data access)
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import ProgressLogForm from '@/components/customer/ProgressLogForm'

export const metadata: Metadata = { title: 'My Progress — Dr Fit Veda' }

type ProgressRecord = {
  id: string; recorded_date: string
  weight_kg: number | null; height_cm: number | null; notes: string | null
  measurements: Record<string, number> | null
}

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers').select('id').eq('user_id', user.id).single() as
    { data: { id: string } | null }
  if (!customer) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('customer_profiles')
    .select('weight_kg, height_cm, bmi')
    .eq('customer_id', customer.id)
    .single() as { data: { weight_kg: number | null; height_cm: number | null; bmi: number | null } | null }

  const { data: records } = await (supabase as any)
    .from('progress_records')
    .select('id, recorded_date, weight_kg, height_cm, notes, measurements')
    .eq('customer_id', customer.id)
    .order('recorded_date', { ascending: false })
    .limit(50) as { data: ProgressRecord[] | null }

  const history = records ?? []
  const latest = history[0]
  const currentWeight = latest?.weight_kg ?? profile?.weight_kg ?? null
  const currentBmi    = profile?.bmi ?? null

  // Simple trend
  const first = history.filter(r => r.weight_kg != null).slice(-1)[0]
  const last  = history.filter(r => r.weight_kg != null)[0]
  const trend = first && last && first.id !== last.id && last.weight_kg != null && first.weight_kg != null
    ? +(last.weight_kg - first.weight_kg).toFixed(2)
    : null

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="text-headline-sm" style={{ fontWeight: 600 }}>My Progress</div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-lg)' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
          <div className="stat-card">
            <div className="stat-label">Current Weight</div>
            <div className="stat-value">{currentWeight != null ? `${currentWeight} kg` : '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">BMI</div>
            <div className="stat-value">{currentBmi ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Change</div>
            <div className="stat-value" style={{ color: trend != null ? (trend < 0 ? 'var(--color-success)' : 'var(--color-warning)') : undefined }}>
              {trend != null ? `${trend > 0 ? '+' : ''}${trend} kg` : '—'}
            </div>
          </div>
        </div>

        {/* Log new entry */}
        <ProgressLogForm />

        {/* History */}
        {history.length > 0 && (
          <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
            <div className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Progress History</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Date</th><th>Weight</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id}>
                      <td className="text-body-sm" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.recorded_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="text-body-sm">{r.weight_kg != null ? `${r.weight_kg} kg` : '—'}</td>
                      <td className="text-body-sm text-muted">{r.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <CustomerBottomNav active="progress" />
    </div>
  )
}
