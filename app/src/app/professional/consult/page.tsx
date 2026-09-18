import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ConsultationActionPanel from '@/components/professional/ConsultationActionPanel'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Consultations & Clinical Appointments' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalConsultPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single()

  // Fetch appointments for this professional
  const { data: appointments } = professional
    ? await (supabase as any)
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          duration_min,
          status,
          notes,
          meeting_url,
          customer_id,
          customers (
            id,
            membership_status,
            user_profiles ( full_name, phone )
          ),
          consultation_notes (
            id,
            notes,
            recommendations,
            follow_up_date
          )
        `)
        .eq('professional_id', professional.id)
        .order('scheduled_at', { ascending: false })
    : { data: [] }

  const apptList: any[] = appointments ?? []
  const upcoming = apptList.filter(a => a.status === 'scheduled')
  const completed = apptList.filter(a => a.status !== 'scheduled')

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Doctor Consultations &amp; Google Meet</h1>
            <p className="text-body-md text-muted">
              Live one-on-one naturopathy and clinical diagnostics conducted via Google Meet.
            </p>
          </div>
          <Link href="/professional/customers" className="btn btn-secondary btn-sm">
            🩺 Patient Intake 360
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>
            Upcoming Video Consultations ({upcoming.length})
          </h2>

          {upcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {upcoming.map(a => {
                const dateObj = new Date(a.scheduled_at)
                const patientName = a.customers?.user_profiles?.full_name ?? 'Patient'
                const phone = a.customers?.user_profiles?.phone
                const meetUrl = a.meeting_url || 'https://meet.google.com/fit-veda-priya'

                return (
                  <div key={a.id} className="card" style={{ padding: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-sm)' }}>
                      <div>
                        <div className="text-headline-sm" style={{ color: '#0f172a' }}>{patientName}</div>
                        <div className="text-body-sm text-muted">
                          {phone ? `${phone} • ` : ''}
                          Membership: <strong style={{ textTransform: 'capitalize' }}>{a.customers?.membership_status || 'active'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <a
                          href={meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ fontWeight: 700 }}
                        >
                          📹 Join Google Meet Now
                        </a>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <span className="text-caption text-muted">Scheduled Time:</span>
                        <div style={{ fontWeight: 600 }}>{dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div>
                        <span className="text-caption text-muted">Duration:</span>
                        <div style={{ fontWeight: 600 }}>{a.duration_min || 30} mins</div>
                      </div>
                      <div>
                        <span className="text-caption text-muted">Meeting Room:</span>
                        <div style={{ color: '#0d9488', fontWeight: 600 }}>{meetUrl}</div>
                      </div>
                    </div>

                    <ConsultationActionPanel appointmentId={a.id} customerId={a.customer_id} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <p className="text-body-sm text-muted">No upcoming consultations scheduled.</p>
            </div>
          )}
        </div>

        {/* Past History */}
        <div>
          <h2 className="text-headline-sm" style={{ marginBottom: 'var(--space-sm)' }}>
            Past Consultations ({completed.length})
          </h2>
          {completed.length > 0 ? (
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Clinical Notes</th>
                      <th>Recommendations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map(a => {
                      const dateObj = new Date(a.scheduled_at)
                      const patientName = a.customers?.user_profiles?.full_name ?? 'Patient'
                      const clinicalNotes = a.consultation_notes?.[0]
                      return (
                        <tr key={a.id}>
                          <td><strong>{patientName}</strong></td>
                          <td className="text-body-sm text-muted">
                            {dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <span className={`badge badge-${a.status === 'completed' ? 'success' : 'neutral'}`} style={{ textTransform: 'capitalize' }}>
                              {a.status}
                            </span>
                          </td>
                          <td className="text-body-sm">{clinicalNotes?.notes || '—'}</td>
                          <td className="text-body-sm">{clinicalNotes?.recommendations || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <p className="text-body-sm text-muted">No past consultation records yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
