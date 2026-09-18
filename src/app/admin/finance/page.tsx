// ============================================================
// /admin/finance — Compensation Rule Versions + live allocation preview
// TRD §9, §11, §14
// ============================================================
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FinancialAllocationService } from '@/lib/services/financial.service'

export const metadata: Metadata = { title: 'Finance — Admin' }

type Component = { id: string; component_code: string; component_name: string; role: string | null; amount_type: string; amount: number; is_active: boolean }
type RuleVersion = { id: string; name: string; effective_from: string; effective_to: string | null; is_active: boolean; created_at: string; payout_rule_components: Component[] }

import AdminSidebar from '@/components/admin/AdminSidebar'

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) }

export default async function AdminFinancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rules } = await (supabase as any)
    .from('compensation_rule_versions')
    .select('id, name, effective_from, effective_to, is_active, created_at, payout_rule_components(id, component_code, component_name, role, amount_type, amount, is_active)')
    .order('effective_from', { ascending: false }) as { data: RuleVersion[] | null }

  const allRules = rules ?? []

  // Live preview with current active rule
  let activeRule: RuleVersion | null = null
  let companyAllocation: number | null = null
  try {
    const rv = await FinancialAllocationService.getActiveRuleVersion()
    activeRule = allRules.find(r => r.id === rv.id) ?? null
    if (activeRule) {
      const comps = await FinancialAllocationService.getPayoutComponents(activeRule.id)
      companyAllocation = FinancialAllocationService.calculateCompanyAllocation(9999, comps, 0)
    }
  } catch { /* no active rule yet */ }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="text-headline-md">Compensation Rules</h1>
            <p className="text-body-md text-muted">Manage payout components and rule versions</p>
          </div>
          <Link href="/admin/finance/new" className="btn btn-primary">+ New Rule Version</Link>
        </div>

        {/* Live allocation preview */}
        {activeRule && (
          <div className="card" style={{ marginBottom: 'var(--space-md)', borderColor: 'var(--color-primary)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="text-headline-sm">Current Allocation Preview — {fmt(9999)} membership</div>
              <span className="badge badge-success">Active: {activeRule.name}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 'var(--space-xs)' }}>
              {activeRule.payout_rule_components.filter(c => c.is_active).map(c => (
                <div key={c.id} className="stat-card">
                  <div className="stat-label">{c.component_name}</div>
                  <div className="stat-value">{c.amount_type === 'fixed' ? fmt(c.amount) : `${c.amount}%`}</div>
                  <div className="text-caption text-muted" style={{ textTransform: 'capitalize' }}>{c.role ?? 'company'}</div>
                </div>
              ))}
              {companyAllocation !== null && (
                <div className="stat-card" style={{ borderColor: 'var(--color-success)' }}>
                  <div className="stat-label">Company Allocation</div>
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>{fmt(companyAllocation)}</div>
                  <div className="text-caption text-muted">auto-calculated</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All rule versions */}
        {allRules.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
            <div className="empty-state-icon">💰</div>
            <p className="text-body-md text-muted">No compensation rules yet.</p>
            <Link href="/admin/finance/new" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-xs)' }}>Create First Rule Version</Link>
          </div>
        ) : allRules.map(rule => (
          <div key={rule.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
              <div>
                <div className="text-label-lg" style={{ fontWeight: 600 }}>{rule.name}</div>
                <div className="text-body-sm text-muted">
                  Effective: {rule.effective_from}{rule.effective_to ? ` → ${rule.effective_to}` : ' (no end date)'}
                </div>
              </div>
              <span className={`badge badge-${rule.is_active ? 'success' : 'neutral'}`}>{rule.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Component</th><th>Role</th><th>Amount</th><th>Type</th><th>Active</th></tr></thead>
                <tbody>
                  {rule.payout_rule_components.length ? rule.payout_rule_components.map(c => (
                    <tr key={c.id}>
                      <td className="text-body-sm" style={{ fontWeight: 500 }}>{c.component_name}</td>
                      <td className="text-body-sm text-muted" style={{ textTransform: 'capitalize' }}>{c.role?.replace(/_/g, ' ') ?? '—'}</td>
                      <td className="text-body-sm" style={{ fontWeight: 600 }}>{c.amount_type === 'fixed' ? fmt(c.amount) : `${c.amount}%`}</td>
                      <td><span className="badge badge-neutral">{c.amount_type}</span></td>
                      <td>{c.is_active ? '✅' : '—'}</td>
                    </tr>
                  )) : <tr><td colSpan={5} className="text-muted text-body-sm">No components</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
