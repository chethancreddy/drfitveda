import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrainingRecordingService } from '@/lib/services/recording.service'
import LatestTrainingSession from '@/components/customer/LatestTrainingSession'
import DailyCheckIn from '@/components/customer/DailyCheckIn'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function CustomerDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers').select('id, membership_status').eq('user_id', user.id).single() as { data: { id: string; membership_status: string } | null }

  const { data: profile } = await (supabase as any)
    .from('user_profiles').select('full_name').eq('id', user.id).single() as { data: { full_name: string } | null }

  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckIn } = customer
    ? await (supabase as any).from('daily_check_ins').select('id').eq('customer_id', customer.id).eq('check_in_date', today).single()
    : { data: null }

  let recordingInfo: { hasRecording: boolean; session: { scheduled_at: string | null; trainer: { full_name: string } | null } | null; recordingStatus: string | null; recordingId: string | null } | null = null
  if (customer) {
    try { recordingInfo = await TrainingRecordingService.getLatestRecordingStatus(customer.id) }
    catch { /* no recording */ }
  }

  const { data: plan } = customer
    ? await (supabase as any).from('plans').select('plan_versions(id, version_number, status, plan_items(category,instruction,display_order))').eq('customer_id', customer.id).limit(1).single()
    : { data: null }

  const activePlanVersion = (plan?.plan_versions as { id: string; status: string; plan_items: { category: string; instruction: string; display_order: number }[] }[] | undefined)?.find(v => v.status === 'published')

  const { data: recentCheckIns } = customer
    ? await (supabase as any).from('daily_check_ins').select('check_in_date, workout_status, diet_status').eq('customer_id', customer.id).gte('check_in_date', new Date(Date.now() - 7*24*3600*1000).toISOString().split('T')[0]).order('check_in_date', { ascending: false })
    : { data: [] }

  const adherencePct = (recentCheckIns as { workout_status?: string; diet_status?: string }[] | null)?.length
    ? Math.round((recentCheckIns as { workout_status?: string; diet_status?: string }[]).filter(c => ['yes','partial'].includes(c.workout_status ?? '') || ['yes','partial'].includes(c.diet_status ?? '')).length / 7 * 100)
    : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-sm">
            <Link href="/" title="Dr Fit Veda Home" style={{display:'flex',alignItems:'center'}}>
              <img
                src="/logo.png"
                alt="Dr Fit Veda"
                style={{height:38,width:'auto',maxWidth:160,objectFit:'contain'}}
              />
            </Link>
            <div style={{borderLeft:'1px solid var(--color-border)',paddingLeft:10}}>
              <div className="text-body-sm text-muted">Good {getGreeting()},</div>
              <div className="text-headline-sm" style={{fontWeight:600}}>{firstName} 👋</div>
            </div>
          </div>
          <div className="flex items-center gap-xs">
            <Link href="/customer/gallery" className="badge badge-success" style={{textDecoration:'none',padding:'4px 8px',display:'inline-flex',alignItems:'center',gap:4}}>
              🎬 Gallery
            </Link>
            <Link href="/customer/notifications" className="btn btn-icon btn-ghost" aria-label="Notifications">🔔</Link>
            <Link href="/customer/profile" className="btn btn-icon btn-ghost" aria-label="Profile">👤</Link>
          </div>
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-lg)'}}>
        <DailyCheckIn customerId={customer?.id ?? null} hasDoneToday={!!todayCheckIn} todayDate={today} />

        <div className="dashboard-grid" style={{marginTop:'var(--space-sm)'}}>
          <div className="card">
            <div className="text-label-md text-muted" style={{marginBottom:8}}>Weekly Adherence</div>
            <div style={{fontSize:32,fontWeight:600,marginBottom:8}}>{adherencePct}%</div>
            <div className="progress-bar"><div className="progress-fill" style={{width:`${adherencePct}%`}} /></div>
            <div className="text-caption text-muted" style={{marginTop:8}}>{(recentCheckIns as unknown[])?.length ?? 0} of 7 days checked in</div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center" style={{marginBottom:12}}>
              <div className="text-label-md text-muted">Today&apos;s Plan</div>
              <Link href="/customer/plan" className="text-caption text-primary">View all →</Link>
            </div>
            {activePlanVersion ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {activePlanVersion.plan_items.sort((a,b) => a.display_order - b.display_order).slice(0,3).map((item,i) => (
                  <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span>{categoryIcon(item.category)}</span>
                    <span className="text-body-sm" style={{lineHeight:1.4}}>{item.instruction}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{padding:'var(--space-sm)'}}><p className="text-body-sm text-muted">Your plan is being prepared.</p></div>
            )}
          </div>

          <LatestTrainingSession customerId={customer?.id ?? null} recordingInfo={recordingInfo} />

          <div className="card">
            <div className="text-label-md text-muted" style={{marginBottom:8}}>Membership</div>
            <div className="flex items-center gap-xs" style={{marginBottom:8}}>
              <span className={`status-dot ${customer?.membership_status === 'active' ? 'active' : 'inactive'}`}></span>
              <span className="text-label-lg" style={{textTransform:'capitalize'}}>{customer?.membership_status ?? 'No membership'}</span>
            </div>
            {customer?.membership_status !== 'active' && <Link href="/memberships" className="btn btn-primary btn-sm btn-full" style={{marginTop:8}}>Get Membership</Link>}
          </div>

          <div className="card">
            <div className="text-label-md text-muted" style={{marginBottom:12}}>Quick Actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--color-neutral)',borderRadius:'var(--radius-sm)',textDecoration:'none',color:'var(--color-on-surface)'}}>
                  <span style={{fontSize:20}}>{l.icon}</span>
                  <span className="text-body-sm" style={{fontWeight:500}}>{l.label}</span>
                  <span style={{marginLeft:'auto',color:'var(--color-muted)'}}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <CustomerBottomNav active="home" />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
function categoryIcon(cat: string) {
  const map: Record<string,string> = { nutrition:'🥗', workout:'💪', yoga:'🧘', sleep:'😴', lifestyle:'✨', water:'💧', default:'📌' }
  return map[cat] ?? map.default
}
const quickLinks = [
  { href:'/customer/track',    icon:'✅', label:'Daily Check-In' },
  { href:'/customer/plan',     icon:'📋', label:'My Plan' },
  { href:'/customer/gallery',  icon:'🎬', label:'Video & Progress Gallery' },
  { href:'/customer/training', icon:'🎥', label:'Live Training Recordings' },
  { href:'/customer/consult',  icon:'📅', label:'Book Consultation' },
  { href:'/customer/progress', icon:'📊', label:'My Progress' },
]

