'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export const PROFESSIONAL_NAV_LINKS = [
  { href: '/professional', icon: '🏠', label: 'Dashboard' },
  { href: '/professional/customers', icon: '🩺', label: 'Patients & Clinical Intake' },
  { href: '/professional/plans', icon: '📋', label: 'Diet & Naturopathy Plans' },
  { href: '/professional/training', icon: '🎥', label: 'Live Training & Meet' },
  { href: '/professional/reviews', icon: '📊', label: 'Weekly Reviews' },
  { href: '/professional/consult', icon: '📅', label: 'Consultations' },
  { href: '/professional/earnings', icon: '💰', label: 'My Earnings' },
]

export default function ProfessionalSidebar({
  userName = 'Doctor / Specialist',
  userRole = 'doctor',
}: {
  userName?: string
  userRole?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

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

  const roleLabel = userRole === 'doctor'
    ? 'Naturopathic Doctor'
    : userRole === 'trainer'
    ? 'Certified Trainer'
    : userRole === 'nutritionist'
    ? 'Clinical Nutritionist'
    : 'Care Specialist'

  return (
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
              color: '#0d9488',
            }}
          >
            Doctor &amp; Professional Portal
          </div>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PROFESSIONAL_NAV_LINKS.map(l => {
            const isActive = pathname === l.href || (l.href !== '/professional' && pathname.startsWith(l.href))
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
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--color-bg-subtle, #f8fafc)',
            borderRadius: 'var(--radius-sm, 6px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#047857',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted, #64748b)' }}>
              {roleLabel}
            </div>
          </div>
        </div>

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
  )
}
