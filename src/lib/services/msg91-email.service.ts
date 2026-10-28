// ============================================================
// Dr Fit Veda — Official MSG91 Email OTP Delivery Service
// Sends secure 6-digit verification codes to user email inboxes
// Powered by MSG91 Email API (Zero Telecom DLT Required)
// Endpoint: POST https://control.msg91.com/api/v5/email/send
// ============================================================

import crypto from 'crypto'
import { createOtpSessionToken, verifyOtpSessionToken } from './otp-security'

export interface Msg91EmailSendResult {
  success: boolean
  message: string
  devMode?: boolean
  otpToken?: string
}

export interface Msg91EmailVerifyResult {
  success: boolean
  message: string
}

class Msg91EmailService {
  private getEnv(key: string): string | null {
    if (process.env[key]) return process.env[key]!
    try {
      const fs = require('fs')
      const path = require('path')
      const envPath = path.resolve(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8')
        const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*([^#\\r\\n]+)`, 'm'))
        if (match && match[1]) {
          const val = match[1].trim()
          process.env[key] = val
          return val
        }
      }
    } catch {}
    return null
  }

  private get authKey(): string | null {
    return this.getEnv('MSG91_AUTH_KEY')
  }

  private get templateId(): string | null {
    return this.getEnv('MSG91_EMAIL_TEMPLATE_ID') || 'global_otp_1622'
  }

  private get fromEmail(): string {
    return this.getEnv('MSG91_FROM_EMAIL') || 'support@drfitveda.com'
  }

  private get fromName(): string {
    return this.getEnv('MSG91_FROM_NAME') || 'Dr Fit Veda'
  }

  private get domain(): string {
    return this.getEnv('MSG91_DOMAIN') || 'drfitveda.com'
  }

  public isConfigured(): boolean {
    const key = this.authKey
    const tpl = this.templateId
    return Boolean(
      key &&
      !key.includes('placeholder') &&
      !key.includes('your_') &&
      key !== 'test' &&
      tpl &&
      !tpl.includes('placeholder')
    )
  }

  // In-memory store: email -> { otp, expiresAt }
  private store = new Map<string, { otp: string; expiresAt: number }>()

  /**
   * Generates a 6-digit OTP and dispatches it via MSG91 Email API.
   * Generates a signed stateless OTP token to guarantee serverless reliability.
   */
  public async sendOtp(email: string): Promise<Msg91EmailSendResult> {
    const cleanEmail = email.toLowerCase().trim()

    // Generate cryptographically secure 6-digit OTP
    let generatedOtp: string
    try {
      generatedOtp = crypto.randomInt(100000, 1000000).toString()
    } catch {
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
    }

    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity
    const otpToken = createOtpSessionToken(cleanEmail, generatedOtp)

    this.store.set(cleanEmail, {
      otp: generatedOtp,
      expiresAt,
    })

    if (!this.isConfigured()) {
      // Safe development test mode when MSG91 credentials are not yet entered
      return {
        success: true,
        message: `Verification code sent to ${cleanEmail} (Development Mode: use test code 123456 or generated code)`,
        devMode: true,
        otpToken,
      }
    }

    try {
      const payload = {
        recipients: [
          {
            to: [
              {
                name: 'Member',
                email: cleanEmail,
              },
            ],
            variables: {
              OTP: generatedOtp,
              otp: generatedOtp,
              Otp: generatedOtp,
              code: generatedOtp,
              CODE: generatedOtp,
              otp_code: generatedOtp,
              OTP_CODE: generatedOtp,
              var1: generatedOtp,
              VAR1: generatedOtp,
              var: generatedOtp,
              VAR: generatedOtp,
              token: generatedOtp,
              TOKEN: generatedOtp,
              company_name: this.fromName,
              COMPANY_NAME: this.fromName,
            },
          },
        ],
        from: {
          name: this.fromName,
          email: this.fromEmail,
        },
        domain: this.domain,
        template_id: this.templateId,
      }

      const res = await fetch('https://control.msg91.com/api/v5/email/send', {
        method: 'POST',
        headers: {
          'authkey': this.authKey!,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && (data.status === 'success' || data.hasError === false || data.message?.includes('success') || data.type === 'success')) {
        return {
          success: true,
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
          otpToken,
        }
      }

      // Check MSG91 error response
      const errMsg = data.message || data.errors?.[0] || 'Failed to dispatch email via MSG91.'
      return {
        success: false,
        message: errMsg,
      }
    } catch {
      return {
        success: false,
        message: 'MSG91 email service is temporarily unreachable. Please try again.',
      }
    }
  }

  /**
   * Verifies the 6-digit code for the specified email.
   * Supports both stateless token verification (serverless-proof) and in-memory store.
   */
  public async verifyOtp(email: string, otp: string, otpToken?: string): Promise<Msg91EmailVerifyResult> {
    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = String(otp || '').trim()

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit verification code.',
      }
    }

    // 1. Primary verification: Stateless signed token (immune to serverless container restarts)
    if (otpToken) {
      const tokenVerification = verifyOtpSessionToken(cleanEmail, cleanOtp, otpToken)
      if (tokenVerification.valid) {
        this.store.delete(cleanEmail)
        return {
          success: true,
          message: 'Email OTP verified successfully',
        }
      }
      if (tokenVerification.reason === 'expired') {
        this.store.delete(cleanEmail)
        return {
          success: false,
          message: 'Verification code has expired. Please request a new code.',
        }
      }
      if (tokenVerification.reason === 'already_used') {
        return {
          success: false,
          message: 'This verification code has already been used. Please request a new code.',
        }
      }
    }

    // 2. Secondary verification: In-memory store (for warm containers and local test runner)
    const record = this.store.get(cleanEmail)
    if (record) {
      if (Date.now() > record.expiresAt) {
        this.store.delete(cleanEmail)
        return {
          success: false,
          message: 'Verification code has expired. Please request a new code.',
        }
      }

      if (record.otp === cleanOtp) {
        this.store.delete(cleanEmail)
        return {
          success: true,
          message: 'Email OTP verified successfully',
        }
      }

      return {
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      }
    }

    // 3. Fallback for development mode test code 123456
    if (!this.isConfigured() && cleanOtp === '123456') {
      this.store.delete(cleanEmail)
      return { success: true, message: 'Email OTP verified successfully' }
    }

    return {
      success: false,
      message: 'No verification code requested or code expired. Please request a new code.',
    }
  }

  /**
   * Helper for test runner: retrieve the in-memory OTP
   */
  public _getStoredOtpForTesting(email: string): string | null {
    const record = this.store.get(email.toLowerCase().trim())
    return record ? record.otp : null
  }
}

export const msg91EmailService = new Msg91EmailService()
