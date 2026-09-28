import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

export async function GET(req: NextRequest) {
  try {
    const settings = mockDb.state.settings || {
      platform_name: 'Dr Fit Veda',
      tagline: 'Naturopathy · Clinical Nutrition · Yoga · Certified Fitness',
      contact_email: 'support@drfitveda.com',
      support_phone: '+91 98765 00000',
      platform_address: 'Bangalore, Karnataka, India',
      google_meet_platform: 'Google Meet',
      google_meet_recording_policy: 'Admin/trainer pastes Google Meet recording link after session completion',
      google_meet_super_plan_overwrite: true,
      google_meet_auto_notify: true,
      google_meet_default_url: 'https://meet.google.com',
    }
    const professional_roles = mockDb.state.professional_roles || []
    return NextResponse.json({ settings, professional_roles })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let role = (user as any)?.user_metadata?.role || (user as any)?.role
    if (!role) {
      const cookie = req.cookies.get('drf_session')?.value
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie))
          role = parsed.role
        } catch {
          try {
            const parsed = JSON.parse(cookie)
            role = parsed.role
          } catch {}
        }
      }
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    if (body.professional_roles) {
      mockDb.state.professional_roles = body.professional_roles
    }

    const { professional_roles, ...settingsData } = body

    mockDb.state.settings = {
      ...(mockDb.state.settings || {}),
      ...settingsData,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      settings: mockDb.state.settings,
      professional_roles: mockDb.state.professional_roles,
      success: true,
    })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
