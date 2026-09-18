// ============================================================
// Training Recording Service — Rolling Retention Logic
// Backend Developer Agent + Security Engineer
// TRD §47.4, §47.5, §47.6
// ============================================================
import { createServiceRoleClient } from '@/lib/supabase/server'

export class TrainingRecordingService {

  /**
   * Activate a recording for a customer.
   * Implements the rolling retention algorithm (TRD §47.4).
   */
  static async activateRecording(recordingId: string, activatedByUserId: string) {
    const supabase = await createServiceRoleClient()

    // Load the new recording
    const recRes = await (supabase as any)
      .from('training_recordings')
      .select('*')
      .eq('id', recordingId)
      .eq('recording_status', 'processing')
      .single()

    const recording = recRes.data
    if (!recording) throw new Error('Recording not found or not in processing state')

    // Find current active recording for this customer
    const prevRes = await (supabase as any)
      .from('training_recordings')
      .select('id')
      .eq('customer_id', recording.customer_id)
      .eq('is_active', true)
      .single()
    const previousActive = prevRes.data

    // Fetch retention config
    const retRes = await (supabase as any)
      .from('training_retention_config')
      .select('retention_mode, grace_period_hours')
      .eq('config_key', 'default_retention_policy')
      .single()
    const retentionConfig = retRes.data

    const now = new Date().toISOString()
    let deletionQueuedAt: string | null = null

    if (previousActive) {
      if (retentionConfig?.retention_mode === 'immediate') {
        deletionQueuedAt = now
      } else {
        const graceHours = retentionConfig?.grace_period_hours ?? 24
        deletionQueuedAt = new Date(Date.now() + graceHours * 3600 * 1000).toISOString()
      }
    }

    // Step 1: Deactivate previous
    if (previousActive) {
      const { error } = await (supabase as any)
        .from('training_recordings')
        .update({
          is_active: false,
          recording_status: 'inactive',
          deactivated_at: now,
          deletion_queued_at: deletionQueuedAt,
          updated_at: now,
        })
        .eq('id', previousActive.id)
      if (error) throw new Error(`Failed to deactivate previous recording: ${error.message}`)
    }

    // Step 2: Activate new recording
    const { error: activateErr } = await (supabase as any)
      .from('training_recordings')
      .update({
        is_active: true,
        recording_status: 'available',
        activated_at: now,
        updated_at: now,
      })
      .eq('id', recordingId)
    if (activateErr) throw new Error(`Failed to activate recording: ${activateErr.message}`)

    // Audit logs
    await (supabase as any).from('audit_logs').insert({
      user_id: activatedByUserId,
      action: 'training_recording.activated',
      table_name: 'training_recordings',
      record_id: recordingId,
      new_data: { customer_id: recording.customer_id, activated_at: now },
    })

    if (previousActive) {
      await (supabase as any).from('audit_logs').insert({
        user_id: activatedByUserId,
        action: 'training_recording.deactivated',
        table_name: 'training_recordings',
        record_id: previousActive.id,
        new_data: { deletion_queued_at: deletionQueuedAt },
      })
    }

    return { success: true, recordingId }
  }

  /**
   * Generate a server-side signed URL for the customer's active recording.
   * TTL: 1 hour. Never stored permanently.
   */
  static async generateSignedUrl(
    customerId: string,
    requestingUserId: string
  ): Promise<{ signedUrl: string; expiresAt: string }> {
    const supabase = await createServiceRoleClient()

    const profileRes = await (supabase as any)
      .from('user_profiles')
      .select('role')
      .eq('id', requestingUserId)
      .single()
    const profile = profileRes.data

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

    if (!isAdmin) {
      const customerRes = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('user_id', requestingUserId)
        .single()
      if (!customerRes.data) throw new Error('Unauthorized: cannot access this recording')
    }

    const recRes = await (supabase as any)
      .from('training_recordings')
      .select('storage_key, recording_status, is_active')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .eq('recording_status', 'available')
      .single()
    const recording = recRes.data

    if (!recording) throw new Error('No active recording available')

    const { data: signed, error: signErr } = await supabase.storage
      .from('training-recordings')
      .createSignedUrl(recording.storage_key, 3600)

    if (signErr || !signed?.signedUrl) throw new Error('Failed to generate signed URL')

    return { signedUrl: signed.signedUrl, expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() }
  }

  /**
   * Get latest recording status for a customer (no signed URL).
   */
  static async getLatestRecordingStatus(customerId: string) {
    const supabase = await createServiceRoleClient()

    const sessionRes = await (supabase as any)
      .from('training_sessions')
      .select('id, scheduled_at, status, trainer:trainer_id ( full_name )')
      .eq('customer_id', customerId)
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
      .limit(1)
      .single()
    const session = sessionRes.data

    if (!session) return { hasRecording: false, session: null, recordingStatus: null, recordingId: null }

    const recRes = await (supabase as any)
      .from('training_recordings')
      .select('id, recording_status, is_active, activated_at, duration_seconds')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .single()
    const recording = recRes.data

    return {
      hasRecording: !!recording,
      session,
      recordingStatus: recording?.recording_status ?? null,
      recordingId: recording?.id ?? null,
    }
  }

  /**
   * Background cleanup job — deletes video files whose deletion_queued_at has passed.
   */
  static async runCleanupJob(): Promise<{ deleted: number; errors: number }> {
    const supabase = await createServiceRoleClient()
    const now = new Date().toISOString()

    const { data: toDelete } = await (supabase as any)
      .from('training_recordings')
      .select('id, storage_key, customer_id')
      .lte('deletion_queued_at', now)
      .is('deleted_at', null)
      .eq('recording_status', 'inactive')

    if (!toDelete || toDelete.length === 0) return { deleted: 0, errors: 0 }

    let deleted = 0, errors = 0

    for (const rec of toDelete as { id: string; storage_key: string; customer_id: string }[]) {
      try {
        const { error: storageErr } = await supabase.storage
          .from('training-recordings')
          .remove([rec.storage_key])

        if (storageErr) throw storageErr

        await (supabase as any)
          .from('training_recordings')
          .update({ recording_status: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', rec.id)

        await (supabase as any).from('audit_logs').insert({
          action: 'training_recording.deleted',
          table_name: 'training_recordings',
          record_id: rec.id,
          new_data: { storage_key: rec.storage_key, deleted_at: new Date().toISOString() },
        })

        deleted++
      } catch (e) {
        console.error(`Failed to delete recording ${rec.id}:`, e)
        errors++
      }
    }

    return { deleted, errors }
  }
}
