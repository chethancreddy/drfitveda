// ============================================================
// Financial Allocation Service
// Backend Developer Agent
// ============================================================
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PayoutComponent {
  component_code: string
  component_name: string
  role: string | null
  amount_type: 'fixed' | 'percent'
  amount: number
}

export interface FinancialSnapshot {
  gross_amount: number
  discount_amount: number
  net_paid_amount: number
  currency: string
  compensation_rule_version_id: string
  payout_components_snapshot: PayoutComponent[]
  company_allocation: number
  effective_date: string
  transaction_status: string
}

export class FinancialAllocationService {
  static async getActiveRuleVersion(forDate = new Date()) {
    const supabase = await createServiceRoleClient()
    const dateStr = forDate.toISOString().split('T')[0]
    const { data, error } = await (supabase as any)
      .from('compensation_rule_versions')
      .select('*')
      .lte('effective_from', dateStr)
      .or(`effective_to.is.null,effective_to.gte.${dateStr}`)
      .eq('is_active', true)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()
    if (error) throw new Error(`No active compensation rule: ${error.message}`)
    return data as { id: string; name: string; effective_from: string }
  }

  static async getPayoutComponents(ruleVersionId: string): Promise<PayoutComponent[]> {
    const supabase = await createServiceRoleClient()
    const { data, error } = await (supabase as any)
      .from('payout_rule_components')
      .select('component_code,component_name,role,amount_type,amount')
      .eq('rule_version_id', ruleVersionId)
      .eq('is_active', true)
    if (error) throw new Error(`Failed to load payout components: ${error.message}`)
    return (data as PayoutComponent[]) ?? []
  }

  static calculateCompanyAllocation(grossAmount: number, components: PayoutComponent[], discountAmount = 0): number {
    const netPaid = grossAmount - discountAmount
    const totalPayouts = components.reduce((sum, c) => {
      if (c.amount_type === 'fixed') return sum + c.amount
      if (c.amount_type === 'percent') return sum + (netPaid * c.amount / 100)
      return sum
    }, 0)
    return Math.round((netPaid - totalPayouts) * 100) / 100
  }

  static async createFinancialSnapshot(params: {
    orderId: string; grossAmount: number; discountAmount: number; netPaidAmount: number; currency?: string
  }): Promise<FinancialSnapshot> {
    const ruleVersion = await this.getActiveRuleVersion()
    const components = await this.getPayoutComponents(ruleVersion.id)
    const companyAllocation = this.calculateCompanyAllocation(params.grossAmount, components, params.discountAmount)

    const snapshot: FinancialSnapshot = {
      gross_amount: params.grossAmount,
      discount_amount: params.discountAmount,
      net_paid_amount: params.netPaidAmount,
      currency: params.currency ?? 'INR',
      compensation_rule_version_id: ruleVersion.id,
      payout_components_snapshot: components,
      company_allocation: companyAllocation,
      effective_date: new Date().toISOString().split('T')[0],
      transaction_status: 'completed',
    }

    const supabase = await createServiceRoleClient()
    await (supabase as any).from('financial_transactions').insert({
      order_id: params.orderId,
      ...snapshot,
    })

    return snapshot
  }

  static async createPayouts(params: {
    customerId: string; orderId: string; assignments: Array<{ professionalId: string; role: string }>
    ruleVersionId: string; components: PayoutComponent[]; serviceDate: string
  }) {
    const supabase = await createServiceRoleClient()
    const payouts = params.assignments.map(a => {
      const comp = params.components.find(c => c.role === a.role)
      if (!comp) return null
      return {
        professional_id: a.professionalId, customer_id: params.customerId, order_id: params.orderId,
        payout_type: comp.component_code, amount: comp.amount, currency: 'INR',
        rule_version_id: params.ruleVersionId, service_date: params.serviceDate, status: 'pending',
      }
    }).filter(Boolean)

    if (payouts.length > 0) {
      const { error } = await (supabase as any).from('payouts').insert(payouts)
      if (error) throw new Error(`Failed to create payouts: ${error.message}`)
    }
  }
}
