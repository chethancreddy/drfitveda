import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { mockDb } from '@/lib/mock-db'

// ============================================================
// GET /api/gallery — List customer's workout and transformation videos
// ============================================================
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let customerId = searchParams.get('customer_id')

    if (!customerId) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customerId = cust.id
    }

    // In mock mode or Supabase, fetch gallery_videos
    const videos = (mockDb.state.gallery_videos || []).filter(
      (v: any) => !customerId || v.customer_id === customerId
    )

    return NextResponse.json({ videos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/gallery — Upload/record a workout or progress video
// Body: {
//   title: string,
//   category: 'workout' | 'yoga' | 'transformation' | 'form_check',
//   video_url?: string,
//   thumbnail_url?: string,
//   notes?: string
// }
// ============================================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      category = 'workout',
      video_url = 'https://www.w3schools.com/html/mov_bbb.mp4',
      thumbnail_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
      notes = ''
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let customerId = body.customer_id
    if (!customerId) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customerId = cust.id
    }

    const newVideo = {
      id: `vid-${Date.now()}`,
      customer_id: customerId || 'c0000000-0000-0000-0000-000000000001',
      title: title.trim(),
      category,
      video_url,
      thumbnail_url,
      duration_seconds: 60,
      notes: notes.trim(),
      trainer_feedback: 'Pending trainer review',
      created_at: new Date().toISOString(),
    }

    mockDb.state.gallery_videos = mockDb.state.gallery_videos || []
    mockDb.state.gallery_videos.unshift(newVideo)

    return NextResponse.json({ success: true, video: newVideo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
