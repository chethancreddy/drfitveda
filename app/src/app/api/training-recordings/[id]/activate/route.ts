import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TrainingRecordingService } from '@/lib/services/recording.service'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase as any)
      .from('user_profiles').select('role').eq('id', user.id).single()
    const role: string = profile?.role ?? ''
    const isTrainer = ['trainer','yoga_doctor','yoga_consultant','admin','super_admin'].includes(role)
    if (!isTrainer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await TrainingRecordingService.activateRecording(id, user.id)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
