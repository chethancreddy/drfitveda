// ============================================================
// /admin/payouts — Admin: full payout ledger with approve/pay actions
// TRD §15: Pending → Approved → Paid
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import PayoutActions from '@/components/admin/PayoutActions'

export const metadata: Metadata = { title: 'Payouts — Admin' }

type Payout = {
  id: string; payout_type: string; amount: number; currency: string; status: string
  service_date: string | null; paid_at: string | null; approved_at: string | null
  professionals: { full_name: string; role: string } | null
  customers: { user_profiles: { full_name: string } | null } | null
}

import AdminSidebar from '@/components/admin/AdminSidebar'

function ps(s: string) { return s === 'paid' ? 'success' : s === 'approved' ? 'info' : s === 'pending' ? 'warning' : 'neutral' }
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) }

export default async function AdminPayoutsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: raw } = await (supabase as any)
    .from('payouts')
    .select('id, payout_type, amount, currency, status, service_date, paid_at, approved_at, professionals:professional_id(full_name, role), customers:customer_id(user_profiles(full_name))')
    .order('created_at', { ascending: false })

  const payouts = (raw as Payout[] | null) ?? []
  const pending  = payouts.filter(p => p.status === 'pending')
  const approved = payouts.filter(p => p.status === 'approved')
  const paid     = payouts.filter(p => p.status === 'paid')
  const totalPending  = pending.reduce((s, p) => s + p.amount, 0)
  const totalApproved = approved.reduce((s, p) => s + p.amount, 0)
  const totalPaid     = paid.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Payouts</h1>
          <p className="text-body-md text-muted">Manage professional payment disbursements</p>
        </div>

        {/* Summary */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Pending',  value: fmt(totalPending),  count: pending.length,  warn: true },
            { label: 'Approved', value: fmt(totalApproved), count: approved.length, warn: false },
            { label: 'Paid',     value: fmt(totalPaid),     count: paid.length,     warn: false },
            { label: 'Total',    value: fmt(payouts.reduce((s, p) => s + p.amount, 0)), count: payouts.length, warn: false },
          ].map(s => (
            <div key={s.label} className="stat-card" style={s.warn && s.count > 0 ? { borderColor: 'var(--color-warning)' } : {}}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="text-caption text-muted">{s.count} payouts</div>
            </div>
          ))}
        </div>

        {/* Payouts table */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Professional</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length ? payouts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="text-body-sm" style={{ fontWeight: 500 }}>{p.professionals?.full_name ?? '—'}</div>
                      <div className="text-caption text-muted" style={{ textTransform: 'capitalize' }}>{p.professionals?.role?.replace(/_/g, ' ') ?? ''}</div>
                    </td>
                    <td className="text-body-sm text-muted">{p.customers?.user_profiles?.full_name ?? '—'}</td>
                    <td className="text-body-sm text-muted" style={{ textTransform: 'capitalize' }}>{p.payout_type.replace(/_/g, ' ')}</td>
                    <td className="text-body-sm" style={{ fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td className="text-body-sm text-muted">{p.service_date ? new Date(p.service_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td><span className={`badge badge-${ps(p.status)}`} style={{ textTransform: 'capitalize' }}>{p.status}</span></td>
                    <td><PayoutActions payoutId={p.id} status={p.status} /></td>
                  </tr>
                )) : <tr><td colSpan={7}><div className="empty-state" style={{ padding: 'var(--space-sm)' }}>No payouts yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
