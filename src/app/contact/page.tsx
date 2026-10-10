'use client'
import { useState } from 'react'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [healthFocus, setHealthFocus] = useState('Weight Loss & Metabolic Health')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('') // Honeypot field for spam prevention

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successReference, setSuccessReference] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!consent) {
      setError('Please agree to the consultation callback terms.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          health_focus: healthFocus,
          message: message.trim(),
          consent,
          website: website.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setSuccessReference(data.reference || 'RECEIVED')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or call our helpline.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setName('')
    setPhone('')
    setMessage('')
    setConsent(false)
    setWebsite('')
    setError(null)
    setSuccessReference(null)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <PublicHeader active="contact" />

      <main style={{flex:1}}>
        <section style={{
          background: 'linear-gradient(160deg, #453421 0%, #2a1f12 60%, #1a1208 100%)',
          color: 'white',
          padding: 'var(--space-xl) 0',
          textAlign: 'center'
        }}>
          <div className="container" style={{maxWidth:680}}>
            <span className="chip chip-accent" style={{marginBottom:'var(--space-xs)',display:'inline-flex'}}>
              📞 We Are Here to Guide You
            </span>
            <h1 className="text-display" style={{color:'white',marginBottom:'var(--space-sm)'}}>
              Contact Dr Fit Veda
            </h1>
            <p className="text-body-lg" style={{color:'rgba(255,255,255,0.8)'}}>
              Speak with a medical intake counselor to determine if our doctor-guided programs are right for your health condition.
            </p>
          </div>
        </section>

        <section style={{padding:'var(--space-xl) 0',background:'var(--surface-page)'}}>
          <div className="container" style={{maxWidth:860}}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
              gap:'var(--space-lg)'
            }}>
              {/* Contact Information */}
              <div className="card" style={{padding:'var(--space-lg)'}}>
                <h2 className="text-headline-sm" style={{marginBottom:16}}>Direct Assistance</h2>

                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  <div>
                    <div className="text-label-md text-muted" style={{marginBottom:2}}>Medical Coordinator Helpline</div>
                    <div className="text-headline-sm" style={{fontSize:18,color:'var(--color-primary)'}}>+91 1800-FIT-VEDA</div>
                    <div className="text-caption text-muted">Mon–Sat: 8:00 AM – 8:00 PM IST</div>
                  </div>

                  <div>
                    <div className="text-label-md text-muted" style={{marginBottom:2}}>Email Inquiries</div>
                    <div className="text-body-md" style={{fontWeight:600}}>care@drfitveda.com</div>
                    <div className="text-caption text-muted">Responses within 4 business hours</div>
                  </div>

                  <div>
                    <div className="text-label-md text-muted" style={{marginBottom:2}}>Clinical Headquarters</div>
                    <p className="text-body-sm text-muted" style={{margin:0}}>
                      Dr Fit Veda Holistic Health Services Ltd.<br/>
                      Health &amp; Wellness Tower, Indiranagar, Bangalore, Karnataka 560038
                    </p>
                  </div>
                </div>

                <div className="divider" style={{margin:'var(--space-md) 0'}} />

                <div>
                  <div className="text-label-md" style={{marginBottom:8}}>Already Enrolled?</div>
                  <p className="text-body-sm text-muted" style={{marginBottom:12}}>
                    Sign into your patient portal to message your assigned doctor directly or schedule a teleconsultation.
                  </p>
                  <Link href="/login" className="btn btn-secondary btn-sm">Access Patient Portal →</Link>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="card" style={{padding:'var(--space-lg)'}}>
                <h2 className="text-headline-sm" style={{marginBottom:12}}>Request Consultation Callback</h2>
                <p className="text-body-sm text-muted" style={{marginBottom:16}}>
                  Leave your details and a medical coordinator will contact you within 24 hours.
                </p>

                {successReference ? (
                  <div style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <h3 className="text-headline-sm" style={{ color: '#166534', marginBottom: 6 }}>
                      Inquiry Received
                    </h3>
                    <p className="text-body-sm" style={{ color: '#15803d', marginBottom: 14 }}>
                      Thank you! A care coordinator will review your health focus and reach out to you within 24 hours.
                    </p>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: '#dcfce7',
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#166534',
                      marginBottom: 16,
                    }}>
                      Ref: {successReference}
                    </div>
                    <div>
                      <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
                        Submit another inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        color: '#b91c1c',
                        fontSize: 13,
                        marginBottom: 14,
                      }}>
                        ⚠️ {error}
                      </div>
                    )}

                    {/* Bot Honeypot — hidden from real users */}
                    <div style={{ display: 'none' }} aria-hidden="true">
                      <label htmlFor="contact-website">Website</label>
                      <input
                        id="contact-website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                      />
                    </div>

                    <div className="input-group" style={{marginBottom:12}}>
                      <label className="input-label" htmlFor="contact-name">Full Name *</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="input"
                        placeholder="e.g. Priya Sharma"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                      />
                    </div>

                    <div className="input-group" style={{marginBottom:12}}>
                      <label className="input-label" htmlFor="contact-phone">Phone Number *</label>
                      <input
                        id="contact-phone"
                        type="tel"
                        className="input"
                        placeholder="+91 98765 43210"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="input-group" style={{marginBottom:12}}>
                      <label className="input-label" htmlFor="contact-focus">Primary Health Focus *</label>
                      <select
                        id="contact-focus"
                        className="input"
                        value={healthFocus}
                        onChange={e => setHealthFocus(e.target.value)}
                      >
                        <option>Weight Loss &amp; Metabolic Health</option>
                        <option>PCOD / Hormonal Balance</option>
                        <option>Diabetes / HbA1c Reversal</option>
                        <option>Therapeutic Yoga &amp; Chronic Pain</option>
                        <option>Naturopathic Gut Health &amp; Clinical Nutrition</option>
                        <option>General Lifestyle Improvement</option>
                      </select>
                    </div>

                    <div className="input-group" style={{marginBottom:12}}>
                      <label className="input-label" htmlFor="contact-message">Message (Optional)</label>
                      <textarea
                        id="contact-message"
                        className="input"
                        rows={3}
                        placeholder="Share any existing conditions or questions..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      />
                    </div>

                    <label style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:12.5,lineHeight:1.5,marginBottom:16}}>
                      <input
                        type="checkbox"
                        required
                        id="contact-consent"
                        style={{marginTop:3}}
                        checked={consent}
                        onChange={e => setConsent(e.target.checked)}
                      />
                      <span>
                        I agree that Dr Fit Veda may use my name, phone number and any health information I enter to contact me
                        about my enquiry, as described in the <Link href="/privacy">Privacy Policy</Link>. Our guidance is
                        not emergency care — see the <Link href="/disclaimer">Medical Disclaimer</Link>. *
                      </span>
                    </label>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                      {loading ? 'Submitting Request...' : 'Request Medical Callback'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
