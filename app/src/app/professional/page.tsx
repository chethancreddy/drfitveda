import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'Doctor & Professional Dashboard' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single() as { data: { id: string; full_name: string; role: string } | null }

  const { data: assignments } = professional
    ? await (supabase as any)
        .from('professional_assignments')
        .select('id, customer_id')
        .eq('professional_id', professional.id)
        .eq('is_active', true)
    : { data: [] }

  const { data: sessions } = professional
    ? await (supabase as any)
        .from('training_sessions')
        .select('id, scheduled_at, status, customer_id, meeting_url, customers:customer_id(user_profiles(full_name)), training_recordings(id, recording_status, is_active)')
        .eq('trainer_id', professional.id)
        .order('scheduled_at', { ascending: false })
        .limit(20)
    : { data: [] }

  const sessArr = (sessions as any[]) ?? []

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">Welcome, {professional?.full_name?.split(' ')[0] ?? 'Doctor'}</h1>
            <p className="text-body-md text-muted">{(assignments as unknown[])?.length ?? 0} active patient assignments under your care.</p>
          </div>
          <div className="flex gap-xs">
            <Link href="/professional/customers" className="btn btn-primary btn-sm">
              🩺 Patients &amp; Clinical Intake
            </Link>
            <Link href="/professional/training/new" className="btn btn-secondary btn-sm">
              + New Live Session
            </Link>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          {[
            { label: 'Active Patients', value: (assignments as unknown[])?.length ?? 0 },
            { label: 'Sessions This Month', value: sessArr.length },
            { label: 'Completed Consultations', value: sessArr.filter(s => s.status === 'completed').length },
            { label: 'Upcoming Live Meets', value: sessArr.filter(s => s.status === 'scheduled' || s.status === 'live').length },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Access Card for Doctor Clinical Intake */}
        <div
          className="card"
          style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1px solid #bbf7d0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>🩺</span>
              <div>
                <h3 className="text-headline-sm" style={{ margin: 0, color: '#065f46' }}>
                  Patient Clinical Intake &amp; Biomarker Diagnostics
                </h3>
                <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
                  Collect BMS, Blood lab reports (Vitamins D/B12, Cholesterol, HbA1c, Thyroid), and prescribe tailored Naturopathic daily diets.
                </p>
              </div>
            </div>
            <Link href="/professional/customers" className="btn btn-primary" style={{ fontWeight: 600 }}>
              Open Clinical Records →
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)' }}>
            <h2 className="text-headline-sm">Live Google Meet Consultations &amp; Training</h2>
            <Link href="/professional/training/new" className="btn btn-primary btn-sm">+ Schedule Session</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient / Customer</th>
                  <th>Date &amp; Time</th>
                  <th>Session Status</th>
                  <th>Google Meet Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessArr.length ? sessArr.map(s => {
                  const customerName = s.customers?.user_profiles?.full_name ?? 'Priya Sharma'
                  return (
                    <tr key={s.id}>
                      <td><span className="text-body-sm" style={{ fontWeight: 600 }}>{customerName}</span></td>
                      <td className="text-body-sm text-muted">
                        {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td><span className={`badge badge-${sc(s.status)}`} style={{ textTransform: 'capitalize' }}>{s.status}</span></td>
                      <td>
                        <a
                          href={s.meeting_url || 'https://meet.google.com/fit-veda-priya'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#0d9488', textDecoration: 'underline' }}
                        >
                          📹 Join Meet
                        </a>
                      </td>
                      <td><Link href={`/professional/training/${s.id}`} className="btn btn-ghost btn-sm">Manage →</Link></td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={5}><div className="empty-state">No sessions scheduled yet</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }
