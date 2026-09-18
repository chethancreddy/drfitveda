import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export const metadata: Metadata = { title: 'Notifications' }

export default async function CustomerNotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await (supabase as any)
    .from('notifications')
    .select('id, title, body, type, is_read, action_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const notifList: any[] = notifications ?? []
  const unreadCount = notifList.filter(n => !n.is_read).length

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Inbox</div>
              <h1 className="text-headline-sm" style={{fontWeight:600}}>Notifications</h1>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="badge badge-warning">{unreadCount} new</span>
          )}
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-xl)'}}>
        <div className="card" style={{padding:'var(--space-md)'}}>
          {notifList.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:'var(--space-xs)'}}>
              {notifList.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding:'12px',
                    borderRadius:'var(--radius-sm)',
                    background: n.is_read ? 'transparent' : 'rgba(92,140,181,0.06)',
                    border: n.is_read ? '1px solid var(--color-neutral)' : '1px solid rgba(92,140,181,0.25)',
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'flex-start',
                    gap:12
                  }}
                >
                  <div>
                    <div className="flex items-center gap-xs" style={{marginBottom:4}}>
                      <span style={{fontSize:16}}>{getNotifIcon(n.type)}</span>
                      <strong className="text-body-md">{n.title}</strong>
                      {!n.is_read && <span className="status-dot active" style={{width:8,height:8}}></span>}
                    </div>
                    {n.body && <p className="text-body-sm text-muted" style={{marginBottom:6}}>{n.body}</p>}
                    <div className="text-caption text-muted">
                      {new Date(n.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>

                  {n.action_url && (
                    <Link href={n.action_url} className="btn btn-secondary btn-sm" style={{flexShrink:0}}>
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{padding:'var(--space-xl)'}}>
              <div style={{fontSize:36,marginBottom:8}}>🔔</div>
              <p className="text-body-md text-muted">You have no notifications at the moment.</p>
            </div>
          )}
        </div>
      </main>

      <CustomerBottomNav active="home" />
    </div>
  )
}

function getNotifIcon(type: string | null) {
  switch (type) {
    case 'appointment': return '📅'
    case 'review': return '📊'
    case 'training': return '🎥'
    case 'plan': return '📋'
    default: return '🔔'
  }
}
