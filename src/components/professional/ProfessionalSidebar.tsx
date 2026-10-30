'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export const PROFESSIONAL_NAV_LINKS = [
  { href: '/professional', icon: '🏠', label: 'Dashboard', shortLabel: 'Home' },
  { href: '/professional/customers', icon: '🩺', label: 'Patients & Clinical Intake', shortLabel: 'Patients' },
  { href: '/professional/plans', icon: '📋', label: 'Diet & Naturopathy Plans', shortLabel: 'Plans' },
  { href: '/professional/training', icon: '🎥', label: 'Live Training & Meet', shortLabel: 'Live Meet' },
  { href: '/professional/reviews', icon: '📊', label: 'Weekly Reviews', shortLabel: 'Reviews' },
  { href: '/professional/consult', icon: '📅', label: 'Consultations', shortLabel: 'Consults' },
  { href: '/professional/earnings', icon: '💰', label: 'My Earnings', shortLabel: 'Earnings' },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
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

  const isTrainer = userRole?.toLowerCase().includes('trainer')
  const roleLabel =
    userRole === 'doctor' || userRole === 'naturopathy_doctor'
      ? 'Naturopathic Doctor'
      : userRole === 'ayurveda_doctor'
      ? 'Ayurvedic Doctor'
      : isTrainer
      ? 'Certified Trainer'
      : userRole === 'nutritionist'
      ? 'Clinical Nutritionist'
      : userRole === 'yoga_doctor' || userRole === 'yoga_consultant'
      ? 'Yoga Specialist'
      : 'Care Specialist'

  const initials =
    userName
      .replace(/^Dr\.?\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('') || 'SP'

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
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: 10,
                color: '#0d9488',
              }}
            >
              {isTrainer ? '🏋️ Trainer Portal' : '🩺 Doctor & Specialist Portal'}
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
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, color: '#047857', fontWeight: 600 }}>
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
            <Link href="/professional" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
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
                {userName}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#047857' }}>
                {roleLabel}
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
              aria-label="Toggle specialist navigation menu"
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
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PROFESSIONAL_NAV_LINKS.map(l => {
                  const isActive = pathname === l.href || (l.href !== '/professional' && pathname.startsWith(l.href))
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`sidebar-item${isActive ? ' active' : ''}`}
                      style={{ minHeight: 44, fontSize: 14.5 }}
                    >
                      <span style={{ fontSize: 18 }}>{l.icon}</span>
                      {l.label}
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
                🚪 {loggingOut ? 'Signing out…' : 'Sign Out of Specialist Portal'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR (<= 768px) ─── */}
      <nav className="bottom-nav hide-desktop no-print" aria-label="Specialist mobile navigation">
        {PROFESSIONAL_NAV_LINKS.slice(0, 5).map(l => {
          const isActive = pathname === l.href || (l.href !== '/professional' && pathname.startsWith(l.href))
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
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
