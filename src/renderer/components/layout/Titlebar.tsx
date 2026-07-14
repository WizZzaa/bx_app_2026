import React, { useState, useEffect } from 'react'

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const isElectron = typeof window !== 'undefined' && !!window.bx

  if (!isElectron) return null

  useEffect(() => {
    if (!isElectron || !window.bx?.window) return

    const checkMaximized = async () => {
      try {
        const max = await window.bx!.window!.isMaximized()
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

  const handleMinimize = () => {
    if (isElectron && window.bx?.window) {
      window.bx.window.minimize().catch(() => void 0)
    }
  }

  const handleMaximize = () => {
    if (isElectron && window.bx?.window) {
      window.bx.window.maximize().then(() => {
        window.bx!.window!.isMaximized().then(setIsMaximized).catch(() => void 0)
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
      className="flex items-center justify-between h-8 bg-[#0b0c10] border-b border-bx-border select-none w-full"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Логотип и заголовок */}
      <div className="flex items-center gap-2 pl-3">
        <span className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[9px]">
          BX
        </span>
        <span className="text-[11px] font-semibold text-bx-text tracking-wide">
          BX — Помощник Бухгалтера
        </span>
      </div>

      {/* Кнопки управления окном */}
      <div 
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Свернуть */}
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-11 h-full text-bx-muted hover:bg-bx-surface hover:text-bx-text transition-colors cursor-pointer"
          title="Свернуть"
          aria-label="Свернуть"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>

        {/* Развернуть / Восстановить */}
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-11 h-full text-bx-muted hover:bg-bx-surface hover:text-bx-text transition-colors cursor-pointer"
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

        {/* Закрыть */}
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-11 h-full text-bx-muted hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
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
