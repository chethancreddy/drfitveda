// ============================================================
// Dr Fit Veda — Approved WhatsApp Message Templates Registry
// Matches approved Meta WhatsApp templates configured on MSG91.
// Supports dynamic variable mapping, sample preview, and batch dispatch.
// ============================================================

export interface WhatsAppTemplateVariable {
  index: number
  label: string
  defaultSource: 'field' | 'custom'
  defaultField?: string
  defaultValue?: string
  description: string
  placeholder: string
}

export interface WhatsAppTemplateDefinition {
  id: string
  name: string
  displayName: string
  purpose: string
  category: 'authentication' | 'utility' | 'marketing'
  language: string
  variables: WhatsAppTemplateVariable[]
  bodyTemplate: string
  sampleVariables: string[]
}

export const APPROVED_WHATSAPP_TEMPLATES: WhatsAppTemplateDefinition[] = [
  {
    id: 'drfitveda_customer_doctor_assigned',
    name: 'drfitveda_customer_doctor_assigned',
    displayName: 'Customer Doctor Assignment Alert',
    purpose: 'Notifies customer when their doctor is assigned with confirmed appointment details',
    category: 'utility',
    language: 'en',
    variables: [
      {
        index: 1,
        label: 'Customer Name',
        defaultSource: 'field',
        defaultField: 'full_name',
        description: 'First or Full Name of the Customer',
        placeholder: 'e.g. Priya Sharma',
      },
      {
        index: 2,
        label: 'Assigned Doctor Name',
        defaultSource: 'custom',
        defaultValue: 'Dr. Varshini Naturopathy',
        description: 'Name of the Assigned Specialist / Doctor',
        placeholder: 'e.g. Dr. Varshini',
      },
      {
        index: 3,
        label: 'Confirmed Appointment Date',
        defaultSource: 'custom',
        defaultValue: 'Tomorrow',
        description: 'Date of the consultation (e.g. 15 Nov 2026)',
        placeholder: 'e.g. 15 Nov 2026',
      },
      {
        index: 4,
        label: 'Confirmed Appointment Time',
        defaultSource: 'custom',
        defaultValue: '10:00 AM - 10:45 AM IST',
        description: 'Time window with timezone',
        placeholder: 'e.g. 10:00 AM - 10:45 AM IST',
      },
      {
        index: 5,
        label: 'Consultation Type',
        defaultSource: 'custom',
        defaultValue: 'Online Video (Google Meet)',
        description: 'Type of Consultation (e.g. Online Video / Follow-up)',
        placeholder: 'e.g. Online Video (Google Meet)',
      },
    ],
    bodyTemplate:
      'Hello {{1}},\n\nGood news! Your doctor has been successfully assigned on DrFitVeda.\n\n*Your Appointment Details:*\n\nDoctor Name: {{2}}\nAppointment Date: {{3}}\nAppointment Time: {{4}}\nConsultation Type: {{5}}\n\nYour appointment is confirmed.\n\nPlease log in to your DrFitVeda account to view your appointment details and access further instructions.\n\nThank you,\nTeam DrFitVeda',
    sampleVariables: [
      'Priya Sharma',
      'Dr. Varshini Naturopathy',
      '15 Nov 2026',
      '10:00 AM - 10:45 AM IST',
      'Online Video (Google Meet)',
    ],
  },
  {
    id: 'customer_session_reminder',
    name: 'customer_session_reminder',
    displayName: 'Customer 15m Session Reminder',
    purpose: '15-minute alert before a live consultation or training session',
    category: 'utility',
    language: 'en',
    variables: [
      {
        index: 1,
        label: 'Customer Name',
        defaultSource: 'field',
        defaultField: 'full_name',
        description: 'Customer full name',
        placeholder: 'e.g. Ananya',
      },
      {
        index: 2,
        label: 'Session Title / Specialist',
        defaultSource: 'custom',
        defaultValue: 'Holistic Wellness Consultation',
        description: 'Title of the session or doctor',
        placeholder: 'e.g. Naturopathy Doctor Consultation',
      },
      {
        index: 3,
        label: 'Start Time',
        defaultSource: 'custom',
        defaultValue: 'In 15 minutes',
        description: 'Start time with timezone',
        placeholder: 'e.g. 10:00 AM IST',
      },
      {
        index: 4,
        label: 'Meeting / Portal Link',
        defaultSource: 'field',
        defaultField: 'meeting_url',
        description: 'Google Meet or Portal link',
        placeholder: 'e.g. https://drfitveda.com/customer/appointments',
      },
    ],
    bodyTemplate:
      'Namaste {{1}},\n\nYour session *{{2}}* is scheduled to start at *{{3}}* (in 15 minutes).\n\nJoin your session securely via your DrFitVeda portal:\n{{4}}\n\nPlease be ready 5 minutes early.\n\nWarm regards,\nTeam DrFitVeda',
    sampleVariables: [
      'Priya Sharma',
      'Holistic Wellness Consultation',
      '10:00 AM IST',
      'https://drfitveda.com/customer/appointments',
    ],
  },
  {
    id: 'drfitveda_general_announcement',
    name: 'drfitveda_general_announcement',
    displayName: 'Wellness Announcement & Program Update',
    purpose: 'Broadcast important health updates, new plan launches, or wellness events',
    category: 'marketing',
    language: 'en',
    variables: [
      {
        index: 1,
        label: 'Customer Name',
        defaultSource: 'field',
        defaultField: 'full_name',
        description: 'Recipient name',
        placeholder: 'e.g. Member',
      },
      {
        index: 2,
        label: 'Announcement Title',
        defaultSource: 'custom',
        defaultValue: 'Special Wellness Program Update',
        description: 'Headline or update title',
        placeholder: 'e.g. New Yoga Routine Live',
      },
      {
        index: 3,
        label: 'Announcement Details',
        defaultSource: 'custom',
        defaultValue: 'Check out our latest holistic wellness updates designed for your health goals.',
        description: 'Main body update',
        placeholder: 'e.g. Your nutritionist has updated dietary guidelines.',
      },
      {
        index: 4,
        label: 'Action Link',
        defaultSource: 'custom',
        defaultValue: 'https://drfitveda.com/customer/programs',
        description: 'Call to action URL',
        placeholder: 'e.g. https://drfitveda.com/customer',
      },
    ],
    bodyTemplate:
      'Hello {{1}},\n\n📢 *{{2}}*\n\n{{3}}\n\nAccess your personalized DrFitVeda portal here:\n{{4}}\n\nWishing you good health and vitality,\nTeam DrFitVeda',
    sampleVariables: [
      'Priya Sharma',
      'Special Wellness Program Update',
      'Your certified care team has posted new weekly wellness routines and nutrition milestones.',
      'https://drfitveda.com/customer/programs',
    ],
  },
  {
    id: 'doctor_customer_assigned',
    name: 'doctor_customer_assigned',
    displayName: 'Doctor Care Team Notification',
    purpose: 'Alerts doctor with assigned patient profile details',
    category: 'utility',
    language: 'en',
    variables: [
      {
        index: 1,
        label: 'Doctor Name',
        defaultSource: 'custom',
        defaultValue: 'Dr. Varshini Naturopathy',
        description: 'Doctor name',
        placeholder: 'e.g. Dr. Varshini',
      },
      {
        index: 2,
        label: 'Customer Name',
        defaultSource: 'field',
        defaultField: 'full_name',
        description: 'Customer name',
        placeholder: 'e.g. Priya Sharma',
      },
      {
        index: 3,
        label: 'Appointment Date/Time',
        defaultSource: 'custom',
        defaultValue: 'Tomorrow at 10:00 AM IST',
        description: 'Scheduled slot time',
        placeholder: 'e.g. Tomorrow at 10:00 AM IST',
      },
      {
        index: 4,
        label: 'Google Meet Room',
        defaultSource: 'field',
        defaultField: 'meeting_url',
        description: 'Meeting room link',
        placeholder: 'e.g. https://drfitveda.com/professional',
      },
    ],
    bodyTemplate:
      'Hello Dr. {{1}},\n\nA new customer *{{2}}* has been assigned to your DrFitVeda care schedule for *{{3}}*.\n\nAccess patient medical history and join consultation:\n{{4}}\n\nBest regards,\nDrFitVeda Care Dispatch',
    sampleVariables: [
      'Dr. Varshini',
      'Priya Sharma',
      'Tomorrow at 10:00 AM IST',
      'https://drfitveda.com/professional',
    ],
  },
  {
    id: 'trainer_customer_assigned',
    name: 'trainer_customer_assigned',
    displayName: 'Trainer Care Team Notification',
    purpose: 'Alerts trainer with assigned client profile details',
    category: 'utility',
    language: 'en',
    variables: [
      {
        index: 1,
        label: 'Trainer Name',
        defaultSource: 'custom',
        defaultValue: 'Coach Vikram',
        description: 'Trainer name',
        placeholder: 'e.g. Vikram',
      },
      {
        index: 2,
        label: 'Customer Name',
        defaultSource: 'field',
        defaultField: 'full_name',
        description: 'Customer name',
        placeholder: 'e.g. Priya Sharma',
      },
      {
        index: 3,
        label: 'Program / Goal',
        defaultSource: 'field',
        defaultField: 'plan_name',
        description: 'Fitness program or goal',
        placeholder: 'e.g. 3-Month Holistic Transformation',
      },
      {
        index: 4,
        label: 'Trainer Dashboard Link',
        defaultSource: 'custom',
        defaultValue: 'https://drfitveda.com/professional',
        description: 'Trainer portal link',
        placeholder: 'e.g. https://drfitveda.com/professional',
      },
    ],
    bodyTemplate:
      'Hello Coach {{1}},\n\nYou have been assigned to train *{{2}}* for their *{{3}}* program.\n\nView client fitness goals and start logging sessions:\n{{4}}\n\nBest regards,\nDrFitVeda Care Dispatch',
    sampleVariables: [
      'Vikram',
      'Priya Sharma',
      '3-Month Holistic Transformation',
      'https://drfitveda.com/professional',
    ],
  },
]

export function renderTemplatePreview(
  bodyTemplate: string,
  variables: Record<number, string> | string[]
): string {
  let result = bodyTemplate
  if (Array.isArray(variables)) {
    variables.forEach((val, idx) => {
      const placeholder = `{{${idx + 1}}}`
      result = result.replaceAll(placeholder, String(val || `[Var ${idx + 1}]`))
    })
  } else {
    Object.entries(variables).forEach(([idx, val]) => {
      const placeholder = `{{${idx}}}`
      result = result.replaceAll(placeholder, String(val || `[Var ${idx}]`))
    })
  }
  return result
}

