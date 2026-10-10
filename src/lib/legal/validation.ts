import { REQUEST_TYPES, CONSENT_PURPOSES, LEGAL } from './config'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface DataRequestInput {
  request_type: string
  name: string
  email: string
  details?: string
  confirm: boolean
  website?: string // honeypot — must be empty
}

/** Validate a public data-request submission. Returns an error string or null. */
export function validateDataRequest(b: Partial<DataRequestInput>): string | null {
  if (b.website) return 'Invalid submission.'
  if (!REQUEST_TYPES.some(t => t.value === b.request_type)) return 'Please choose a request type.'
  const name = (b.name ?? '').trim()
  if (name.length < 2 || name.length > 120) return 'Please enter your full name.'
  const email = (b.email ?? '').trim()
  if (!EMAIL_RE.test(email) || email.length > 200) return 'Please enter a valid email address.'
  if ((b.details ?? '').length > 2000) return 'Details must be under 2000 characters.'
  if (b.confirm !== true) return 'Please confirm that we may use these details to process your request.'
  return null
}

export function validateConsent(b: { purpose?: string; granted?: unknown; source?: string }): string | null {
  if (!CONSENT_PURPOSES.includes(b.purpose as any)) return 'Unknown consent purpose.'
  if (typeof b.granted !== 'boolean') return 'granted must be true or false.'
  if (!b.source || b.source.length > 60) return 'source is required.'
  return null
}

export interface ContactInquiryInput {
  name: string
  phone: string
  health_focus: string
  message?: string
  consent: boolean
  website?: string // honeypot
}

export function validateContactInquiry(b: Partial<ContactInquiryInput>): string | null {
  if (b.website) return 'Invalid submission.'
  const name = (b.name ?? '').trim()
  if (name.length < 2 || name.length > 120) return 'Please enter your full name.'
  const phone = (b.phone ?? '').trim()
  if (phone.length < 7 || phone.length > 25) return 'Please enter a valid phone number.'
  const focus = (b.health_focus ?? '').trim()
  if (!focus || focus.length > 100) return 'Please select your primary health focus.'
  if ((b.message ?? '').length > 1500) return 'Message must be under 1500 characters.'
  if (b.consent !== true) return 'Please agree to the consultation callback consent terms.'
  return null
}

export const POLICY_VERSION = LEGAL.version

/** Tiny in-memory rate limiter (per server instance) to deter form abuse. */
const hits = new Map<string, number[]>()
export function rateLimited(key: string, max = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}
