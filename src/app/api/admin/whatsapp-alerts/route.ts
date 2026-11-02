import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-db'
import { loadPersistedState, savePersistedState } from '@/lib/persistent-store'
import { verifyAdminAccess, recordAdminAuditLog } from '@/lib/services/admin-record-governance'
import { msg91WhatsAppService } from '@/lib/services/msg91-whatsapp.service'
import { APPROVED_WHATSAPP_TEMPLATES, renderTemplatePreview } from '@/lib/services/whatsapp-templates'
import { validateInternationalPhone } from '@/lib/country-codes'

// ============================================================
// Dr Fit Veda — WhatsApp Alert Management API
// Handles:
// - Template catalog retrieval
// - Recipient list with membership & status filtering
// - Multi-recipient batch sending with rate limit throttling
// - Independent recipient tracking & error isolation
// - Campaign history persistence & failed recipient retry
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    await loadPersistedState()

    const customers = mockDb.state.customers || []
    const userProfiles = mockDb.state.user_profiles || []
    const memberships = mockDb.state.memberships || []
    const campaigns = (mockDb.state as any).whatsapp_campaigns || []

    const customerList = customers.map((c: any) => {
      const up = userProfiles.find((u: any) => u.id === c.user_id) || {}
      const plan = memberships.find((m: any) => m.id === c.membership_plan_id) || null
      const phone = up.phone || c.phone || ''
      const phoneValidation = phone
        ? validateInternationalPhone(phone)
        : { isValid: false, error: 'Phone missing', displayPhone: '' }

      return {
        id: c.id,
        user_id: c.user_id,
        full_name: up.full_name || c.full_name || 'Customer',
        email: up.email || c.email || '',
        phone,
        is_phone_valid: phoneValidation.isValid,
        phone_display: phoneValidation.displayPhone || phone,
        is_active: c.is_active !== false && !c.is_archived,
        is_archived: Boolean(c.is_archived),
        membership_status: c.membership_status || 'inactive',
        membership_plan_id: c.membership_plan_id || null,
        plan_name: plan?.name || 'No Active Plan',
        meeting_url: c.zoho_meeting_url || c.google_meet_url || c.meeting_url || '',
      }
    })

    return NextResponse.json({
      templates: APPROVED_WHATSAPP_TEMPLATES,
      customers: customerList,
      campaigns: campaigns.slice().reverse(),
      plans: memberships.map((m: any) => ({ id: m.id, name: m.name })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch WhatsApp alerts data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAccess(req, ['admin', 'super_admin'])
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. Only Admin can send alerts.' }, { status: auth.status })
    }

    await loadPersistedState()
    const body = await req.json()
    const { action } = body

    // ─── ACTION: RETRY FAILED RECIPIENTS ─────────────────────────
    if (action === 'retry_campaign') {
      const { campaign_id } = body
      if (!campaign_id) {
        return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
      }

      if (!Array.isArray((mockDb.state as any).whatsapp_campaigns)) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      const campaign = (mockDb.state as any).whatsapp_campaigns.find((c: any) => c.id === campaign_id)
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      const failedRecipients = campaign.recipients.filter((r: any) => r.status === 'failed')
      if (failedRecipients.length === 0) {
        return NextResponse.json({ message: 'No failed recipients to retry in this campaign.' }, { status: 200 })
      }

      let retriedSuccess = 0
      let retriedFailed = 0

      for (const recipient of failedRecipients) {
        try {
          const sendResult = await msg91WhatsAppService.sendTemplateMessage({
            toMobile: recipient.phone,
            templateName: campaign.template_name,
            bodyVariables: recipient.variables,
            languageCode: campaign.language_code || 'en',
          })

          if (sendResult.success || sendResult.providerAccepted) {
            recipient.status = 'sent'
            recipient.provider_request_id = sendResult.requestId || 'sim-retry-ok'
            recipient.error = null
            retriedSuccess++
          } else {
            recipient.status = 'failed'
            recipient.error = sendResult.message || 'Retry rejected by provider'
            retriedFailed++
          }
        } catch (dispatchErr: any) {
          recipient.status = 'failed'
          recipient.error = dispatchErr.message || 'Network exception during retry'
          retriedFailed++
        }
      }

      campaign.success_count = campaign.recipients.filter((r: any) => r.status === 'sent').length
      campaign.failed_count = campaign.recipients.filter((r: any) => r.status === 'failed').length
      campaign.status = campaign.failed_count === 0 ? 'completed' : campaign.success_count > 0 ? 'partial_failure' : 'failed'
      campaign.updated_at = new Date().toISOString()

      await savePersistedState('whatsapp_campaigns')

      await recordAdminAuditLog({
        actorId: auth.userId,
        actorName: auth.userName,
        module: 'whatsapp_campaigns',
        recordId: campaign.id,
        recordName: campaign.campaign_name,
        previousStatus: 'partial_failure',
        newStatus: campaign.status,
        actionType: 'update',
        detail: `Retried ${failedRecipients.length} failed recipients. Succeeded: ${retriedSuccess}, Still failed: ${retriedFailed}.`,
      })

      return NextResponse.json({
        success: true,
        campaign,
        retried_count: failedRecipients.length,
        retried_success: retriedSuccess,
        retried_failed: retriedFailed,
      })
    }

    // ─── ACTION: NEW CAMPAIGN SEND ───────────────────────────────
    const { campaign_name, template_name, recipient_ids, variable_mappings, language_code } = body

    if (!template_name || !recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return NextResponse.json({ error: 'Please select a template and at least one recipient.' }, { status: 400 })
    }

    const templateDef = APPROVED_WHATSAPP_TEMPLATES.find(t => t.name === template_name)
    if (!templateDef) {
      return NextResponse.json({ error: `Template "${template_name}" is not in the approved templates list.` }, { status: 400 })
    }

    const customers = mockDb.state.customers || []
    const userProfiles = mockDb.state.user_profiles || []
    const memberships = mockDb.state.memberships || []

    const selectedCustomers = recipient_ids
      .map(id => customers.find((c: any) => c.id === id || c.user_id === id))
      .filter(Boolean)

    if (selectedCustomers.length === 0) {
      return NextResponse.json({ error: 'No matching customer records found for selected IDs.' }, { status: 400 })
    }

    const campaignId = `camp-${Date.now()}`
    const campaignTitle = (campaign_name && campaign_name.trim()) || `Alert: ${templateDef.displayName} (${new Date().toLocaleDateString()})`
    const recipientResults: any[] = []

    let successCount = 0
    let failedCount = 0

    // Batch send with throttling (chunks of 5 to protect MSG91 rate limits)
    const BATCH_SIZE = 5
    for (let i = 0; i < selectedCustomers.length; i += BATCH_SIZE) {
      const batch = selectedCustomers.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (cust: any) => {
          const up = userProfiles.find((u: any) => u.id === cust.user_id) || {}
          const plan = memberships.find((m: any) => m.id === cust.membership_plan_id) || null
          const rawPhone = up.phone || cust.phone || ''
          const custName = up.full_name || cust.full_name || 'Valued Member'
          const custEmail = up.email || cust.email || ''
          const custMeeting = cust.zoho_meeting_url || cust.google_meet_url || cust.meeting_url || 'https://drfitveda.com/customer'
          const planName = plan?.name || 'Custom Care Plan'

          // Validate phone number
          const phoneVal = validateInternationalPhone(rawPhone)
          if (!phoneVal.isValid) {
            failedCount++
            recipientResults.push({
              customer_id: cust.id,
              customer_name: custName,
              phone: rawPhone,
              status: 'failed',
              error: phoneVal.error || 'Invalid or missing international phone format',
              variables: [],
              dispatched_at: new Date().toISOString(),
            })
            return
          }

          // Build dynamic template variables based on mappings
          const renderedVariables: string[] = []
          for (const vDef of templateDef.variables) {
            const mapping = variable_mappings?.[vDef.index]
            let resolvedVal = ''

            if (mapping?.source === 'custom' && mapping.customValue !== undefined) {
              resolvedVal = mapping.customValue.trim()
            } else {
              // Field mapping
              const targetField = mapping?.field || vDef.defaultField || 'full_name'
              switch (targetField) {
                case 'full_name':
                  resolvedVal = custName
                  break
                case 'email':
                  resolvedVal = custEmail
                  break
                case 'phone':
                  resolvedVal = phoneVal.displayPhone || rawPhone
                  break
                case 'plan_name':
                  resolvedVal = planName
                  break
                case 'meeting_url':
                  resolvedVal = custMeeting
                  break
                case 'id':
                  resolvedVal = cust.id
                  break
                default:
                  resolvedVal = mapping?.customValue || vDef.defaultValue || '-'
              }
            }
            renderedVariables.push(resolvedVal || vDef.defaultValue || '-')
          }

          try {
            const sendResult = await msg91WhatsAppService.sendTemplateMessage({
              toMobile: phoneVal.msg91Mobile,
              templateName: templateDef.name,
              bodyVariables: renderedVariables,
              languageCode: language_code || templateDef.language || 'en',
            })

            if (sendResult.success || sendResult.providerAccepted) {
              successCount++
              recipientResults.push({
                customer_id: cust.id,
                customer_name: custName,
                phone: phoneVal.e164Phone,
                status: 'sent',
                provider_request_id: sendResult.requestId || 'msg91-req-ok',
                variables: renderedVariables,
                dispatched_at: new Date().toISOString(),
              })
            } else {
              failedCount++
              recipientResults.push({
                customer_id: cust.id,
                customer_name: custName,
                phone: phoneVal.e164Phone,
                status: 'failed',
                error: sendResult.message || 'Provider rejected dispatch',
                variables: renderedVariables,
                dispatched_at: new Date().toISOString(),
              })
            }
          } catch (dispatchErr: any) {
            failedCount++
            recipientResults.push({
              customer_id: cust.id,
              customer_name: custName,
              phone: phoneVal.e164Phone,
              status: 'failed',
              error: dispatchErr.message || 'Dispatch network exception',
              variables: renderedVariables,
              dispatched_at: new Date().toISOString(),
            })
          }
        })
      )

      // 50ms pause between batches to adhere to rate limits
      if (i + BATCH_SIZE < selectedCustomers.length) {
        await new Promise(res => setTimeout(res, 50))
      }
    }

    const campaignRecord = {
      id: campaignId,
      campaign_name: campaignTitle,
      template_name: templateDef.name,
      template_display_name: templateDef.displayName,
      language_code: language_code || templateDef.language,
      total_recipients: selectedCustomers.length,
      success_count: successCount,
      failed_count: failedCount,
      status: failedCount === 0 ? 'completed' : successCount > 0 ? 'partial_failure' : 'failed',
      created_by: auth.userName,
      created_by_id: auth.userId,
      created_at: new Date().toISOString(),
      recipients: recipientResults,
    }

    if (!Array.isArray((mockDb.state as any).whatsapp_campaigns)) {
      ;(mockDb.state as any).whatsapp_campaigns = []
    }
    ;(mockDb.state as any).whatsapp_campaigns.push(campaignRecord)
    await savePersistedState('whatsapp_campaigns')

    await recordAdminAuditLog({
      actorId: auth.userId,
      actorName: auth.userName,
      module: 'whatsapp_campaigns',
      recordId: campaignId,
      recordName: campaignTitle,
      previousStatus: 'draft',
      newStatus: campaignRecord.status,
      actionType: 'create',
      detail: `WhatsApp alert broadcast "${campaignTitle}" dispatched using template "${templateDef.name}". Total: ${selectedCustomers.length}, Sent: ${successCount}, Failed: ${failedCount}.`,
    })

    return NextResponse.json({
      success: true,
      campaign: campaignRecord,
      message: `Campaign dispatched: ${successCount} sent, ${failedCount} failed.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch WhatsApp alerts' }, { status: 500 })
  }
}
