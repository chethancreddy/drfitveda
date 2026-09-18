import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminRetentionSettings from '@/components/admin/AdminRetentionSettings'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Training Management' }

export default async function AdminTrainingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessRaw } = await (supabase as any)
    .from('training_sessions')
    .select('id, scheduled_at, status, customers:customer_id(user_profiles(full_name)), trainer:trainer_id(full_name), training_recordings(id, recording_status, is_active, activated_at, deactivated_at, deleted_at, file_size_bytes)')
    .order('scheduled_at', { ascending: false })
    .limit(50)

  const sessions = (sessRaw as { id: string; scheduled_at: string | null; status: string; customers: { user_profiles: { full_name: string } | null } | null; trainer: { full_name: string } | null; training_recordings: { id: string; recording_status: string; is_active: boolean; activated_at: string | null; deactivated_at: string | null; deleted_at: string | null; file_size_bytes: number | null }[] | null }[] | null) ?? []

  const { data: retentionConfig } = await (supabase as any)
    .from('training_retention_config').select('*').eq('config_key', 'default_retention_policy').single() as { data: { id: string; retention_mode: 'immediate' | 'grace_period'; grace_period_hours: number | null } | null }

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div><h1 className="text-headline-md">Training Management</h1><p className="text-body-md text-muted">Sessions, recordings, and retention settings</p></div>
        </div>

        <AdminRetentionSettings config={retentionConfig} />

        <div className="card">
          <h2 className="text-headline-sm" style={{marginBottom:'var(--space-sm)'}}>All Training Sessions</h2>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer</th><th>Trainer</th><th>Session Date</th><th>Session Status</th><th>Recording Status</th><th>Video</th><th>Actions</th></tr></thead>
              <tbody>
                {sessions.length ? sessions.map(s => {
                  const rec = s.training_recordings?.[0]
                  const cName = s.customers?.user_profiles?.full_name ?? '—'
                  const tName = s.trainer?.full_name ?? '—'
                  return (
                    <tr key={s.id}>
                      <td className="text-body-sm" style={{fontWeight:500}}>{cName}</td>
                      <td className="text-body-sm text-muted">{tName}</td>
                      <td className="text-body-sm text-muted">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                      <td><span className={`badge badge-${sc(s.status)}`} style={{textTransform:'capitalize'}}>{s.status}</span></td>
                      <td>
                        {rec ? (
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span className={`status-dot ${rec.recording_status === 'available' ? 'active' : rec.recording_status === 'processing' ? 'processing' : 'inactive'}`}></span>
                            <span className="text-body-sm" style={{textTransform:'capitalize'}}>{rec.recording_status}</span>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {rec?.deleted_at ? <span className="badge badge-neutral" title={`Deleted ${new Date(rec.deleted_at).toLocaleDateString()}`}>Deleted</span>
                          : rec?.is_active ? <span className="badge badge-success">Active</span>
                          : rec ? <span className="badge badge-neutral">Inactive</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td><Link href={`/admin/training/${s.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                    </tr>
                  )
                }) : <tr><td colSpan={7}><div className="empty-state" style={{padding:'var(--space-sm)'}}>No sessions yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }
