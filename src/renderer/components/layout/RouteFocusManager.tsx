import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteFocusManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    let observer: MutationObserver | undefined
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('[data-route-heading], #bx-main-content h1')
      if (!heading) return false
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
      return true
    }
    const frame = window.requestAnimationFrame(() => {
      if (focusHeading()) return
      const main = document.getElementById('bx-main-content')
      if (!main) return
      observer = new MutationObserver(() => {
        if (focusHeading()) observer?.disconnect()
      })
      observer.observe(main, { childList: true, subtree: true })
    })
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
