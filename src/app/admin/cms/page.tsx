import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBiomarkersManager from '@/components/admin/AdminBiomarkersManager'

export const metadata: Metadata = { title: 'CMS — Admin' }

const CMS_SECTIONS = [
  { icon: '💳', title: 'Membership Plans', desc: 'Edit plan pricing, session counts, session frequency, and benefits. All changes reflect instantly on the public page.', href: '/admin/memberships', label: 'Manage Plans' },
  { icon: '🩺', title: 'Consultation Services', desc: 'Manage standalone consultation services (Yoga, PCOD/PCOS, General Wellness) including price and description.', href: '/admin/memberships', label: 'Manage Consultations' },
  { icon: '💰', title: 'Compensation Rules', desc: 'Configure how earnings are split between doctors, trainers, and the platform per payout component.', href: '/admin/finance', label: 'Edit Rules' },
  { icon: '🎥', title: 'Recording Settings', desc: 'Configure Google Meet recording link handling and training session retention policies.', href: '/admin/training', label: 'Recording Settings' },
]

export default async function AdminCMSPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="app-layout">
      <AdminSidebar />

      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Content Management System</h1>
          <p className="text-body-md text-muted">Manage all editable platform content, memberships, and clinical biomarker parameters</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'var(--space-md)'}}>
          {CMS_SECTIONS.map(s => (
            <div key={s.title} className="card" style={{padding:'var(--space-lg)',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:32}}>{s.icon}</div>
              <div>
                <h2 className="text-headline-sm" style={{marginBottom:6}}>{s.title}</h2>
                <p className="text-body-sm text-muted" style={{lineHeight:1.6}}>{s.desc}</p>
              </div>
              <Link href={s.href} className="btn btn-primary btn-sm" style={{alignSelf:'flex-start',marginTop:'auto'}}>
                {s.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Clinical Biomarkers & Lab Parameters CMS Manager */}
        <AdminBiomarkersManager />
      </main>
    </div>
  )
}
