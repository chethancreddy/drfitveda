// ============================================================
// /admin/training/[id] — Admin: Session Detail
// TRD §47.12
// ============================================================
import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Session Detail — Admin' }

export default async function AdminSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await (supabase as any)
    .from('training_sessions')
    .select(`
      id, scheduled_at, started_at, ended_at, status, notes, created_at,
      meeting_url, recording_url,
      customers:customer_id(id, user_profiles(full_name)),
      trainer:trainer_id(full_name)
    `)
    .eq('id', id)
    .single() as {
      data: {
        id: string; scheduled_at: string | null; started_at: string | null; ended_at: string | null
        status: string; notes: string | null; created_at: string
        meeting_url: string | null; recording_url: string | null
        customers: { id: string; user_profiles: { full_name: string } | null } | null
        trainer: { full_name: string } | null
      } | null
    }

  if (!session) notFound()

  const customerName = session.customers?.user_profiles?.full_name ?? '—'
  const trainerName  = session.trainer?.full_name ?? '—'

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <Link href="/admin/training" className="btn btn-ghost btn-sm" style={{marginBottom:'var(--space-xs)'}}>← Back to Training</Link>
          <h1 className="text-headline-md">Session Detail</h1>
          <p className="text-body-md text-muted">{customerName} · {trainerName}</p>
        </div>

        {/* Session metadata */}
        <div className="card" style={{marginBottom:'var(--space-md)'}}>
          <h2 className="text-headline-sm" style={{marginBottom:'var(--space-sm)'}}>Session Info</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))',gap:'var(--space-sm)'}}>
            {[
              { label:'Customer',     value: customerName },
              { label:'Trainer',      value: trainerName },
              { label:'Status',       value: session.status, badge: sc(session.status) },
              { label:'Scheduled',    value: fmt(session.scheduled_at) },
              { label:'Started',      value: fmt(session.started_at) },
              { label:'Ended',        value: fmt(session.ended_at) },
              { label:'Created',      value: fmt(session.created_at) },
            ].map(f => (
              <div key={f.label}>
                <div className="text-label-sm text-muted">{f.label}</div>
                {f.badge
                  ? <span className={`badge badge-${f.badge}`} style={{textTransform:'capitalize'}}>{f.value}</span>
                  : <div className="text-body-sm">{f.value}</div>}
              </div>
            ))}
          </div>
          {session.notes && (
            <div style={{marginTop:'var(--space-sm)',background:'var(--color-surface-2)',borderRadius:8,padding:'var(--space-xs)'}}>
              <div className="text-label-sm text-muted">Notes</div>
              <div className="text-body-sm">{session.notes}</div>
            </div>
          )}
        </div>

        {/* Google Meet — Live & Recording Links */}
        <div className="card">
          <h2 className="text-headline-sm" style={{marginBottom:'var(--space-sm)'}}>Google Meet</h2>
          <p className="text-body-sm text-muted" style={{marginBottom:'var(--space-sm)'}}
          >All sessions are conducted via Google Meet. Paste the session join link and recording link below. These are displayed directly to the customer and trainer.</p>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--space-sm)'}}>
            <div>
              <div className="text-label-sm text-muted" style={{marginBottom:4}}>Session Join Link (Google Meet)</div>
              {session.meeting_url
                ? <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className="text-body-sm" style={{color:'var(--color-primary)',wordBreak:'break-all'}}>{session.meeting_url}</a>
                : <div className="text-body-sm text-muted">No meeting link set. Add via the training session editor.</div>
              }
            </div>
            <div style={{borderTop:'1px dashed var(--color-border)',paddingTop:'var(--space-sm)'}}>
              <div className="text-label-sm text-muted" style={{marginBottom:4}}>Recording Link (Google Meet)</div>
              {session.recording_url
                ? <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="text-body-sm" style={{color:'var(--color-primary)',wordBreak:'break-all'}}>{session.recording_url}</a>
                : <div className="text-body-sm text-muted">No recording link yet. Add the Google Meet recording link here after the session ends.</div>
              }
            </div>
            <div className="alert alert-info" style={{fontSize:12}}>
              <span>ℹ️</span>
              <span>Recording is managed entirely by Google Meet. Dr Fit Veda does not host or process video files. Share the Google Meet recording link with the customer once it is available.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }
function fmt(s: string | null) { return s ? new Date(s).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' }
