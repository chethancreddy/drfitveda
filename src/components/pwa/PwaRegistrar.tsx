'use client'

import { useEffect } from 'react'

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerSw = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Trigger update check so deployed versions take effect immediately
        registration.update().catch(() => {})

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch {
        // Silent fail if service worker registration is blocked in private mode
      }
    }

    registerSw()
  }, [])

  return null
}

