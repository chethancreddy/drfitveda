'use client'
import Link from 'next/link'

const NAV = [
  { href:'/customer',         label:'Home',    icon:'🏠' },
  { href:'/customer/plan',    label:'Plan',    icon:'📋' },
  { href:'/customer/track',   label:'Track',   icon:'✅' },
  { href:'/customer/gallery', label:'Gallery', icon:'🎬' },
  { href:'/customer/consult', label:'Consult', icon:'📅' },
  { href:'/customer/profile', label:'Profile', icon:'👤' },
]

export default function CustomerBottomNav({ active }: { active: string }) {
  return (
    <nav className="bottom-nav no-print" aria-label="Main navigation">
      {NAV.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className={`bottom-nav-item ${active === n.label.toLowerCase() || (active === 'home' && n.href === '/customer') ? 'active' : ''}`}
          aria-label={n.label}
          aria-current={active === n.label.toLowerCase() ? 'page' : undefined}
        >
          <span style={{fontSize:22}}>{n.icon}</span>
          <span>{n.label}</span>
        </Link>
      ))}
    </nav>
  )
}
