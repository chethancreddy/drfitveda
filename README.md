# Dr Fit Veda

Comprehensive naturopathy, clinical consultations, daily wellness plans, and holistic healthcare management platform.

## Features

- **Multi-Factor Authentication**:
  - Secure **WhatsApp OTP** verification powered by MSG91 WhatsApp Outbound API.
  - Interactive **Country Code** selector (defaults to India `+91`, with customizable international codes and country-specific phone validation).
  - **Email OTP** verification powered by MSG91 Email API.
  - Traditional User ID & Password login for patients, doctors, trainers, and administrators.
  - Multi-tier brute-force protection (60s cooldown, 5-attempt temporary lockouts).
- **Consultations & Daily Plans**:
  - Naturopathy doctor scheduling and consultations.
  - Daily diet, yoga, and wellness plan delivery and tracking.
- **Compliance & Security**:
  - Indian Law compliance package (DPDP Act, Telemedicine Guidelines, Non-Refund Policy).
  - Role-based access control with administrative escalation barriers.

## Environment Variables

Refer to `.env.example` for all required configuration keys:

```env
# Database & Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MSG91 WhatsApp OTP
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_WHATSAPP_NUMBER=17111240135
MSG91_WHATSAPP_TEMPLATE_NAME=otp_verification
MSG91_WHATSAPP_NAMESPACE=73d9201b_9c90_4716_9857_fb09589cb3bc
MSG91_WHATSAPP_OTP_TEMPLATE_ID=1987029608646436

# MSG91 Email OTP
MSG91_EMAIL_TEMPLATE_ID=your-msg91-email-template-id
MSG91_FROM_EMAIL=care@drfitveda.com
MSG91_FROM_NAME=Dr Fit Veda
MSG91_DOMAIN=drfitveda.com
```

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build
```
