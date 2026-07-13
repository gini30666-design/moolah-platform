'use client'
import { useEffect } from 'react'

export function ScrollReveal() {
  useEffect(() => {
    const vh = window.innerHeight

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const intersectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            intersectionObs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px 0px 0px' }
    )

    function observe(el: Element) {
      if (el.classList.contains('will-animate') || el.classList.contains('in-view')) return
      const rect = el.getBoundingClientRect()
      if (reducedMotion || rect.top < vh + 20) {
        el.classList.add('in-view')
      } else {
        el.classList.add('will-animate')
        intersectionObs.observe(el)
        // 保險絲：IO 事件被吞（背景分頁預載等）時，寧可不播動畫也不能讓內容卡在隱藏
        setTimeout(() => {
          if (!el.classList.contains('in-view') && el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('in-view')
          }
        }, 2500)
      }
    }

    // Word-reveal elements: just add in-view (no will-animate opacity hiding)
    function observeWordReveal(el: Element) {
      if (el.classList.contains('in-view')) return
      const rect = el.getBoundingClientRect()
      if (rect.top < vh - 40) {
        el.classList.add('in-view')
      } else {
        intersectionObs.observe(el)
      }
    }

    const init = () => {
      document.querySelectorAll('[data-animate]').forEach(observe)
      document.querySelectorAll('[data-word-reveal]').forEach(observeWordReveal)
    }
    requestAnimationFrame(() => requestAnimationFrame(init))

    // Pick up data-animate elements added dynamically (async data loads, client components)
    // RAF ensures getBoundingClientRect() is called after browser layout
    const mutationObs = new MutationObserver(() => {
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-animate]:not(.will-animate):not(.in-view)').forEach(observe)
        document.querySelectorAll('[data-word-reveal]:not(.in-view)').forEach(observeWordReveal)
      })
    })
    mutationObs.observe(document.body, { childList: true, subtree: true })

    return () => {
      intersectionObs.disconnect()
      mutationObs.disconnect()
    }
  }, [])

  return null
}
