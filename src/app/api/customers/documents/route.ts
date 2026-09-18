import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/customers/documents — List customer medical documents
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

    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const { data, error } = await (supabase as any)
      .from('medical_documents')
      .select('id, customer_id, doc_type, storage_key, file_name, file_size, status, notes, uploaded_at')
      .eq('customer_id', customerId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ documents: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/customers/documents — Add medical document record
// Body: {
//   customer_id?: string,
//   doc_type: string,
//   file_name: string,
//   storage_key?: string,
//   file_size?: number,
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
    let {
      customer_id,
      doc_type = 'general',
      file_name,
      storage_key,
      file_size = 0,
      notes = ''
    } = body

    if (!customer_id) {
      const { data: cust } = await (supabase as any)
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (cust) customer_id = cust.id
    }

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 400 })
    }

    if (!file_name) {
      return NextResponse.json({ error: 'file_name is required' }, { status: 400 })
    }

    // Default storage key if not provided
    if (!storage_key) {
      storage_key = `docs/${customer_id}/${Date.now()}_${file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    }

    const { data: doc, error } = await (supabase as any)
      .from('medical_documents')
      .insert({
        customer_id,
        uploaded_by: user.id,
        doc_type,
        file_name,
        storage_key,
        file_size,
        status: 'pending',
        notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
