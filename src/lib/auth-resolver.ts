// ============================================================
// Dr Fit Veda — Authoritative Role & Account Resolution Engine
// Identifies users across Admin Profile, Professionals (Doctors/Trainers),
// Operations Team Members, Core Accounts, and Customer Profiles.
// Ensures Doctors & Trainers ALWAYS route to /professional,
// Admins & Staff ALWAYS route to /admin, and Customers to /customer.
// ============================================================

import { MOCK_USERS, mockDb } from './mock-db'
import { normalizeIdentifier } from './services/otp-security'

export const PROFESSIONAL_ROLES = [
  'doctor',
  'trainer',
  'nutritionist',
  'yoga_doctor',
  'yoga_consultant',
  'naturopathy_doctor',
  'ayurveda_doctor',
  'physiotherapist',
  'wellness_coach',
  'doctor_lead',
  'trainer_lead',
] as const

export const ADMIN_STAFF_ROLES = [
  'admin',
  'super_admin',
  'operations_manager',
  'care_coordinator',
  'staff',
] as const

export interface ResolvedAccount {
  id: string
  role: string
  full_name: string
  email: string
  phone: string
  password?: string
  professional_id?: string
  source: 'admin_profile' | 'professionals' | 'team_members' | 'mock_users' | 'user_profiles'
}

export function isProfessionalRole(role?: string | null): boolean {
  if (!role) return false
  return (PROFESSIONAL_ROLES as readonly string[]).includes(role.toLowerCase().trim())
}

export function isAdminOrStaffRole(role?: string | null): boolean {
  if (!role) return false
  return (ADMIN_STAFF_ROLES as readonly string[]).includes(role.toLowerCase().trim())
}

/**
 * Maps any authenticated role to its canonical portal dashboard route.
 */
export function getDashboardForRole(role?: string | null): '/admin' | '/professional' | '/customer' {
  if (isAdminOrStaffRole(role)) return '/admin'
  if (isProfessionalRole(role)) return '/professional'
  return '/customer'
}

/**
 * Normalizes a phone string to canonical digits (e.g. 919876543210) for reliable matching.
 */
export function normalizePhoneForMatch(phone?: string | null): string {
  if (!phone) return ''
  const norm = normalizeIdentifier(String(phone), 'whatsapp')
  if (norm.isValid && norm.normalized) return norm.normalized
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`
  }
  return digits
}

/**
 * Checks if two email addresses match, including known official doctor email aliases
 * (e.g., varsini@drfitveda.com <-> drvarshini@drfitveda.com).
 */
export function emailsMatch(recordEmail?: string | null, inputEmail?: string | null, alternateEmails?: string[]): boolean {
  if (!inputEmail) return false
  const target = inputEmail.trim().toLowerCase()
  if (!target) return false

  if (recordEmail && recordEmail.trim().toLowerCase() === target) {
    return true
  }

  if (Array.isArray(alternateEmails)) {
    for (const alt of alternateEmails) {
      if (alt && alt.trim().toLowerCase() === target) return true
    }
  }

  // Handle common Dr. Varshini alias variations (varsini@drfitveda.com / drvarshini@drfitveda.com / varshini@drfitveda.com)
  const varshiniAliases = ['varsini@drfitveda.com', 'drvarshini@drfitveda.com', 'varshini@drfitveda.com']
  if (
    recordEmail &&
    varshiniAliases.includes(recordEmail.trim().toLowerCase()) &&
    varshiniAliases.includes(target)
  ) {
    return true
  }

  return false
}

/**
 * Resolves an account by email, phone, or user ID from trusted backend state.
 * Priority Order:
 * 1. Persisted Admin Profile (Super Admin / Admin)
 * 2. Registered Professionals (Doctors, Trainers, Nutritionists, Yoga Specialists)
 * 3. Operations Team Members (Operations Manager, Care Coordinator, Staff)
 * 4. Core System Accounts (MOCK_USERS)
 * 5. Persisted User Profiles (Customers & synced accounts)
 */
export function resolveAccountByIdentifier(rawIdentifier: string): ResolvedAccount | null {
  const clean = String(rawIdentifier || '').trim()
  if (!clean) return null

  const lower = clean.toLowerCase()
  const isEmailInput = clean.includes('@')
  const inputPhoneNorm = !isEmailInput ? normalizePhoneForMatch(clean) : ''

  // 1. Check Persisted Admin Profile
  if (mockDb.state?.admin_profile) {
    const ap = mockDb.state.admin_profile
    const apPhoneNorm = normalizePhoneForMatch(ap.phone)
    const matchedEmail = isEmailInput && ap.email && ap.email.trim().toLowerCase() === lower
    const matchedId = ap.id && ap.id.toLowerCase() === lower
    const matchedPhone = !isEmailInput && inputPhoneNorm && apPhoneNorm && inputPhoneNorm === apPhoneNorm

    if (matchedEmail || matchedId || matchedPhone) {
      return {
        id: ap.id || MOCK_USERS.admin.id,
        role: ap.role || 'admin',
        full_name: ap.full_name || MOCK_USERS.admin.full_name,
        email: ap.email || MOCK_USERS.admin.email,
        phone: ap.phone || MOCK_USERS.admin.phone,
        password: ap.password || MOCK_USERS.admin.password,
        source: 'admin_profile',
      }
    }
  }

  // 2. Check Registered Professionals (Doctors & Trainers) — HIGH PRIORITY
  // Ensures doctors/trainers never get shadowed by auto-created customer profiles.
  if (Array.isArray(mockDb.state?.professionals)) {
    const proMatch = mockDb.state.professionals.find((p: any) => {
      if (p.is_active === false) return false
      if (p.id?.toLowerCase() === lower || p.user_id?.toLowerCase() === lower) return true
      if (isEmailInput && emailsMatch(p.email, lower, p.alternate_emails)) return true
      if (!isEmailInput && inputPhoneNorm && p.phone) {
        return normalizePhoneForMatch(p.phone) === inputPhoneNorm
      }
      return false
    })

    if (proMatch) {
      // Find any linked user_profile or MOCK_USER for password fallback
      const linkedProfile = Array.isArray(mockDb.state?.user_profiles)
        ? mockDb.state.user_profiles.find((up: any) => up.id === proMatch.user_id)
        : null
      const defaultMock =
        proMatch.user_id === MOCK_USERS.doctor.id
          ? MOCK_USERS.doctor
          : proMatch.user_id === MOCK_USERS.trainer.id
          ? MOCK_USERS.trainer
          : proMatch.role?.includes('trainer')
          ? MOCK_USERS.trainer
          : MOCK_USERS.doctor

      return {
        id: proMatch.user_id || proMatch.id,
        professional_id: proMatch.id,
        role: proMatch.role || 'doctor',
        full_name: proMatch.full_name || linkedProfile?.full_name || defaultMock.full_name,
        email: proMatch.email || linkedProfile?.email || defaultMock.email,
        phone: proMatch.phone || linkedProfile?.phone || defaultMock.phone,
        password: proMatch.password || linkedProfile?.password || defaultMock.password,
        source: 'professionals',
      }
    }
  }

  // 3. Check Operations Team Members
  if (Array.isArray(mockDb.state?.team_members)) {
    const tmMatch = mockDb.state.team_members.find((m: any) => {
      if (m.is_active === false) return false
      if (m.id?.toLowerCase() === lower || m.user_id?.toLowerCase() === lower) return true
      if (isEmailInput && m.email && m.email.trim().toLowerCase() === lower) return true
      if (!isEmailInput && inputPhoneNorm && m.phone) {
        return normalizePhoneForMatch(m.phone) === inputPhoneNorm
      }
      return false
    })

    if (tmMatch) {
      return {
        id: tmMatch.user_id || tmMatch.id,
        role: tmMatch.role || 'care_coordinator',
        full_name: tmMatch.full_name,
        email: tmMatch.email || `${inputPhoneNorm || lower}@users.drfitveda.com`,
        phone: tmMatch.phone || '',
        password: tmMatch.password || 'coordinator123',
        source: 'team_members',
      }
    }
  }

  // 4. Check Core MOCK_USERS (admin, doctor, trainer, coordinator, customer)
  const mockMatch = Object.values(MOCK_USERS).find(u => {
    if (u.id.toLowerCase() === lower) return true
    if (isEmailInput && u.email.toLowerCase() === lower) return true
    if (!isEmailInput && inputPhoneNorm && u.phone) {
      return normalizePhoneForMatch(u.phone) === inputPhoneNorm
    }
    return false
  })

  if (mockMatch) {
    // If this MOCK_USER corresponds to a professional in mockDb.state.professionals,
    // enrich with the latest professional record's full_name, role, email, and phone.
    const linkedPro = Array.isArray(mockDb.state?.professionals)
      ? mockDb.state.professionals.find((p: any) => p.user_id === mockMatch.id && p.is_active !== false)
      : null

    return {
      id: mockMatch.id,
      professional_id: linkedPro?.id,
      role: linkedPro?.role || mockMatch.role,
      full_name: linkedPro?.full_name || mockMatch.full_name,
      email: linkedPro?.email || mockMatch.email,
      phone: linkedPro?.phone || mockMatch.phone,
      password: mockMatch.password,
      source: 'mock_users',
    }
  }

  // 5. Check Persisted User Profiles
  if (Array.isArray(mockDb.state?.user_profiles)) {
    const profileMatch = mockDb.state.user_profiles.find((p: any) => {
      if (p.is_active === false) return false
      if (p.id?.toLowerCase() === lower) return true
      if (isEmailInput && p.email && p.email.trim().toLowerCase() === lower) return true
      if (!isEmailInput && inputPhoneNorm && p.phone) {
        return normalizePhoneForMatch(p.phone) === inputPhoneNorm
      }
      return false
    })

    if (profileMatch) {
      return {
        id: profileMatch.id,
        role: profileMatch.role || 'customer',
        full_name: profileMatch.full_name || 'Member',
        email: profileMatch.email || (isEmailInput ? lower : `${inputPhoneNorm || lower}@users.drfitveda.com`),
        phone: profileMatch.phone || '',
        password: profileMatch.password,
        source: 'user_profiles',
      }
    }
  }

  return null
}

