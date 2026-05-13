'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PwaInit() {
  const pathname = usePathname()

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // View Transitions — smooth page changes that feel like an app
  useEffect(() => {
    if (!document.startViewTransition) return
    // The transition is triggered automatically by Next.js navigation.
    // We just need the CSS rules in globals.css to animate it.
  }, [pathname])

  return null
}
