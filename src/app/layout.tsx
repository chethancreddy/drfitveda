import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegistrar from '@/components/pwa/PwaRegistrar'

export const metadata: Metadata = {
  title: { template: '%s | Dr Fit Veda', default: 'Dr Fit Veda — Doctor-Guided Lifestyle Management' },
  description: 'Personalized fitness, yoga, nutrition and lifestyle guidance by doctors and certified professionals.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Dr Fit Veda' },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Dr Fit Veda',
    description: 'Doctor-guided fitness, yoga, nutrition and lifestyle management.',
    type: 'website',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#5C8CB5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  )
}
