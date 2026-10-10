import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Returns the signed-in user if (and only if) they are an admin/super_admin.
 * Role is read from the user_profiles table (server-controlled), never from
 * user-editable metadata. In local demo mode the mock session's app_metadata is used.
 */
export async function requireAdmin(): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const svc = await createServiceRoleClient()
  const { data: profile } = await (svc as any)
    .from('user_profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? (user as any).app_metadata?.role
  return role === 'admin' || role === 'super_admin' ? { id: user.id } : null
}

export async function getSignedInUser(): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? { id: user.id } : null
}
