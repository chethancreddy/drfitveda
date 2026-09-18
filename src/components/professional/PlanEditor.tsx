'use client'
// ============================================================
// PlanEditor — Interactive client component to create/edit plan versions
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PlanItem {
  category: string
  instruction: string
  internal_notes?: string
}

interface PlanEditorProps {
  customerId: string
  customerName: string
  planId?: string
  initialItems?: PlanItem[]
  currentVersionNumber?: number
}

const CATEGORIES = [
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'workout',   label: '💪 Workout' },
  { value: 'yoga',      label: '🧘 Yoga' },
  { value: 'sleep',     label: '😴 Sleep' },
  { value: 'lifestyle', label: '✨ Lifestyle' },
  { value: 'water',     label: '💧 Water' },
]

export default function PlanEditor({
  customerId,
  customerName,
  planId,
  initialItems = [],
  currentVersionNumber = 0,
}: PlanEditorProps) {
  const router = useRouter()
  const [items, setItems] = useState<PlanItem[]>(
    initialItems.length > 0
      ? initialItems
      : [
          { category: 'nutrition', instruction: 'Balanced clinical whole-food nutrition plan with seasonal vegetables and optimal hydration.' },
          { category: 'workout',   instruction: 'Morning 30-min brisk walk or light resistance training.' },
          { category: 'yoga',      instruction: 'Surya Namaskar (5 rounds) followed by Pranayama (10 mins).' },
        ]
  )
  const [changeReason, setChangeReason] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0])
  const [publishImmediately, setPublishImmediately] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const addItem = () => {
    setItems([...items, { category: 'lifestyle', instruction: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PlanItem, value: string) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validItems = items.filter(it => it.instruction.trim().length > 0)
      if (validItems.length === 0) {
        throw new Error('Please add at least one instruction to the plan.')
      }

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          plan_id: planId,
          change_reason: changeReason || (currentVersionNumber === 0 ? 'Initial plan formulation' : `Version ${currentVersionNumber + 1} update`),
          effective_from: effectiveFrom,
          status: publishImmediately ? 'published' : 'draft',
          items: validItems.map((it, idx) => ({
            ...it,
            display_order: idx + 1
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save plan')

      setSuccess(true)
      setTimeout(() => {
        router.push('/professional/plans')
        router.refresh()
      }, 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{padding:'var(--space-md)'}}>
      <div style={{marginBottom:'var(--space-md)'}}>
        <h2 className="text-headline-sm" style={{marginBottom:4}}>
          {currentVersionNumber > 0 ? `Create Plan Version ${currentVersionNumber + 1}` : 'Create Initial Plan'}
        </h2>
        <p className="text-body-sm text-muted">
          For patient: <strong>{customerName}</strong>
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{marginBottom:'var(--space-sm)'}}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{marginBottom:'var(--space-sm)'}}>
          Plan version successfully saved and published!
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'var(--space-sm)',marginBottom:'var(--space-md)'}}>
        <div>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>Effective From</label>
          <input
            type="date"
            className="input"
            value={effectiveFrom}
            onChange={e => setEffectiveFrom(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-label-md" style={{display:'block',marginBottom:4}}>Change Reason / Focus</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Added weight training, reduced evening carbs"
            value={changeReason}
            onChange={e => setChangeReason(e.target.value)}
          />
        </div>
      </div>

      {/* Plan Items list */}
      <div style={{marginBottom:'var(--space-md)'}}>
        <div className="flex justify-between items-center" style={{marginBottom:'var(--space-xs)'}}>
          <h3 className="text-label-lg">Plan Instructions ({items.length})</h3>
          <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
            + Add Instruction
          </button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)'}}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display:'flex',
                gap:8,
                alignItems:'flex-start',
                padding:'10px',
                background:'var(--color-neutral)',
                borderRadius:'var(--radius-sm)'
              }}
            >
              <div style={{width:130,flexShrink:0}}>
                <select
                  className="input"
                  value={item.category}
                  onChange={e => updateItem(idx, 'category', e.target.value)}
                  style={{padding:'6px 8px'}}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{flex:1}}>
                <input
                  type="text"
                  className="input"
                  placeholder="Instruction details (e.g. 15 mins Kapalbhati after waking up)"
                  value={item.instruction}
                  onChange={e => updateItem(idx, 'instruction', e.target.value)}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="btn btn-ghost btn-sm"
                title="Remove item"
                style={{color:'var(--color-error)'}}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setPublishImmediately(false)
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            className="btn btn-ghost"
            style={{
              border: '1px solid #cbd5e1',
              padding: '8px 18px',
              fontWeight: 600,
              background: '#f8fafc',
            }}
          >
            {loading && !publishImmediately ? 'Saving Draft…' : '📝 Save as Draft'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setPublishImmediately(true)
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            className="btn btn-primary"
            style={{
              padding: '8px 22px',
              fontWeight: 700,
            }}
          >
            {loading && publishImmediately ? 'Publishing…' : '🚀 Publish to Client & Trainer'}
          </button>
        </div>
      </div>
    </form>
  )
}
