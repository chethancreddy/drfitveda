// ============================================================
// Dr Fit Veda — Official MSG91 v5 OTP Service Client
// Handles SMS OTP Dispatch, Verification, and Retry via MSG91
// Strictly keeps API secrets server-side and never exposes keys.
// ============================================================

export interface Msg91SendResult {
  success: boolean
  message: string
  devMode?: boolean
}

export interface Msg91VerifyResult {
  success: boolean
  message: string
}

class Msg91Service {
  private get authKey(): string | null {
    return process.env.MSG91_AUTH_KEY || null
  }

  private get templateId(): string | null {
    return process.env.MSG91_OTP_TEMPLATE_ID || null
  }

  private get dltTeId(): string | null {
    return process.env.MSG91_DLT_TE_ID || null
  }

  /**
   * Returns true if production MSG91 credentials are configured.
   */
  public isConfigured(): boolean {
    const key = this.authKey
    return Boolean(key && !key.includes('placeholder') && !key.includes('your_') && key !== 'test')
  }

  /**
   * In-memory mock store for local development testing when MSG91 credentials are not injected.
   */
  private mockOtpStore = new Map<string, { otp: string; expiresAt: number }>()

  /**
   * 1. Send OTP via MSG91 official v5 API
   * Endpoint: POST https://control.msg91.com/api/v5/otp
   * @param msg91Mobile Normalized mobile with country code (e.g. 919876543210)
   */
  public async sendOtp(msg91Mobile: string): Promise<Msg91SendResult> {
    if (!this.isConfigured()) {
      // Local development mock mode fallback
      const devOtp = '123456'
      this.mockOtpStore.set(msg91Mobile, {
        otp: devOtp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      })

      return {
        success: true,
        message: 'OTP sent successfully (Development Test Mode)',
        devMode: true,
      }
    }

    try {
      const template = this.templateId || ''
      const url = new URL('https://control.msg91.com/api/v5/otp')
      url.searchParams.set('template_id', template)
      url.searchParams.set('mobile', msg91Mobile)
      url.searchParams.set('authkey', this.authKey!)
      url.searchParams.set('otp_length', '6')
      url.searchParams.set('otp_expiry', '5') // 5 minutes validity

      if (this.dltTeId) {
        url.searchParams.set('dlt_te_id', this.dltTeId)
      }

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.authKey!,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.type === 'success') {
        return {
          success: true,
          message: 'OTP sent successfully to your mobile number.',
        }
      }

      const errMsg = data.message || 'Failed to dispatch SMS OTP. Please check your mobile number.'
      return {
        success: false,
        message: errMsg,
      }
    } catch {
      return {
        success: false,
        message: 'SMS service temporarily unavailable. Please try again or use password login.',
      }
    }
  }

  /**
   * 2. Verify OTP via MSG91 official v5 API
   * Endpoint: GET https://control.msg91.com/api/v5/otp/verify
   * @param msg91Mobile Normalized mobile (e.g. 919876543210)
   * @param otp 6-digit numeric OTP code
   */
  public async verifyOtp(msg91Mobile: string, otp: string): Promise<Msg91VerifyResult> {
    const cleanOtp = otp.trim()

    if (!this.isConfigured()) {
      // Local development mock check
      const record = this.mockOtpStore.get(msg91Mobile)
      if (cleanOtp === '123456' || (record && record.otp === cleanOtp && record.expiresAt > Date.now())) {
        this.mockOtpStore.delete(msg91Mobile)
        return { success: true, message: 'OTP verified successfully' }
      }
      return { success: false, message: 'Invalid or expired OTP code.' }
    }

    try {
      const url = new URL('https://control.msg91.com/api/v5/otp/verify')
      url.searchParams.set('otp', cleanOtp)
      url.searchParams.set('mobile', msg91Mobile)
      url.searchParams.set('authkey', this.authKey!)

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'authkey': this.authKey!,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.type === 'success') {
        return { success: true, message: 'OTP verified successfully' }
      }

      // Map specific MSG91 error messages to user-friendly text
      const rawMessage = (data.message || '').toLowerCase()
      if (rawMessage.includes('not match')) {
        return { success: false, message: 'Incorrect OTP code. Please verify the 6 digits.' }
      }
      if (rawMessage.includes('expired')) {
        return { success: false, message: 'OTP code has expired. Please request a new code.' }
      }
      if (rawMessage.includes('mobile no. not found') || rawMessage.includes('already verified')) {
        return { success: false, message: 'OTP session expired or already used. Please request a fresh OTP.' }
      }

      return { success: false, message: data.message || 'OTP verification failed.' }
    } catch {
      return {
        success: false,
        message: 'Unable to verify OTP due to a network glitch. Please try again.',
      }
    }
  }

  /**
   * 3. Retry / Resend OTP via MSG91 official v5 API
   * Endpoint: GET https://control.msg91.com/api/v5/otp/retry
   * @param msg91Mobile Normalized mobile (e.g. 919876543210)
   */
  public async retryOtp(msg91Mobile: string): Promise<Msg91SendResult> {
    if (!this.isConfigured()) {
      return this.sendOtp(msg91Mobile)
    }

    try {
      const url = new URL('https://control.msg91.com/api/v5/otp/retry')
      url.searchParams.set('mobile', msg91Mobile)
      url.searchParams.set('retrytype', 'text')
      url.searchParams.set('authkey', this.authKey!)

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'authkey': this.authKey!,
        },
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.type === 'success') {
        return {
          success: true,
          message: 'OTP resent successfully to your mobile number.',
        }
      }

      return {
        success: false,
        message: data.message || 'Failed to resend OTP. Please wait before retrying.',
      }
    } catch {
      return {
        success: false,
        message: 'Could not contact SMS service. Please try again later.',
      }
    }
  }
}

export const msg91Service = new Msg91Service()
