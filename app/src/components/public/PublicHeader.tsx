import Link from 'next/link'

export default function PublicHeader({ active = '' }: { active?: string }) {
  const links = [
    { href: '/how-it-works', label: 'How It Works', key: 'how-it-works' },
    { href: '/programs', label: 'Programs', key: 'programs' },
    { href: '/memberships', label: 'Memberships', key: 'memberships' },
    { href: '/testimonials', label: 'Transformations', key: 'testimonials' },
    { href: '/about', label: 'About', key: 'about' },
    { href: '/faq', label: 'FAQ', key: 'faq' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ]

  return (
    <header className="header" style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,0.96)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--color-border)'}}>
      <div className="container header-inner">
        <Link href="/" className="logo" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <img
            src="/logo.png"
            alt="Dr Fit Veda — Health, Fitness, Nutrition"
            style={{height:44,width:'auto',maxWidth:220,objectFit:'contain'}}
          />
        </Link>

        <nav className="flex items-center gap-xs hide-mobile">
          {links.map(l => (
            <Link
              key={l.key}
              href={l.href}
              className={`text-body-sm ${active === l.key ? 'text-primary' : 'text-muted'}`}
              style={{padding:'6px 12px',fontWeight: active === l.key ? 600 : 500,borderRadius:'var(--radius-sm)'}}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-xs">
          <Link href="/login" className="btn btn-secondary btn-sm hide-mobile">Sign In</Link>
          <Link href="/memberships" className="btn btn-primary btn-sm">Join Today</Link>
        </div>
      </div>
    </header>
  )
}
