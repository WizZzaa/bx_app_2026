import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'
import { isNavigationPathActive, MOBILE_NAVIGATION, MORE_NAVIGATION } from './navigation'

export default function MobileNavigation() {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()

  useEffect(() => setMoreOpen(false), [pathname])

  useEffect(() => {
    if (!moreOpen) return undefined
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMoreOpen(false)
      moreButtonRef.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [moreOpen])

  return (
    <>
      {moreOpen && (
        <>
          <button type="button" aria-label="Закрыть дополнительные разделы" onClick={() => setMoreOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/40 md:hidden" />
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 max-h-[min(70dvh,36rem)] overflow-y-auto rounded-t-[24px] border border-bx-border bg-bx-surface p-3 pb-4 shadow-2xl md:hidden" role="menu" aria-label="Дополнительные разделы">
            <div className="mb-2 flex items-center justify-between gap-3 px-2 py-1">
              <div><p className="text-base font-bold text-bx-text">Ещё</p><p className="text-sm text-bx-muted">Все вторичные разделы BX</p></div>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Закрыть меню Ещё" className="grid h-11 w-11 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted"><Icon name="crossSmall" className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {MORE_NAVIGATION.map(item => <NavLink key={item.to} to={item.to} role="menuitem" onClick={() => setMoreOpen(false)} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-bx-accent ${isActive ? 'bg-bx-accent text-bx-on-accent' : 'text-bx-text hover:bg-bx-surface-2'}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-bx-bg/80"><Icon name={item.icon} className="h-5 w-5" /></span>{item.label}</NavLink>)}
            </div>
          </div>
        </>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-bx-border bg-bx-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Мобильная навигация">
        {MOBILE_NAVIGATION.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${isActive ? 'text-bx-accent' : 'text-bx-muted'}`}><Icon name={item.icon} className="h-5 w-5" /><span>{item.shortLabel ?? item.label}</span></NavLink>)}
        <button ref={moreButtonRef} type="button" onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen} aria-haspopup="menu" className={`flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${moreOpen || MORE_NAVIGATION.some(item => isNavigationPathActive(pathname, item.to)) ? 'text-bx-accent' : 'text-bx-muted'}`}><Icon name="tools" className="h-5 w-5" /><span>Ещё</span></button>
      </nav>
    </>
  )
}
