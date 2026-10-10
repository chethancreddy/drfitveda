import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isConfigured = Boolean(
    url &&
    !url.includes('placeholder') &&
    anonKey &&
    !anonKey.includes('placeholder')
  )

  if (!isConfigured) {
    return NextResponse.json({
      status: 'mock_mode',
      connected: false,
      message: 'Supabase environment variables are missing or set to placeholder. The application is running on the in-memory mock database.',
      configured_keys: {
        NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anonKey),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
      },
    })
  }

  try {
    const client = createClient(url!, serviceKey || anonKey!)
    
    // Check key tables
    const tablesToCheck = [
      'user_profiles',
      'customers',
      'professionals',
      'memberships',
      'consent_records',
      'data_subject_requests',
      'contact_inquiries',
    ]

    const tableResults: Record<string, boolean> = {}

    for (const table of tablesToCheck) {
      const { error } = await client.from(table).select('id').limit(1)
      tableResults[table] = !error
    }

    const allHealthy = Object.values(tableResults).every(Boolean)

    return NextResponse.json({
      status: allHealthy ? 'connected' : 'partially_migrated',
      connected: true,
      url: url,
      tables: tableResults,
      message: allHealthy
        ? 'Successfully connected to live Supabase database with all tables verified.'
        : 'Connected to Supabase, but some tables are missing. Please ensure all migrations (001 - 006) have been run.',
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: err.message || 'Failed to connect to Supabase instance',
    }, { status: 500 })
  }
}
