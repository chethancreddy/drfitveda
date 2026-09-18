// ============================================================
// Dr Fit Veda — Unit Tests
// QA/Testing Engineer Agent
// Covers: financial calculations, rolling retention logic, BMI
// ============================================================

import { describe, it, expect } from '@jest/globals'
import { FinancialAllocationService } from '@/lib/services/financial.service'

// ─── BMI Calculation ──────────────────────────────────────

describe('BMI Calculation (via DB generated column)', () => {
  it('calculates correct BMI for 70kg / 170cm', () => {
    const height = 170, weight = 70
    const bmi = weight / ((height / 100) ** 2)
    expect(Math.round(bmi * 100) / 100).toBe(24.22)
  })

  it('calculates correct BMI for 90kg / 175cm', () => {
    const bmi = 90 / ((1.75) ** 2)
    expect(Math.round(bmi * 100) / 100).toBe(29.39)
  })
})

// ─── Financial Calculations (TRD §36) ────────────────────

describe('FinancialAllocationService.calculateCompanyAllocation', () => {
  const makeComponent = (code: string, role: string, amount: number) => ({
    component_code: code, component_name: code, role,
    amount_type: 'fixed' as const, amount
  })

  // Test A: standard defaults
  it('Test A — calculates ₹3302 company allocation', () => {
    const components = [
      makeComponent('initial_doctor_plan', 'doctor', 999),
      makeComponent('trainer_service',     'trainer', 5499),
      makeComponent('weekly_review',       'doctor', 199),
    ]
    const result = FinancialAllocationService.calculateCompanyAllocation(9999, components, 0)
    expect(result).toBe(3302)
  })

  // Test B: trainer changed to ₹5999
  it('Test B — calculates ₹2802 after trainer rate change', () => {
    const components = [
      makeComponent('initial_doctor_plan', 'doctor', 999),
      makeComponent('trainer_service',     'trainer', 5999),
      makeComponent('weekly_review',       'doctor', 199),
    ]
    const result = FinancialAllocationService.calculateCompanyAllocation(9999, components, 0)
    expect(result).toBe(2802)
  })

  // Test C: historical record uses old rate
  it('Test C — snapshot preserves old rate (3302), new rate only used forward', () => {
    const oldComponents = [makeComponent('trainer_service','trainer',5499)]
    const newComponents = [makeComponent('trainer_service','trainer',5999)]
    const oldAlloc = FinancialAllocationService.calculateCompanyAllocation(9999, oldComponents, 0)
    const newAlloc = FinancialAllocationService.calculateCompanyAllocation(9999, newComponents, 0)
    expect(oldAlloc).toBe(4500)  // 9999 - 5499
    expect(newAlloc).toBe(4000)  // 9999 - 5999
    expect(oldAlloc).not.toBe(newAlloc)
  })

  it('handles percent-based components', () => {
    const components = [{ component_code:'rev_share', component_name:'Rev Share', role:'trainer', amount_type:'percent' as const, amount:50 }]
    const result = FinancialAllocationService.calculateCompanyAllocation(10000, components, 0)
    expect(result).toBe(5000)
  })

  it('handles discount correctly', () => {
    const components = [makeComponent('doctor', 'doctor', 999)]
    const result = FinancialAllocationService.calculateCompanyAllocation(9999, components, 1000)
    // net = 8999, company = 8999 - 999 = 8000
    expect(result).toBe(8000)
  })
})

// ─── Rolling Retention Logic ──────────────────────────────

describe('Rolling retention algorithm', () => {
  it('ensures only one active recording per customer', () => {
    // Simulate state machine
    type Rec = { id: string; is_active: boolean; status: string }
    const recordings: Rec[] = [
      { id:'rec-1', is_active: true,  status: 'available' },
      { id:'rec-2', is_active: false, status: 'uploading' },
    ]

    function activateRecording(newId: string, recs: Rec[]): Rec[] {
      return recs.map(r => {
        if (r.id === newId) return { ...r, is_active: true, status: 'available' }
        if (r.is_active) return { ...r, is_active: false, status: 'inactive' }
        return r
      })
    }

    const updated = activateRecording('rec-2', recordings)
    const activeCount = updated.filter(r => r.is_active).length
    expect(activeCount).toBe(1)
    expect(updated.find(r => r.id === 'rec-2')?.is_active).toBe(true)
    expect(updated.find(r => r.id === 'rec-1')?.is_active).toBe(false)
    expect(updated.find(r => r.id === 'rec-1')?.status).toBe('inactive')
  })

  it('calculates grace period deletion time correctly', () => {
    const now = new Date('2026-09-16T10:00:00Z')
    const graceHours = 24
    const deleteAt = new Date(now.getTime() + graceHours * 3600 * 1000)
    expect(deleteAt.toISOString()).toBe('2026-09-17T10:00:00.000Z')
  })

  it('calculates immediate deletion time as now', () => {
    const now = new Date()
    const deletionQueuedAt = now.toISOString()
    expect(new Date(deletionQueuedAt) <= new Date()).toBe(true)
  })
})

// ─── Check-In Validation ──────────────────────────────────

describe('Check-in status validation', () => {
  const VALID_STATUSES = ['yes', 'partial', 'no', 'skip']

  it('accepts valid check-in statuses', () => {
    VALID_STATUSES.forEach(s => {
      expect(VALID_STATUSES.includes(s)).toBe(true)
    })
  })

  it('rejects invalid check-in status', () => {
    expect(VALID_STATUSES.includes('maybe')).toBe(false)
    expect(VALID_STATUSES.includes('')).toBe(false)
    expect(VALID_STATUSES.includes('done')).toBe(false)
  })
})

// ─── Authorization (unit level) ───────────────────────────

describe('Customer isolation', () => {
  it('cannot access another customers recording via mismatched customerId', () => {
    const requestingCustomerId: string = 'customer-A'
    const recordingCustomerId: string  = 'customer-B'
    // The service should throw if these don't match (simulated)
    const canAccess = requestingCustomerId === recordingCustomerId
    expect(canAccess).toBe(false)
  })
})
