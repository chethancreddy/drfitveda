'use client'
import { useState } from 'react'
import Link from 'next/link'
import { REQUEST_TYPES, LEGAL } from '@/lib/legal/config'

export default function DataRequestForm() {
  const [type, setType] = useState('access')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [details, setDetails] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [website, setWebsite] = useState('') // honeypot
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ref, setRef] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/data-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_type: type, name, email, details, confirm, website }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setRef(data.reference)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (ref) {
    return (
      <div className="alert alert-success" role="status">
        <div>
          <strong>Request received. Reference: {ref}</strong>
          <p style={{ margin: '6px 0 0', lineHeight: 1.6 }}>
            We will verify your identity using the phone number or email already on your account — not by asking for
            your password or card details — and aim to respond within 30 days. Quote this reference if you write to{' '}
            {LEGAL.privacyEmail}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div>
        <label htmlFor="dr-type" className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Request type *</label>
        <select id="dr-type" className="input" value={type} onChange={e => setType(e.target.value)}>
          {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="dr-name" className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Full name *</label>
        <input id="dr-name" className="input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={120} required />
      </div>

      <div>
        <label htmlFor="dr-email" className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Email *</label>
        <input id="dr-email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={200} required />
      </div>

      <div>
        <label htmlFor="dr-details" className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Details (optional)</label>
        <textarea id="dr-details" className="input" rows={4} value={details} onChange={e => setDetails(e.target.value)} maxLength={2000}
          placeholder="Tell us what you need. Please do NOT include medical details, passwords or card numbers." />
      </div>

      {/* honeypot — hidden from people */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>Website <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label>
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
        <input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          I agree that Dr Fit Veda may use the details above to verify and process this request, as described in the{' '}
          <Link href="/privacy">Privacy Policy</Link>. *
        </span>
      </label>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}
