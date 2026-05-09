'use client'
import { useEffect } from 'react'

export function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -48px 0px' }
    )

    const init = () => {
      const els = document.querySelectorAll('[data-animate]')
      const vh = window.innerHeight

      els.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.top < vh - 40) {
          // Already visible on load — show immediately, no animation
          el.classList.add('in-view')
        } else {
          el.classList.add('will-animate')
          observer.observe(el)
        }
      })
    }

    // Small rAF delay so layout is settled before we measure
    requestAnimationFrame(() => requestAnimationFrame(init))

    return () => observer.disconnect()
  }, [])

  return null
}
