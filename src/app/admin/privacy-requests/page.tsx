import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import PrivacyRequestsTable from '@/components/admin/PrivacyRequestsTable'
import { requireAdmin } from '@/lib/legal/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Privacy Requests — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPrivacyRequestsPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/login')

  const svc = await createServiceRoleClient()
  const { data } = await (svc as any).from('data_subject_requests').select('*').order('created_at', { ascending: false })

  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="app-main">
        <div className="page-header">
          <h1 className="text-headline-md">Privacy Requests</h1>
          <p className="text-body-md text-muted">
            Access, correction, export, deletion, consent-withdrawal and complaint requests. Verify identity using the
            contact details already on the account before acting. Do not delete records subject to legal retention —
            record what was kept and why.
          </p>
        </div>
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <PrivacyRequestsTable requests={data ?? []} />
        </div>
      </main>
    </div>
  )
}
