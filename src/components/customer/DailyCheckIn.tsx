'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  customerId: string | null
  hasDoneToday: boolean
  todayDate: string
}

const ITEMS = [
  { key:'workout_status', label:'Workout', icon:'💪' },
  { key:'diet_status',    label:'Diet',    icon:'🥗' },
  { key:'yoga_status',    label:'Yoga',    icon:'🧘' },
  { key:'water_status',   label:'Water',   icon:'💧' },
] as const

type ItemKey = typeof ITEMS[number]['key']
type CheckIn = 'yes' | 'partial' | 'no' | 'skip'

const OPTIONS: { value: CheckIn; label: string; emoji: string }[] = [
  { value:'yes',     label:'Done',    emoji:'✅' },
  { value:'partial', label:'Partial', emoji:'🔶' },
  { value:'no',      label:'Missed',  emoji:'❌' },
  { value:'skip',    label:'Skip',    emoji:'⏭' },
]

export default function DailyCheckIn({ customerId, hasDoneToday, todayDate }: Props) {
  const [statuses, setStatuses] = useState<Partial<Record<ItemKey, CheckIn>>>({})
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(hasDoneToday)
  const [error, setError] = useState<string | null>(null)

  if (!customerId) return null

  const handleSave = async () => {
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error: err } = await (supabase as any)
      .from('daily_check_ins')
      .upsert({
        customer_id: customerId,
        check_in_date: todayDate,
        ...statuses,
        energy_level: energy,
        note: note || null,
      }, { onConflict: 'customer_id,check_in_date' })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="alert alert-success" style={{borderRadius:'var(--radius-md)'}}>
        <span style={{fontSize:20}}>✅</span>
        <div><div className="text-label-md">Today&apos;s check-in complete!</div><div className="text-body-sm">Great job staying on track today.</div></div>
      </div>
    )
  }

  return (
    <div className="card" style={{padding:'var(--space-md)'}}>
      <div className="flex justify-between items-center" style={{marginBottom:'var(--space-sm)'}}>
        <div><div className="text-headline-sm">Daily Check-In</div><div className="text-body-sm text-muted">Takes about 30 seconds</div></div>
        <span className="badge badge-warning">Today</span>
      </div>
      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-xs)'}}><span>⚠</span><span>{error}</span></div>}
      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)'}}>
        {ITEMS.map(item => (
          <div key={item.key} style={{display:'flex',alignItems:'center',gap:'var(--space-xs)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,width:100,flexShrink:0}}>
              <span style={{fontSize:18}}>{item.icon}</span>
              <span className="text-label-sm">{item.label}</span>
            </div>
            <div style={{display:'flex',gap:6,flex:1,flexWrap:'wrap'}}>
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatuses(s => ({...s, [item.key]: opt.value}))}
                  className={`checkin-option${statuses[item.key] === opt.value ? ` selected-${opt.value}` : ''}`}
                  style={{flex:1,minWidth:56}}
                  aria-label={`${item.label}: ${opt.label}`}
                >
                  <span style={{fontSize:16}}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:'var(--space-xs)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,width:100,flexShrink:0}}>
            <span style={{fontSize:18}}>⚡</span>
            <span className="text-label-sm">Energy</span>
          </div>
          <div style={{flex:1,display:'flex',alignItems:'center',gap:12}}>
            <input type="range" min={1} max={5} value={energy} onChange={e => setEnergy(Number(e.target.value))} style={{flex:1,accentColor:'var(--color-primary)'}} aria-label="Energy level" />
            <span style={{width:36,height:36,background:'var(--color-neutral)',borderRadius:'var(--radius-full)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,flexShrink:0}}>{energy}</span>
          </div>
        </div>
        <textarea className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note… how are you feeling today?" rows={2} style={{marginTop:4}} aria-label="Daily note" />
      </div>
      <button className="btn btn-primary btn-full" style={{marginTop:'var(--space-sm)'}} onClick={handleSave} disabled={loading} id="btn-submit-checkin">
        {loading ? <><span className="spinner" style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white'}}></span>&nbsp;Saving…</> : 'Submit Check-In'}
      </button>
    </div>
  )
}
