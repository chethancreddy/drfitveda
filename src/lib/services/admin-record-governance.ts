import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '../supabase/server'
import { mockDb } from '../mock-db'
import { loadPersistedState, savePersistedState } from '../persistent-store'

export type GovernanceModule =
  | 'customers'
  | 'professionals'
  | 'assignments'
  | 'team'
  | 'memberships'
  | 'consultation_services'
  | 'consultation_categories'
  | 'compensation_rules'
  | 'cms_biomarkers'
  | 'cms_content'
  | 'professional_roles'

export interface DependencyCheckResult {
  module: GovernanceModule
  recordId: string
  recordName: string
  canPermanentDelete: boolean
  canSoftDelete: boolean
  blockingReasons: string[]
  linkedRecords: {
    label: string
    count: number
    blocking?: boolean
  }[]
  recommendedAction: 'permanent_delete' | 'soft_delete' | 'blocked_requires_reassignment'
  consequenceWarning: string
}

export interface AuditLogInput {
  actorId: string
  actorName: string
  module: string
  recordId: string
  recordName?: string
  previousStatus: string
  newStatus: string
  actionType: 'activate' | 'deactivate' | 'archive' | 'soft_delete' | 'permanent_delete' | 'restore' | 'update' | 'create'
  detail?: string
}

/**
 * Resolves the current user & role from Supabase session or drf_session cookie,
 * and verifies that deactivated/archived staff or users have their access revoked.
 */
export async function verifyAdminAccess(
  req: NextRequest | Request,
  allowedRoles: string[] = ['admin', 'super_admin', 'operations_manager']
): Promise<{
  authorized: boolean
  status: number
  error?: string
  userId: string
  userName: string
  role: string
}> {
  await loadPersistedState()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = (user as any)?.user_metadata?.role || (user as any)?.role || ''
  let userId = user?.id || ''
  let userName = (user as any)?.user_metadata?.full_name || (user as any)?.full_name || ''
  let userEmail = user?.email || ''

  if (!role && 'cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
    const cookie = (req as NextRequest).cookies.get('drf_session')?.value
    if (cookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie))
        role = parsed.role || ''
        userId = parsed.user_id || userId
        userName = parsed.full_name || userName
        userEmail = parsed.email || userEmail
      } catch {
        try {
          const parsed = JSON.parse(cookie)
          role = parsed.role || ''
          userId = parsed.user_id || userId
          userName = parsed.full_name || userName
          userEmail = parsed.email || userEmail
        } catch {}
      }
    }
  }

  if (!role) {
    return {
      authorized: false,
      status: 403,
      error: 'Unauthorized: Authentication required.',
      userId: 'anonymous',
      userName: 'Anonymous',
      role: 'none',
    }
  }

  // Check if staff member or user profile has been deactivated or archived
  if (!['admin', 'super_admin'].includes(role)) {
    const teamMembers = mockDb.state.team_members || []
    const matchedStaff = teamMembers.find(
      (tm: any) =>
        (userId && (tm.user_id === userId || tm.id === userId)) ||
        (userEmail && tm.email?.toLowerCase() === userEmail.toLowerCase())
    )
    if (matchedStaff && (matchedStaff.is_active === false || matchedStaff.is_archived === true)) {
      return {
        authorized: false,
        status: 403,
        error: 'Access revoked: Your staff account has been deactivated.',
        userId: matchedStaff.id,
        userName: matchedStaff.full_name || userName,
        role,
      }
    }

    const userProfiles = mockDb.state.user_profiles || []
    const matchedProfile = userProfiles.find(
      (up: any) =>
        (userId && up.id === userId) ||
        (userEmail && up.email?.toLowerCase() === userEmail.toLowerCase())
    )
    if (matchedProfile && (matchedProfile.is_active === false || matchedProfile.is_archived === true)) {
      return {
        authorized: false,
        status: 403,
        error: 'Access revoked: Your user account is inactive.',
        userId: matchedProfile.id,
        userName: matchedProfile.full_name || userName,
        role,
      }
    }
  }

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      status: 403,
      error: 'Forbidden: Insufficient permissions for this operation.',
      userId: userId || 'unknown',
      userName: userName || 'Unauthorized User',
      role,
    }
  }

  return {
    authorized: true,
    status: 200,
    userId: userId || 'u0000000-0000-0000-0000-000000000004',
    userName: userName || 'Admin',
    role,
  }
}

/**
 * Records a structured audit log entry without exposing sensitive PII/credentials.
 */
export async function recordAdminAuditLog(input: AuditLogInput) {
  if (!mockDb.state.audit_logs) {
    mockDb.state.audit_logs = []
  }

  const now = new Date().toISOString()
  const entry = {
    id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: input.actorId,
    actor: input.actorName || 'Admin',
    module: input.module,
    table_name: input.module,
    record_id: input.recordId,
    record_name: input.recordName || input.recordId,
    previous_status: input.previousStatus,
    new_status: input.newStatus,
    action_type: input.actionType,
    action: `${input.module}.${input.actionType}`,
    event: `${input.module.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — ${input.actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    detail:
      input.detail ||
      `Record "${input.recordName || input.recordId}" (${input.recordId}) in ${input.module} changed from [${input.previousStatus}] to [${input.newStatus}] via ${input.actionType}.`,
    ts: now,
    created_at: now,
  }

  mockDb.state.audit_logs.unshift(entry)
  await savePersistedState('audit_logs')
  return entry
}

/**
 * Synchronizes Customer active/inactive status with their Membership(s)
 * according to Section 2 business rules:
 * - When Customer -> Inactive:
 *   - Deactivate active membership(s), recording `deactivated_by_customer_status: true`
 *     and preserving historical/expired/cancelled memberships untouched.
 *   - Sync user_profiles.is_active = false.
 * - When Customer -> Active (Reactivated):
 *   - Do NOT reactivate expired, cancelled, or deleted memberships.
 *   - Only reactivate a membership if it was active prior to customer deactivation
 *     (`deactivated_by_customer_status === true`), is not expired, and its plan is still valid.
 */
export function syncCustomerStatusAndMemberships(
  customer: any,
  targetIsActive: boolean,
  options?: { manualMembershipStatus?: string; now?: Date }
) {
  const now = options?.now || new Date()
  const nowIso = now.toISOString()
  const initialMembershipStatus = customer.membership_status

  if (!targetIsActive) {
    // Transitioning Active -> Inactive
    customer.is_active = false
    customer.deactivated_at = nowIso

    // Handle primary membership on customer record
    if (customer.membership_status === 'active') {
      customer.previous_membership_status = 'active'
      customer.membership_deactivated_by_status_sync = true
      customer.membership_status = 'inactive'
    } else {
      customer.membership_deactivated_by_status_sync = false
    }

    // Handle multiple memberships array if present on customer or in state
    if (Array.isArray(customer.memberships_history)) {
      customer.memberships_history = customer.memberships_history.map((mh: any) => {
        if (mh.status === 'active' && !mh.is_deleted) {
          return {
            ...mh,
            status: 'inactive',
            deactivated_by_customer_status: true,
            updated_at: nowIso,
          }
        }
        // Leave expired, cancelled, completed, or deleted historical records untouched!
        return mh
      })
    }
  } else {
    // Transitioning Inactive -> Active (Reactivation)
    customer.is_active = true
    customer.deactivated_at = null
    customer.is_archived = false
    customer.deleted_at = null

    if (options?.manualMembershipStatus) {
      customer.membership_status = options.manualMembershipStatus
      customer.membership_deactivated_by_status_sync = false
    } else if (customer.membership_deactivated_by_status_sync && customer.previous_membership_status === 'active') {
      // Check eligibility: not expired, not cancelled, not deleted, and plan exists
      const isExpired =
        customer.membership_expires_at && new Date(customer.membership_expires_at).getTime() <= now.getTime()
      const isCancelledOrDeleted = ['cancelled', 'expired', 'deleted'].includes(customer.membership_status)
      const plan = customer.membership_plan_id
        ? (mockDb.state.memberships || []).find((m: any) => m.id === customer.membership_plan_id)
        : null
      const planDeleted = plan && plan.is_deleted === true

      if (!isExpired && !isCancelledOrDeleted && !planDeleted) {
        customer.membership_status = 'active'
      } else if (isExpired) {
        customer.membership_status = 'expired'
      }
      customer.membership_deactivated_by_status_sync = false
    }

    // Handle multiple memberships history array if present
    if (Array.isArray(customer.memberships_history)) {
      customer.memberships_history = customer.memberships_history.map((mh: any) => {
        if (mh.status === 'inactive' && mh.deactivated_by_customer_status === true && !mh.is_deleted) {
          const mhExpired = mh.expires_at && new Date(mh.expires_at).getTime() <= now.getTime()
          if (!mhExpired) {
            return {
              ...mh,
              status: 'active',
              deactivated_by_customer_status: false,
              updated_at: nowIso,
            }
          } else {
            return {
              ...mh,
              status: 'expired',
              deactivated_by_customer_status: false,
              updated_at: nowIso,
            }
          }
        }
        // Do NOT reactivate expired, cancelled, or deleted memberships
        return mh
      })
    }
  }

  customer.updated_at = nowIso
  const membershipChanged = customer.membership_status !== initialMembershipStatus
  customer.membershipChanged = membershipChanged

  // Sync linked user_profile
  const userProfiles = mockDb.state.user_profiles || []
  const uIdx = userProfiles.findIndex((up: any) => up.id === customer.user_id)
  if (uIdx !== -1) {
    userProfiles[uIdx].is_active = targetIsActive
    userProfiles[uIdx].updated_at = nowIso
  }

  return customer
}

/**
 * Inspects dependencies for any record across all 8 Admin Portal modules
 * to determine whether Permanent Delete is safe, Soft Delete / Archive is required,
 * or Deletion is blocked until active assignments/upcoming sessions are resolved.
 */
export async function inspectRecordDependencies(
  module: GovernanceModule,
  recordId: string
): Promise<DependencyCheckResult | null> {
  if (!mockDb.state.customers?.length && !mockDb.state.professionals?.length) {
    await loadPersistedState()
  }

  const customers = mockDb.state.customers || []
  const userProfiles = mockDb.state.user_profiles || []
  const professionals = mockDb.state.professionals || []
  const assignments = mockDb.state.professional_assignments || []
  const appointments = mockDb.state.appointments || []
  const trainingSessions = mockDb.state.training_sessions || []
  const orders = (mockDb.state as any).orders || []
  const financialTx = (mockDb.state as any).financial_transactions || []
  const payouts = (mockDb.state as any).payouts || []
  const checkIns = mockDb.state.daily_check_ins || []
  const plans = mockDb.state.plans || []
  const whatsappNotifs = mockDb.state.whatsapp_notifications || []

  if (module === 'customers') {
    const cust = customers.find((c: any) => c.id === recordId || c.user_id === recordId)
    if (!cust) return null
    const up = userProfiles.find((u: any) => u.id === cust.user_id)
    const name = up?.full_name || cust.full_name || cust.id

    const custAppts = appointments.filter((a: any) => a.customer_id === cust.id)
    const custSessions = trainingSessions.filter((s: any) => s.customer_id === cust.id)
    const custOrders = orders.filter((o: any) => o.customer_id === cust.id)
    const custPayouts = payouts.filter((p: any) => p.customer_id === cust.id)
    const custAssigns = assignments.filter((a: any) => a.customer_id === cust.id)
    const custCheckIns = checkIns.filter((ci: any) => ci.customer_id === cust.id)
    const custPlans = plans.filter((pl: any) => pl.customer_id === cust.id)
    const hasMembershipHistory =
      !!cust.membership_plan_id ||
      (Array.isArray(cust.memberships_history) && cust.memberships_history.length > 0)

    const linkedRecords = [
      { label: 'Consultations & Appointments', count: custAppts.length },
      { label: 'Training Sessions', count: custSessions.length },
      { label: 'Payments & Orders', count: custOrders.length + custPayouts.length },
      { label: 'Care Team Assignments', count: custAssigns.length },
      { label: 'Health Plans & Daily Check-Ins', count: custPlans.length + custCheckIns.length },
      { label: 'Membership History Records', count: hasMembershipHistory ? 1 : 0 },
    ].filter(r => r.count > 0)

    const hasDependencies = linkedRecords.length > 0
    return {
      module,
      recordId: cust.id,
      recordName: name,
      canPermanentDelete: !hasDependencies,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDependencies ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDependencies
        ? `This customer has linked historical records (${linkedRecords.map(l => `${l.count} ${l.label}`).join(', ')}). It will be safely Archived (Soft Deleted), deactivating their membership and login while preserving all clinical and financial history.`
        : 'This customer record has no linked appointments, memberships, or payments and will be permanently deleted.',
    }
  }

  if (module === 'professionals') {
    const pro = professionals.find((p: any) => p.id === recordId || p.user_id === recordId)
    if (!pro) return null

    const activeAssignments = assignments.filter(
      (a: any) => a.professional_id === pro.id && a.is_active !== false && !a.is_archived
    )
    const historicalAssignments = assignments.filter(
      (a: any) => a.professional_id === pro.id && (a.is_active === false || a.is_archived)
    )
    const now = Date.now()
    const proAppts = appointments.filter((a: any) => a.professional_id === pro.id)
    const upcomingAppts = proAppts.filter(
      (a: any) => a.status === 'scheduled' && new Date(a.scheduled_at).getTime() >= now
    )
    const pastAppts = proAppts.filter(
      (a: any) => a.status !== 'scheduled' || new Date(a.scheduled_at).getTime() < now
    )
    const proSessions = trainingSessions.filter((s: any) => s.trainer_id === pro.id)
    const upcomingSessions = proSessions.filter(
      (s: any) => s.status === 'scheduled' && new Date(s.scheduled_at).getTime() >= now
    )
    const pastSessions = proSessions.filter(
      (s: any) => s.status !== 'scheduled' || new Date(s.scheduled_at).getTime() < now
    )
    const proPayouts = payouts.filter((p: any) => p.professional_id === pro.id)

    const blockingReasons: string[] = []
    if (activeAssignments.length > 0) {
      blockingReasons.push(
        `${activeAssignments.length} active customer assignment(s) must be reassigned or deactivated before deletion.`
      )
    }
    if (upcomingAppts.length + upcomingSessions.length > 0) {
      blockingReasons.push(
        `${upcomingAppts.length + upcomingSessions.length} upcoming scheduled consultation(s)/session(s) must be reassigned or cancelled before deletion.`
      )
    }

    const linkedRecords = [
      { label: 'Active Customer Assignments', count: activeAssignments.length, blocking: activeAssignments.length > 0 },
      {
        label: 'Upcoming Consultations / Sessions',
        count: upcomingAppts.length + upcomingSessions.length,
        blocking: upcomingAppts.length + upcomingSessions.length > 0,
      },
      { label: 'Historical Consultations & Sessions', count: pastAppts.length + pastSessions.length },
      { label: 'Historical Care Assignments', count: historicalAssignments.length },
      { label: 'Compensation & Payout Records', count: proPayouts.length },
    ].filter(r => r.count > 0)

    const hasHistoricalDeps =
      pastAppts.length + pastSessions.length + historicalAssignments.length + proPayouts.length > 0
    const isBlocked = blockingReasons.length > 0

    return {
      module,
      recordId: pro.id,
      recordName: pro.full_name,
      canPermanentDelete: !isBlocked && !hasHistoricalDeps,
      canSoftDelete: !isBlocked,
      blockingReasons,
      linkedRecords,
      recommendedAction: isBlocked
        ? 'blocked_requires_reassignment'
        : hasHistoricalDeps
          ? 'soft_delete'
          : 'permanent_delete',
      consequenceWarning: isBlocked
        ? `Cannot delete "${pro.full_name}" while they have active customer assignments or upcoming sessions. Please reassign their customers/sessions first (or select automatic reassignment/deactivation).`
        : hasHistoricalDeps
          ? `"${pro.full_name}" has historical consultations or compensation records. Their profile will be safely Archived (Soft Deleted) so all historical consultations and payouts remain intact.`
          : `"${pro.full_name}" has no active or historical dependencies and will be permanently deleted.`,
    }
  }

  if (module === 'assignments') {
    const assign = assignments.find((a: any) => a.id === recordId)
    if (!assign) return null
    const cust = customers.find((c: any) => c.id === assign.customer_id)
    const up = cust ? userProfiles.find((u: any) => u.id === cust.user_id) : null
    const pro = professionals.find((p: any) => p.id === assign.professional_id)
    const label = `${up?.full_name || assign.customer_id} ↔ ${pro?.full_name || assign.professional_id} (${assign.role})`

    const linkedAppts = appointments.filter(
      (a: any) => a.customer_id === assign.customer_id && a.professional_id === assign.professional_id
    )
    const linkedSessions = trainingSessions.filter(
      (s: any) => s.customer_id === assign.customer_id && s.trainer_id === assign.professional_id
    )
    const linkedNotifs = whatsappNotifs.filter((n: any) => n.assignment_id === assign.id)
    const linkedPayouts = payouts.filter(
      (p: any) => p.customer_id === assign.customer_id && p.professional_id === assign.professional_id
    )

    const linkedRecords = [
      { label: 'Linked Appointments / Consultations', count: linkedAppts.length },
      { label: 'Linked Training Sessions', count: linkedSessions.length },
      { label: 'WhatsApp Dispatch Notifications', count: linkedNotifs.length },
      { label: 'Linked Compensation / Payouts', count: linkedPayouts.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: assign.id,
      recordName: label,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `This assignment is linked to ${linkedRecords.map(l => `${l.count} ${l.label}`).join(', ')}. It will be safely Archived/Cancelled without deleting any appointments, historical consultations, or payouts.`
        : 'This slot assignment has no linked appointments, consultations, notifications, or payouts and will be permanently deleted.',
    }
  }

  if (module === 'team') {
    const member = (mockDb.state.team_members || []).find((m: any) => m.id === recordId)
    if (!member) return null

    const dispatchedAssignments = assignments.filter(
      (a: any) => a.assigned_by_coordinator_id === member.id || a.assigned_by_name === member.full_name
    )
    const auditActions = (mockDb.state.audit_logs || []).filter(
      (al: any) => al.user_id === member.user_id || al.user_id === member.id
    )

    const linkedRecords = [
      { label: 'Dispatched Care Assignments', count: dispatchedAssignments.length },
      { label: 'Historical Audit Log Entries', count: auditActions.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: member.id,
      recordName: `${member.full_name} (${member.role.replace(/_/g, ' ')})`,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `"${member.full_name}" has historical dispatch records. Their staff profile will be Archived (Soft Deleted) and their system access permissions will be immediately revoked.`
        : `"${member.full_name}" has no historical dispatch dependencies. Their staff profile will be permanently deleted and their access permissions revoked.`,
    }
  }

  if (module === 'memberships') {
    const plan = (mockDb.state.memberships || []).find((m: any) => m.id === recordId)
    if (!plan) return null

    const subscribedCustomers = customers.filter((c: any) => c.membership_plan_id === plan.id)
    const linkedOrders = orders.filter((o: any) => o.membership_id === plan.id || o.plan_id === plan.id)

    const linkedRecords = [
      { label: 'Customers with this Membership Plan', count: subscribedCustomers.length },
      { label: 'Orders / Invoices / Payments', count: linkedOrders.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: plan.id,
      recordName: `${plan.name} (${plan.duration_label})`,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `"${plan.name}" has ${subscribedCustomers.length} customer(s) or payment records. It will be safely Archived (Soft Deleted) so existing subscribers keep their historical plan details while new purchases are blocked.`
        : `"${plan.name}" has no subscribers or payment records and will be permanently deleted.`,
    }
  }

  if (module === 'consultation_services') {
    const svc = (mockDb.state.consultation_services || []).find(
      (s: any) => s.id === recordId || s.key === recordId
    )
    if (!svc) return null

    const linkedAppts = appointments.filter(
      (a: any) =>
        a.consultation_service_id === svc.id ||
        a.service_key === svc.key ||
        (a.notes && String(a.notes).toLowerCase().includes(String(svc.name).toLowerCase()))
    )

    const linkedRecords = [
      { label: 'Customer Consultation Bookings', count: linkedAppts.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: svc.id,
      recordName: svc.name,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `"${svc.name}" has ${linkedAppts.length} historical booking(s). It will be safely Archived (Soft Deleted) and hidden from new customer bookings while preserving all historical appointment snapshots.`
        : `"${svc.name}" has no customer bookings and will be permanently deleted.`,
    }
  }

  if (module === 'consultation_categories') {
    const cat = ((mockDb.state as any).consultation_categories || []).find(
      (c: any) => c.id === recordId || c.key === recordId
    )
    if (!cat) return null

    const linkedServices = (mockDb.state.consultation_services || []).filter(
      (s: any) => s.category === cat.key
    )
    const linkedRecords = [
      { label: 'Consultation Services in this Category', count: linkedServices.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: cat.id,
      recordName: cat.label,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `Category "${cat.label}" is used by ${linkedServices.length} consultation service(s). It will be Archived (Soft Deleted) so existing services remain intact.`
        : `Category "${cat.label}" has no linked consultation services and will be permanently deleted.`,
    }
  }

  if (module === 'compensation_rules') {
    const rules = (mockDb.state as any).compensation_rule_versions || []
    const rule = rules.find((r: any) => r.id === recordId)
    if (!rule) return null

    const linkedTx = financialTx.filter((tx: any) => tx.compensation_rule_version_id === rule.id)
    const linkedPayouts = payouts.filter((p: any) => p.rule_version_id === rule.id)

    const linkedRecords = [
      { label: 'Financial Allocation Snapshots', count: linkedTx.length },
      { label: 'Generated Professional Payouts', count: linkedPayouts.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: rule.id,
      recordName: rule.name,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `Rule "${rule.name}" has been used in ${linkedTx.length + linkedPayouts.length} historical financial/payout calculation(s). It will be safely Archived (Soft Deleted) so all historical payouts and snapshots remain 100% unchanged.`
        : `Rule "${rule.name}" has never been used to generate payouts or financial transactions and will be permanently deleted.`,
    }
  }

  if (module === 'cms_biomarkers') {
    const biomarkers = mockDb.state.clinical_biomarkers || []
    const bm = biomarkers.find((b: any) => b.id === recordId || b.code === recordId)
    if (!bm) return null

    const intakes = (mockDb.state as any).clinical_intakes || []
    const usedInIntakes = intakes.filter(
      (i: any) => i.biomarkers && (i.biomarkers[bm.code] !== undefined || i.biomarkers[bm.id] !== undefined)
    )
    const isCoreSeeded = !bm.is_custom

    const linkedRecords = [
      { label: 'Patient Clinical Lab Records', count: usedInIntakes.length },
      { label: 'Core Clinical Reference Parameter', count: isCoreSeeded ? 1 : 0 },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: bm.id,
      recordName: `${bm.name} (${bm.unit})`,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `Biomarker "${bm.name}" is a core reference or linked to patient lab records. It will be safely Archived (Soft Deleted) to preserve historical clinical reports.`
        : `Custom biomarker "${bm.name}" has no linked patient lab records and will be permanently deleted.`,
    }
  }

  if (module === 'cms_content') {
    const items = (mockDb.state as any).cms_content_items || []
    const item = items.find((i: any) => i.id === recordId)
    if (!item) return null

    const isPublishedProtected = item.is_core_section === true || item.status === 'published'
    const linkedRecords = isPublishedProtected
      ? [{ label: 'Live Website Section / Published Route Reference', count: 1 }]
      : []

    return {
      module,
      recordId: item.id,
      recordName: item.title,
      canPermanentDelete: !isPublishedProtected,
      canSoftDelete: true,
      blockingReasons: [],
      linkedRecords,
      recommendedAction: isPublishedProtected ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: isPublishedProtected
        ? `"${item.title}" is a published or core website content block. It will be safely Archived (Soft Deleted) so the public website never renders broken links or missing sections.`
        : `"${item.title}" is an unpublished draft/custom item with no live route dependencies and will be permanently deleted.`,
    }
  }

  if (module === 'professional_roles') {
    const roles = mockDb.state.professional_roles || []
    const roleObj = roles.find((r: any) => r.id === recordId || r.value === recordId)
    if (!roleObj) return null

    const linkedPros = professionals.filter((p: any) => p.role === roleObj.value)
    const linkedAssigns = assignments.filter((a: any) => a.role === roleObj.value)
    const ruleComps = ((mockDb.state as any).payout_rule_components || []).filter(
      (c: any) => c.role === roleObj.value
    )

    const linkedRecords = [
      { label: 'Professionals with this Role', count: linkedPros.length, blocking: linkedPros.length > 0 },
      { label: 'Customer Care Assignments', count: linkedAssigns.length },
      { label: 'Compensation Rule Components', count: ruleComps.length },
    ].filter(r => r.count > 0)

    const hasDeps = linkedRecords.length > 0
    return {
      module,
      recordId: roleObj.id,
      recordName: `${roleObj.label} (${roleObj.value})`,
      canPermanentDelete: !hasDeps,
      canSoftDelete: true,
      blockingReasons:
        linkedPros.length > 0
          ? [`${linkedPros.length} professional profile(s) currently depend on role "${roleObj.label}".`]
          : [],
      linkedRecords,
      recommendedAction: hasDeps ? 'soft_delete' : 'permanent_delete',
      consequenceWarning: hasDeps
        ? `Role "${roleObj.label}" is referenced by ${linkedRecords.map(l => `${l.count} ${l.label}`).join(', ')}. To prevent breaking existing professional profiles or historical assignments, it will be Archived / Deactivated (or you may reassign dependent professionals first).`
        : `Role "${roleObj.label}" has no dependent professionals, assignments, or compensation rules and will be permanently deleted.`,
    }
  }

  return null
}
