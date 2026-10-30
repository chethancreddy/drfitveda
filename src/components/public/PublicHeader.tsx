'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/programs',        label: 'Programs',       key: 'programs' },
  { href: '/how-it-works',    label: 'How It Works',   key: 'how-it-works' },
  { href: '/yoga',            label: 'Yoga',           key: 'yoga' },
  { href: '/nutrition',       label: 'Nutrition',      key: 'nutrition' },
  { href: '/womens-wellness', label: "Women's Health", key: 'womens-wellness' },
  { href: '/about',           label: 'About',          key: 'about' },
]

export default function PublicHeader({ active }: { active?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 150 }}>
      <div className="container header-inner" style={{ gap: 8 }}>
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
          title="Dr Fit Veda Home"
        >
          <img
            src="/logo.png"
            alt="Dr Fit Veda — Eat Right | Move Daily | Live Fully"
            style={{ height: 42, width: 'auto', maxWidth: 180, objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-xs hide-mobile" aria-label="Primary navigation">
          {NAV_LINKS.map(n => (
            <Link
              key={n.key}
              href={n.href}
              className={`btn btn-ghost btn-sm ${active === n.key || pathname === n.href ? 'text-primary' : ''}`}
              style={active === n.key || pathname === n.href ? { fontWeight: 600 } : {}}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop & Mobile Action Buttons */}
        <div className="flex items-center gap-xs" style={{ flexShrink: 0 }}>
          {/* Desktop Doctor / Trainer Direct Entry */}
          <Link
            href="/login?portal=professional"
            className="btn btn-ghost btn-sm hide-mobile"
            style={{
              color: '#0d9488',
              fontWeight: 600,
              fontSize: 13,
              padding: '0 12px',
            }}
            title="Direct Login for Doctors, Trainers & Care Team"
          >
            🩺 Doctor / Trainer Login
          </Link>

          {/* Direct Sign In Button — Visible on BOTH Mobile and Desktop */}
          <Link
            href="/login"
            className="btn btn-secondary btn-sm"
            style={{
              height: 40,
              padding: '0 14px',
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Sign In
          </Link>

          {/* Primary CTA */}
          <Link
            href="/memberships"
            className="btn btn-primary btn-sm"
            style={{
              height: 40,
              padding: '0 14px',
              fontSize: 13.5,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <span className="hide-mobile">Join Today</span>
            <span className="hide-desktop">Join</span>
          </Link>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className="btn btn-icon btn-ghost hide-desktop"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              background: menuOpen ? 'var(--color-neutral)' : 'white',
              fontSize: 18,
              color: 'var(--color-on-surface)',
              flexShrink: 0,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div
          className="hide-desktop"
          style={{
            position: 'fixed',
            top: 'var(--header-height)',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 149,
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface-card, #ffffff)',
              borderBottom: '1px solid var(--color-border)',
              padding: '16px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
              maxHeight: 'calc(100dvh - var(--header-height))',
              overflowY: 'auto',
              boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Direct Role-Based Sign-In Cards (Doctors, Trainers & Patients) */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-muted)',
                  marginBottom: 8,
                }}
              >
                Direct Account Sign In
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: '12px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1.5px solid var(--color-primary)',
                    textDecoration: 'none',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>👤</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                    Customer Login
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                    Daily plans, check-ins &amp; video sessions
                  </span>
                </Link>

                <Link
                  href="/login?portal=professional"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: '12px',
                    borderRadius: 12,
                    background: '#f0fdf4',
                    border: '1.5px solid #059669',
                    textDecoration: 'none',
                    color: 'var(--color-on-surface)',
                  }}
                >
                  <span style={{ fontSize: 18 }}>🩺</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#065f46' }}>
                    Doctor / Trainer
                  </span>
                  <span style={{ fontSize: 11, color: '#047857', lineHeight: 1.3 }}>
                    Specialist &amp; trainer clinical portal
                  </span>
                </Link>
              </div>
            </div>

            <div className="divider" style={{ margin: '12px 0' }} />

            {/* Site Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="Mobile navigation">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`sidebar-item ${pathname === '/' ? 'active' : ''}`}
                style={{ minHeight: 44, fontSize: 15 }}
              >
                <span>🏠</span> Home
              </Link>
              {NAV_LINKS.map(n => (
                <Link
                  key={n.key}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className={`sidebar-item ${active === n.key || pathname === n.href ? 'active' : ''}`}
                  style={{ minHeight: 44, fontSize: 15 }}
                >
                  <span>•</span> {n.label}
                </Link>
              ))}
              <Link
                href="/memberships"
                onClick={() => setMenuOpen(false)}
                className={`sidebar-item ${active === 'memberships' || pathname === '/memberships' ? 'active' : ''}`}
                style={{ minHeight: 44, fontSize: 15 }}
              >
                <span>💎</span> Memberships &amp; Pricing
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className={`sidebar-item ${pathname === '/contact' ? 'active' : ''}`}
                style={{ minHeight: 44, fontSize: 15 }}
              >
                <span>📞</span> Contact &amp; Support
              </Link>
            </nav>

            <div style={{ marginTop: 16 }}>
              <Link
                href="/memberships"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary btn-full"
                style={{ height: 48, fontSize: 15, fontWeight: 600 }}
              >
                Explore 90-Day Program →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
