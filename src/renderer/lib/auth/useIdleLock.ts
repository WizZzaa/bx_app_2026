import { useEffect, useRef, useCallback } from 'react'

const IDLE_LOCK_KEY = 'bx_idle_lock'
type IdleTimeout = 'off' | '5' | '10' | '30' | '60'

const getIdleTimeout = (): number | null => {
  const val = localStorage.getItem(IDLE_LOCK_KEY) as IdleTimeout | null
  if (!val || val === 'off') return null
  return parseInt(val, 10) * 60 * 1000
}

/**
 * Хук для автоблокировки экрана по неактивности.
 * Отслеживает mousemove, keydown, click, scroll.
 * При бездействии дольше выбранного таймаута вызывает onLock().
 * Активен только когда enabled === true.
 */
export const useIdleLock = (onLock: () => void, enabled: boolean) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    const timeoutMs = getIdleTimeout()
    if (!timeoutMs || !enabled) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onLock()
    }, timeoutMs)
  }, [onLock, enabled])

  useEffect(() => {
    const timeoutMs = getIdleTimeout()
    if (!timeoutMs || !enabled) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    // Throttle: обрабатываем не чаще чем раз в 2 секунды
    let throttled = false
    const handleActivity = () => {
      if (throttled) return
      throttled = true
      setTimeout(() => { throttled = false }, 2000)
      resetTimer()
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }))

    // Стартовый таймер
    resetTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer, enabled])
}
