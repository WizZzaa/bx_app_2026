import React, { useState, useEffect } from 'react'

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const isElectron = typeof window !== 'undefined' && !!window.bx

  useEffect(() => {
    const windowApi = window.bx?.window
    if (!isElectron || !windowApi) return

    const checkMaximized = async () => {
      try {
        const max = await windowApi.isMaximized()
        setIsMaximized(max)
      } catch (e) {
        console.error(e)
      }
    }

    checkMaximized()

    // Слушаем ресайз окна для перепроверки статуса
    window.addEventListener('resize', checkMaximized)
    return () => window.removeEventListener('resize', checkMaximized)
  }, [isElectron])

  if (!isElectron) return null

  const handleMinimize = () => {
    if (isElectron && window.bx?.window) {
      window.bx.window.minimize().catch(() => void 0)
    }
  }

  const handleMaximize = () => {
    const windowApi = window.bx?.window
    if (isElectron && windowApi) {
      windowApi.maximize().then(() => {
        windowApi.isMaximized().then(setIsMaximized).catch(() => void 0)
      }).catch(() => void 0)
    }
  }

  const handleClose = () => {
    if (isElectron && window.bx?.window) {
      window.bx.window.close().catch(() => void 0)
    }
  }

  return (
    <div 
      className="bx-app-titlebar"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="bx-app-titlebar__identity">
        <span className="bx-app-brand-mark bx-app-titlebar__mark">
          BX
        </span>
        <span className="bx-app-titlebar__title">
          BX · рабочее пространство
        </span>
      </div>

      <div 
        className="bx-app-titlebar__controls"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={handleMinimize}
          className="bx-app-titlebar__control"
          title="Свернуть"
          aria-label="Свернуть"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleMaximize}
          className="bx-app-titlebar__control"
          title={isMaximized ? "Свернуть в окно" : "Развернуть"}
          aria-label={isMaximized ? "Свернуть в окно" : "Развернуть"}
        >
          {isMaximized ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H4V12M16 8h4v4M4 16l6-6M20 8l-6 6" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="bx-app-titlebar__control bx-app-titlebar__control--close"
          title="Закрыть"
          aria-label="Закрыть"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
