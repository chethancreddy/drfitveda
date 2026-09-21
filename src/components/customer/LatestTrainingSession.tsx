'use client'
import { format } from 'date-fns'

interface Props {
  session: {
    scheduled_at: string | null
    trainer: { full_name: string } | null
    meeting_url: string | null
    recording_url: string | null
    status: string
  } | null
  customerId: string | null
}

export default function LatestTrainingSession({ session, customerId }: Props) {
  if (!customerId) {
    return (
      <div className="recording-card">
        <div className="recording-card-title">Latest Training Session</div>
        <div className="recording-empty">Get a membership to access live training sessions.</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="recording-card">
        <div className="recording-card-title">Latest Training Session</div>
        <div className="recording-empty">No training sessions scheduled yet. Your trainer will be in touch once your plan is ready.</div>
      </div>
    )
  }

  const isUpcoming = session.status === 'scheduled'
  const isLive = session.status === 'live'
  const isCompleted = session.status === 'completed'

  return (
    <div className="recording-card">
      <div className="recording-card-title">Latest Training Session</div>

      <div className="recording-meta">
        <div className="recording-meta-row">
          <span>📅</span>
          <span>{session.scheduled_at
            ? format(new Date(session.scheduled_at), 'dd MMM yyyy, hh:mm a')
            : '—'}</span>
        </div>
        <div className="recording-meta-row">
          <span>👤</span>
          <span>{session.trainer?.full_name ?? 'Trainer'}</span>
        </div>
        <div className="recording-meta-row">
          <span>📌</span>
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{session.status}</span>
        </div>
      </div>

      {/* Live right now */}
      {isLive && session.meeting_url && (
        <a
          href={session.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-watch"
          style={{ background: '#dc2626', borderColor: '#dc2626' }}
          id="btn-join-live-session"
        >
          <span>🔴</span> {session.meeting_url.includes('zoho.com') ? 'Join Live on Zoho Meeting' : 'Join Live Session'}
        </a>
      )}

      {/* Upcoming — show join link early */}
      {isUpcoming && session.meeting_url && (
        <a
          href={session.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-watch"
          id="btn-join-upcoming-session"
        >
          <span>📹</span> {session.meeting_url.includes('zoho.com') ? 'Open Zoho Meeting Room' : 'Open Meeting Link'}
        </a>
      )}

      {/* Completed — show recording link if available */}
      {isCompleted && session.recording_url && (
        <a
          href={session.recording_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-watch"
          id="btn-watch-meet-recording"
        >
          <span>▶</span> Watch Session Recording (Google Meet)
        </a>
      )}

      {/* Completed — no recording yet */}
      {isCompleted && !session.recording_url && (
        <div className="recording-empty" style={{ marginTop: 8 }}>
          Session completed. Recording link will appear here once available from Google Meet.
        </div>
      )}

      <div style={{
        marginTop: 12,
        fontSize: 11,
        color: 'var(--color-muted)',
        lineHeight: 1.5,
        borderTop: '1px dashed var(--color-border)',
        paddingTop: 8,
      }}>
        📹 All sessions are conducted and recorded via <strong>Google Meet</strong>.
        Recording links are provided by Google Meet after the session ends.
      </div>
    </div>
  )
}
