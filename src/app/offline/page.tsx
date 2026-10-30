'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(160deg, #2d2417 0%, #1c150c 50%, #0d0a06 100%)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '32px 24px',
          textAlign: 'center',
          background: 'white',
          borderRadius: 18,
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        }}
      >
        <img
          src="/logo.png"
          alt="Dr Fit Veda"
          style={{ height: 48, width: 'auto', marginInline: 'auto', marginBottom: 16, objectFit: 'contain' }}
        />

        <div style={{ fontSize: 42, marginBottom: 12 }}>📡</div>
        <h1 className="text-headline-sm" style={{ marginBottom: 8, color: '#0f172a' }}>
          You Are Currently Offline
        </h1>
        <p className="text-body-sm text-muted" style={{ marginBottom: 24, lineHeight: 1.6 }}>
          Dr Fit Veda requires an active internet connection to securely sync your live doctor consultations, daily check-ins, and clinical health records.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-full"
            style={{ height: 48, fontWeight: 700, fontSize: 15 }}
          >
            🔄 Reconnect &amp; Try Again
          </button>
          <Link href="/" className="btn btn-ghost btn-full" style={{ height: 44, fontSize: 14 }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

