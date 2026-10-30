'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export const ADMIN_NAV_LINKS = [
  { href: '/admin', icon: '📊', label: 'Dashboard', shortLabel: 'Home' },
  { href: '/admin/customers', icon: '👥', label: 'Customers', shortLabel: 'Patients' },
  { href: '/admin/professionals', icon: '👨‍⚕️', label: 'Professionals', shortLabel: 'Doctors' },
  { href: '/admin/assignments', icon: '🔗', label: 'Assignments', shortLabel: 'Assign' },
  { href: '/admin/team', icon: '👔', label: 'Operations Team', shortLabel: 'Team' },
  { href: '/admin/memberships', icon: '💳', label: 'Memberships', shortLabel: 'Plans' },
  { href: '/admin/training', icon: '🎥', label: 'Training', shortLabel: 'Training' },
  { href: '/admin/finance', icon: '💰', label: 'Finance', shortLabel: 'Finance' },
  { href: '/admin/payouts', icon: '💵', label: 'Payouts', shortLabel: 'Payouts' },
  { href: '/admin/reviews', icon: '📋', label: 'Reviews', shortLabel: 'Reviews' },
  { href: '/admin/cms', icon: '🌐', label: 'CMS', shortLabel: 'CMS' },
  { href: '/admin/reports', icon: '📈', label: 'Reports', shortLabel: 'Reports' },
  { href: '/admin/audit', icon: '🔍', label: 'Audit Logs', shortLabel: 'Audit' },
  { href: '/admin/privacy-requests', icon: '🔒', label: 'Privacy Requests', shortLabel: 'Privacy' },
  { href: '/admin/settings', icon: '⚙️', label: 'Settings', shortLabel: 'Settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState<{ full_name: string; designation: string; email?: string } | null>(null)

  useEffect(() => {
    setMobileMenuOpen(false)
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) setAdminProfile(data.profile)
      })
      .catch(() => {})
  }, [pathname])

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      window.location.href = '/login'
    } finally {
      setLoggingOut(false)
    }
  }

  const adminName = adminProfile?.full_name || 'Rajesh Kumar'
  const adminDesignation = adminProfile?.designation || 'Super Administrator'
  const initials =
    adminName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'SA'

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (> 768px) ─── */}
      <aside
        className="sidebar hide-mobile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              display: 'block',
              padding: '10px 12px',
              marginBottom: 'var(--space-sm)',
              background: 'white',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <img
              src="/logo.png"
              alt="Dr Fit Veda"
              style={{ height: 38, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />
            <div
              className="text-caption text-muted"
              style={{
                marginTop: 4,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: 10,
              }}
            >
              Admin Control Panel
            </div>
          </Link>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ADMIN_NAV_LINKS.map(l => {
              const isActive = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`sidebar-item${isActive ? ' active' : ''}`}
                >
                  <span style={{ fontSize: 18 }}>{l.icon}</span>
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User / Logout section */}
        <div
          style={{
            marginTop: 'var(--space-md)',
            paddingTop: 'var(--space-sm)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Link
            href="/admin/settings#profile"
            title="Click to edit Superadmin Profile in Settings"
            style={{
              padding: '8px 10px',
              background: 'var(--color-bg-subtle, #f8fafc)',
              borderRadius: 'var(--radius-sm, 6px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--color-border, #e2e8f0)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0d9488',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminName}
              </div>
              <div style={{ fontSize: 10, color: '#0d9488', fontWeight: 600 }}>
                {adminDesignation} ✏️
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-ghost btn-sm"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              color: '#dc2626',
              padding: '8px 12px',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            {loggingOut ? 'Signing out...' : 'Sign Out / Logout'}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR (<= 768px) ─── */}
      <header
        className="header hide-desktop no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 140,
          paddingInline: 12,
        }}
      >
        <div className="header-inner" style={{ gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img
                src="/logo.png"
                alt="Dr Fit Veda"
                style={{ height: 34, width: 'auto', maxWidth: 130, objectFit: 'contain' }}
              />
            </Link>
            <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 8, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {adminName}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#0d9488' }}>
                Admin Control
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-ghost btn-sm"
              style={{
                height: 36,
                padding: '0 10px',
                fontSize: 12,
                color: '#dc2626',
                fontWeight: 600,
              }}
              title="Sign Out"
            >
              🚪 Exit
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle admin navigation menu"
              aria-expanded={mobileMenuOpen}
              className="btn btn-icon btn-ghost"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                background: mobileMenuOpen ? 'var(--color-neutral)' : 'white',
                fontSize: 18,
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: 'var(--header-height)',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              zIndex: 139,
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              style={{
                background: 'var(--surface-card, #ffffff)',
                borderBottom: '1px solid var(--color-border)',
                padding: '14px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
                maxHeight: 'calc(100dvh - var(--header-height))',
                overflowY: 'auto',
                boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <nav style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ADMIN_NAV_LINKS.map(l => {
                  const isActive = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`sidebar-item${isActive ? ' active' : ''}`}
                      style={{ minHeight: 42, fontSize: 13, padding: '8px 10px' }}
                    >
                      <span style={{ fontSize: 16 }}>{l.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="divider" style={{ margin: '12px 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn btn-ghost btn-full"
                style={{
                  height: 44,
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  background: '#fef2f2',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                🚪 {loggingOut ? 'Signing out…' : 'Sign Out of Admin Portal'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR (<= 768px) ─── */}
      <nav className="bottom-nav hide-desktop no-print" aria-label="Admin mobile navigation">
        {[
          ADMIN_NAV_LINKS[0], // Dashboard
          ADMIN_NAV_LINKS[1], // Customers
          ADMIN_NAV_LINKS[2], // Professionals
          ADMIN_NAV_LINKS[5], // Memberships
          ADMIN_NAV_LINKS[14], // Settings
        ].map(l => {
          const isActive = pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href))
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              <span>{l.shortLabel}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className={`bottom-nav-item ${mobileMenuOpen ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 20 }}>☰</span>
          <span>All</span>
        </button>
      </nav>
    </>
  )
}
