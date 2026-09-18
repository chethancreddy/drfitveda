import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'
import DocumentUploadForm from '@/components/customer/DocumentUploadForm'

export const metadata: Metadata = { title: 'Medical Documents' }

export default async function CustomerDocumentsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const { data: docs } = await (supabase as any)
    .from('medical_documents')
    .select('id, doc_type, file_name, file_size, status, notes, uploaded_at')
    .eq('customer_id', customer.id)
    .order('uploaded_at', { ascending: false })

  const docList: any[] = docs ?? []

  return (
    <div className="customer-layout">
      <header className="header">
        <div className="container header-inner">
          <div className="flex items-center gap-xs">
            <Link href="/customer/profile" className="btn btn-icon btn-ghost">←</Link>
            <div>
              <div className="text-body-sm text-muted">Health Records</div>
              <h1 className="text-headline-sm" style={{fontWeight:600}}>Medical Documents</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{paddingTop:'var(--space-sm)',paddingBottom:'var(--space-xl)'}}>
        {/* Document upload form */}
        <div style={{marginBottom:'var(--space-md)'}}>
          <DocumentUploadForm />
        </div>

        {/* Documents table */}
        <div className="card" style={{padding:'var(--space-md)'}}>
          <h3 className="text-label-lg" style={{marginBottom:12}}>Your Uploaded Reports ({docList.length})</h3>

          {docList.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                    <th>Doctor Review Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {docList.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                          <span>📄</span>
                          <span>{d.file_name}</span>
                        </div>
                        {d.file_size && (
                          <div className="text-caption text-muted">
                            {(d.file_size / 1024).toFixed(1)} KB
                          </div>
                        )}
                      </td>
                      <td className="text-body-sm" style={{textTransform:'capitalize'}}>
                        {d.doc_type?.replace('_', ' ') ?? 'General'}
                      </td>
                      <td className="text-body-sm text-muted">
                        {new Date(d.uploaded_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td>
                        <span className={`badge badge-${d.status === 'reviewed' ? 'success' : 'warning'}`} style={{textTransform:'capitalize'}}>
                          {d.status}
                        </span>
                      </td>
                      <td className="text-body-sm text-muted">{d.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{padding:'var(--space-md)'}}>
              <p className="text-body-sm text-muted">No documents uploaded yet. Upload your blood tests or medical prescriptions above.</p>
            </div>
          )}
        </div>
      </main>

      <CustomerBottomNav active="profile" />
    </div>
  )
}
