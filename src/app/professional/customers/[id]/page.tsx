import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import ProfessionalSidebar from '@/components/professional/ProfessionalSidebar'
import ClinicalIntakeEditor from '@/components/professional/ClinicalIntakeEditor'

export const metadata: Metadata = { title: 'Patient 360 View & Clinical Intake' }
export const dynamic = 'force-dynamic'

export default async function ProfessionalCustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: customerId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await (supabase as any)
    .from('professionals')
    .select('id, full_name, role')
    .eq('user_id', user.id)
    .single()

  // Fetch full customer details
  const { data: customer } = await (supabase as any)
    .from('customers')
    .select(`
      id,
      membership_status,
      created_at,
      google_meet_url,
      user_profiles ( full_name, phone ),
      customer_profiles (
        date_of_birth, gender, height_cm, weight_kg, bmi,
        occupation, work_schedule, sleep_hours, activity_level,
        exercise_history, stress_level, lifestyle_notes, goals
      ),
      food_profiles (
        dietary_preference, meal_timing, typical_meals, snacks,
        preferences, dislikes, eating_out_freq, water_intake_liters,
        restrictions, allergies
      )
    `)
    .eq('id', customerId)
    .single()

  if (!customer) redirect('/professional/customers')

  const profile = customer.customer_profiles?.[0] || customer.customer_profiles || {}
  const food = customer.food_profiles?.[0] || customer.food_profiles || {}
  const name = customer.user_profiles?.full_name ?? 'Patient'

  // Fetch medical documents
  const { data: documents } = await (supabase as any)
    .from('medical_documents')
    .select('id, doc_type, file_name, file_size, status, notes, uploaded_at')
    .eq('customer_id', customerId)
    .order('uploaded_at', { ascending: false })

  // Fetch recent check-ins
  const { data: checkIns } = await (supabase as any)
    .from('daily_check_ins')
    .select('check_in_date, workout_status, diet_status, yoga_status, water_status, energy_level, mood_level, note')
    .eq('customer_id', customerId)
    .order('check_in_date', { ascending: false })
    .limit(7)

  // Fetch clinical records
  const clinicalRecords = (mockDb.state.clinical_records || []).filter((r: any) => r.customer_id === customerId)
  clinicalRecords.sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
  const latestClinicalRecord = clinicalRecords[0] || null

  // Fetch active plan
  const { data: plan } = await (supabase as any)
    .from('plans')
    .select(`
      id,
      plan_versions (
        id,
        version_number,
        status,
        change_reason,
        effective_from,
        plan_items (
          category,
          instruction,
          display_order
        )
      )
    `)
    .eq('customer_id', customerId)
    .limit(1)
    .single()

  const versions: any[] = plan?.plan_versions ?? []
  versions.sort((a, b) => b.version_number - a.version_number)
  const activeVer = versions.find(v => v.status === 'published') || versions[0]
  const planItems: any[] = activeVer?.plan_items ?? []
  planItems.sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="app-layout">
      <ProfessionalSidebar
        userName={professional?.full_name || 'Dr. Ananya Verma'}
        userRole={professional?.role || 'doctor'}
      />

      <main className="app-main">
        {/* Header */}
        <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link href="/professional/customers" className="btn btn-ghost btn-sm" style={{ marginBottom: 4 }}>
              ← Back to Patient List
            </Link>
            <h1 className="text-headline-md">{name}</h1>
            <p className="text-body-sm text-muted">
              {customer.user_profiles?.phone ? `${customer.user_profiles.phone} • ` : ''}
              Membership: <strong style={{ textTransform: 'capitalize' }}>{customer.membership_status}</strong>
            </p>
          </div>

          <div className="flex gap-xs" style={{ alignItems: 'center' }}>
            {customer.google_meet_url && (
              <a
                href={customer.google_meet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', fontWeight: 600 }}
              >
                📹 Join Google Meet Room
              </a>
            )}
            <Link href={`/professional/plans/${customerId}`} className="btn btn-primary btn-sm">
              📋 Plan Editor
            </Link>
          </div>
        </div>

        {/* Dedicated Google Meet Banner */}
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📹</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                Dedicated Patient Video Consultation Room (Google Meet)
              </div>
              <div style={{ fontSize: 12, color: '#047857', wordBreak: 'break-all' }}>
                {customer.google_meet_url || 'https://meet.google.com/fit-veda-priya'}
              </div>
            </div>
          </div>
          <a
            href={customer.google_meet_url || 'https://meet.google.com/fit-veda-priya'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            Launch Google Meet →
          </a>
        </div>

        {/* MAIN INTERACTIVE CLINICAL INTAKE, BIOMARKERS & DIET CHART EDITOR */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <ClinicalIntakeEditor
            customerId={customerId}
            customerName={name}
            existingRecord={latestClinicalRecord}
          />
        </div>

        {/* Vitals Summary Card */}
        <div className="grid-4" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="stat-card">
            <div className="stat-label">Calculated BMI</div>
            <div className="stat-value">{profile.bmi ? `${profile.bmi}` : '—'}</div>
            <div className="text-caption text-muted">
              {profile.height_cm ? `${profile.height_cm} cm` : ''} {profile.weight_kg ? `• ${profile.weight_kg} kg` : ''}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stress Score</div>
            <div className="stat-value">{profile.stress_level ? `${profile.stress_level} / 10` : '—'}</div>
            <div className="text-caption text-muted">Self reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sleep Target</div>
            <div className="stat-value">{profile.sleep_hours ? `${profile.sleep_hours} hrs` : '—'}</div>
            <div className="text-caption text-muted">Per night</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Dietary Type</div>
            <div className="stat-value" style={{ fontSize: 18, textTransform: 'capitalize' }}>
              {food.dietary_preference?.replace('_', ' ') || 'Not set'}
            </div>
            <div className="text-caption text-muted">
              Water: {food.water_intake_liters ? `${food.water_intake_liters} L/day` : '—'}
            </div>
          </div>
        </div>

        {/* Active Plan Version Preview */}
        <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
            <h3 className="text-label-lg">
              Active Personalized Regimen {activeVer ? `(v${activeVer.version_number})` : ''}
            </h3>
            <Link href={`/professional/plans/${customerId}`} className="btn btn-secondary btn-sm">
              Update Regimen
            </Link>
          </div>

          {planItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="badge badge-neutral" style={{ textTransform: 'capitalize', width: 90, textAlign: 'center' }}>
                    {item.category}
                  </span>
                  <span className="text-body-sm">{item.instruction}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-muted">No plan drafted yet for this patient.</p>
          )}
        </div>

        {/* Uploaded Documents & Daily Check-Ins */}
        <div className="grid-2" style={{ gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h3 className="text-label-lg" style={{ marginBottom: 12 }}>
              Uploaded Medical Documents ({(documents as unknown[])?.length ?? 0})
            </h3>
            {(documents as any[])?.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(documents as any[]).map(d => (
                      <tr key={d.id}>
                        <td>📄 <strong>{d.file_name}</strong></td>
                        <td className="text-body-sm" style={{ textTransform: 'capitalize' }}>{d.doc_type?.replace('_', ' ')}</td>
                        <td><span className={`badge badge-${d.status === 'reviewed' ? 'success' : 'warning'}`}>{d.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-body-sm text-muted">No medical documents uploaded yet.</p>
            )}
          </div>

          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <h3 className="text-label-lg" style={{ marginBottom: 12 }}>Recent Daily Check-Ins</h3>
            {(checkIns as any[])?.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Workout</th>
                      <th>Diet</th>
                      <th>Yoga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(checkIns as any[]).map(c => (
                      <tr key={c.check_in_date}>
                        <td><strong>{new Date(c.check_in_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></td>
                        <td><span className={`badge badge-${c.workout_status === 'yes' ? 'success' : 'neutral'}`}>{c.workout_status || '—'}</span></td>
                        <td><span className={`badge badge-${c.diet_status === 'yes' ? 'success' : 'neutral'}`}>{c.diet_status || '—'}</span></td>
                        <td><span className={`badge badge-${c.yoga_status === 'yes' ? 'success' : 'neutral'}`}>{c.yoga_status || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-body-sm text-muted">No check-in history logged yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
