'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerSignOutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    try {
      setLoading(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch {
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-ghost btn-sm"
      style={{
        height: compact ? 36 : 40,
        padding: compact ? '0 10px' : '0 14px',
        fontSize: compact ? 12 : 13,
        color: '#dc2626',
        fontWeight: 600,
      }}
      title="Sign Out"
    >
      {loading ? 'Signing out…' : compact ? '🚪 Exit' : 'Sign Out 🚪'}
    </button>
  )
}

