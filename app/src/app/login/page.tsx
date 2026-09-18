'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // OTP State
  const [phoneOrEmail, setPhoneOrEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpPreview, setOtpPreview] = useState('')

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          email: identifier.trim(),
          password,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid User ID or Password')

      window.location.href = data.redirectTo || '/customer'
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  // 2. OTP Request Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneOrEmail) {
      setError('Please enter your mobile number or email')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_or_email: phoneOrEmail,
          action: 'send_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setOtpSent(true)
      setOtpPreview(data.otp_preview || '123456')
      setSuccessMsg(`OTP verification code generated for ${phoneOrEmail}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // 3. OTP Verify & Login Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_or_email: phoneOrEmail,
          otp: otpCode.trim(),
          action: 'verify_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code')

      window.location.href = data.redirectTo || '/customer'
    } catch (err: any) {
      setError(err.message || 'OTP verification failed')
      setLoading(false)
    }
  }

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetIdentifier) {
      setResetStatus({ type: 'error', message: 'User ID or Email is required' })
      return
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetStatus({ type: 'error', message: 'New passwords do not match' })
      return
    }
    if (resetNewPassword.length < 6) {
      setResetStatus({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setResetLoading(true)
    setResetStatus(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resetIdentifier,
          new_password: resetNewPassword,
          action: 'reset_password',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reset failed')

      setResetStatus({
        type: 'success',
        message: 'Password reset successfully! Auto-filled your login details below.',
      })

      setIdentifier(resetIdentifier)
      setPassword(resetNewPassword)

      setTimeout(() => {
        setShowResetModal(false)
        setResetStatus(null)
      }, 1800)
    } catch (err: any) {
      setResetStatus({ type: 'error', message: err.message || 'Error resetting password' })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #2d2417 0%, #1c150c 50%, #0d0a06 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo Card */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              background: 'white',
              padding: '10px 24px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              alignItems: 'center',
            }}
          >
            <img
              src="/logo.png"
              alt="Dr Fit Veda"
              style={{ height: 48, width: 'auto', maxWidth: 240, objectFit: 'contain' }}
            />
          </Link>
        </div>

        {/* Main Login Card */}
        <div
          className="card"
          style={{
            padding: 'var(--space-lg)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            background: 'white',
            borderRadius: '16px',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <h1 className="text-headline-sm" style={{ margin: 0, color: '#0f172a' }}>
              Sign In to Your Account
            </h1>
            <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0' }}>
              Access Doctor Consultations, Daily Naturopathy Plans &amp; Training
            </p>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: 8,
              padding: 4,
              marginBottom: 'var(--space-md)',
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setError(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'password' ? 'white' : 'transparent',
                fontWeight: activeTab === 'password' ? 700 : 500,
                fontSize: 13,
                color: activeTab === 'password' ? '#0d9488' : '#64748b',
                boxShadow: activeTab === 'password' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
              }}
            >
              🔑 User ID &amp; Password
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('otp'); setError(null); setSuccessMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'otp' ? 'white' : 'transparent',
                fontWeight: activeTab === 'otp' ? 700 : 500,
                fontSize: 13,
                color: activeTab === 'otp' ? '#0d9488' : '#64748b',
                boxShadow: activeTab === 'otp' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
              }}
            >
              📲 Mobile OTP Login
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                borderRadius: 6,
                marginBottom: 'var(--space-md)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                background: '#ecfdf5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                borderRadius: 6,
                marginBottom: 'var(--space-md)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ✓ {successMsg}
            </div>
          )}

          {/* TAB 1: USER ID & PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  User ID / Registered Email / Phone *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="e.g. admin@drfitveda.com or +91 98765 43210"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 16, color: '#94a3b8' }}>👤</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="text-body-sm" style={{ fontWeight: 600 }}>
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier || 'customer@drfitveda.com')
                      setShowResetModal(true)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#0d9488',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Forgot / Reset Password?
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      fontSize: 14,
                    }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 16, color: '#94a3b8' }}>🔒</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 8,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#64748b',
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  Remember my login
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 6,
                }}
              >
                {loading ? 'Signing In…' : 'Sign In with Password'}
              </button>
            </form>
          )}

          {/* TAB 2: MOBILE OTP LOGIN */}
          {activeTab === 'otp' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Enter Mobile Number or Registered Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required
                        value={phoneOrEmail}
                        onChange={e => setPhoneOrEmail(e.target.value)}
                        placeholder="e.g. +91 98765 43210 or email@domain.com"
                        className="form-input"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                      />
                      <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 16, color: '#94a3b8' }}>📱</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, fontSize: 12, color: '#64748b' }}>
                    💡 <strong>OTP-Ready:</strong> Enter your mobile number. A 6-digit verification code will be sent to your device.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: 15 }}
                  >
                    {loading ? 'Sending OTP…' : 'Get Verification OTP →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-body-sm text-muted">OTP sent to: <strong>{phoneOrEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'transparent', border: 'none', color: '#0d9488', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #0d9488',
                        borderRadius: 6,
                        fontSize: 20,
                        letterSpacing: '6px',
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {otpPreview && (
                    <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 6, fontSize: 12, color: '#065f46', textAlign: 'center' }}>
                      🔑 Test Code: <strong>{otpPreview}</strong>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: 15 }}
                  >
                    {loading ? 'Verifying OTP…' : 'Verify &amp; Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <p
          className="text-caption"
          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 'var(--space-md)' }}
        >
          Dr Fit Veda Platform • Naturopathy, Clinical Nutrition &amp; Certified Fitness
        </p>
      </div>

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
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
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 'var(--space-lg)', borderRadius: 12 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <h2 className="text-headline-sm" style={{ margin: 0 }}>Reset Password</h2>
              </div>
              <button
                className="btn btn-icon btn-ghost"
                onClick={() => { setShowResetModal(false); setResetStatus(null); }}
              >
                ✕
              </button>
            </div>

            <p className="text-body-sm text-muted" style={{ marginBottom: 14 }}>
              Enter your registered User ID, Email, or Mobile Number and choose your new password.
            </p>

            {resetStatus && (
              <div
                style={{
                  padding: '10px 14px',
                  background: resetStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${resetStatus.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
                  color: resetStatus.type === 'success' ? '#065f46' : '#991b1b',
                  borderRadius: 6,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {resetStatus.message}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  User ID / Email / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={e => setResetIdentifier(e.target.value)}
                  placeholder="e.g. doctor@drfitveda.com"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                />
              </div>

              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  New Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                />
              </div>

              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={e => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                />
              </div>

              <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setShowResetModal(false); setResetStatus(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn btn-primary"
                >
                  {resetLoading ? 'Resetting…' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
