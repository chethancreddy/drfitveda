'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RetentionConfig {
  id?: string
  retention_mode: 'immediate' | 'grace_period'
  grace_period_hours: number | null
}

export default function AdminRetentionSettings({ config }: { config: RetentionConfig | null }) {
  const [mode, setMode] = useState<'immediate'|'grace_period'>(config?.retention_mode ?? 'grace_period')
  const [hours, setHours] = useState(config?.grace_period_hours ?? 24)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const save = async () => {
    setSaving(true); setSaved(false); setError(null)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('training_retention_config')
      .upsert({
        config_key: 'default_retention_policy',
        retention_mode: mode,
        grace_period_hours: mode === 'grace_period' ? hours : null,
      }, { onConflict: 'config_key' })
    if (err) { setError(err.message) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  return (
    <div className="form-section" style={{marginBottom:'var(--space-md)'}}>
      <div className="form-section-title">Recording Retention Settings</div>
      <p className="text-body-sm text-muted">
        Configure how long old recordings are kept before being deleted from storage.
        Session metadata is always retained permanently regardless of this setting.
      </p>
      {error && <div className="alert alert-error"><span>⚠</span><span>{error}</span></div>}
      {saved && <div className="alert alert-success"><span>✓</span><span>Retention settings saved.</span></div>}
      <div style={{display:'flex',gap:'var(--space-sm)',flexWrap:'wrap'}}>
        <div className="input-group" style={{flex:1,minWidth:220}}>
          <label className="input-label">Retention Mode</label>
          <select className="input" value={mode} onChange={e => setMode(e.target.value as 'immediate'|'grace_period')} id="retention-mode">
            <option value="grace_period">Grace Period (keep for N hours before deleting)</option>
            <option value="immediate">Immediate (delete as soon as replaced)</option>
          </select>
        </div>
        {mode === 'grace_period' && (
          <div className="input-group" style={{width:200}}>
            <label className="input-label">Grace Period (hours)</label>
            <input id="grace-period-hours" type="number" className="input" min={1} max={8760} value={hours} onChange={e => setHours(Number(e.target.value))} />
          </div>
        )}
      </div>
      <div>
        <div className="alert alert-info" style={{marginBottom:'var(--space-sm)'}}>
          <span>ℹ</span>
          <div>
            <div className="text-label-sm">Current policy:</div>
            <div className="text-body-sm">
              {mode === 'immediate' ? 'Old recordings are deleted immediately when a new recording is published.' : `Old recordings are deleted ${hours} hour${hours !== 1 ? 's' : ''} after being replaced by a new recording.`}
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving} id="btn-save-retention">
          {saving ? <><span className="spinner" style={{width:16,height:16}}></span>&nbsp;Saving…</> : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
