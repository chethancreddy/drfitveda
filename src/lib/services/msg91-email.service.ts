// ============================================================
// Dr Fit Veda — Official MSG91 Email OTP Delivery Service
// Sends secure 6-digit verification codes to user email inboxes
// Powered by MSG91 Email API (Zero Telecom DLT Required)
// Endpoint: POST https://control.msg91.com/api/v5/email/send
// ============================================================

export interface Msg91EmailSendResult {
  success: boolean
  message: string
  devMode?: boolean
}

export interface Msg91EmailVerifyResult {
  success: boolean
  message: string
}

class Msg91EmailService {
  private get authKey(): string | null {
    return process.env.MSG91_AUTH_KEY || null
  }

  private get templateId(): string | null {
    return process.env.MSG91_EMAIL_TEMPLATE_ID || null
  }

  private get fromEmail(): string {
    return process.env.MSG91_FROM_EMAIL || 'care@drfitveda.com'
  }

  private get fromName(): string {
    return process.env.MSG91_FROM_NAME || 'Dr Fit Veda'
  }

  private get domain(): string {
    return process.env.MSG91_DOMAIN || 'drfitveda.com'
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
   */
  public async sendOtp(email: string): Promise<Msg91EmailSendResult> {
    const cleanEmail = email.toLowerCase().trim()

    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

    this.store.set(cleanEmail, {
      otp: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    })

    if (!this.isConfigured()) {
      // Safe development test mode when MSG91 credentials are not yet entered
      return {
        success: true,
        message: `Verification code sent to ${cleanEmail} (Development Mode: use test code 123456 or generated code)`,
        devMode: true,
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
   */
  public async verifyOtp(email: string, otp: string): Promise<Msg91EmailVerifyResult> {
    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = otp.trim()
    const record = this.store.get(cleanEmail)

    if (!record) {
      return {
        success: false,
        message: 'No verification code requested or code expired. Please request a new code.',
      }
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(cleanEmail)
      return {
        success: false,
        message: 'Verification code has expired. Please request a new code.',
      }
    }

    // In dev mode without API key, allow test code 123456 or the generated code
    if (!this.isConfigured() && cleanOtp === '123456') {
      this.store.delete(cleanEmail)
      return { success: true, message: 'Email OTP verified successfully' }
    }

    if (record.otp !== cleanOtp) {
      return {
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      }
    }

    // Success: single-use OTP consumed
    this.store.delete(cleanEmail)
    return {
      success: true,
      message: 'Email OTP verified successfully',
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
