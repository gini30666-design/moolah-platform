'use client'
import { useEffect } from 'react'

export function ScrollReveal() {
  useEffect(() => {
    const vh = window.innerHeight

    const intersectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            intersectionObs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -48px 0px' }
    )

    function observe(el: Element) {
      if (el.classList.contains('will-animate') || el.classList.contains('in-view')) return
      const rect = el.getBoundingClientRect()
      if (rect.top < vh - 40) {
        el.classList.add('in-view')
      } else {
        el.classList.add('will-animate')
        intersectionObs.observe(el)
      }
    }

    const init = () => {
      document.querySelectorAll('[data-animate]').forEach(observe)
    }
    requestAnimationFrame(() => requestAnimationFrame(init))

    // Pick up data-animate elements added dynamically (async data loads, client components)
    const mutationObs = new MutationObserver(() => {
      document.querySelectorAll('[data-animate]:not(.will-animate):not(.in-view)').forEach(observe)
    })
    mutationObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      intersectionObs.disconnect()
      mutationObs.disconnect()
    }
  }, [])

  return null
}
