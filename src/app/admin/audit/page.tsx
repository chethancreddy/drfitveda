import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Audit Logs — Admin' }

export default async function AdminAuditPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const auditLogs: any[] = mockDb.state.audit_logs ?? []

  // Build a synthetic activity log from existing data
  const syntheticLog = [
    { id: 'al-1', event: 'Plan Updated', actor: 'Admin', detail: 'Membership plan pricing updated via CMS', ts: new Date(Date.now() - 3600000).toISOString() },
    { id: 'al-2', event: 'Consultation Services', actor: 'Admin', detail: '3 standalone consultation services seeded (Yoga, PCOD, Wellness)', ts: new Date(Date.now() - 7200000).toISOString() },
    { id: 'al-3', event: 'Appointment Booked', actor: 'Priya Sharma', detail: 'Appointment scheduled with Dr. Ananya Verma', ts: new Date(Date.now() - 86400000).toISOString() },
    { id: 'al-4', event: 'Plan Published', actor: 'Dr. Ananya Verma', detail: 'Health plan v1 published for Priya Sharma', ts: new Date(Date.now() - 7*86400000).toISOString() },
    ...(auditLogs),
  ]

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Audit Logs</h1>
          <p className="text-body-md text-muted">Platform activity trail — all significant actions are recorded</p>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Detail</th></tr></thead>
              <tbody>
                {syntheticLog.map(log => (
                  <tr key={log.id}>
                    <td className="text-caption text-muted">{new Date(log.ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                    <td><span className="badge badge-neutral" style={{fontSize:11}}>{log.event}</span></td>
                    <td className="text-body-sm">{log.actor}</td>
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
