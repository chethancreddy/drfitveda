'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminRecordDeleteModal from '@/components/admin/AdminRecordDeleteModal'

export interface WebsiteContentItem {
  id: string
  title: string
  slug: string
  content_type: 'section' | 'banner' | 'article' | 'page' | 'faq'
  summary: string
  body: string
  cta_label?: string
  cta_href?: string
  display_order: number
  is_active: boolean
  is_archived?: boolean
  archived_at?: string | null
  updated_at?: string
}

const EMPTY_CONTENT: Partial<WebsiteContentItem> = {
  title: '',
  slug: '',
  content_type: 'section',
  summary: '',
  body: '',
  cta_label: '',
  cta_href: '',
  display_order: 10,
  is_active: true,
}

export default function AdminWebsiteContentManager() {
  const [items, setItems] = useState<WebsiteContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')
  const [editingItem, setEditingItem] = useState<Partial<WebsiteContentItem> | null>(null)
  const [viewingItem, setViewingItem] = useState<WebsiteContentItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<WebsiteContentItem | null>(null)
  const [toast, setToast] = useState('')

  const loadContent = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cms/content?include_inactive=true&include_archived=true', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.content_items || [])
    } catch {
      showToast('Failed to load CMS content items')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadContent()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem?.title?.trim()) return
    setSaving(true)
    try {
      const isNew = !editingItem.id
      const res = await fetch('/api/cms/content', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save content item')
      showToast(isNew ? 'Content item created!' : 'Content item updated!')
      setEditingItem(null)
      await loadContent()
    } catch (err: any) {
      showToast(err?.message || 'Failed to save content item')
    }
    setSaving(false)
  }

  async function toggleActive(item: WebsiteContentItem) {
    try {
      const res = await fetch('/api/cms/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      })
      if (res.ok) {
        showToast(item.is_active ? `"${item.title}" unpublished (hidden from website)` : `"${item.title}" published`)
        await loadContent()
      }
    } catch {}
  }

  async function restoreItem(item: WebsiteContentItem) {
    try {
      const res = await fetch('/api/cms/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, restore: true, is_active: true }),
      })
      if (res.ok) {
        showToast(`"${item.title}" restored!`)
        await loadContent()
      }
    } catch {}
  }

  async function confirmDeleteItem() {
    if (!deletingItem) return
    const res = await fetch(`/api/cms/content?id=${encodeURIComponent(deletingItem.id)}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete content item')
    }
    showToast(data.message || `Removed "${deletingItem.title}"`)
    setDeletingItem(null)
    await loadContent()
  }

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (statusFilter === 'active' && (!i.is_active || i.is_archived)) return false
      if (statusFilter === 'inactive' && (i.is_active || i.is_archived)) return false
      if (statusFilter === 'archived' && !i.is_archived) return false
      if (statusFilter === 'all' && i.is_archived) return false
      if (typeFilter !== 'all' && i.content_type !== typeFilter) return false
      return true
    })
  }, [items, statusFilter, typeFilter])

  const nonArchivedCount = items.filter(i => !i.is_archived).length
  const activeCount = items.filter(i => i.is_active && !i.is_archived).length
  const inactiveCount = items.filter(i => !i.is_active && !i.is_archived).length
  const archivedCount = items.filter(i => i.is_archived).length

  return (
    <div className="card" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)', background: 'white', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>📰</span>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>Website Content, Banners, Pages &amp; FAQs CMS</h2>
          </div>
          <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
            Manage public website sections, promotional banners, articles, pages, and FAQs. Inactive or deleted items are immediately hidden from public pages without breaking layouts.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setEditingItem({ ...EMPTY_CONTENT, display_order: items.length + 1 })}
        >
          + Add Content Block
        </button>
      </div>

      {toast && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 6, marginBottom: 14, fontSize: 13, fontWeight: 500 }}>
          ✓ {toast}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'section', 'banner', 'article', 'page', 'faq'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: typeFilter === t ? 700 : 500,
                background: typeFilter === t ? '#0d9488' : '#f1f5f9',
                color: typeFilter === t ? 'white' : '#475569',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              { key: 'all', label: `All (${nonArchivedCount})` },
              { key: 'active', label: `Published (${activeCount})` },
              { key: 'inactive', label: `Unpublished (${inactiveCount})` },
              { key: 'archived', label: `Archived (${archivedCount})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading website content blocks…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Title &amp; Slug</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Summary</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: item.is_active && !item.is_archived ? 1 : 0.7 }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                    <code style={{ fontSize: 11, color: '#64748b' }}>{item.slug}</code>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: 11 }}>
                      {item.content_type}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569', maxWidth: 320 }}>
                    {item.summary || item.body.slice(0, 80)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {item.is_archived ? (
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>Archived</span>
                    ) : (
                      <span className={`badge badge-${item.is_active ? 'success' : 'warning'}`} style={{ fontSize: 10 }}>
                        {item.is_active ? 'Published' : 'Unpublished'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setViewingItem(item)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setEditingItem({ ...item })}
                      >
                        Edit
                      </button>
                      {item.is_archived ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => restoreItem(item)}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                          onClick={() => toggleActive(item)}
                        >
                          {item.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '4px 8px', color: '#dc2626' }}
                        onClick={() => setDeletingItem(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Content Modal */}
      {viewingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setViewingItem(null)}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: 'var(--space-lg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <div>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>{viewingItem.title}</h3>
                <p className="text-caption text-muted">Type: {viewingItem.content_type} • Slug: {viewingItem.slug}</p>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setViewingItem(null)}>✕</button>
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 12 }}>
              <div className="text-caption text-muted">Summary</div>
              <div className="text-body-sm" style={{ fontWeight: 600 }}>{viewingItem.summary || '—'}</div>
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 14 }}>
              <div className="text-caption text-muted">Body Content</div>
              <div className="text-body-sm" style={{ whiteSpace: 'pre-wrap' }}>{viewingItem.body}</div>
            </div>
            <div className="flex justify-end" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const i = viewingItem
                  setViewingItem(null)
                  setEditingItem({ ...i })
                }}
              >
                Edit Content
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setViewingItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Content Modal */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 'var(--space-lg)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <h3 className="text-headline-sm" style={{ margin: 0 }}>
                {editingItem.id ? 'Edit Website Content Item' : 'Create Website Content Item'}
              </h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setEditingItem(null)}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="form-field">
                <span className="form-label">Title *</span>
                <input
                  className="form-input"
                  required
                  value={editingItem.title ?? ''}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. Holistic Naturopathy Hero Banner"
                />
              </label>

              <div className="grid-2" style={{ gap: 12 }}>
                <label className="form-field">
                  <span className="form-label">Content Type *</span>
                  <select
                    className="form-input"
                    value={editingItem.content_type ?? 'section'}
                    onChange={e => setEditingItem({ ...editingItem, content_type: e.target.value as any })}
                  >
                    <option value="section">Website Section</option>
                    <option value="banner">Promotional Banner</option>
                    <option value="article">Article / Blog</option>
                    <option value="page">Landing Page Block</option>
                    <option value="faq">FAQ Item</option>
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Display Order</span>
                  <input
                    type="number"
                    className="form-input"
                    value={editingItem.display_order ?? 1}
                    onChange={e => setEditingItem({ ...editingItem, display_order: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label className="form-field">
                <span className="form-label">Summary / Subtitle</span>
                <input
                  className="form-input"
                  value={editingItem.summary ?? ''}
                  onChange={e => setEditingItem({ ...editingItem, summary: e.target.value })}
                />
              </label>

              <label className="form-field">
                <span className="form-label">Body Content</span>
                <textarea
                  className="form-input"
                  rows={4}
                  value={editingItem.body ?? ''}
                  onChange={e => setEditingItem({ ...editingItem, body: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!editingItem.is_active}
                  onChange={e => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                />
                <strong>Published &amp; Active on Public Website</strong>
              </label>

              <div className="flex justify-end" style={{ gap: 8, marginTop: 6 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Safety Modal */}
      <AdminRecordDeleteModal
        isOpen={!!deletingItem}
        moduleKey="cms_content"
        moduleLabel="Content Management System"
        recordId={deletingItem?.id || ''}
        recordName={deletingItem?.title || ''}
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  )
}

