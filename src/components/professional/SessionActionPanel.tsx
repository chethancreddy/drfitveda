'use client'
// ============================================================
// SessionActionPanel — Client component for trainer session actions
// TRD §47.11: Status controls + recording link + publish
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type RecordingInfo = { id: string; recording_status: string; is_active: boolean }

interface Props {
  sessionId: string
  sessionStatus: string
  recording: RecordingInfo | null
}

export default function SessionActionPanel({ sessionId, sessionStatus, recording }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Recording link form state
  const [storageKey, setStorageKey] = useState('')
  const [fileSizeMb, setFileSizeMb] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [showLinkForm, setShowLinkForm] = useState(false)

  async function updateStatus(newStatus: string) {
    setBusy(newStatus); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/training-sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setSuccess(`Session marked as ${newStatus}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  async function linkRecording() {
    if (!storageKey.trim()) { setError('Storage key is required'); return }
    setBusy('link'); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/training-recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          storage_key: storageKey.trim(),
          file_size_bytes: fileSizeMb ? Math.round(parseFloat(fileSizeMb) * 1024 * 1024) : undefined,
          duration_seconds: durationMin ? Math.round(parseFloat(durationMin) * 60) : undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setSuccess('Recording linked. You can now publish it to the customer.')
      setShowLinkForm(false)
      setStorageKey(''); setFileSizeMb(''); setDurationMin('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  async function publishRecording() {
    if (!recording) return
    setBusy('publish'); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/training-recordings/${recording.id}/activate`, {
        method: 'PATCH',
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      setSuccess('Recording published! Customer can now watch it.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const isCancelled = sessionStatus === 'cancelled'
  const isCompleted = sessionStatus === 'completed'

  return (
    <div className="card">
      <h2 className="text-headline-sm" style={{marginBottom:'var(--space-sm)'}}>Actions</h2>

      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>{success}</div>}

      {!isCancelled && (
        <div style={{display:'flex',flexWrap:'wrap',gap:'var(--space-xs)',marginBottom:'var(--space-sm)'}}>

          {/* Scheduled → Mark Live */}
          {sessionStatus === 'scheduled' && (
            <button
              className="btn btn-warning"
              onClick={() => updateStatus('live')}
              disabled={busy !== null}
              id="btn-mark-live"
            >
              {busy === 'live' ? 'Updating…' : '🟡 Mark as Live'}
            </button>
          )}

          {/* Live → Mark Completed */}
          {sessionStatus === 'live' && (
            <button
              className="btn btn-success"
              onClick={() => updateStatus('completed')}
              disabled={busy !== null}
              id="btn-mark-completed"
            >
              {busy === 'completed' ? 'Updating…' : '✅ Mark as Completed'}
            </button>
          )}

          {/* Cancel (not already cancelled / completed) */}
          {(sessionStatus === 'scheduled' || sessionStatus === 'live') && (
            <button
              className="btn btn-ghost"
              style={{color:'var(--color-error)'}}
              onClick={() => {
                if (window.confirm('Cancel this session?')) updateStatus('cancelled')
              }}
              disabled={busy !== null}
              id="btn-cancel-session"
            >
              {busy === 'cancelled' ? 'Cancelling…' : '✕ Cancel Session'}
            </button>
          )}
        </div>
      )}

      {/* Recording actions — only after session is live or completed */}
      {(sessionStatus === 'live' || isCompleted) && !isCancelled && (
        <>
          <hr style={{border:'none',borderTop:'1px solid var(--color-border)',margin:'var(--space-sm) 0'}} />
          <div className="text-label-md" style={{marginBottom:'var(--space-xs)'}}>Recording</div>

          {!recording && !showLinkForm && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowLinkForm(true)}
              id="btn-link-recording"
            >
              🎥 Link Recording
            </button>
          )}

          {showLinkForm && (
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)',maxWidth:400}}>
              <div className="form-group">
                <label className="form-label" htmlFor="storage-key">Storage Key (bucket path) *</label>
                <input
                  id="storage-key"
                  className="form-input"
                  value={storageKey}
                  onChange={e => setStorageKey(e.target.value)}
                  placeholder="recordings/customer-id/session-id.mp4"
                />
              </div>
              <div style={{display:'flex',gap:'var(--space-xs)'}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label" htmlFor="file-size">File size (MB)</label>
                  <input id="file-size" type="number" min="0" step="0.1" className="form-input" value={fileSizeMb} onChange={e => setFileSizeMb(e.target.value)} placeholder="e.g. 512" />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label" htmlFor="duration">Duration (min)</label>
                  <input id="duration" type="number" min="0" step="1" className="form-input" value={durationMin} onChange={e => setDurationMin(e.target.value)} placeholder="e.g. 45" />
                </div>
              </div>
              <div style={{display:'flex',gap:'var(--space-xs)'}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={linkRecording} disabled={busy === 'link'} id="btn-submit-recording">
                  {busy === 'link' ? 'Linking…' : 'Link Recording'}
                </button>
              </div>
            </div>
          )}

          {/* Publish (activate) — only if recording exists and not yet active/available */}
          {recording && !recording.is_active && recording.recording_status !== 'deleted' && (
            <div style={{marginTop:'var(--space-xs)'}}>
              <button
                className="btn btn-success btn-sm"
                onClick={publishRecording}
                disabled={busy === 'publish'}
                id="btn-publish-recording"
              >
                {busy === 'publish' ? 'Publishing…' : '📢 Publish Recording to Customer'}
              </button>
              <div className="text-body-sm text-muted" style={{marginTop:4}}>
                This will make the recording visible to the customer and deactivate any previous recording.
              </div>
            </div>
          )}

          {recording?.is_active && (
            <div className="alert alert-success" style={{marginTop:'var(--space-xs)'}}>
              ✅ Recording is live — customer can watch it now.
            </div>
          )}
        </>
      )}
    </div>
  )
}
