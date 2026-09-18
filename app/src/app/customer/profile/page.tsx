import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import ProfileEditForm from '@/components/customer/ProfileEditForm'

export const metadata: Metadata = { title: 'My Health Profile' }

export default async function CustomerProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await (supabase as any)
    .from('user_profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: customer } = await (supabase as any)
    .from('customers')
    .select(`
      id,
      membership_status,
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
    .eq('user_id', user.id)
    .single()

  const profile = customer?.customer_profiles?.[0] || customer?.customer_profiles || {}
  const food = customer?.food_profiles?.[0] || customer?.food_profiles || {}

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Account & Health Details</div>
              <h1 className="text-headline-sm" style={{fontWeight:600}}>My Profile</h1>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            <Link href="/customer/documents" className="btn btn-secondary btn-sm">Documents</Link>
            <Link href="/login" className="btn btn-ghost btn-sm">Sign Out 🚪</Link>
          </div>
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-xl)'}}>
        {/* Quick Summary Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'var(--space-xs)',marginBottom:'var(--space-md)'}}>
          <div className="stat-card" style={{padding:'12px'}}>
            <div className="stat-label">Membership</div>
            <div className="stat-value" style={{fontSize:18,textTransform:'capitalize'}}>
              {customer?.membership_status ?? 'Inactive'}
            </div>
          </div>
          <div className="stat-card" style={{padding:'12px'}}>
            <div className="stat-label">BMI</div>
            <div className="stat-value" style={{fontSize:18}}>
              {profile.bmi ? `${profile.bmi} kg/m²` : '—'}
            </div>
          </div>
          <div className="stat-card" style={{padding:'12px'}}>
            <div className="stat-label">Weight</div>
            <div className="stat-value" style={{fontSize:18}}>
              {profile.weight_kg ? `${profile.weight_kg} kg` : '—'}
            </div>
          </div>
          <div className="stat-card" style={{padding:'12px'}}>
            <div className="stat-label">Stress (1-10)</div>
            <div className="stat-value" style={{fontSize:18}}>
              {profile.stress_level ? `${profile.stress_level}/10` : '—'}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <ProfileEditForm
          initialFullName={userProfile?.full_name ?? ''}
          initialPhone={userProfile?.phone ?? ''}
          initialProfile={profile}
          initialFood={food}
        />
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}
