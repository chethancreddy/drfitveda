import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    totalCustomersRes, activeMembersRes, totalProsRes, pendingPayoutsRes, activeSessionsRes
  ] = await Promise.all([
    (supabase as any).from('customers').select('*', { count:'exact', head:true }),
    (supabase as any).from('customers').select('*', { count:'exact', head:true }).eq('membership_status','active'),
    (supabase as any).from('professionals').select('*', { count:'exact', head:true }).eq('is_active', true),
    (supabase as any).from('payouts').select('*', { count:'exact', head:true }).eq('status','pending'),
    (supabase as any).from('training_sessions').select('*', { count:'exact', head:true }).eq('status','live'),
  ])

  const totalCustomers = totalCustomersRes.count ?? 0
  const activeMembers  = activeMembersRes.count ?? 0
  const totalPros      = totalProsRes.count ?? 0
  const pendingPayouts = pendingPayoutsRes.count ?? 0
  const activeSessions = activeSessionsRes.count ?? 0

  const { data: sessRaw } = await (supabase as any)
    .from('training_sessions')
    .select('id, scheduled_at, status, customers:customer_id(user_profiles(full_name)), trainer:trainer_id(full_name), training_recordings(recording_status, is_active, deleted_at)')
    .order('scheduled_at', { ascending: false })
    .limit(10)

  const recentSessions = (sessRaw as { id: string; scheduled_at: string | null; status: string; customers: { user_profiles: { full_name: string } | null } | null; trainer: { full_name: string } | null; training_recordings: { recording_status: string; is_active: boolean; deleted_at: string | null }[] | null }[] | null) ?? []

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header flex justify-between items-center">
          <div><h1 className="text-headline-md">Admin Dashboard</h1><p className="text-body-md text-muted">Platform overview</p></div>
          <Link href="/admin/customers/new" className="btn btn-primary btn-sm">+ Customer</Link>
        </div>

        <div className="grid-4" style={{marginBottom:'var(--space-md)'}}>
          {[
            { label:'Total Customers', value: totalCustomers, icon:'👥' },
            { label:'Active Members',  value: activeMembers,  icon:'✅' },
            { label:'Professionals',   value: totalPros,      icon:'👨‍⚕️' },
            { label:'Pending Payouts', value: pendingPayouts, icon:'💰', warn: pendingPayouts > 0 },
          ].map(s => (
            <div key={s.label} className="stat-card" style={s.warn ? {borderColor:'var(--color-warning)'} : {}}>
              <div className="stat-label">{s.label}</div>
              <div className="flex items-center gap-xs"><span style={{fontSize:24}}>{s.icon}</span><div className="stat-value">{s.value}</div></div>
            </div>
          ))}
        </div>

        {activeSessions > 0 && (
          <div className="alert alert-warning" style={{marginBottom:'var(--space-sm)'}}>
            <span>🎥</span><span>{activeSessions} live training session{activeSessions>1?'s':''} in progress</span>
          </div>
        )}

        <div className="card" style={{marginBottom:'var(--space-md)'}}>
          <div className="flex justify-between items-center" style={{marginBottom:'var(--space-sm)'}}>
            <h2 className="text-headline-sm">Training Sessions — Recording Status</h2>
            <Link href="/admin/training" className="text-caption text-primary">View all →</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Customer</th><th>Trainer</th><th>Session Date</th><th>Session Status</th><th>Recording</th><th>Actions</th></tr></thead>
              <tbody>
                {recentSessions.length ? recentSessions.map(s => {
                  const rec = s.training_recordings?.[0]
                  const cName = s.customers?.user_profiles?.full_name ?? '—'
                  const tName = s.trainer?.full_name ?? '—'
                  return (
                    <tr key={s.id}>
                      <td className="text-body-sm" style={{fontWeight:500}}>{cName}</td>
                      <td className="text-body-sm text-muted">{tName}</td>
                      <td className="text-body-sm text-muted">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                      <td><span className={`badge badge-${sc(s.status)}`} style={{textTransform:'capitalize'}}>{s.status}</span></td>
                      <td>
                        {rec ? (
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span className={`status-dot ${rec.recording_status === 'available' ? 'active' : rec.recording_status === 'processing' ? 'processing' : 'inactive'}`}></span>
                            <span className="text-body-sm" style={{textTransform:'capitalize'}}>{rec.recording_status}</span>
                            {rec.deleted_at && <span className="badge badge-neutral" style={{fontSize:9}}>video deleted</span>}
                          </div>
                        ) : <span className="text-muted text-body-sm">—</span>}
                      </td>
                      <td><Link href={`/admin/training/${s.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                    </tr>
                  )
                }) : <tr><td colSpan={6}><div className="empty-state" style={{padding:'var(--space-sm)'}}>No sessions yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid-3">
          {adminActions.map(a => (
            <Link key={a.href} href={a.href} className="card" style={{display:'flex',flexDirection:'column',gap:8,textDecoration:'none'}}>
              <div style={{fontSize:28}}>{a.icon}</div>
              <div className="text-label-lg">{a.label}</div>
              <div className="text-body-sm text-muted">{a.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

function sc(s: string) { return s === 'completed' ? 'success' : s === 'live' ? 'warning' : s === 'cancelled' ? 'error' : 'neutral' }

const adminActions = [
  { href:'/admin/memberships', icon:'💳', label:'Membership & Consultation CMS', desc:'Edit plans, session counts, pricing & standalone consultations' },
  { href:'/admin/finance',     icon:'💰', label:'Compensation Rules',   desc:'Manage payout components and effective dates' },
  { href:'/admin/training',    icon:'🎥', label:'Recording Settings',   desc:'Configure retention policy for training videos' },
  { href:'/admin/assignments', icon:'🔗', label:'Assign Professionals', desc:'Assign doctors, trainers and yoga professionals' },
]
