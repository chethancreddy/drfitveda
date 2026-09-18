'use client'
import { useState } from 'react'
import Link from 'next/link'
import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'


export default function ContactPage() {
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

                <form onSubmit={(e) => { e.preventDefault(); alert('Thank you! A care coordinator will contact you shortly.') }}>
                  <div className="input-group" style={{marginBottom:12}}>
                    <label className="input-label">Full Name</label>
                    <input type="text" className="input" placeholder="e.g. Priya Sharma" required />
                  </div>

                  <div className="input-group" style={{marginBottom:12}}>
                    <label className="input-label">Phone Number</label>
                    <input type="tel" className="input" placeholder="+91 98765 43210" required />
                  </div>

                  <div className="input-group" style={{marginBottom:12}}>
                    <label className="input-label">Primary Health Focus</label>
                    <select className="input">
                      <option>Weight Loss &amp; Metabolic Health</option>
                      <option>PCOD / Hormonal Balance</option>
                      <option>Diabetes / HbA1c Reversal</option>
                      <option>Therapeutic Yoga &amp; Chronic Pain</option>
                      <option>Naturopathic Gut Health &amp; Clinical Nutrition</option>
                      <option>General Lifestyle Improvement</option>
                    </select>
                  </div>

                  <div className="input-group" style={{marginBottom:16}}>
                    <label className="input-label">Message (Optional)</label>
                    <textarea className="input" rows={3} placeholder="Share any existing conditions or questions..."></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    Request Medical Callback
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
