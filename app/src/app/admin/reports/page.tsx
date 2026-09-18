import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Reports — Admin' }

export default async function AdminReportsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Aggregate stats from mock-db
  const customers = mockDb.state.customers ?? []
  const payouts = mockDb.state.payouts ?? []
  const sessions = mockDb.state.training_sessions ?? []
  const memberships = mockDb.state.memberships ?? []
  const checkIns = mockDb.state.daily_check_ins ?? []

  const totalRevenue = memberships.reduce((sum: number, m: any) => sum + (m.price ?? 0), 0)
  const totalPayouts = payouts.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)
  const activeCustomers = customers.filter((c: any) => c.membership_status === 'active').length
  const completedSessions = sessions.filter((s: any) => s.status === 'completed').length

  const stats = [
    { label: 'Total Customers', value: customers.length, icon: '👥', color: 'var(--color-primary)' },
    { label: 'Active Members', value: activeCustomers, icon: '✅', color: 'var(--color-success)' },
    { label: 'Sessions Completed', value: completedSessions, icon: '🎥', color: '#7c3aed' },
    { label: 'Check-ins Logged', value: checkIns.length, icon: '📋', color: '#2563eb' },
    { label: 'Total Payouts (₹)', value: `₹${totalPayouts.toLocaleString('en-IN')}`, icon: '💵', color: '#d97706' },
    { label: 'Plan Configurations', value: memberships.length, icon: '💳', color: '#059669' },
  ]

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Platform Reports</h1>
          <p className="text-body-md text-muted">Overview of platform activity, revenue, and engagement</p>
        </div>

        <div className="grid-3" style={{marginBottom:'var(--space-md)'}}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="flex items-center gap-xs">
                <span style={{fontSize:24}}>{s.icon}</span>
                <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="alert alert-info">
          <span>📊</span>
          <div>
            <strong>Advanced Analytics</strong>
            <p className="text-body-sm" style={{margin:'4px 0 0'}}>Full revenue reports, cohort analysis, and export functionality will be available when connected to Supabase. Currently showing local dev data.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
