// ============================================================
// DrFitVeda - Sign Up / Registration & Data Integrity Test Suite
// Verifies:
//   1. Successful registration with all 6 mandatory fields
//   2. Validation blocks missing First Name, Last Name, DOB, Gender, Email, Phone
//   3. Rejection of future Date of Birth
//   4. Acceptance of valid past Date of Birth
//   5. Strict Gender validation (Male, Female, Others)
//   6. Rejection of invalid Email format
//   7. Rejection of invalid Phone Number format
//   8. Duplicate Email detection & rejection (409 Conflict)
//   9. Duplicate Phone Number detection & rejection (409 Conflict)
//   10. Database persistence in user_profiles, customers, customer_profiles
//   11. Backward compatibility for existing users (Login intact)
// ============================================================

import { POST as registerHandler, ALLOWED_GENDERS } from '../src/app/api/auth/register/route'
import { resolveAccountByIdentifier } from '../src/lib/auth-resolver'
import { mockDb, MOCK_USERS } from '../src/lib/mock-db'
import { loadPersistedState, savePersistedState } from '../src/lib/persistent-store'
import { NextRequest } from 'next/server'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passedTests++
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`)
    failedTests++
  }
}

function createRegisterRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function runTestSuite() {
  console.log('\n======================================================')
  console.log('🧪 RUNNING DRFITVEDA REGISTRATION & AUTH TEST SUITE')
  console.log('======================================================\n')

  await loadPersistedState()

  // Baseline state backup
  const initialUserProfilesCount = (mockDb.state.user_profiles || []).length
  const initialCustomersCount = (mockDb.state.customers || []).length

  // --------------------------------------------------------------------------
  // TEST GROUP 1: MANDATORY FIELD PRESENCE & BLOCKING
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Mandatory Fields Enforcement ---')

  // 1. Missing First Name
  {
    const req = createRegisterRequest({
      first_name: '',
      last_name: 'Verma',
      date_of_birth: '1995-05-20',
      gender: 'Female',
      email: 'test_missing_fn@example.com',
      phone: '+919876500001',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when First Name is empty (status 400)')
    assert(Boolean(json.fieldErrors?.first_name), 'Field error returned specifically for first_name')
  }

  // 2. Missing Last Name
  {
    const req = createRegisterRequest({
      first_name: 'Rahul',
      last_name: '',
      date_of_birth: '1992-10-14',
      gender: 'Male',
      email: 'test_missing_ln@example.com',
      phone: '+919876500002',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when Last Name is empty (status 400)')
    assert(Boolean(json.fieldErrors?.last_name), 'Field error returned specifically for last_name')
  }

  // 3. Missing Date of Birth
  {
    const req = createRegisterRequest({
      first_name: 'Rahul',
      last_name: 'Verma',
      date_of_birth: '',
      gender: 'Male',
      email: 'test_missing_dob@example.com',
      phone: '+919876500003',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when Date of Birth is empty (status 400)')
    assert(Boolean(json.fieldErrors?.date_of_birth), 'Field error returned specifically for date_of_birth')
  }

  // 4. Missing Gender
  {
    const req = createRegisterRequest({
      first_name: 'Rahul',
      last_name: 'Verma',
      date_of_birth: '1992-10-14',
      gender: '',
      email: 'test_missing_gender@example.com',
      phone: '+919876500004',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when Gender is empty (status 400)')
    assert(Boolean(json.fieldErrors?.gender), 'Field error returned specifically for gender')
  }

  // 5. Missing Email ID
  {
    const req = createRegisterRequest({
      first_name: 'Rahul',
      last_name: 'Verma',
      date_of_birth: '1992-10-14',
      gender: 'Male',
      email: '',
      phone: '+919876500005',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when Email ID is empty (status 400)')
    assert(Boolean(json.fieldErrors?.email), 'Field error returned specifically for email')
  }

  // 6. Missing Phone Number
  {
    const req = createRegisterRequest({
      first_name: 'Rahul',
      last_name: 'Verma',
      date_of_birth: '1992-10-14',
      gender: 'Male',
      email: 'test_missing_phone@example.com',
      phone: '',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Registration blocked when Phone Number is empty (status 400)')
    assert(Boolean(json.fieldErrors?.phone), 'Field error returned specifically for phone')
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 2: DATE OF BIRTH STRICT PAST DATE VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Date of Birth Validation ---')

  // Future DOB (Tomorrow)
  {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDateStr = tomorrow.toISOString().split('T')[0]

    const req = createRegisterRequest({
      first_name: 'Aarav',
      last_name: 'Mehta',
      date_of_birth: futureDateStr,
      gender: 'Male',
      email: 'test_future_dob@example.com',
      phone: '+919876500006',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Future Date of Birth is strictly rejected (status 400)')
    assert(
      json.fieldErrors?.date_of_birth?.includes('past date'),
      'Clear error message explaining future dates are not allowed'
    )
  }

  // Future DOB (Next Year)
  {
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 2)
    const nextYearStr = nextYear.toISOString().split('T')[0]

    const req = createRegisterRequest({
      first_name: 'Aarav',
      last_name: 'Mehta',
      date_of_birth: nextYearStr,
      gender: 'Male',
      email: 'test_next_year_dob@example.com',
      phone: '+919876500007',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Next year Date of Birth is strictly rejected (status 400)')
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: GENDER OPTIONS VALIDATION (Male, Female, Others)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Gender Options Validation ---')

  assert(
    ALLOWED_GENDERS.length === 3 &&
      ALLOWED_GENDERS.includes('Male') &&
      ALLOWED_GENDERS.includes('Female') &&
      ALLOWED_GENDERS.includes('Others'),
    'ALLOWED_GENDERS contains exactly Male, Female, Others'
  )

  // Invalid Gender value rejected
  {
    const req = createRegisterRequest({
      first_name: 'Sam',
      last_name: 'Ray',
      date_of_birth: '1998-04-12',
      gender: 'UnknownGender',
      email: 'test_invalid_gender@example.com',
      phone: '+919876500008',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Invalid gender option is rejected (status 400)')
    assert(
      json.fieldErrors?.gender?.includes('Male, Female, Others'),
      'Gender error specifies exact allowed options'
    )
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 4: EMAIL & PHONE FORMAT VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Email & Phone Format Validation ---')

  // Malformed Email
  {
    const req = createRegisterRequest({
      first_name: 'Sam',
      last_name: 'Ray',
      date_of_birth: '1998-04-12',
      gender: 'Male',
      email: 'invalid-email-without-domain',
      phone: '+919876500009',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Malformed email without @ or domain is rejected')
    assert(Boolean(json.fieldErrors?.email), 'Email field error displayed')
  }

  // Invalid Indian Phone (less than 10 digits)
  {
    const req = createRegisterRequest({
      first_name: 'Sam',
      last_name: 'Ray',
      date_of_birth: '1998-04-12',
      gender: 'Male',
      email: 'test_short_phone@example.com',
      phone: '+9198765',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 400, 'Short phone number is rejected')
    assert(Boolean(json.fieldErrors?.phone), 'Phone field error displayed')
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 5: SUCCESSFUL REGISTRATION & DATA PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Successful Registration & Persistence ---')

  const validRegistrationPayload = {
    first_name: 'Sneha',
    last_name: 'Kulkarni',
    date_of_birth: '1996-03-22',
    gender: 'Female',
    email: 'sneha.kulkarni.qa@drfitveda.com',
    phone: '+919876543999',
  }

  let createdUserId = ''
  let createdCustomerId = ''

  {
    const req = createRegisterRequest(validRegistrationPayload)
    const res = await registerHandler(req)
    const json = await res.json()

    assert(res.status === 200, 'Registration succeeded with HTTP 200')
    assert(json.success === true, 'Response contains success=true')
    assert(json.user?.first_name === 'Sneha', 'User first_name stored correctly')
    assert(json.user?.last_name === 'Kulkarni', 'User last_name stored correctly')
    assert(json.user?.full_name === 'Sneha Kulkarni', 'User full_name constructed correctly')
    assert(json.user?.date_of_birth === '1996-03-22', 'User date_of_birth stored correctly')
    assert(json.user?.gender === 'Female', 'User gender stored correctly')
    assert(json.user?.email === 'sneha.kulkarni.qa@drfitveda.com', 'User email stored correctly')
    assert(json.user?.phone === '+919876543999', 'User phone stored correctly')
    assert(json.redirectTo === '/customer', 'Redirect target points to /customer dashboard')

    createdUserId = json.user?.id
    createdCustomerId = json.user?.customer_id

    // Check cookie issued
    const cookieHeader = res.headers.get('set-cookie') || ''
    assert(cookieHeader.includes('drf_session='), 'drf_session cookie issued on successful registration')
  }

  // Verify persistence in mockDb.state collections
  {
    const storedUser = mockDb.state.user_profiles?.find((u: any) => u.id === createdUserId)
    assert(Boolean(storedUser), 'New user profile persisted in user_profiles collection')
    assert(storedUser?.first_name === 'Sneha', 'Stored user profile has first_name')
    assert(storedUser?.last_name === 'Kulkarni', 'Stored user profile has last_name')
    assert(storedUser?.date_of_birth === '1996-03-22', 'Stored user profile has date_of_birth')
    assert(storedUser?.gender === 'Female', 'Stored user profile has gender')

    const storedCust = mockDb.state.customers?.find((c: any) => c.user_id === createdUserId)
    assert(Boolean(storedCust), 'New customer record persisted in customers collection')
    assert(Boolean(storedCust?.zoho_meeting_url), 'Unique Zoho meeting room provisioned for new customer')

    const storedProfile = mockDb.state.customer_profiles?.find((cp: any) => cp.customer_id === storedCust?.id)
    assert(Boolean(storedProfile), 'Customer detailed profile persisted in customer_profiles')
    assert(storedProfile?.gender === 'Female', 'Customer profile has gender')
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 6: DUPLICATE EMAIL & PHONE PREVENTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Duplicate Registration Prevention ---')

  // Duplicate Email Attempt
  {
    const req = createRegisterRequest({
      first_name: 'Duplicate',
      last_name: 'Test',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      email: validRegistrationPayload.email, // already registered
      phone: '+919876500111',
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 409, 'Duplicate Email registration rejected with HTTP 409 Conflict')
    assert(json.code === 'DUPLICATE_EMAIL', 'Response error code is DUPLICATE_EMAIL')
    assert(json.error?.includes('already exists'), 'Clear user-friendly error message for duplicate email')
  }

  // Duplicate Phone Attempt
  {
    const req = createRegisterRequest({
      first_name: 'Duplicate',
      last_name: 'PhoneTest',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      email: 'unique_new_email@example.com',
      phone: validRegistrationPayload.phone, // already registered
    })
    const res = await registerHandler(req)
    const json = await res.json()
    assert(res.status === 409, 'Duplicate Phone Number registration rejected with HTTP 409 Conflict')
    assert(json.code === 'DUPLICATE_PHONE', 'Response error code is DUPLICATE_PHONE')
    assert(json.error?.includes('already exists'), 'Clear user-friendly error message for duplicate phone')
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 7: EXISTING USER AUTHENTICATION INTEGRITY (ZERO REGRESSION)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: Existing User Login Compatibility ---')

  // Existing Customer
  {
    const existingCust = resolveAccountByIdentifier(MOCK_USERS.customer.email)
    assert(Boolean(existingCust), 'Existing customer account resolves cleanly')
    assert(existingCust?.role === 'customer', 'Existing customer role remains "customer"')
  }

  // Existing Doctor
  {
    const existingDoc = resolveAccountByIdentifier(MOCK_USERS.doctor.email)
    assert(Boolean(existingDoc), 'Existing doctor account resolves cleanly')
    assert(existingDoc?.role === 'doctor', 'Existing doctor role remains "doctor"')
  }

  // Existing Trainer
  {
    const existingTrn = resolveAccountByIdentifier(MOCK_USERS.trainer.email)
    assert(Boolean(existingTrn), 'Existing trainer account resolves cleanly')
    assert(existingTrn?.role === 'trainer', 'Existing trainer role remains "trainer"')
  }

  // Existing Admin
  {
    const existingAdmin = resolveAccountByIdentifier(MOCK_USERS.admin.email)
    assert(Boolean(existingAdmin), 'Existing admin account resolves cleanly')
    assert(existingAdmin?.role === 'admin', 'Existing admin role remains "admin"')
  }

  // Newly Registered User Can Also Resolve & Sign In
  {
    const newResolved = resolveAccountByIdentifier(validRegistrationPayload.email)
    assert(Boolean(newResolved), 'Newly registered user immediately resolves via resolveAccountByIdentifier')
    assert(newResolved?.role === 'customer', 'Newly registered user resolves as role "customer"')
    assert(newResolved?.full_name === 'Sneha Kulkarni', 'Full name accurately returned on auth resolve')
  }

  // --------------------------------------------------------------------------
  // CLEANUP TEST RECORD
  // --------------------------------------------------------------------------
  if (createdUserId) {
    mockDb.state.user_profiles = (mockDb.state.user_profiles || []).filter(
      (u: any) => u.id !== createdUserId
    )
    mockDb.state.customers = (mockDb.state.customers || []).filter(
      (c: any) => c.user_id !== createdUserId
    )
    mockDb.state.customer_profiles = (mockDb.state.customer_profiles || []).filter(
      (cp: any) => cp.customer_id !== createdCustomerId
    )
    await savePersistedState(['user_profiles', 'customers', 'customer_profiles'])
    console.log('\n--- Cleanup ---')
    console.log('✅ Temporary test registration records cleaned up.')
  }

  console.log('\n======================================================')
  console.log(`TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`)
  console.log('======================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

