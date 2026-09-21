import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'

export const metadata: Metadata = { title: 'My Patients & Clinical Intake' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalCustomersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single()

  // Get active assignments
  const { data: assignments } = professional
    ? await (supabase as any)
        .from('professional_assignments')
        .select(`
          id,
          customer_id,
          role,
          customers (
            id,
            membership_status,
            google_meet_url,
            user_profiles ( full_name, phone ),
            customer_profiles ( bmi, weight_kg, height_cm, stress_level ),
            daily_check_ins ( check_in_date, workout_status, diet_status )
          )
        `)
        .eq('professional_id', professional.id)
        .eq('is_active', true)
    : { data: [] }

  const assignList: any[] = assignments ?? []

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="text-headline-md">My Patients &amp; Clinical Intake</h1>
            <p className="text-body-md text-muted">
              {assignList.length} active patient assignments under your clinical care.
            </p>
          </div>
          <div className="flex gap-xs">
            <Link href="/professional/plans" className="btn btn-secondary btn-sm">
              📋 All Patient Plans
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient Name &amp; Contact</th>
                  <th>Membership</th>
                  <th>BMS (BMI / Weight)</th>
                  <th>Zoho Meeting Room</th>
                  <th>Doctor Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignList.length > 0 ? (
                  assignList.map(a => {
                    const cust = a.customers
                    const name = cust?.user_profiles?.full_name ?? 'Patient'
                    const phone = cust?.user_profiles?.phone
                    const profile = cust?.customer_profiles?.[0] || cust?.customer_profiles || {}
                    const meetUrl = cust?.zoho_meeting_url || cust?.google_meet_url || 'https://meet.zoho.com/fitveda-priya-sharma'

                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{name}</div>
                          {phone && <div className="text-caption text-muted">{phone}</div>}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${cust?.membership_status === 'active' ? 'success' : 'neutral'}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {cust?.membership_status ?? 'Active'}
                          </span>
                        </td>
                        <td>
                          {profile.bmi ? (
                            <div>
                              <span style={{ fontWeight: 600 }}>{profile.bmi}</span>{' '}
                              <span className="text-caption text-muted">kg/m²</span>
                              {profile.weight_kg && (
                                <div className="text-caption text-muted">
                                  {profile.weight_kg} kg • {profile.height_cm} cm
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-caption text-muted">Intake pending</span>
                          )}
                        </td>
                        <td>
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#0d9488', fontWeight: 600 }}
                          >
                            📹 Join Zoho Meet
                          </a>
                        </td>
                        <td>
                          <div className="flex gap-xs">
                            <Link
                              href={`/professional/customers/${a.customer_id}`}
                              className="btn btn-primary btn-sm"
                              style={{ fontWeight: 600 }}
                            >
                              🩺 Clinical Intake &amp; Diet →
                            </Link>
                            <Link
                              href={`/professional/plans/${a.customer_id}`}
                              className="btn btn-secondary btn-sm"
                            >
                              Plan
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
                        <p className="text-body-md text-muted">No active patients assigned to your profile yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
