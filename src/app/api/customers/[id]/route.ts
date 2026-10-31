import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import {
  inspectRecordDependencies,
  recordAdminAuditLog,
  syncCustomerStatusAndMemberships,
  verifyAdminAccess,
} from '@/lib/services/admin-record-governance'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await loadPersistedState()
    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams

    const customers = mockDb.state.customers || []
    const customer = customers.find((c: any) => c.id === id || c.user_id === id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const userProfiles = mockDb.state.user_profiles || []
    const profiles = mockDb.state.customer_profiles || []
    const foodProfiles = mockDb.state.food_profiles || []
    const assignments = mockDb.state.professional_assignments || []
    const professionals = mockDb.state.professionals || []
    const memberships = mockDb.state.memberships || []
    const trainingSessions = mockDb.state.training_sessions || []
    const appointments = mockDb.state.appointments || []

    const userProfile = userProfiles.find((up: any) => up.id === customer.user_id) || {}
    const profile = profiles.find((cp: any) => cp.customer_id === customer.id) || {}
    const foodProfile = foodProfiles.find((fp: any) => fp.customer_id === customer.id) || {}
    const plan = memberships.find((m: any) => m.id === customer.membership_plan_id) || null

    const custAssignments = assignments
      .filter((pa: any) => pa.customer_id === customer.id && pa.is_active && !pa.is_archived)
      .map((pa: any) => {
        const pro = professionals.find((p: any) => p.id === pa.professional_id)
        return {
          id: pa.id,
          role: pa.role,
          professional_id: pa.professional_id,
          full_name: pro?.full_name || 'Professional',
          qualification: pro?.qualification || '',
          specialization: pro?.specialization || '',
        }
      })

    const sessions = trainingSessions
      .filter((s: any) => s.customer_id === customer.id)
      .map((s: any) => {
        const trn = professionals.find((p: any) => p.id === s.trainer_id)
        return {
          ...s,
          trainer_name: trn?.full_name || 'Trainer',
        }
      })

    const custAppointments = appointments.filter((a: any) => a.customer_id === customer.id)

    return NextResponse.json({
      customer: {
        ...customer,
        full_name: userProfile.full_name || customer.full_name || 'Customer',
        email: userProfile.email || customer.email || '',
        phone: userProfile.phone || customer.phone || '',
        profile,
        food_profile: foodProfile,
        plan,
        assignments: custAssignments,
        sessions,
        appointments: custAppointments,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, [
      'admin',
      'super_admin',
      'operations_manager',
      'care_coordinator',
    ])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams
    const body = await req.json()

    const customers = mockDb.state.customers || []
    const idx = customers.findIndex((c: any) => c.id === id || c.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const customer = customers[idx]
    const userProfiles = mockDb.state.user_profiles || []
    const existingUp = userProfiles.find((up: any) => up.id === customer.user_id) || {}
    const recordName = body.full_name || existingUp.full_name || customer.full_name || customer.id

    const prevStatus = customer.is_archived
      ? 'archived'
      : customer.is_active !== false
        ? 'active'
        : 'inactive'

    const newMeetingUrl = body.zoho_meeting_url || body.google_meet_url || body.meeting_url

    // 1. Update core fields first
    if (body.membership_plan_id !== undefined) {
      customer.membership_plan_id = body.membership_plan_id || null
    }
    if (body.membership_expires_at !== undefined) {
      customer.membership_expires_at = body.membership_expires_at
    }
    if (newMeetingUrl !== undefined) {
      customer.zoho_meeting_url = newMeetingUrl
      customer.google_meet_url = newMeetingUrl
      customer.meeting_url = newMeetingUrl
      customer.meeting_provider = newMeetingUrl?.includes('zoho.com')
        ? 'zoho_meeting'
        : customer.meeting_provider || 'zoho_meeting'
    }

    // 2. Handle Restore from Archive
    if (body.restore === true) {
      customer.is_archived = false
      customer.deleted_at = null
      syncCustomerStatusAndMemberships(customer, true, {
        manualMembershipStatus: body.membership_status,
      })
    } else if (body.is_active !== undefined && Boolean(body.is_active) !== Boolean(customer.is_active)) {
      // 3. Synchronize Customer Active/Inactive Status with Membership(s)
      syncCustomerStatusAndMemberships(customer, Boolean(body.is_active), {
        manualMembershipStatus: body.membership_status,
      })
    } else if (body.membership_status !== undefined) {
      // Manual membership status update by Admin
      customer.membership_status = body.membership_status
      customer.membership_deactivated_by_status_sync = false
    }

    if (body.is_archived !== undefined) {
      customer.is_archived = Boolean(body.is_archived)
      if (customer.is_archived) {
        customer.deleted_at = new Date().toISOString()
        syncCustomerStatusAndMemberships(customer, false)
      }
    }

    customer.updated_at = new Date().toISOString()
    customers[idx] = customer

    // 4. Update user_profiles (full_name, email, phone)
    if (body.full_name !== undefined || body.email !== undefined || body.phone !== undefined) {
      const uIdx = userProfiles.findIndex((up: any) => up.id === customer.user_id)
      if (uIdx !== -1) {
        userProfiles[uIdx] = {
          ...userProfiles[uIdx],
          full_name: body.full_name !== undefined ? body.full_name : userProfiles[uIdx].full_name,
          email: body.email !== undefined ? body.email : userProfiles[uIdx].email,
          phone: body.phone !== undefined ? body.phone : userProfiles[uIdx].phone,
          is_active: customer.is_active,
          updated_at: new Date().toISOString(),
        }
      }
    }

    // 5. Update customer_profiles biometrics if provided
    if (body.profile) {
      const profiles = mockDb.state.customer_profiles || []
      const pIdx = profiles.findIndex((cp: any) => cp.customer_id === customer.id)
      if (pIdx !== -1) {
        const h = body.profile.height_cm !== undefined ? Number(body.profile.height_cm) : profiles[pIdx].height_cm
        const w = body.profile.weight_kg !== undefined ? Number(body.profile.weight_kg) : profiles[pIdx].weight_kg
        profiles[pIdx] = {
          ...profiles[pIdx],
          ...body.profile,
          height_cm: h,
          weight_kg: w,
          bmi: h && w ? Number((w / ((h / 100) * (h / 100))).toFixed(1)) : profiles[pIdx].bmi,
        }
      }
    }

    await savePersistedState(['customers', 'user_profiles', 'customer_profiles'])

    const newStatus = customer.is_archived
      ? 'archived'
      : customer.is_active !== false
        ? 'active'
        : 'inactive'

    const actionType =
      body.restore === true
        ? 'restore'
        : prevStatus !== newStatus
          ? newStatus === 'active'
            ? 'activate'
            : newStatus === 'archived'
              ? 'archive'
              : 'deactivate'
          : 'update'

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'customers',
      recordId: customer.id,
      recordName,
      previousStatus: prevStatus,
      newStatus,
      actionType,
      detail: `Customer "${recordName}" (${customer.id}) updated (${actionType}). Membership status: ${customer.membership_status}.`,
    })

    return NextResponse.json({ customer: customers[idx], success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin', 'operations_manager'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const resolvedParams = await Promise.resolve(context.params)
    const { id } = resolvedParams
    const { searchParams } = new URL(req.url)
    const forceArchive = searchParams.get('mode') === 'archive'

    const customers = mockDb.state.customers || []
    const idx = customers.findIndex((c: any) => c.id === id || c.user_id === id)
    if (idx === -1) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const customer = customers[idx]
    const prevStatus = customer.is_archived
      ? 'archived'
      : customer.is_active !== false
        ? 'active'
        : 'inactive'

    const dep = await inspectRecordDependencies('customers', customer.id)
    const recordName = dep?.recordName || customer.id

    if (dep?.canPermanentDelete && !forceArchive) {
      // Safe permanent deletion — zero linked historical/financial records
      customers.splice(idx, 1)
      if (mockDb.state.customer_profiles) {
        mockDb.state.customer_profiles = mockDb.state.customer_profiles.filter(
          (cp: any) => cp.customer_id !== customer.id
        )
      }
      if (mockDb.state.user_profiles) {
        mockDb.state.user_profiles = mockDb.state.user_profiles.filter(
          (up: any) => up.id !== customer.user_id
        )
      }
      await savePersistedState(['customers', 'customer_profiles', 'user_profiles'])

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'customers',
        recordId: customer.id,
        recordName,
        previousStatus: prevStatus,
        newStatus: 'deleted',
        actionType: 'permanent_delete',
        detail: `Customer "${recordName}" (${customer.id}) permanently deleted (0 dependencies).`,
      })

      return NextResponse.json({
        success: true,
        deleted: true,
        archived: false,
        message: `Customer "${recordName}" permanently deleted.`,
      })
    }

    // Soft Delete / Archive — preserve all linked appointments, memberships, orders, and clinical records
    syncCustomerStatusAndMemberships(customer, false)
    customer.is_archived = true
    customer.deleted_at = new Date().toISOString()
    customers[idx] = customer

    // Deactivate active assignments for this archived customer without deleting historical assignments
    if (Array.isArray(mockDb.state.professional_assignments)) {
      for (const pa of mockDb.state.professional_assignments) {
        if (pa.customer_id === customer.id && pa.is_active) {
          pa.is_active = false
          pa.updated_at = new Date().toISOString()
        }
      }
    }

    await savePersistedState(['customers', 'user_profiles', 'professional_assignments'])

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'customers',
      recordId: customer.id,
      recordName,
      previousStatus: prevStatus,
      newStatus: 'archived',
      actionType: 'archive',
      detail: `Customer "${recordName}" (${customer.id}) soft-deleted/archived to preserve linked clinical and membership history.`,
    })

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
      customer,
      message: `Customer "${recordName}" archived safely. Historical records remain intact.`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to delete or archive customer' }, { status: 400 })
  }
}
