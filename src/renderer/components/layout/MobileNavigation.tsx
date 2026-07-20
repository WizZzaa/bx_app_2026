import React, { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from '../../lib/ui/Icon'
import { MOBILE_NAVIGATION, MORE_NAVIGATION } from './navigation'

export default function MobileNavigation() {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)

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
        <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 rounded-2xl border border-bx-border bg-bx-surface p-2 shadow-2xl md:hidden" role="menu" aria-label="Дополнительные разделы">
          {MORE_NAVIGATION.map(item => <NavLink key={item.to} to={item.to} role="menuitem" onClick={() => setMoreOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${isActive ? 'bg-bx-accent text-bx-on-accent' : 'text-bx-text hover:bg-bx-surface-2'}`}><Icon name={item.icon} className="h-5 w-5" />{item.label}</NavLink>)}
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-bx-border bg-bx-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Мобильная навигация">
        {MOBILE_NAVIGATION.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${isActive ? 'text-bx-accent' : 'text-bx-muted'}`}><Icon name={item.icon} className="h-5 w-5" /><span>{item.label === 'AI-консультант' ? 'AI' : item.label}</span></NavLink>)}
        <button ref={moreButtonRef} type="button" onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen} aria-haspopup="menu" className={`flex min-h-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${moreOpen ? 'text-bx-accent' : 'text-bx-muted'}`}><Icon name="tools" className="h-5 w-5" /><span>Ещё</span></button>
      </nav>
    </>
  )
}
