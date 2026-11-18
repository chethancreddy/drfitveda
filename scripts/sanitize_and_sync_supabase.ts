import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { mockDb } from '../src/lib/mock-db'

async function run() {
  console.log('Loading state from Supabase...')
  await loadPersistedState(true)
  console.log(`Loaded ${mockDb.state.consultation_services?.length ?? 0} consultation services.`)

  let cleanedServices = 0
  if (Array.isArray(mockDb.state.consultation_services)) {
    mockDb.state.consultation_services = mockDb.state.consultation_services.map((s: any) => {
      const hadZoho =
        /zoho/i.test(s.consultation_type || '') ||
        /zoho/i.test(s.description || '') ||
        /zoho/i.test(s.short_description || '') ||
        /zoho/i.test(s.full_description || '')
      if (hadZoho) cleanedServices++
      return {
        ...s,
        consultation_type: (s.consultation_type || 'Online Video (Google Meet)')
          .replace(/zoho meeting/gi, 'Google Meet')
          .replace(/zoho/gi, 'Google Meet'),
        short_description: (s.short_description || s.description || '')
          .replace(/zoho meeting/gi, 'Google Meet')
          .replace(/zoho/gi, 'Google Meet'),
        full_description: (s.full_description || s.description || s.short_description || '')
          .replace(/zoho meeting/gi, 'Google Meet')
          .replace(/zoho/gi, 'Google Meet'),
        description: (s.description || s.full_description || s.short_description || '')
          .replace(/zoho meeting/gi, 'Google Meet')
          .replace(/zoho/gi, 'Google Meet'),
      }
    })
  }

  let cleanedMemberships = 0
  if (Array.isArray(mockDb.state.memberships)) {
    mockDb.state.memberships = mockDb.state.memberships.map((m: any) => {
      const origBenefits = Array.isArray(m.benefits) ? m.benefits.join(' ') : ''
      if (/zoho/i.test(origBenefits) || /zoho/i.test(m.session_frequency || '')) {
        cleanedMemberships++
      }
      return {
        ...m,
        session_frequency: (m.session_frequency || '').replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'),
        benefits: Array.isArray(m.benefits)
          ? m.benefits.map((b: string) => b.replace(/zoho meeting/gi, 'Google Meet').replace(/zoho/gi, 'Google Meet'))
          : [],
      }
    })
  }

  console.log(`Cleaned ${cleanedServices} services and ${cleanedMemberships} memberships containing Zoho.`)
  console.log('Saving updated state to Supabase...')
  const saved = await savePersistedState([
    'consultation_services',
    'memberships',
    'appointments',
    'homepage_settings',
    'normal_programs',
  ])
  console.log('Save result to Supabase:', saved ? 'SUCCESS' : 'FAILED')
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error running sanitization:', err)
    process.exit(1)
  })
