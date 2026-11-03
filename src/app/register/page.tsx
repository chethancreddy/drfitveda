'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CountryCodeSelector from '@/components/ui/CountryCodeSelector'
import { validateInternationalPhone, findCountry, ALL_COUNTRY_CODES } from '@/lib/country-codes'

export default function RegisterPage() {
  const router = useRouter()

  // Workflow Step: 'form' (Initial data entry) | 'verify' (Email & WhatsApp OTP verification)
  const [step, setStep] = useState<'form' | 'verify'>('form')

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
  })

  // Country code state
  const [countryCode, setCountryCode] = useState('+91')

  // Validation errors per field
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Verification Step States
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [registeredPhone, setRegisteredPhone] = useState('')

  const [emailOtp, setEmailOtp] = useState('')
  const [whatsappOtp, setWhatsappOtp] = useState('')

  const [emailVerified, setEmailVerified] = useState(false)
  const [whatsappVerified, setWhatsappVerified] = useState(false)

  const [emailCountdown, setEmailCountdown] = useState(60)
  const [whatsappCountdown, setWhatsappCountdown] = useState(60)

  const [emailOtpToken, setEmailOtpToken] = useState<string | undefined>(undefined)
  const [whatsappOtpToken, setWhatsappOtpToken] = useState<string | undefined>(undefined)

  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [verifyingWhatsapp, setVerifyingWhatsapp] = useState(false)

  // Cooldown timers
  useEffect(() => {
    if (step !== 'verify') return
    const timer = setInterval(() => {
      setEmailCountdown(prev => (prev > 0 ? prev - 1 : 0))
      setWhatsappCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  // Maximum date allowed for Date of Birth is yesterday / today (strictly in the past)
  const maxDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Input change handler
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (globalError) setGlobalError(null)
  }

  // Frontend Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // 1. First Name
    const fn = formData.first_name.trim()
    if (!fn) {
      newErrors.first_name = 'First Name is required.'
    } else if (fn.length < 2) {
      newErrors.first_name = 'First Name must be at least 2 characters.'
    }

    // 2. Last Name
    const ln = formData.last_name.trim()
    if (!ln) {
      newErrors.last_name = 'Last Name is required.'
    } else if (ln.length < 1) {
      newErrors.last_name = 'Last Name must be at least 1 character.'
    }

    // 3. Date of Birth
    const dob = formData.date_of_birth.trim()
    if (!dob) {
      newErrors.date_of_birth = 'Date of Birth is required.'
    } else {
      const selected = new Date(dob)
      const today = new Date()
      today.setHours(23, 59, 59, 999)

      if (isNaN(selected.getTime())) {
        newErrors.date_of_birth = 'Please enter a valid Date of Birth.'
      } else if (selected.getTime() > today.getTime()) {
        newErrors.date_of_birth = 'Date of Birth must be a valid past date. Future dates are not allowed.'
      } else if (selected.getFullYear() < 1900) {
        newErrors.date_of_birth = 'Please enter a valid Date of Birth (year 1900 or later).'
      }
    }

    // 4. Gender (Exactly: Male, Female, Others)
    const g = formData.gender.trim()
    if (!g) {
      newErrors.gender = 'Gender is required. Please select an option.'
    } else if (!['Male', 'Female', 'Others'].includes(g)) {
      newErrors.gender = 'Gender must be Male, Female, or Others.'
    }

    // 5. Email ID
    const em = formData.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!em) {
      newErrors.email = 'Email ID is required.'
    } else if (!emailRegex.test(em)) {
      newErrors.email = 'Please enter a valid Email ID (e.g. name@example.com).'
    }

    // 6. Phone Number (International Validation)
    const phoneVal = validateInternationalPhone(countryCode, formData.phone)
    if (!phoneVal.isValid) {
      newErrors.phone = phoneVal.error || 'Please enter a valid phone number.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step 1: Submit Registration Form -> Initiate OTP Challenges
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setSuccessMsg(null)

    if (!validateForm()) {
      setGlobalError('Please fill in all mandatory fields with valid information.')
      return
    }

    setLoading(true)

    try {
      const cleanPhone = formData.phone.trim().replace(/\D/g, '')
      const fullPhone = `${countryCode}${cleanPhone}`

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          date_of_birth: formData.date_of_birth.trim(),
          gender: formData.gender.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: fullPhone,
          country_code: countryCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
        }
        throw new Error(data.error || 'Registration failed. Please check your details.')
      }

      if (data.pendingVerification && data.registrationId) {
        setRegistrationId(data.registrationId)
        setRegisteredEmail(data.email)
        setRegisteredPhone(data.phone)
        if (data.emailOtpToken) setEmailOtpToken(data.emailOtpToken)
        if (data.whatsappOtpToken) setWhatsappOtpToken(data.whatsappOtpToken)
        setEmailCountdown(60)
        setWhatsappCountdown(60)
        setStep('verify')
        setSuccessMsg('Verification codes have been dispatched to your Email and WhatsApp. Please enter them below.')
      } else {
        setSuccessMsg(data.message || 'Registration successful! Redirecting...')
        setTimeout(() => {
          router.push(data.redirectTo || '/customer')
        }, 1200)
      }
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Single OTP (Email or WhatsApp)
  const handleVerifyOtp = async (type: 'email' | 'whatsapp') => {
    if (!registrationId) return
    const otpToVerify = type === 'email' ? emailOtp.trim() : whatsappOtp.trim()
    const otpToken = type === 'email' ? emailOtpToken : whatsappOtpToken

    if (!otpToVerify || otpToVerify.length !== 6) {
      setGlobalError(`Please enter the complete 6-digit ${type === 'email' ? 'Email' : 'WhatsApp'} code.`)
      return
    }

    if (type === 'email') setVerifyingEmail(true)
    else setVerifyingWhatsapp(true)
    setGlobalError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          registrationId,
          type,
          otp: otpToVerify,
          otpToken,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed. Please check the code.')

      if (type === 'email') setEmailVerified(true)
      if (type === 'whatsapp') setWhatsappVerified(true)

      if (data.accountActivated) {
        setSuccessMsg('🎉 Identity verified! Welcome to Dr Fit Veda. Taking you to your dashboard…')
        setTimeout(() => {
          window.location.href = data.redirectTo || '/customer?welcome=true'
        }, 1200)
      } else {
        setSuccessMsg(data.message || `${type === 'email' ? 'Email' : 'WhatsApp'} verified successfully!`)
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Invalid verification code')
    } finally {
      if (type === 'email') setVerifyingEmail(false)
      else setVerifyingWhatsapp(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async (type: 'email' | 'whatsapp') => {
    if (!registrationId) return
    const countdown = type === 'email' ? emailCountdown : whatsappCountdown
    if (countdown > 0) return

    setGlobalError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_otp',
          registrationId,
          type,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification code.')

      if (type === 'email') {
        setEmailCountdown(data.cooldownSeconds || 60)
        if (data.otpToken) setEmailOtpToken(data.otpToken)
      } else {
        setWhatsappCountdown(data.cooldownSeconds || 60)
        if (data.otpToken) setWhatsappOtpToken(data.otpToken)
      }

      setSuccessMsg(data.message || `Fresh verification code dispatched to ${type === 'email' ? 'Email' : 'WhatsApp'}.`)
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to resend code')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #022c22 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ width: '100%', maxWidth: 540 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <img
              src="/logo.png"
              alt="Dr Fit Veda"
              style={{ height: 48, width: 'auto', margin: '0 auto', objectFit: 'contain' }}
            />
          </Link>
          <p style={{ margin: '8px 0 0 0', color: '#a7f3d0', fontSize: 13.5, fontWeight: 500 }}>
            Eat Right • Move Daily • Live Fully
          </p>
        </div>

        {/* Card Container */}
        <div
          className="card"
          style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: 16,
            padding: '28px 24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {step === 'form' ? 'Create Patient Account' : 'Verify Your Account'}
              </h1>
              <span
                style={{
                  fontSize: 11.5,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: step === 'form' ? '#ecfdf5' : '#fef3c7',
                  color: step === 'form' ? '#047857' : '#b45309',
                  fontWeight: 600,
                }}
              >
                {step === 'form' ? '👤 Step 1 of 2: Details' : '🔐 Step 2 of 2: OTP Verification'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
              {step === 'form'
                ? 'Join Dr Fit Veda for personalized doctor consultations, naturopathy, and holistic training.'
                : 'Enter the verification code sent to your WhatsApp and Email to activate your account.'}
            </p>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div
              style={{
                padding: '12px 14px',
                background: '#ecfdf5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>✅</span>
              <div>{successMsg}</div>
            </div>
          )}

          {/* Global Error Banner */}
          {globalError && (
            <div
              style={{
                padding: '12px 14px',
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13.5,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <div style={{ flex: 1 }}>{globalError}</div>
              {globalError.includes('already exists') && (
                <Link
                  href="/login"
                  style={{
                    color: '#0284c7',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sign In →
                </Link>
              )}
            </div>
          )}

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* First & Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                <div>
                  <label
                    htmlFor="first_name"
                    style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                  >
                    First Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    placeholder="e.g. Priya"
                    value={formData.first_name}
                    onChange={e => handleChange('first_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: errors.first_name ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.first_name && (
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                  >
                    Last Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    placeholder="e.g. Sharma"
                    value={formData.last_name}
                    onChange={e => handleChange('last_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: errors.last_name ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.last_name && (
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              {/* DOB & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                <div>
                  <label
                    htmlFor="date_of_birth"
                    style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                  >
                    Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="date_of_birth"
                    type="date"
                    required
                    max={maxDate}
                    value={formData.date_of_birth}
                    onChange={e => handleChange('date_of_birth', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: errors.date_of_birth ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.date_of_birth && (
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                      {errors.date_of_birth}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                  >
                    Gender <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={e => handleChange('gender', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: errors.gender ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                  {errors.gender && (
                    <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                >
                  Email ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@example.com"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: errors.email ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.email && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone with International Country Code */}
              <div>
                <label
                  htmlFor="phone"
                  style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
                >
                  WhatsApp Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <div style={{ minWidth: 110 }}>
                    <CountryCodeSelector
                      value={countryCode}
                      onChange={code => {
                        setCountryCode(code)
                        if (errors.phone) {
                          setErrors(prev => {
                            const next = { ...prev }
                            delete next.phone
                            return next
                          })
                        }
                      }}
                    />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder={findCountry(countryCode)?.format || '9876543210'}
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: errors.phone ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {errors.phone && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Terms note */}
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0', lineHeight: 1.5 }}>
                By registering, you agree to our{' '}
                <Link href="/terms" target="_blank" style={{ color: '#047857', textDecoration: 'underline' }}>
                  Terms of Use
                </Link>
                ,{' '}
                <Link href="/privacy" target="_blank" style={{ color: '#047857', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/disclaimer" target="_blank" style={{ color: '#047857', textDecoration: 'underline' }}>
                  Medical Disclaimer
                </Link>
                .
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  background: loading ? '#64748b' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 14.5,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.15s ease-in-out',
                  marginTop: 4,
                }}
              >
                {loading ? 'Submitting Details…' : 'Continue to Verification →'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION CHALLENGE */}
          {step === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Account Summary Banner */}
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formData.first_name} {formData.last_name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form')
                      setGlobalError(null)
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ✏️ Edit Details
                  </button>
                </div>
                <div style={{ color: '#64748b' }}>
                  ✉️ {registeredEmail} &bull; 💬 {registeredPhone}
                </div>
              </div>

              {/* WhatsApp Verification Card */}
              <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>💬</span> WhatsApp Verification
                  </span>
                  {whatsappVerified ? (
                    <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#166534' }}>Code sent to your WhatsApp</span>
                  )}
                </div>

                {!whatsappVerified && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={whatsappOtp}
                        onChange={e => setWhatsappOtp(e.target.value.replace(/\D/g, ''))}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: '1.5px solid #16a34a',
                          fontSize: 18,
                          letterSpacing: '4px',
                          textAlign: 'center',
                          fontWeight: 700,
                          background: 'white',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp('whatsapp')}
                        disabled={verifyingWhatsapp || whatsappOtp.length !== 6}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 700 }}
                      >
                        {verifyingWhatsapp ? 'Verifying…' : 'Verify WhatsApp'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 12 }}>
                      {whatsappCountdown > 0 ? (
                        <span style={{ color: '#64748b' }}>Resend in {whatsappCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResendOtp('whatsapp')}
                          style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          🔄 Resend WhatsApp Code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Verification Card */}
              <div style={{ padding: '16px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✉️</span> Email Verification
                  </span>
                  {emailVerified ? (
                    <span className="badge badge-success" style={{ background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#0f766e' }}>Code sent to your Inbox</span>
                  )}
                </div>

                {!emailVerified && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={emailOtp}
                        onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 6,
                          border: '1.5px solid #0d9488',
                          fontSize: 18,
                          letterSpacing: '4px',
                          textAlign: 'center',
                          fontWeight: 700,
                          background: 'white',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOtp('email')}
                        disabled={verifyingEmail || emailOtp.length !== 6}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#0d9488', borderColor: '#0f766e', fontWeight: 700 }}
                      >
                        {verifyingEmail ? 'Verifying…' : 'Verify Email'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 12 }}>
                      {emailCountdown > 0 ? (
                        <span style={{ color: '#64748b' }}>Resend in {emailCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleResendOtp('email')}
                          style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          🔄 Resend Email Code
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider & Switch to Sign In */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: 13,
              color: '#64748b',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: '#059669',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Sign In here →
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            marginTop: 18,
          }}
        >
          Dr Fit Veda Platform &bull; Naturopathy, Clinical Nutrition &amp; Certified Fitness
        </p>
      </div>
    </div>
  )
}
