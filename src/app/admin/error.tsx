'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin route error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🩺</div>
        <h2 className="text-headline-sm" style={{ marginBottom: 8, color: '#0f172a' }}>
          Admin View Recovery
        </h2>
        <p className="text-body-sm text-muted" style={{ marginBottom: 20, lineHeight: 1.6 }}>
          An error occurred while loading this administrative view. All patient data, consultations, and platform configurations remain completely safe.
        </p>

        {error.message && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#991b1b',
              fontSize: 12.5,
              marginBottom: 24,
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary btn-sm"
            style={{ minWidth: 120 }}
          >
            ↻ Try Again
          </button>
          <Link href="/admin" className="btn btn-outline btn-sm" style={{ minWidth: 120 }}>
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
