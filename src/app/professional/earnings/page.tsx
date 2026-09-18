import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'My Earnings — Professional Portal' }
export const dynamic = 'force-dynamic'

type Payout = {
  id: string
  payout_type: string
  amount: number
  currency: string
  status: string
  service_date: string | null
  paid_at: string | null
  customers: { user_profiles: { full_name: string } | null } | null
}

function ps(s: string) {
  return s === 'paid' ? 'success' : s === 'approved' ? 'info' : s === 'pending' ? 'warning' : 'neutral'
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default async function EarningsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals').select('id, full_name, role').eq('user_id', user.id).single() as
    { data: { id: string; full_name: string; role: string } | null }
  if (!professional) redirect('/login')

  const { data: raw } = await (supabase as any)
    .from('payouts')
    .select('id, payout_type, amount, currency, status, service_date, paid_at, customers:customer_id(user_profiles(full_name))')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })

  const payouts = (raw as Payout[] | null) ?? []
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter(p => ['pending', 'approved'].includes(p.status)).reduce((s, p) => s + p.amount, 0)
  const totalAll = payouts.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional.full_name}
        userRole={professional.role}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">My Earnings &amp; Payouts</h1>
            <p className="text-body-md text-muted">Compensation ledger for {professional.full_name}</p>
          </div>
          <Link href="/professional/customers" className="btn btn-secondary btn-sm">
            🩺 My Patients
          </Link>
        </div>

        {/* Totals */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-label">Total Earned &amp; Disbursed</div>
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{fmt(totalPaid)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value">{fmt(totalPending)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cumulative Total</div>
            <div className="stat-value">{fmt(totalAll)}</div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer / Patient</th>
                  <th>Service Type</th>
                  <th>Service Date</th>
                  <th>Amount</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length ? payouts.map(p => {
                  const name = p.customers?.user_profiles?.full_name ?? '—'
                  return (
                    <tr key={p.id}>
                      <td><span className="text-body-sm" style={{ fontWeight: 600 }}>{name}</span></td>
                      <td>
                        <span className="text-body-sm" style={{ textTransform: 'capitalize' }}>
                          {p.payout_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-body-sm text-muted">
                        {p.service_date ? new Date(p.service_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="text-body-sm" style={{ fontWeight: 700 }}>{fmt(p.amount)}</td>
                      <td>
                        <span className={`badge badge-${ps(p.status)}`} style={{ textTransform: 'capitalize' }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={5}><div className="empty-state">No earnings records yet.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
