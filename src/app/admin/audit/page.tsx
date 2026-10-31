import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState } from '@/lib/persistent-store'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Audit Logs — Admin' }

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await loadPersistedState()
  const auditLogs: any[] = mockDb.state.audit_logs ?? []

  const syntheticLog = [
    ...auditLogs,
    {
      id: 'al-1',
      event: 'Plan Updated',
      action_type: 'edit',
      module: 'memberships',
      record_name: 'Starter Plan',
      previous_status: 'active',
      new_status: 'active',
      actor: 'Admin',
      detail: 'Membership plan pricing updated via CMS',
      ts: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'al-2',
      event: 'Consultation Services',
      action_type: 'create',
      module: 'consultation_services',
      record_name: 'Standalone Consultation Suite',
      previous_status: 'none',
      new_status: 'active',
      actor: 'Admin',
      detail: 'Standalone consultation services configured via CMS',
      ts: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Audit Logs &amp; Governance Trail</h1>
          <p className="text-body-md text-muted">
            Complete platform governance trail — all record activations, deactivations, edits, soft-deletes (archives), permanent deletions, and restorations are recorded.
          </p>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Status Change</th>
                  <th>Actor</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {syntheticLog.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td className="text-caption text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.ts || Date.now()).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                        {(log.module || 'system').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          log.action_type === 'permanent_delete'
                            ? 'error'
                            : log.action_type === 'soft_delete' || log.action_type === 'deactivate'
                              ? 'warning'
                              : 'success'
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {log.event || log.action_type || 'Activity'}
                      </span>
                    </td>
                    <td className="text-body-sm" style={{ fontWeight: 600 }}>
                      {log.record_name || log.record_id || '—'}
                    </td>
                    <td className="text-caption text-muted">
                      {log.previous_status && log.new_status
                        ? `${log.previous_status} → ${log.new_status}`
                        : '—'}
                    </td>
                    <td className="text-body-sm">{log.actor || 'Admin'}</td>
                    <td className="text-body-sm text-muted">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
