import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout, { Section } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Medical, Fitness & Nutrition Disclaimer (Draft) | Dr Fit Veda',
  description: 'Dr Fit Veda guidance is wellness support and does not replace diagnosis or treatment by a qualified healthcare professional.',
}

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Medical, Fitness & Nutrition Disclaimer"
      intro="Please read this before using our programmes, plans or consultations."
    >
      <Section title="1. Not emergency or substitute care">
        <p>
          Dr Fit Veda provides naturopathy, nutrition, yoga and fitness guidance delivered online. It is{' '}
          <strong>not an emergency service</strong> and does not replace diagnosis, treatment or advice from a
          qualified healthcare professional who can examine you in person. Never ignore or delay medical advice
          because of something you read or were told on this platform.
        </p>
      </Section>

      <Section title="2. Get urgent help immediately if you have">
        <p>
          Chest pain or pressure, difficulty breathing, fainting, sudden weakness or numbness, severe bleeding, signs
          of stroke, thoughts of self-harm, severe allergic reaction, very high or low blood sugar symptoms, or any
          other emergency. Call your local emergency number (India 112 / 108; UAE 999 / 998) or go to the nearest
          hospital.
        </p>
      </Section>

      <Section title="3. Talk to your own doctor first if you">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>have a medical condition (for example diabetes, heart, thyroid, kidney or liver disease, high blood pressure, PCOD/PCOS) or take prescribed medicines, insulin or supplements;</li>
          <li>are pregnant, breastfeeding, recovering from surgery or injury, or have an eating disorder;</li>
          <li>are under 18 (our services are for adults) or over 60 and new to exercise.</li>
        </ul>
        <p>
          Do not stop or change prescribed medicine, and do not change insulin or other treatment, on the basis of our
          plans without your treating doctor&apos;s approval.
        </p>
      </Section>

      <Section title="4. Fitness and yoga">
        <p>
          Exercise carries risk of injury. Stop if you feel pain, dizziness or unusual breathlessness. Follow
          trainers&apos; instructions, use a safe space, and tell your trainer about injuries or limitations.
        </p>
      </Section>

      <Section title="5. Nutrition">
        <p>
          Diet plans are personalised using information you provide. Check them against your allergies and doctor&apos;s
          instructions; report any reaction at once. Supplements and herbal items can interact with medicines.
        </p>
      </Section>

      <Section title="6. Results and testimonials">
        <p>
          Outcomes differ for each person and depend on health, effort and other factors. We do not guarantee weight
          loss, cure, reversal or improvement of any condition. Customer stories on this site describe individual
          experiences and are not typical or promised results.
        </p>
      </Section>

      <Section title="7. Automated and AI-assisted content">
        <p>
          The platform currently contains no artificial-intelligence service. If AI-assisted features are added they will
          be labelled, will not replace professional review, and the Privacy Policy will be updated first.
        </p>
      </Section>

      <Section title="8. Our professionals">
        <p>
          Professionals are responsible for their own professional standards. This disclaimer does not reduce their
          duty of care or exclude liability that cannot be excluded by law. See the{' '}
          <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>
    </LegalLayout>
  )
}
