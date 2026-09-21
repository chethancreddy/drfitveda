import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Live Training & Google Meet Sessions' }
export const dynamic = 'force-dynamic'

type Rec = { id: string; recording_status: string; is_active: boolean }
type Sess = {
  id: string
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  status: string
  meeting_url: string | null
  recording_url: string | null
  customers: { user_profiles: { full_name: string } | null } | null
  training_recordings: Rec[] | null
}

export default async function ProfessionalTrainingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single() as { data: { id: string; full_name: string; role: string } | null }
  if (!professional) redirect('/login')

  const { data: sessRaw } = await (supabase as any)
    .from('training_sessions')
    .select('id, scheduled_at, started_at, ended_at, status, meeting_url, recording_url, customers:customer_id(user_profiles(full_name)), training_recordings(id, recording_status, is_active)')
    .eq('trainer_id', professional.id)
    .order('scheduled_at', { ascending: false })

  const sessions = (sessRaw as Sess[] | null) ?? []

  const stats = {
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    live: sessions.filter(s => s.status === 'live').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  }

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional.full_name}
        userRole={professional.role}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Live Training &amp; Zoho Meeting</h1>
            <p className="text-body-md text-muted">Sessions and video calls conducted for {professional.full_name}</p>
          </div>
          <Link href="/professional/training/new" className="btn btn-primary">+ New Session</Link>
        </div>

        {/* Stats row */}
        <div className="grid-3" style={{ marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Upcoming Scheduled', value: stats.scheduled, badge: 'neutral' },
            { label: 'Live Now', value: stats.live, badge: 'warning' },
            { label: 'Completed Sessions', value: stats.completed, badge: 'success' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Session table */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer / Patient</th>
                  <th>Date &amp; Time</th>
                  <th>Session Status</th>
                  <th>Zoho Meeting Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length ? sessions.map(s => {
                  const name = s.customers?.user_profiles?.full_name ?? 'Patient'
                  const meetUrl = s.meeting_url || (s.customers as any)?.zoho_meeting_url || 'https://meet.zoho.com/fitveda-priya-sharma'
                  return (
                    <tr key={s.id}>
                      <td><span className="text-body-sm" style={{ fontWeight: 600 }}>{name}</span></td>
                      <td className="text-body-sm text-muted">
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td><span className={`badge badge-${sc(s.status)}`} style={{ textTransform: 'capitalize' }}>{s.status}</span></td>
                      <td>
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#0d9488', fontWeight: 600 }}
                        >
                          📹 Join Zoho Room
                        </a>
                      </td>
                      <td>
                        <Link href={`/professional/training/${s.id}`} className="btn btn-ghost btn-sm">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                        <div className="empty-state-icon">🎥</div>
                        <p className="text-body-md text-muted">No sessions yet. Create your first session.</p>
                        <Link href="/professional/training/new" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-xs)' }}>
                          + New Session
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }
