// ============================================================
// Dr Fit Veda — Comprehensive International Country Calling Codes
// Standard ITU-T E.164 dataset covering all international destinations
// Flags, ISO codes, calling codes, name search, and validation rules
// ============================================================

export interface CountryCodeItem {
  code: string // e.g. 'IN', 'US', 'AE'
  name: string // e.g. 'India', 'United States'
  dialCode: string // e.g. '+91', '+1', '+971'
  flag: string // e.g. '🇮🇳'
  format: string // placeholder e.g. '98765 43210'
  minLen: number // national significant number min length
  maxLen: number // national significant number max length
  leadingDigitsRegex?: RegExp
}

export const ALL_COUNTRY_CODES: CountryCodeItem[] = [
  // ─── Priority Top Destinations ───
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '98765 43210', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[6-9]/ },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', format: '50 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^5/ },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(415) 555-2671', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[2-9]/ },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '7123 456789', minLen: 10, maxLen: 10, leadingDigitsRegex: /^7/ },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(416) 555-0199', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[2-9]/ },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: '9123 4567', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[89]/ },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '412 345 678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^4/ },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '151 23456789', minLen: 10, maxLen: 11, leadingDigitsRegex: /^1/ },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: '50 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^5/ },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', format: '3312 3456', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[3567]/ },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', format: '9123 4567', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[569]/ },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', format: '9123 4567', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[79]/ },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', format: '3912 3456', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[36]/ },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', format: '12 345 6789', minLen: 9, maxLen: 10, leadingDigitsRegex: /^1/ },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '6 12 34 56 78', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[67]/ },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '21 123 4567', minLen: 8, maxLen: 10, leadingDigitsRegex: /^2/ },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '90 1234 5678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[789]0/ },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: '71 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[678]/ },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', format: '1712 345678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^1/ },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', format: '981 2345678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^9/ },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', format: '77 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^7/ },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', format: '917 123 4567', minLen: 10, maxLen: 10, leadingDigitsRegex: /^9/ },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', format: '812 3456 7890', minLen: 9, maxLen: 12, leadingDigitsRegex: /^8/ },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: '81 234 5678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[689]/ },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', format: '91 234 5678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[35789]/ },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: '9123 4567', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[569]/ },

  // ─── Europe ───
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '312 345 6789', minLen: 9, maxLen: 10, leadingDigitsRegex: /^3/ },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '612 34 56 78', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[67]/ },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '6 12345678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^6/ },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', format: '470 12 34 56', minLen: 9, maxLen: 9, leadingDigitsRegex: /^4/ },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: '78 123 45 67', minLen: 9, maxLen: 9, leadingDigitsRegex: /^7/ },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: '70 123 45 67', minLen: 9, maxLen: 9, leadingDigitsRegex: /^7/ },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', format: '412 34 567', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[49]/ },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', format: '20 12 34 56', minLen: 8, maxLen: 8, leadingDigitsRegex: /^[2-9]/ },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', format: '40 123 4567', minLen: 7, maxLen: 10, leadingDigitsRegex: /^[45]/ },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', format: '85 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^8/ },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '512 345 678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[4-8]/ },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '912 345 678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^9/ },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', format: '664 1234567', minLen: 10, maxLen: 11, leadingDigitsRegex: /^6/ },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', format: '691 234 5678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^69/ },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', format: '601 123 456', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[67]/ },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', format: '20 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[237]0/ },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴', format: '712 345 678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^7/ },

  // ─── Americas ───
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '11 91234-5678', minLen: 10, maxLen: 11, leadingDigitsRegex: /^[1-9]{2}9/ },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '55 1234 5678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[1-9]/ },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', format: '9 11 1234-5678', minLen: 10, maxLen: 11, leadingDigitsRegex: /^9/ },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', format: '9 1234 5678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^9/ },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', format: '300 123 4567', minLen: 10, maxLen: 10, leadingDigitsRegex: /^3/ },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', format: '912 345 678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^9/ },

  // ─── Africa & Middle East ───
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', format: '10 1234 5678', minLen: 10, maxLen: 10, leadingDigitsRegex: /^1/ },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: '802 123 4567', minLen: 10, maxLen: 10, leadingDigitsRegex: /^[789]/ },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', format: '712 345678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[17]/ },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', format: '24 123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[25]/ },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', format: '612-345678', minLen: 9, maxLen: 9, leadingDigitsRegex: /^[67]/ },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '512 345 67 89', minLen: 10, maxLen: 10, leadingDigitsRegex: /^5/ },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', format: '50-123-4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^5/ },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', format: '7 9123 4567', minLen: 9, maxLen: 9, leadingDigitsRegex: /^7/ },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', format: '70 123 456', minLen: 7, maxLen: 8, leadingDigitsRegex: /^[378]/ },
]

/**
 * Finds country configuration matching a dial code or country ISO code.
 */
export function findCountry(codeOrDial: string): CountryCodeItem | undefined {
  if (!codeOrDial) return undefined
  const clean = codeOrDial.trim().toUpperCase()
  const withPlus = clean.startsWith('+') ? clean : `+${clean}`

  // Check by exact dial code
  const byDial = ALL_COUNTRY_CODES.find(c => c.dialCode === withPlus || c.dialCode === clean)
  if (byDial) return byDial

  // Check by ISO code
  const byIso = ALL_COUNTRY_CODES.find(c => c.code === clean)
  if (byIso) return byIso

  return undefined
}

export interface InternationalValidationResult {
  isValid: boolean
  error?: string
  cleanDialCode: string
  nationalNumber: string
  e164Phone: string // e.g. +447123456789
  msg91Mobile: string // e.g. 447123456789 (digits only for MSG91 API)
  displayPhone: string // e.g. +44 7123456789
  country?: CountryCodeItem
}

/**
 * Validates and normalizes any international phone number against its calling code.
 * Supports:
 * - 2 arguments: (dialCodeInput, numberInput) e.g. ('+91', '9876543210')
 * - 1 argument: (fullPhoneInput) e.g. ('+44 7123456789' or '+971501234567')
 * Strips duplicate country code if accidentally entered in the national number field.
 */
export function validateInternationalPhone(
  dialCodeOrFullPhone: string,
  numberInput?: string
): InternationalValidationResult {
  let cleanDial = ''
  let rawNumber = ''

  if (numberInput !== undefined) {
    const argA = (dialCodeOrFullPhone || '').trim()
    const argB = (numberInput || '').trim()
    if (argA.startsWith('+') && argB.startsWith('+')) {
      if (argA.length > argB.length) {
        cleanDial = argB
        rawNumber = argA.replace(/[\s\-\(\)\.]/g, '')
      } else {
        cleanDial = argA
        rawNumber = argB.replace(/[\s\-\(\)\.]/g, '')
      }
    } else if (argB.startsWith('+') && !argA.startsWith('+')) {
      cleanDial = argB
      rawNumber = argA.replace(/[\s\-\(\)\.]/g, '')
    } else {
      cleanDial = argA
      rawNumber = argB.replace(/[\s\-\(\)\.]/g, '')
    }
  } else {
    // Single argument passed: parse dial code and national number
    const trimmed = (dialCodeOrFullPhone || '').trim()
    const sorted = [...ALL_COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length)
    const matched = sorted.find(c => trimmed.startsWith(c.dialCode))
    if (matched) {
      cleanDial = matched.dialCode
      rawNumber = trimmed.slice(matched.dialCode.length).replace(/[\s\-\(\)\.]/g, '')
    } else if (trimmed.startsWith('+')) {
      const match = trimmed.match(/^(\+\d{1,4})(.*)$/)
      if (match) {
        cleanDial = match[1]
        rawNumber = match[2].replace(/[\s\-\(\)\.]/g, '')
      } else {
        cleanDial = '+91'
        rawNumber = trimmed.replace(/\D/g, '')
      }
    } else {
      const digits = trimmed.replace(/\D/g, '')
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        cleanDial = '+91'
        rawNumber = digits
      } else if (digits.length === 12 && digits.startsWith('91')) {
        cleanDial = '+91'
        rawNumber = digits.slice(2)
      } else {
        cleanDial = '+91'
        rawNumber = digits
      }
    }
  }

  if (!cleanDial.startsWith('+')) cleanDial = `+${cleanDial.replace(/\D/g, '')}`
  const dialDigits = cleanDial.replace(/\D/g, '')

  if (!dialDigits) {
    return {
      isValid: false,
      error: 'Please select a valid country calling code.',
      cleanDialCode: '',
      nationalNumber: '',
      e164Phone: '',
      msg91Mobile: '',
      displayPhone: '',
    }
  }

  if (!rawNumber) {
    return {
      isValid: false,
      error: 'Please enter your mobile phone number.',
      cleanDialCode: cleanDial,
      nationalNumber: '',
      e164Phone: '',
      msg91Mobile: '',
      displayPhone: '',
    }
  }

  // Prevent duplicate country code if user pasted full number into the number field
  if (rawNumber.startsWith('+')) {
    rawNumber = rawNumber.slice(1)
  }
  if (rawNumber.startsWith(dialDigits) && rawNumber.length > dialDigits.length + 5) {
    rawNumber = rawNumber.slice(dialDigits.length)
  }

  // Strip leading national trunk zero (e.g. 050 -> 50 in UAE, 07 -> 7 in UK, 09 -> 9 in India)
  if (rawNumber.startsWith('0') && rawNumber.length > 8) {
    rawNumber = rawNumber.slice(1)
  }

  const country = findCountry(cleanDial)

  // Country-specific rules
  if (country) {
    if (rawNumber.length < country.minLen || rawNumber.length > country.maxLen) {
      const lenDesc =
        country.minLen === country.maxLen
          ? `${country.minLen} digits`
          : `between ${country.minLen} and ${country.maxLen} digits`
      return {
        isValid: false,
        error: `Please enter a valid mobile number for ${country.name} (${lenDesc}).`,
        cleanDialCode: cleanDial,
        nationalNumber: rawNumber,
        e164Phone: '',
        msg91Mobile: '',
        displayPhone: `${cleanDial} ${rawNumber}`,
        country,
      }
    }

    if (country.leadingDigitsRegex && !country.leadingDigitsRegex.test(rawNumber)) {
      return {
        isValid: false,
        error: `Please enter a valid mobile number format for ${country.name}.`,
        cleanDialCode: cleanDial,
        nationalNumber: rawNumber,
        e164Phone: '',
        msg91Mobile: '',
        displayPhone: `${cleanDial} ${rawNumber}`,
        country,
      }
    }
  } else {
    // General ITU E.164 rules for unlisted countries
    if (rawNumber.length < 6 || rawNumber.length > 14) {
      return {
        isValid: false,
        error: `Please enter a valid mobile number (6 to 14 digits) for country code ${cleanDial}.`,
        cleanDialCode: cleanDial,
        nationalNumber: rawNumber,
        e164Phone: '',
        msg91Mobile: '',
        displayPhone: `${cleanDial} ${rawNumber}`,
      }
    }
  }

  const fullDigits = `${dialDigits}${rawNumber}`

  // ITU-T E.164 total number length check (maximum 15 digits)
  if (fullDigits.length < 8 || fullDigits.length > 15) {
    return {
      isValid: false,
      error: 'Phone number exceeds standard international length (max 15 digits).',
      cleanDialCode: cleanDial,
      nationalNumber: rawNumber,
      e164Phone: '',
      msg91Mobile: '',
      displayPhone: `${cleanDial} ${rawNumber}`,
    }
  }

  return {
    isValid: true,
    cleanDialCode: cleanDial,
    nationalNumber: rawNumber,
    e164Phone: `+${fullDigits}`,
    msg91Mobile: fullDigits,
    displayPhone: `${cleanDial} ${rawNumber}`,
    country,
  }
}
