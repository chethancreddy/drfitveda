// ============================================================
// Dr Fit Veda — central legal/compliance constants
// DRAFT: values marked [CONFIRM] must be verified by the business
// and a qualified lawyer before publication.
// ============================================================

export const LEGAL = {
  /** Date the current drafts take effect. Update on every material change. */
  effectiveDate: '9 October 2026',
  version: '0.1-draft',
  entityName: 'Dr Fit Veda Holistic Health Services Ltd.', // [CONFIRM] legal name & registration no. (taken from /contact page)
  address: 'Health & Wellness Tower, Indiranagar, Bangalore, Karnataka 560038, India', // [CONFIRM]
  supportEmail: 'care@drfitveda.com',
  privacyEmail: 'care@drfitveda.com', // [CONFIRM] dedicated privacy@ mailbox recommended
  phone: '+91 1800-FIT-VEDA', // [CONFIRM] number shown on /contact
  grievanceOfficer: '[CONFIRM — name of Grievance Officer to be appointed]',
  governingLaw: 'India', // [CONFIRM] with counsel
  minimumAge: 18,
} as const

export const LEGAL_PAGES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/refund-policy', label: 'Refund & Cancellation' },
  { href: '/disclaimer', label: 'Medical Disclaimer' },
  { href: '/data-request', label: 'Data Requests' },
] as const

/** Types of data-subject requests accepted at /data-request. */
export const REQUEST_TYPES = [
  { value: 'access', label: 'Access a copy of my personal data' },
  { value: 'correction', label: 'Correct inaccurate personal data' },
  { value: 'export', label: 'Export my data (portable format)' },
  { value: 'deletion', label: 'Delete my personal data' },
  { value: 'withdraw_consent', label: 'Withdraw a consent I gave' },
  { value: 'complaint', label: 'Raise a privacy complaint / grievance' },
] as const

export type RequestType = (typeof REQUEST_TYPES)[number]['value']

/** Consent purposes recorded in the consent_records table. */
export const CONSENT_PURPOSES = [
  'health_data_processing', // explicit consent for health reports / consultation data
  'session_recording', // recording of live training / consultation sessions
  'contact_enquiry', // being contacted about an enquiry
  'marketing', // separate, optional (not yet used — no marketing is sent)
] as const

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]
