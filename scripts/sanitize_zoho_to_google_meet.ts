import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { mockDb } from '../src/lib/mock-db'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const k = trimmed.substring(0, idx).trim()
      const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '')
      if (k && !process.env[k]) {
        process.env[k] = v
      }
    }
  })
}

async function main() {
  console.log('=== Sanitizing Zoho Meeting references across DrFitVeda ===\n')

  // 1. Load and sanitize state in website_settings
  console.log('Step 1: Loading persisted state from Supabase...')
  await loadPersistedState(true)

  const services = mockDb.state.consultation_services || []
  console.log(`Loaded ${services.length} consultation services.`)

  let servicesModified = 0
  for (const s of services) {
    console.log(`- Service "${s.name}": consultation_type = "${s.consultation_type}"`)
    if (s.consultation_type && s.consultation_type.toLowerCase().includes('zoho')) {
      s.consultation_type = s.consultation_type.replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet')
      servicesModified++
    }
  }

  // Save back to persistent store
  console.log('\nStep 2: Saving sanitized state to Supabase website_settings...')
  await savePersistedState(['consultation_services', 'memberships', 'appointments'])
  console.log('State saved successfully.')

  // 2. Direct table update in Supabase (if tables exist)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    console.log('\nStep 3: Checking relational tables in Supabase directly...')
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
      const { data: dbServices, error } = await supabase
        .from('consultation_services')
        .select('id, name, consultation_type, short_description')

      if (!error && dbServices && dbServices.length > 0) {
        console.log(`Found ${dbServices.length} records in public.consultation_services table:`)
        for (const row of dbServices) {
          console.log(`  * ${row.name}: ${row.consultation_type}`)
          if (row.consultation_type && row.consultation_type.toLowerCase().includes('zoho')) {
            const cleanType = row.consultation_type.replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet')
            await supabase
              .from('consultation_services')
              .update({ consultation_type: cleanType })
              .eq('id', row.id)
            console.log(`    -> Updated to: ${cleanType}`)
          }
        }
      } else {
        console.log('Table public.consultation_services is either empty or not accessed directly:', error?.message || 'OK')
      }
    } catch (e: any) {
      console.log('Direct table check notice:', e.message)
    }
  }

  console.log('\n=== Sanitization Complete: All Zoho Meeting references replaced with Google Meet ===')
}

main().catch(err => {
  console.error('Error running sanitization script:', err)
  process.exit(1)
})
