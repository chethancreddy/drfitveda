'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Popular country codes supported with flags
const POPULAR_COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India (+91)' },
  { code: '+971', flag: '🇦🇪', name: 'UAE (+971)' },
  { code: '+1', flag: '🇺🇸', name: 'USA/CA (+1)' },
  { code: '+44', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore (+65)' },
  { code: '+61', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia (+966)' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar (+974)' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait (+965)' },
  { code: '+968', flag: '🇴🇲', name: 'Oman (+968)' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain (+973)' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia (+60)' },
  { code: '+49', flag: '🇩🇪', name: 'Germany (+49)' },
  { code: '+33', flag: '🇫🇷', name: 'France (+33)' },
  { code: '+81', flag: '🇯🇵', name: 'Japan (+81)' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa (+27)' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh (+880)' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal (+977)' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka (+94)' },
]

export default function LoginPage() {
  const [portalMode, setPortalMode] = useState<'customer' | 'professional' | 'admin'>('customer')
  const [activeTab, setActiveTab] = useState<'password' | 'whatsapp_otp' | 'email_otp'>('whatsapp_otp')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Detect ?portal=professional or ?role=doctor|trainer from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const portal = (params.get('portal') || params.get('role') || '').toLowerCase()
    if (portal === 'professional' || portal === 'doctor' || portal === 'trainer') {
      setPortalMode('professional')
    } else if (portal === 'admin' || portal === 'staff') {
      setPortalMode('admin')
    }
  }, [])

  // WhatsApp OTP State (with editable Country Code, defaults to India +91)
  const [countryCode, setCountryCode] = useState('+91')
  const [isCustomCode, setIsCustomCode] = useState(false)
  const [customCountryCode, setCustomCountryCode] = useState('+')
  const [whatsappMobile, setWhatsappMobile] = useState('')
  const [whatsappFullPhone, setWhatsappFullPhone] = useState('')
  const [whatsappDisplay, setWhatsappDisplay] = useState('')
  const [whatsappCode, setWhatsappCode] = useState('')
  const [whatsappSent, setWhatsappSent] = useState(false)
  const [whatsappCountdown, setWhatsappCountdown] = useState(0)

  // Email OTP State
  const [emailIdentifier, setEmailIdentifier] = useState('')
  const [emailDisplay, setEmailDisplay] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)

  // Stateless OTP session tokens for serverless resilience
  const [whatsappOtpToken, setWhatsappOtpToken] = useState<string | null>(null)
  const [emailOtpToken, setEmailOtpToken] = useState<string | null>(null)

  // Countdown timers for OTP resend cooldown
  useEffect(() => {
    if (whatsappCountdown <= 0) return
    const timer = setInterval(() => {
      setWhatsappCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [whatsappCountdown])

  useEffect(() => {
    if (emailCountdown <= 0) return
    const timer = setInterval(() => {
      setEmailCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [emailCountdown])

  // Helper: validate phone number using selected country code
  const validatePhoneNumber = (
    code: string,
    number: string
  ): { isValid: boolean; error?: string; cleanPhone: string; cleanCode: string; fullPhone: string } => {
    let cleanNumber = number.replace(/\D/g, '')
    let cleanCode = code.trim().startsWith('+') ? code.trim() : `+${code.trim()}`
    cleanCode = `+${cleanCode.replace(/\D/g, '')}`

    if (!cleanCode || cleanCode === '+') {
      return { isValid: false, error: 'Please enter a valid country code (e.g. +91).', cleanPhone: '', cleanCode: '', fullPhone: '' }
    }

    if (!cleanNumber) {
      return { isValid: false, error: 'Please enter your mobile number.', cleanPhone: '', cleanCode, fullPhone: '' }
    }

    // Handle duplicate country code if user accidentally pasted it in the mobile field
    const codeDigits = cleanCode.replace(/\D/g, '')
    if (cleanNumber.startsWith(codeDigits) && cleanNumber.length > 10) {
      cleanNumber = cleanNumber.slice(codeDigits.length)
    }

    // Specific country validations
    if (cleanCode === '+91') {
      // Strip leading 0 if entered for India
      if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
        cleanNumber = cleanNumber.slice(1)
      }
      if (cleanNumber.length !== 10) {
        return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.', cleanPhone: cleanNumber, cleanCode, fullPhone: '' }
      }
      if (!/^[6-9]/.test(cleanNumber)) {
        return { isValid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9.', cleanPhone: cleanNumber, cleanCode, fullPhone: '' }
      }
    } else if (cleanCode === '+1') {
      if (cleanNumber.length !== 10) {
        return { isValid: false, error: 'Please enter a valid 10-digit US/Canada phone number.', cleanPhone: cleanNumber, cleanCode, fullPhone: '' }
      }
    } else if (cleanCode === '+971') {
      if (cleanNumber.length !== 9) {
        return { isValid: false, error: 'Please enter a valid 9-digit UAE mobile number (e.g. 50 123 4567).', cleanPhone: cleanNumber, cleanCode, fullPhone: '' }
      }
    } else {
      if (cleanNumber.length < 6 || cleanNumber.length > 14) {
        return { isValid: false, error: `Please enter a valid mobile number for country code ${cleanCode}.`, cleanPhone: cleanNumber, cleanCode, fullPhone: '' }
      }
    }

    const fullPhone = `${cleanCode}${cleanNumber}`
    return { isValid: true, cleanPhone: cleanNumber, cleanCode, fullPhone }
  }

  // Auto-detect pasted phone number containing a country code
  const handleMobileInputChange = (val: string) => {
    const trimmed = val.trim()
    if (trimmed.startsWith('+')) {
      const matched = POPULAR_COUNTRY_CODES.find(c => trimmed.startsWith(c.code))
      if (matched) {
        setCountryCode(matched.code)
        setIsCustomCode(false)
        const remainder = trimmed.slice(matched.code.length).replace(/[\s\-]/g, '')
        setWhatsappMobile(remainder)
        return
      }
    }
    setWhatsappMobile(val)
  }

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetOtpSent, setResetOtpSent] = useState(false)
  const [resetOtpCode, setResetOtpCode] = useState('')
  const [resetOtpToken, setResetOtpToken] = useState<string | null>(null)
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

  // 2. WhatsApp OTP Send Handler (Combines Country Code + Mobile Number)
  const handleSendWhatsappOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeCode = isCustomCode ? customCountryCode : countryCode
    const validation = validatePhoneNumber(activeCode, whatsappMobile)

    if (!validation.isValid) {
      setError(validation.error || 'Please enter a valid mobile number with country code.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: validation.fullPhone,
          channel: 'whatsapp',
          action: 'send_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send WhatsApp verification code.')

      setWhatsappSent(true)
      setWhatsappFullPhone(validation.fullPhone)
      setWhatsappDisplay(data.display || validation.fullPhone)
      setWhatsappCountdown(data.cooldownSeconds || 60)
      if (data.otpToken) setWhatsappOtpToken(data.otpToken)
      setSuccessMsg(data.message || `Verification code sent to WhatsApp: ${data.display || validation.fullPhone}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send WhatsApp OTP')
    } finally {
      setLoading(false)
    }
  }

  // 3. WhatsApp OTP Resend Handler
  const handleResendWhatsappOtp = async () => {
    if (whatsappCountdown > 0 || loading) return

    const activeCode = isCustomCode ? customCountryCode : countryCode
    const validation = validatePhoneNumber(activeCode, whatsappMobile)
    const targetPhone = whatsappFullPhone || validation.fullPhone

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          channel: 'whatsapp',
          action: 'resend_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend WhatsApp OTP.')

      setWhatsappCountdown(data.cooldownSeconds || 60)
      if (data.otpToken) setWhatsappOtpToken(data.otpToken)
      setSuccessMsg(`A fresh verification code has been dispatched to WhatsApp (${whatsappDisplay || targetPhone}).`)
    } catch (err: any) {
      setError(err.message || 'Failed to resend WhatsApp OTP')
    } finally {
      setLoading(false)
    }
  }

  // 4. WhatsApp OTP Verify & Login Handler
  const handleVerifyWhatsappOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = whatsappCode.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    const activeCode = isCustomCode ? customCountryCode : countryCode
    const validation = validatePhoneNumber(activeCode, whatsappMobile)
    const targetPhone = whatsappFullPhone || validation.fullPhone

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          channel: 'whatsapp',
          otp: cleanCode,
          otpToken: whatsappOtpToken || undefined,
          action: 'verify_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.')

      setSuccessMsg('WhatsApp verification successful! Accessing your portal…')
      window.location.href = data.redirectTo || '/customer'
    } catch (err: any) {
      setError(err.message || 'WhatsApp OTP verification failed')
      setLoading(false)
    }
  }

  // 5. Email OTP Send Handler
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanInput = emailIdentifier.trim()
    if (!cleanInput || !cleanInput.includes('@')) {
      setError('Please enter a valid registered email address.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanInput,
          channel: 'email',
          action: 'send_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send Email OTP')

      setEmailSent(true)
      setEmailDisplay(data.display || cleanInput)
      setEmailCountdown(data.cooldownSeconds || 60)
      if (data.otpToken) setEmailOtpToken(data.otpToken)
      setSuccessMsg(data.message || `Verification code sent to ${data.display || cleanInput}`)
    } catch (err: any) {
      setError(err.message || 'Failed to send Email OTP')
    } finally {
      setLoading(false)
    }
  }

  // 6. Email OTP Resend Handler
  const handleResendEmailOtp = async () => {
    if (emailCountdown > 0 || loading) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailIdentifier.trim(),
          channel: 'email',
          action: 'resend_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend Email OTP')

      setEmailCountdown(data.cooldownSeconds || 60)
      if (data.otpToken) setEmailOtpToken(data.otpToken)
      setSuccessMsg(`A fresh verification code has been sent to ${emailDisplay}.`)
    } catch (err: any) {
      setError(err.message || 'Failed to resend Email OTP')
    } finally {
      setLoading(false)
    }
  }

  // 7. Email OTP Verify Handler
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = emailCode.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailIdentifier.trim(),
          channel: 'email',
          otp: cleanCode,
          otpToken: emailOtpToken || undefined,
          action: 'verify_otp',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.')

      setSuccessMsg('Email verification successful! Accessing your portal…')
      window.location.href = data.redirectTo || '/customer'
    } catch (err: any) {
      setError(err.message || 'Email OTP verification failed')
      setLoading(false)
    }
  }

  // Request Reset Password OTP Handler
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetIdentifier.trim()) {
      setResetStatus({ type: 'error', message: 'User ID or Email is required' })
      return
    }
    setResetLoading(true)
    setResetStatus(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resetIdentifier.trim(),
          action: 'request_otp',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code')
      setResetOtpSent(true)
      if (data.otpToken) setResetOtpToken(data.otpToken)
      setResetStatus({
        type: 'success',
        message: data.message || 'Verification code sent! Enter the 6-digit code below.',
      })
    } catch (err: any) {
      setResetStatus({ type: 'error', message: err.message || 'Failed to request verification code' })
    } finally {
      setResetLoading(false)
    }
  }

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetIdentifier) {
      setResetStatus({ type: 'error', message: 'User ID or Email is required' })
      return
    }
    if (!resetOtpCode.trim() || resetOtpCode.trim().length !== 6) {
      setResetStatus({ type: 'error', message: 'Please enter the 6-digit verification code' })
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
          otp: resetOtpCode.trim(),
          otpToken: resetOtpToken || undefined,
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
        setResetOtpSent(false)
        setResetOtpCode('')
        setResetOtpToken(null)
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
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #2d2417 0%, #1c150c 50%, #0d0a06 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 4vw, 24px)',
        overflowX: 'hidden',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480, minWidth: 0 }}>
        {/* Logo Card */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              background: 'white',
              padding: '8px 20px',
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              alignItems: 'center',
            }}
          >
            <img
              src="/logo.png"
              alt="Dr Fit Veda"
              style={{ height: 42, width: 'auto', maxWidth: 210, objectFit: 'contain' }}
            />
          </Link>
        </div>

        {/* Main Login Card */}
        <div
          className="card"
          style={{
            padding: 'clamp(16px, 5vw, 28px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Role / Portal Quick Switcher */}
          <div
            role="tablist"
            aria-label="Account type"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.15fr 0.85fr',
              gap: 4,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 4,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={portalMode === 'customer'}
              onClick={() => setPortalMode('customer')}
              style={{
                padding: '7px 6px',
                borderRadius: 7,
                border: 'none',
                background: portalMode === 'customer' ? '#0f172a' : 'transparent',
                color: portalMode === 'customer' ? 'white' : '#475569',
                fontWeight: portalMode === 'customer' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              👤 Patient
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={portalMode === 'professional'}
              onClick={() => setPortalMode('professional')}
              style={{
                padding: '7px 6px',
                borderRadius: 7,
                border: 'none',
                background: portalMode === 'professional' ? '#059669' : 'transparent',
                color: portalMode === 'professional' ? 'white' : '#047857',
                fontWeight: portalMode === 'professional' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🩺 Doctor / Trainer
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={portalMode === 'admin'}
              onClick={() => setPortalMode('admin')}
              style={{
                padding: '7px 6px',
                borderRadius: 7,
                border: 'none',
                background: portalMode === 'admin' ? '#0d9488' : 'transparent',
                color: portalMode === 'admin' ? 'white' : '#475569',
                fontWeight: portalMode === 'admin' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🛡️ Admin
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: 14 }}>
            <h1 className="text-headline-sm" style={{ margin: 0, color: '#0f172a', fontSize: 21 }}>
              {portalMode === 'professional'
                ? 'Doctor & Trainer Portal Sign In'
                : portalMode === 'admin'
                ? 'Admin & Operations Sign In'
                : 'Sign In to Your Account'}
            </h1>
            <p className="text-body-sm text-muted" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
              {portalMode === 'professional'
                ? 'Sign in with your registered clinical email or WhatsApp number to open your Specialist Dashboard directly.'
                : portalMode === 'admin'
                ? 'Authorized Super Admin, Operations Manager & Care Coordinator access.'
                : 'Access Doctor Consultations, Daily Naturopathy Plans & Live Training.'}
            </p>
          </div>

          {/* Navigation Tabs: WhatsApp OTP, Email OTP, Password */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: 8,
              padding: 4,
              marginBottom: 'var(--space-md)',
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('whatsapp_otp')
                setError(null)
                setSuccessMsg(null)
              }}
              style={{
                flex: 1,
                minHeight: 38,
                padding: '8px 4px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'whatsapp_otp' ? 'white' : 'transparent',
                fontWeight: activeTab === 'whatsapp_otp' ? 700 : 500,
                fontSize: 12.5,
                color: activeTab === 'whatsapp_otp' ? '#059669' : '#64748b',
                boxShadow: activeTab === 'whatsapp_otp' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <span>💬</span> WhatsApp OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('email_otp')
                setError(null)
                setSuccessMsg(null)
              }}
              style={{
                flex: 1,
                minHeight: 38,
                padding: '8px 4px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'email_otp' ? 'white' : 'transparent',
                fontWeight: activeTab === 'email_otp' ? 700 : 500,
                fontSize: 12.5,
                color: activeTab === 'email_otp' ? '#0d9488' : '#64748b',
                boxShadow: activeTab === 'email_otp' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <span>✉️</span> Email OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('password')
                setError(null)
                setSuccessMsg(null)
              }}
              style={{
                flex: 1,
                minHeight: 38,
                padding: '8px 4px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'password' ? 'white' : 'transparent',
                fontWeight: activeTab === 'password' ? 700 : 500,
                fontSize: 12.5,
                color: activeTab === 'password' ? '#0d9488' : '#64748b',
                boxShadow: activeTab === 'password' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <span>🔑</span> Password
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

          {/* TAB 1: WHATSAPP OTP LOGIN (POWERED BY MSG91) */}
          {activeTab === 'whatsapp_otp' && (
            <div>
              {!whatsappSent ? (
                <form onSubmit={handleSendWhatsappOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: '#0f172a' }}>
                      Registered Mobile Number *
                    </label>

                    {/* Side-by-side Country Code & Mobile Number Input — Compact & Vertically Aligned */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      {/* Country Code: Default +91, compact 100px width, exact 48px height */}
                      {!isCustomCode ? (
                        <div style={{ flex: '0 0 100px', width: 100, height: 48, position: 'relative' }}>
                          <select
                            value={countryCode}
                            onChange={e => {
                              if (e.target.value === 'custom') {
                                setIsCustomCode(true)
                                setCustomCountryCode('+')
                              } else {
                                setCountryCode(e.target.value)
                              }
                            }}
                            aria-label="Country Code"
                            className="form-input"
                            style={{
                              width: '100%',
                              height: 48,
                              minHeight: 48,
                              padding: '0 22px 0 8px',
                              border: '1px solid var(--color-border)',
                              borderRadius: 8,
                              fontSize: 16,
                              lineHeight: '22px',
                              fontWeight: 600,
                              background: '#f8fafc',
                              color: '#0f172a',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23475569' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 7px center',
                            }}
                            title="Country Code (defaults to +91 India)"
                          >
                            {POPULAR_COUNTRY_CODES.map(c => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.code}
                              </option>
                            ))}
                            <option value="custom">✏️ Other</option>
                          </select>
                        </div>
                      ) : (
                        <div style={{ flex: '0 0 104px', width: 104, height: 48, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="tel"
                            value={customCountryCode}
                            onChange={e => {
                              let val = e.target.value.trim()
                              if (!val.startsWith('+')) val = `+${val.replace(/\+/g, '')}`
                              setCustomCountryCode(val)
                            }}
                            placeholder="+91"
                            maxLength={5}
                            aria-label="Custom Country Code"
                            className="form-input"
                            style={{
                              width: 72,
                              height: 48,
                              minHeight: 48,
                              padding: '0 6px',
                              border: '1px solid #059669',
                              borderRadius: 8,
                              fontSize: 16,
                              lineHeight: '22px',
                              fontWeight: 700,
                              textAlign: 'center',
                              color: '#0f172a',
                              boxSizing: 'border-box',
                            }}
                            title="Enter country code (e.g. +91)"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCode(false)
                              setCountryCode('+91')
                            }}
                            style={{
                              width: 28,
                              height: 48,
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: 8,
                              padding: 0,
                              fontSize: 12,
                              cursor: 'pointer',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxSizing: 'border-box',
                            }}
                            title="Reset to default (+91)"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Mobile Number Input — Full Remaining Width, Identical 48px Height */}
                      <div style={{ flex: '1 1 auto', minWidth: 0, height: 48, position: 'relative' }}>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          required
                          value={whatsappMobile}
                          onChange={e => handleMobileInputChange(e.target.value)}
                          placeholder={countryCode === '+91' ? '98765 43210' : 'Mobile number'}
                          className="form-input"
                          style={{
                            width: '100%',
                            height: 48,
                            minHeight: 48,
                            padding: '0 12px 0 34px',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            fontSize: 16,
                            lineHeight: '22px',
                            letterSpacing: '0.4px',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 15,
                            lineHeight: 1,
                            color: '#059669',
                            pointerEvents: 'none',
                          }}
                        >
                          💬
                        </span>
                      </div>
                    </div>

                    {/* Country Code Helper & Switch Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>
                        Country code: <strong>{isCustomCode ? customCountryCode : countryCode}</strong> (edit anytime)
                      </span>
                      {isCustomCode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCode(false)
                            setCountryCode('+91')
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            fontSize: 11.5,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            fontWeight: 600,
                          }}
                        >
                          Reset to India (+91)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCode(true)
                            setCustomCountryCode('+')
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            fontSize: 11.5,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            fontWeight: 500,
                          }}
                        >
                          Type other code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode explanation */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#166534',
                      lineHeight: 1.5,
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <span>
                      💬 <strong>Instant WhatsApp OTP:</strong> Verification code will be sent to{' '}
                      <strong>
                        {isCustomCode ? customCountryCode : countryCode} {whatsappMobile.trim() || '••••••••••'}
                      </strong>{' '}
                      via MSG91.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !whatsappMobile.trim()}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: 15,
                      background: '#059669',
                      borderColor: '#059669',
                    }}
                  >
                    {loading ? 'Sending WhatsApp Code…' : 'Get WhatsApp Verification Code →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyWhatsappOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-body-sm text-muted">
                      WhatsApp code sent to: <strong style={{ color: '#0f172a' }}>{whatsappDisplay}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappSent(false)
                        setWhatsappCode('')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#059669',
                        fontSize: 12,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Enter 6-Digit WhatsApp Code *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={whatsappCode}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setWhatsappCode(digits)
                      }}
                      placeholder="••••••"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #059669',
                        borderRadius: 6,
                        fontSize: 22,
                        letterSpacing: '8px',
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* 60s Resend Cooldown Timer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    {whatsappCountdown > 0 ? (
                      <span style={{ color: '#64748b' }}>
                        ⏱️ Resend code in <strong>{whatsappCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendWhatsappOtp}
                        disabled={loading}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        🔄 Didn&apos;t receive WhatsApp code? Resend
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || whatsappCode.length !== 6}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: 15,
                      background: '#059669',
                      borderColor: '#059669',
                      opacity: whatsappCode.length === 6 ? 1 : 0.7,
                    }}
                  >
                    {loading ? 'Verifying WhatsApp Code…' : 'Verify & Sign In →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL OTP LOGIN (POWERED BY MSG91) */}
          {activeTab === 'email_otp' && (
            <div>
              {!emailSent ? (
                <form onSubmit={handleSendEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Registered Email Address *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        required
                        value={emailIdentifier}
                        onChange={e => setEmailIdentifier(e.target.value)}
                        placeholder={portalMode === 'professional' ? 'e.g. doctor@drfitveda.com' : 'e.g. yourname@domain.com'}
                        className="form-input"
                        style={{
                          width: '100%',
                          height: 48,
                          minHeight: 48,
                          padding: '0 14px 0 38px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 16,
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, lineHeight: 1, color: '#94a3b8' }}>
                        ✉️
                      </span>
                    </div>
                  </div>

                  {/* Mode explanation */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#64748b',
                      lineHeight: 1.5,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <span>
                      ✉️ <strong>Passwordless Email Sign In:</strong> Enter your registered email to receive a secure 6-digit verification code.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !emailIdentifier.trim()}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {loading ? 'Sending Verification Code…' : 'Get Email Verification Code →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-body-sm text-muted">
                      Code sent to: <strong style={{ color: '#0f172a' }}>{emailDisplay}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailSent(false)
                        setEmailCode('')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#0d9488',
                        fontSize: 12,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Enter 6-Digit Verification Code *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={emailCode}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '')
                        setEmailCode(digits)
                      }}
                      placeholder="••••••"
                      className="form-input"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #0d9488',
                        borderRadius: 6,
                        fontSize: 22,
                        letterSpacing: '8px',
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* 60s Resend Cooldown Timer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    {emailCountdown > 0 ? (
                      <span style={{ color: '#64748b' }}>
                        ⏱️ Resend code in <strong>{emailCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendEmailOtp}
                        disabled={loading}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#0d9488',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        🔄 Didn&apos;t receive code? Resend Code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || emailCode.length !== 6}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontWeight: 700,
                      fontSize: 15,
                      opacity: emailCode.length === 6 ? 1 : 0.7,
                    }}
                  >
                    {loading ? 'Verifying Code…' : 'Verify & Sign In →'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: USER ID & PASSWORD LOGIN */}
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
                    placeholder="e.g. doctor@drfitveda.com or +91 98765 43210"
                    className="form-input"
                    style={{
                      width: '100%',
                      height: 48,
                      minHeight: 48,
                      padding: '0 12px 0 38px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, lineHeight: 1, color: '#94a3b8' }}>👤</span>
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
                      height: 48,
                      minHeight: 48,
                      padding: '0 40px 0 38px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, lineHeight: 1, color: '#94a3b8' }}>🔒</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
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
        </div>

        {/* Footer */}
        <p
          className="text-caption"
          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 'var(--space-md)' }}
        >
          Dr Fit Veda Platform • Naturopathy, Clinical Nutrition &amp; Certified Fitness
        </p>
        <p className="text-caption" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.6 }}>
          By signing in you acknowledge our <Link href="/terms" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>Terms</Link>,{' '}
          <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>Privacy Policy</Link> and{' '}
          <Link href="/disclaimer" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>Medical Disclaimer</Link>.
          Separate consent is requested before you share health data.
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

            <form onSubmit={resetOtpSent ? handleResetPassword : handleRequestResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  User ID / Email / Phone *
                </label>
                <input
                  type="text"
                  required
                  disabled={resetOtpSent}
                  value={resetIdentifier}
                  onChange={e => setResetIdentifier(e.target.value)}
                  placeholder="e.g. doctor@drfitveda.com"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6 }}
                />
              </div>

              {resetOtpSent && (
                <>
                  <div>
                    <label className="text-body-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      6-Digit Verification Code (OTP) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtpCode}
                      onChange={e => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="form-input"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6, letterSpacing: 4, fontWeight: 700 }}
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
                </>
              )}

              <div className="flex justify-end" style={{ gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setShowResetModal(false); setResetStatus(null); setResetOtpSent(false); setResetOtpCode(''); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="btn btn-primary"
                >
                  {resetLoading ? 'Processing…' : resetOtpSent ? 'Verify & Save New Password' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
