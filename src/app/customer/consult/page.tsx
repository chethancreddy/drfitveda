import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import BookAppointmentModal from '@/components/customer/BookAppointmentModal'

export const metadata: Metadata = { title: 'Doctor Consultations' }

export default async function CustomerConsultPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  // Fetch all appointments for customer
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      duration_min,
      status,
      notes,
      meeting_url,
      professionals (
        id,
        full_name,
        role,
        specialization
      ),
      consultation_notes (
        id,
        notes,
        recommendations,
        follow_up_date
      )
    `)
    .eq('customer_id', customer.id)
    .order('scheduled_at', { ascending: false })

  // Fetch available professionals for booking
  const { data: profs } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role, specialization')
    .eq('is_available', true)
    .order('full_name')

  // Fetch consultation services from API (works with mock-db)
  let consultationServices: any[] = []
  try {
    const csRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/consultation-services`, { cache: 'no-store' })
    if (csRes.ok) {
      const csData = await csRes.json()
      consultationServices = csData.consultation_services ?? []
    }
  } catch {
    // fallback: show nothing (not critical)
  }

  const apptList: any[] = appointments ?? []
  const profList: any[] = profs ?? []

  const upcoming = apptList.filter(a => a.status === 'scheduled' && new Date(a.scheduled_at) >= new Date())
  const past = apptList.filter(a => a.status !== 'scheduled' || new Date(a.scheduled_at) < new Date())

  const CONSULT_ICON: Record<string, string> = { yoga: '🧘', pcod: '🩺', wellness: '💚' }

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Clinical Guidance</div>
              <h1 className="text-headline-sm" style={{fontWeight:600}}>Doctor Consultations</h1>
            </div>
          </div>
          <BookAppointmentModal
            professionals={profList}
            customerId={customer.id}
          />
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-xl)'}}>

        {/* Standalone Consultation Services */}
        {consultationServices.length > 0 && (
          <div style={{marginBottom:'var(--space-lg)'}}>
            <div style={{marginBottom:'var(--space-sm)'}}>
              <h2 className="text-label-lg" style={{marginBottom:4}}>Specialist Consultations</h2>
              <p className="text-body-sm text-muted">Book a standalone session — separate from your membership trainer sessions</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'var(--space-sm)'}}>
              {consultationServices.map((c: any) => (
                <div key={c.id} className="card" style={{padding:'var(--space-md)',border:'1px solid var(--color-border)',display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{fontSize:28}}>{CONSULT_ICON[c.category] ?? '🏥'}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{c.name}</div>
                    <p className="text-caption text-muted" style={{lineHeight:1.5}}>{c.description}</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,borderTop:'1px dashed var(--color-border)',marginTop:'auto'}}>
                    <div>
                      <span style={{fontWeight:800,fontSize:20,color:'var(--color-primary)'}}>₹{c.price}</span>
                      <span className="text-caption text-muted"> / {c.duration_min} min</span>
                    </div>
                    <BookAppointmentModal
                      professionals={profList.filter((p:any) => p.role === 'doctor')}
                      customerId={customer.id}
                      consultationType={c.name}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:'10px 16px',background:'var(--color-neutral)',borderRadius:'var(--radius-sm)'}}>
              <p className="text-caption text-muted">
                📹 All consultations via <strong>Google Meet</strong>. Recorded and shared post-session. Yoga, PCOD/PCOS & Wellness are <strong>separate from</strong> your membership trainer sessions.
              </p>
            </div>
          </div>
        )}


        {/* Upcoming appointments */}
        <div style={{marginBottom:'var(--space-md)'}}>
          <h2 className="text-label-lg" style={{marginBottom:'var(--space-xs)'}}>Upcoming Appointments</h2>
          {upcoming.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)'}}>
              {upcoming.map(a => {
                const dateObj = new Date(a.scheduled_at)
                return (
                  <div key={a.id} className="card" style={{padding:'var(--space-md)',borderLeft:'4px solid var(--color-primary)'}}>
                    <div className="flex justify-between items-start" style={{marginBottom:8}}>
                      <div>
                        <div className="text-headline-sm" style={{fontSize:18,fontWeight:600}}>
                          {a.professionals?.full_name ?? 'Doctor'}
                        </div>
                        <div className="text-body-sm text-muted" style={{textTransform:'capitalize'}}>
                          {a.professionals?.role?.replace('_', ' ')} {a.professionals?.specialization ? `• ${a.professionals.specialization}` : ''}
                        </div>
                      </div>
                      <span className="badge badge-warning">Scheduled</span>
                    </div>

                    <div style={{display:'flex',flexWrap:'wrap',gap:16,marginBottom:12}}>
                      <div className="text-body-sm">
                        📅 {dateObj.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                      </div>
                      <div className="text-body-sm">
                        ⏰ {dateObj.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })} ({a.duration_min} mins)
                      </div>
                    </div>

                    {a.notes && (
                      <p className="text-body-sm text-muted" style={{marginBottom:12}}>
                        Topic: {a.notes}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <a
                        href={a.meeting_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        🎥 Join Video Consultation
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{padding:'var(--space-md)',textAlign:'center'}}>
              <p className="text-body-sm text-muted">No upcoming consultations scheduled.</p>
            </div>
          )}
        </div>

        {/* Past consultations */}
        <div>
          <h2 className="text-label-lg" style={{marginBottom:'var(--space-xs)'}}>Past Consultations ({past.length})</h2>
          {past.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)'}}>
              {past.map(a => {
                const dateObj = new Date(a.scheduled_at)
                const notes = a.consultation_notes?.[0]
                return (
                  <div key={a.id} className="card" style={{padding:'var(--space-md)'}}>
                    <div className="flex justify-between items-start" style={{marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:600}}>
                          {a.professionals?.full_name ?? 'Doctor'}
                        </div>
                        <div className="text-caption text-muted">
                          {dateObj.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                        </div>
                      </div>
                      <span className={`badge badge-${a.status === 'completed' ? 'success' : 'neutral'}`} style={{textTransform:'capitalize'}}>
                        {a.status}
                      </span>
                    </div>

                    {notes && (
                      <div style={{marginTop:8,padding:'8px 12px',background:'var(--color-neutral)',borderRadius:'var(--radius-sm)'}}>
                        {notes.recommendations && (
                          <div style={{marginBottom:4}}>
                            <span className="text-label-md">Doctor Advice: </span>
                            <span className="text-body-sm">{notes.recommendations}</span>
                          </div>
                        )}
                        {notes.follow_up_date && (
                          <div className="text-caption text-muted">
                            Next suggested follow-up: {new Date(notes.follow_up_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{padding:'var(--space-md)',textAlign:'center'}}>
              <p className="text-body-sm text-muted">No consultation history yet.</p>
            </div>
          )}
        </div>
      </main>

      <CustomerBottomNav active="consult" />
    </div>
  )
}
