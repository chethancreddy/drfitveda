// ============================================================
// DrFitVeda — Centralized Application URL & Routing Configuration
// Enforces production domain consistency and prevents ephemeral preview URL breakage.
// ============================================================

export const OFFICIAL_PRODUCTION_URL = 'https://drfitveda.com'

/**
 * Returns the sanitized, authoritative base URL for the application.
 *
 * Guarantees:
 * 1. Strictly rejects ephemeral/preview Vercel deployment hashes (*-*.vercel.app).
 * 2. Defaults to https://drfitveda.com in production, serverless, and notification contexts.
 * 3. Supports explicit APP_BASE_URL environment variable if set to an authorized domain.
 * 4. Permits localhost during local development only.
 * 5. Strips trailing slashes cleanly.
 */
export function getAppBaseUrl(): string {
  const envUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL

  if (!envUrl) {
    return OFFICIAL_PRODUCTION_URL
  }

  const trimmed = envUrl.trim().replace(/\/+$/, '')

  // Allow explicit localhost only in local development mode
  if (
    process.env.NODE_ENV === 'development' &&
    (trimmed.startsWith('http://localhost') || trimmed.startsWith('http://127.0.0.1'))
  ) {
    return trimmed
  }

  // Reject ephemeral / preview vercel URLs like drfitveda-6l2fxdgda-chethan4.vercel.app
  // These produce 404: DEPLOYMENT_NOT_FOUND when branches or preview deployments age out.
  if (
    trimmed.includes('.vercel.app') ||
    trimmed.includes('localhost') ||
    trimmed.includes('127.0.0.1')
  ) {
    if (process.env.APP_BASE_URL && !process.env.APP_BASE_URL.includes('.vercel.app')) {
      return process.env.APP_BASE_URL.trim().replace(/\/+$/, '')
    }
    return OFFICIAL_PRODUCTION_URL
  }

  return trimmed
}

/**
 * Builds the canonical URL for a professional to view a customer profile.
 * Example: https://drfitveda.com/professional/customers/c-otp-1793424968092
 */
export function buildProfessionalCustomerProfileUrl(customerId: string): string {
  const base = getAppBaseUrl()
  const cleanId = String(customerId || '').trim()
  return `${base}/professional/customers/${encodeURIComponent(cleanId)}`
}

/**
 * Builds the canonical URL for a customer to view their consultation/appointment.
 * Example: https://drfitveda.com/customer/consult
 */
export function buildCustomerAppointmentUrl(appointmentId?: string): string {
  const base = getAppBaseUrl()
  if (appointmentId) {
    return `${base}/customer/consult?appointment=${encodeURIComponent(appointmentId)}`
  }
  return `${base}/customer/consult`
}

/**
 * Builds the login URL with an optional post-authentication redirect.
 * Example: https://drfitveda.com/login?redirect=%2Fprofessional%2Fcustomers%2Fc-123
 */
export function buildLoginUrl(redirectPath?: string): string {
  const base = getAppBaseUrl()
  if (!redirectPath) return `${base}/login`
  return `${base}/login?redirect=${encodeURIComponent(redirectPath)}`
}

