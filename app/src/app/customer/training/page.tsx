import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import LatestTrainingSession from '@/components/customer/LatestTrainingSession'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'Training' }

export default async function CustomerTrainingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers').select('id').eq('user_id', user.id).single() as { data: { id: string } | null }

  // Fetch sessions including Google Meet links
  const { data: sessRaw } = customer ? await (supabase as any)
    .from('training_sessions')
    .select('id, scheduled_at, status, notes, meeting_url, recording_url, trainer:trainer_id(full_name)')
    .eq('customer_id', customer.id)
    .order('scheduled_at', { ascending: false }) : { data: [] }

  const sessions = (sessRaw as {
    id: string
    scheduled_at: string | null
    status: string
    notes: string | null
    meeting_url: string | null
    recording_url: string | null
    trainer: { full_name: string } | null
  }[] | null) ?? []

  // Latest session for the hero card
  const latestSession = sessions[0] ?? null

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <h1 className="text-headline-sm">Training</h1>
          <Link href="/customer" className="btn btn-ghost btn-sm">← Home</Link>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 'var(--space-sm)' }}>
        {/* Latest session hero card — Google Meet links */}
        <LatestTrainingSession
          customerId={customer?.id ?? null}
          session={latestSession}
        />

        {/* Session history */}
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>Session History</h2>
          {sessions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {sessions.map(s => {
                const tName = s.trainer?.full_name ?? 'Trainer'
                const isCompleted = s.status === 'completed'
                const isLive = s.status === 'live'
                return (
                  <div key={s.id} className="card-neutral" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-label-md">{tName}</div>
                      <div className="text-body-sm text-muted">
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                      {s.notes && <div className="text-caption text-muted" style={{ marginTop: 2 }}>{s.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Recording link */}
                      {isCompleted && s.recording_url && (
                        <a
                          href={s.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          ▶ Recording
                        </a>
                      )}
                      {/* Join live */}
                      {(isLive || s.status === 'scheduled') && s.meeting_url && (
                        <a
                          href={s.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          {isLive ? '🔴 Join Live' : '📹 Meet Link'}
                        </a>
                      )}
                      <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'live' ? 'warning' : s.status === 'cancelled' ? 'error' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🎥</div>
              <p className="text-body-md text-muted">No training sessions yet.</p>
              <p className="text-body-sm text-muted">Your trainer will schedule sessions once your plan is ready.</p>
            </div>
          )}
        </div>

        {/* Google Meet note */}
        <div style={{
          marginTop: 'var(--space-sm)',
          padding: '12px 16px',
          background: 'var(--color-neutral)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          color: 'var(--color-muted)',
          lineHeight: 1.55,
        }}>
          📹 <strong>All sessions are on Google Meet.</strong> Join links appear before the session. Recording links (shared by Google Meet) appear here after the session is completed.
        </div>
      </main>

      <CustomerBottomNav active="plan" />
    </div>
  )
}
