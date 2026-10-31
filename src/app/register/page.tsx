'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Popular country codes supported with flags (matches DrFitVeda standard)
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

export default function RegisterPage() {
  const router = useRouter()

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

  // Maximum date allowed for Date of Birth is yesterday / today (strictly in the past)
  const maxDate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }, [])

  // Input change handler
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-level error as user edits
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

    // 6. Phone Number
    const ph = formData.phone.trim().replace(/\D/g, '')
    if (!ph) {
      newErrors.phone = 'Phone Number is required.'
    } else if (countryCode === '+91') {
      if (ph.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit Indian mobile number.'
      } else if (!/^[6-9]/.test(ph)) {
        newErrors.phone = 'Indian mobile numbers must start with 6, 7, 8, or 9.'
      }
    } else {
      if (ph.length < 6 || ph.length > 15) {
        newErrors.phone = 'Please enter a valid mobile number (6 to 15 digits).'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Form Submission
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

      setSuccessMsg(data.message || 'Registration successful! Redirecting to your dashboard...')

      // Redirect user to customer portal
      setTimeout(() => {
        router.push(data.redirectTo || '/customer')
      }, 1200)
    } catch (err: any) {
      setGlobalError(err.message || 'An unexpected error occurred during registration.')
    } finally {
      setLoading(false)
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
          {/* Form Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Create Patient Account
              </h1>
              <span
                style={{
                  fontSize: 11.5,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: '#ecfdf5',
                  color: '#047857',
                  fontWeight: 600,
                }}
              >
                👤 Sign Up
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Enter your details to register for Doctor Consultations, Naturopathy &amp; Fitness plans.
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 1 & 2. First Name & Last Name (Side by Side on Desktop, Stacked on Mobile) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {/* First Name */}
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
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.first_name ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: errors.first_name ? '#fff5f5' : '#ffffff',
                  }}
                />
                {errors.first_name && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                    {errors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name */}
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
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.last_name ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: errors.last_name ? '#fff5f5' : '#ffffff',
                  }}
                />
                {errors.last_name && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* 3 & 4. Date of Birth & Gender (Side by Side on Desktop, Stacked on Mobile) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {/* Date of Birth */}
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
                    padding: '8.5px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.date_of_birth ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: errors.date_of_birth ? '#fff5f5' : '#ffffff',
                  }}
                />
                {errors.date_of_birth && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                    {errors.date_of_birth}
                  </p>
                )}
              </div>

              {/* Gender */}
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
                    padding: '9.5px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.gender ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: errors.gender ? '#fff5f5' : '#ffffff',
                    color: formData.gender ? '#0f172a' : '#94a3b8',
                  }}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
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

            {/* 5. Email ID */}
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
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.email ? '#ef4444' : '#cbd5e1'}`,
                  outline: 'none',
                  fontSize: 13.5,
                  boxSizing: 'border-box',
                  background: errors.email ? '#fff5f5' : '#ffffff',
                }}
              />
              {errors.email && (
                <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* 6. Phone Number */}
            <div>
              <label
                htmlFor="phone"
                style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 4 }}
              >
                WhatsApp / Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{
                    padding: '9px 8px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 13,
                    fontWeight: 600,
                    width: 110,
                    flexShrink: 0,
                    outline: 'none',
                  }}
                  title="Select Country Code"
                >
                  {POPULAR_COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder={countryCode === '+91' ? '98765 43210' : 'Mobile number'}
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: `1px solid ${errors.phone ? '#ef4444' : '#cbd5e1'}`,
                    outline: 'none',
                    fontSize: 13.5,
                    boxSizing: 'border-box',
                    background: errors.phone ? '#fff5f5' : '#ffffff',
                  }}
                />
              </div>
              {errors.phone && (
                <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: '#dc2626', fontWeight: 500 }}>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Terms and Consent Note */}
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
              {loading ? 'Creating Account…' : 'Sign Up & Continue →'}
            </button>
          </form>

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
          Dr Fit Veda Platform • Naturopathy, Clinical Nutrition &amp; Certified Fitness
        </p>
      </div>
    </div>
  )
}

