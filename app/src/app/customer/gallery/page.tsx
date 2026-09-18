import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import VideoGalleryUpload from '@/components/customer/VideoGalleryUpload'

export const metadata: Metadata = { title: 'Transformation & Video Gallery' }

export default async function CustomerGalleryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const customerId = customer?.id || 'c0000000-0000-0000-0000-000000000001'

  // Fetch gallery videos
  const videos: any[] = (mockDb.state.gallery_videos || []).filter(
    (v: any) => v.customer_id === customerId
  )

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Movement &amp; Progress</div>
              <h1 className="text-headline-sm" style={{fontWeight:600}}>Video Gallery</h1>
            </div>
          </div>
          <VideoGalleryUpload customerId={customerId} />
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-xl)'}}>
        {/* Banner */}
        <div className="card" style={{
          marginBottom:'var(--space-md)',
          background:'linear-gradient(135deg, rgba(92,140,181,0.12) 0%, rgba(200,149,109,0.12) 100%)',
          border:'1px solid rgba(92,140,181,0.25)',
          padding:'var(--space-md)'
        }}>
          <div className="flex items-center gap-sm">
            <div style={{fontSize:36}}>🎥</div>
            <div>
              <h2 className="text-headline-sm" style={{fontSize:18,marginBottom:2}}>Your Movement Portfolio</h2>
              <p className="text-body-sm text-muted">
                Upload your exercise form checks, yoga flow recordings, and transformation milestones. Your assigned trainer and doctor review each clip to fine-tune your regimen.
              </p>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {videos.length > 0 ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'var(--space-md)'}}>
            {videos.map(v => {
              return (
                <div key={v.id} className="card" style={{overflow:'hidden',padding:0}}>
                  {/* Video player / preview */}
                  <div style={{position:'relative',background:'#111',aspectRatio:'16/9'}}>
                    <video
                      controls
                      poster={v.thumbnail_url}
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                      preload="metadata"
                    >
                      <source src={v.video_url} type="video/mp4" />
                      Your browser does not support HTML video.
                    </video>
                  </div>

                  <div style={{padding:'var(--space-sm)'}}>
                    <div className="flex justify-between items-start" style={{marginBottom:6}}>
                      <span className="badge badge-neutral" style={{textTransform:'capitalize'}}>
                        {v.category?.replace('_', ' ')}
                      </span>
                      <span className="text-caption text-muted">
                        {new Date(v.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-body-md" style={{fontWeight:600,marginBottom:6}}>
                      {v.title}
                    </h3>

                    {v.notes && (
                      <p className="text-body-sm text-muted" style={{marginBottom:8}}>
                        {v.notes}
                      </p>
                    )}

                    {v.trainer_feedback && (
                      <div style={{
                        marginTop:8,
                        padding:'8px 10px',
                        background:'rgba(92,140,181,0.08)',
                        borderLeft:'3px solid var(--color-primary)',
                        borderRadius:'var(--radius-sm)'
                      }}>
                        <div className="text-caption text-primary" style={{fontWeight:600,marginBottom:2}}>
                          Coach Feedback:
                        </div>
                        <p className="text-body-sm" style={{margin:0}}>
                          {v.trainer_feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card" style={{textAlign:'center',padding:'var(--space-xl)'}}>
            <div style={{fontSize:40,marginBottom:8}}>🎬</div>
            <h3 className="text-headline-sm" style={{marginBottom:4}}>No Videos Uploaded Yet</h3>
            <p className="text-body-sm text-muted" style={{maxWidth:380,marginInline:'auto',marginBottom:'var(--space-md)'}}>
              Record a 30-second form check of your squats, yoga flow, or posture and upload it here for your trainer to review.
            </p>
            <VideoGalleryUpload customerId={customerId} />
          </div>
        )}
      </main>

      <CustomerBottomNav active="gallery" />
    </div>
  )
}
