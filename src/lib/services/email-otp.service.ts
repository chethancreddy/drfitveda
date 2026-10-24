// ============================================================
// Dr Fit Veda — Official Email OTP Delivery Service
// Sends secure 6-digit verification codes to user email inboxes
// Powered by Resend REST API (Zero Telecom DLT Required)
// ============================================================

export interface EmailOtpSendResult {
  success: boolean
  message: string
  devMode?: boolean
}

export interface EmailOtpVerifyResult {
  success: boolean
  message: string
}

class EmailOtpService {
  private get apiKey(): string | null {
    return process.env.RESEND_API_KEY || null
  }

  private get fromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || 'care@drfitveda.com'
  }

  public isConfigured(): boolean {
    const key = this.apiKey
    return Boolean(key && !key.includes('placeholder') && !key.includes('your_') && key !== 'test')
  }

  // In-memory store: email -> { otp, expiresAt }
  private store = new Map<string, { otp: string; expiresAt: number }>()

  /**
   * Generates a 6-digit OTP and dispatches it to the recipient's email inbox.
   */
  public async sendOtp(email: string): Promise<EmailOtpSendResult> {
    const cleanEmail = email.toLowerCase().trim()
    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

    this.store.set(cleanEmail, {
      otp: generatedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    })

    if (!this.isConfigured()) {
      // Development fallback when RESEND_API_KEY is not yet added
      return {
        success: true,
        message: `Verification code sent to ${cleanEmail} (Development Mode: use test code 123456 or generated code)`,
        devMode: true,
      }
    }

    try {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Dr Fit Veda Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 800;">🌿 Dr Fit Veda</h2>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Doctor-Guided Holistic Healthcare</p>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Use the 6-digit verification code below to securely sign in to your Dr Fit Veda account:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #0d9488; background: #f0fdfa; border: 2px dashed #0d9488; padding: 14px 28px; border-radius: 8px;">
        ${generatedOtp}
      </span>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      ⏱️ This code is valid for <strong>5 minutes</strong>. For your security, please do not share this code with anyone.
    </p>
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      If you did not request this login code, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
      `

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Dr Fit Veda <${this.fromEmail}>`,
          to: [cleanEmail],
          subject: `${generatedOtp} is your Dr Fit Veda login verification code`,
          html: emailHtml,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.id) {
        return {
          success: true,
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
        }
      }

      return {
        success: false,
        message: data.message || 'Failed to dispatch email. Please check the email address.',
      }
    } catch {
      return {
        success: false,
        message: 'Email service temporarily unavailable. Please try again.',
      }
    }
  }

  /**
   * Verifies the 6-digit code for the specified email.
   */
  public async verifyOtp(email: string, otp: string): Promise<EmailOtpVerifyResult> {
    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = otp.trim()
    const record = this.store.get(cleanEmail)

    // In dev mode without API key, allow test code 123456
    if (!this.isConfigured() && cleanOtp === '123456') {
      this.store.delete(cleanEmail)
      return { success: true, message: 'Email OTP verified successfully' }
    }

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

    if (record.otp !== cleanOtp) {
      return {
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.',
      }
    }

    // Success: consume single-use OTP
    this.store.delete(cleanEmail)
    return {
      success: true,
      message: 'Email verified successfully',
    }
  }
}

export const emailOtpService = new EmailOtpService()
