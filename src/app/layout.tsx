import type { Metadata, Viewport } from 'next'
import './globals.css'

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
  maximumScale: 1,
  themeColor: '#5C8CB5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
