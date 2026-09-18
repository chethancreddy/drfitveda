import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import SessionActionPanel from '@/components/professional/SessionActionPanel'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Manage Session — Doctor & Professional Portal' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals').select('id, full_name, role').eq('user_id', user.id).single() as
    { data: { id: string; full_name: string; role: string } | null }
  if (!professional) redirect('/login')

  const { data: session } = await (supabase as any)
    .from('training_sessions')
    .select('id, scheduled_at, started_at, ended_at, status, notes, meeting_url, customers:customer_id(id, user_profiles(full_name)), training_recordings(id, recording_status, is_active, storage_key, duration_seconds, file_size_bytes, activated_at, deactivated_at, deleted_at)')
    .eq('id', id)
    .eq('trainer_id', professional.id)
    .single() as {
      data: {
        id: string
        scheduled_at: string | null
        started_at: string | null
        ended_at: string | null
        status: string
        notes: string | null
        meeting_url: string | null
        customers: { id: string; user_profiles: { full_name: string } | null } | null
        training_recordings: {
          id: string
          recording_status: string
          is_active: boolean
          storage_key: string
          duration_seconds: number | null
          file_size_bytes: number | null
          activated_at: string | null
          deactivated_at: string | null
          deleted_at: string | null
        }[] | null
      } | null
    }

  if (!session) notFound()

  const recording = session.training_recordings?.[0] ?? null
  const customerName = session.customers?.user_profiles?.full_name ?? '—'
  const meetUrl = session.meeting_url || 'https://meet.google.com/fit-veda-priya'

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional.full_name}
        userRole={professional.role}
      />

      <main className="app-main">
        <div className="page-header">
          <Link href="/professional/training" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-xs)' }}>
            ← Back to sessions
          </Link>
          <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
            <div>
              <h1 className="text-headline-md">Session: {customerName}</h1>
              <p className="text-body-md text-muted">
                {session.scheduled_at
                  ? new Date(session.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Unscheduled session'}
              </p>
            </div>
            <span className={`badge badge-${sc(session.status)}`} style={{ textTransform: 'capitalize', fontSize: '0.85rem', padding: '4px 10px' }}>
              {session.status}
            </span>
          </div>
        </div>

        {/* Dedicated Google Meet Link */}
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📹</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                Google Meet Video Consultation Room
              </div>
              <div style={{ fontSize: 12, color: '#047857', wordBreak: 'break-all' }}>
                {meetUrl}
              </div>
            </div>
          </div>
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            Launch Google Meet →
          </a>
        </div>

        {/* Session info card */}
        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Session Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <div>
              <div className="text-label-sm text-muted">Customer</div>
              <div className="text-body-md" style={{ fontWeight: 600 }}>{customerName}</div>
            </div>
            <div>
              <div className="text-label-sm text-muted">Status</div>
              <div><span className={`badge badge-${sc(session.status)}`} style={{ textTransform: 'capitalize' }}>{session.status}</span></div>
            </div>
            {session.started_at && (
              <div>
                <div className="text-label-sm text-muted">Started</div>
                <div className="text-body-md">{new Date(session.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )}
            {session.ended_at && (
              <div>
                <div className="text-label-sm text-muted">Ended</div>
                <div className="text-body-md">{new Date(session.ended_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            )}
          </div>
          {session.notes && (
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: 'var(--space-xs)' }}>
              <div className="text-label-sm text-muted" style={{ marginBottom: 4 }}>Notes</div>
              <div className="text-body-sm">{session.notes}</div>
            </div>
          )}
        </div>

        {/* Action panel */}
        <SessionActionPanel
          sessionId={session.id}
          sessionStatus={session.status}
          recording={recording ? {
            id: recording.id,
            recording_status: recording.recording_status,
            is_active: recording.is_active,
          } : null}
        />
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }
