import { validateInternationalPhone, normalizeE164, findCountry } from '../src/lib/country-codes'
import { normalizeIdentifier } from '../src/lib/services/otp-security'
import { APPROVED_WHATSAPP_TEMPLATES, renderTemplatePreview } from '../src/lib/services/whatsapp-templates'
import { mockDb } from '../src/lib/mock-db'
import { syncCustomerStatusAndMemberships } from '../src/lib/services/admin-record-governance'

async function runTests() {
  console.log('====================================================')
  console.log('DrFitVeda Comprehensive Verification Suite')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✓ [PASS] ${desc}`)
      passed++
    } else {
      console.error(`✗ [FAIL] ${desc}`)
      failed++
    }
  }

  // ============================================================
  // TEST SUITE 1: International WhatsApp OTP & Phone Normalization
  // ============================================================
  console.log('\n--- 1. Testing International Phone Validation & E.164 Normalization ---')

  // India (+91)
  const indiaTest = validateInternationalPhone('9876543210', '+91')
  assert(indiaTest.isValid && indiaTest.e164Phone === '+919876543210' && indiaTest.msg91Mobile === '919876543210', 'India 10-digit number normalizes to +919876543210')

  // India with prefix
  const indiaPrefixed = validateInternationalPhone('+91 98765 43210')
  assert(indiaPrefixed.isValid && indiaPrefixed.msg91Mobile === '919876543210', 'India prefixed with spaces normalizes to 919876543210')

  // UAE (+971)
  const uaeTest = validateInternationalPhone('50 123 4567', '+971')
  assert(uaeTest.isValid && uaeTest.e164Phone === '+971501234567' && uaeTest.msg91Mobile === '971501234567', 'UAE 9-digit mobile normalizes to +971501234567')

  // UK (+44)
  const ukTest = validateInternationalPhone('7123456789', '+44')
  assert(ukTest.isValid && ukTest.e164Phone === '+447123456789' && ukTest.msg91Mobile === '447123456789', 'UK 10-digit mobile normalizes to +447123456789')

  // USA (+1)
  const usaTest = validateInternationalPhone('(415) 555-2671', '+1')
  assert(usaTest.isValid && usaTest.e164Phone === '+14155552671' && usaTest.msg91Mobile === '14155552671', 'USA formatted mobile normalizes to +14155552671')

  // Germany (+49)
  const germanyTest = validateInternationalPhone('1512 3456789', '+49')
  assert(germanyTest.isValid && germanyTest.e164Phone === '+4915123456789' && germanyTest.msg91Mobile === '4915123456789', 'Germany mobile normalizes to +4915123456789')

  // Singapore (+65)
  // Notice: Singapore numbers are 8 digits starting with 8 or 9.
  // Previously a bug treated 8/9 prefix as India! Now properly handled with +65.
  const singaporeTest = validateInternationalPhone('91234567', '+65')
  assert(singaporeTest.isValid && singaporeTest.e164Phone === '+6591234567' && singaporeTest.msg91Mobile === '6591234567', 'Singapore mobile starting with 9 normalizes to +6591234567 (not corrupted into +91)')

  // Australia (+61)
  const australiaTest = validateInternationalPhone('412 345 678', '+61')
  assert(australiaTest.isValid && australiaTest.e164Phone === '+61412345678' && australiaTest.msg91Mobile === '61412345678', 'Australia mobile normalizes to +61412345678')

  // Prevent duplicate country code
  const dupCheck = validateInternationalPhone('+1 415 555 2671', '+1')
  assert(dupCheck.isValid && dupCheck.e164Phone === '+14155552671', 'Duplicate country code correctly deduplicated')

  // Invalid number length rejection
  const invalidShort = validateInternationalPhone('1234', '+91')
  assert(!invalidShort.isValid, 'Short invalid phone rejected correctly')

  // OTP security normalizer
  const normResult = normalizeIdentifier('501234567', 'whatsapp', '+971')
  assert(normResult.isValid && normResult.type === 'phone' && normResult.normalized === '971501234567', 'normalizeIdentifier handles UAE phone with country_code parameter')

  // ============================================================
  // TEST SUITE 2: WhatsApp Templates & Dynamic Variable Mapping
  // ============================================================
  console.log('\n--- 2. Testing WhatsApp Templates & Dynamic Variable Mapping ---')

  const doctorAssignedTemplate = APPROVED_WHATSAPP_TEMPLATES.find(t => t.name === 'drfitveda_customer_doctor_assigned')
  assert(!!doctorAssignedTemplate, 'Template drfitveda_customer_doctor_assigned is registered')
  assert(doctorAssignedTemplate?.variables.length === 5, 'Template has exactly 5 dynamic variables')

  const rendered = renderTemplatePreview(doctorAssignedTemplate!.bodyTemplate, [
    'Rajesh Kumar',
    'Dr. Varshini Naturopathy',
    '15 Nov 2026',
    '11:00 AM - 11:45 AM IST',
    'Online Video Consultation',
  ])

  assert(rendered.includes('Hello Rajesh Kumar,'), 'Customer name {{1}} dynamically bound')
  assert(rendered.includes('Doctor Name: Dr. Varshini Naturopathy'), 'Doctor name {{2}} dynamically bound')
  assert(rendered.includes('Appointment Date: 15 Nov 2026'), 'Date {{3}} dynamically bound')
  assert(rendered.includes('Appointment Time: 11:00 AM - 11:45 AM IST'), 'Time {{4}} dynamically bound')
  assert(rendered.includes('Consultation Type: Online Video Consultation'), 'Consultation type {{5}} dynamically bound')

  // ============================================================
  // TEST SUITE 3: Customer Deactivation & Membership Sync
  // ============================================================
  console.log('\n--- 3. Testing Customer Status & Membership Synchronization ---')

  const testCustomer: any = {
    id: 'c-test-01',
    is_active: true,
    membership_status: 'active',
    membership_plan_id: 'mbr-001',
    memberships_history: [
      { id: 'mh-1', status: 'active' },
      { id: 'mh-old', status: 'expired' },
      { id: 'mh-cancelled', status: 'cancelled' },
    ],
  }

  // Deactivate
  syncCustomerStatusAndMemberships(testCustomer, false)
  assert(testCustomer.is_active === false, 'Customer set to inactive')
  assert(testCustomer.membership_status === 'inactive', 'Active membership suspended to inactive')
  assert(testCustomer.membership_deactivated_by_status_sync === true, 'Flag recorded for eligible reactivation')
  assert(testCustomer.memberships_history[0].status === 'inactive', 'History active membership suspended')
  assert(testCustomer.memberships_history[1].status === 'expired', 'Historical expired membership remains expired (untouched)')
  assert(testCustomer.memberships_history[2].status === 'cancelled', 'Historical cancelled membership remains cancelled (untouched)')

  // Reactivate
  syncCustomerStatusAndMemberships(testCustomer, true)
  assert(testCustomer.is_active === true, 'Customer reactivated')
  assert(testCustomer.membership_status === 'active', 'Eligible membership automatically restored')
  assert(testCustomer.memberships_history[1].status === 'expired', 'Expired membership still expired after customer reactivation')

  console.log('\n====================================================')
  console.log(`Verification Summary: Passed: ${passed}, Failed: ${failed}`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})

