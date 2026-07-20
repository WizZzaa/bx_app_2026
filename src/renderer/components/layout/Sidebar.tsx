import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../../shared/version'
import AboutModal from '../AboutModal'
import Icon from '../../lib/ui/Icon'
import { usePlan } from '../../lib/plan'
import { PRIMARY_NAVIGATION } from './navigation'

const STORAGE_KEY = 'bx_sidebar_collapsed'

export function initialSidebarCollapsed() {
  if (typeof window === 'undefined') return false
  // На компактном desktop/web-окне рабочая область важнее сохранённого
  // предпочтения: две раскрытые панели включают «широкие» сетки в слишком
  // узком контенте. Пользователь по-прежнему может развернуть меню вручную.
  if (window.innerWidth < 1440) return true
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return false
}

export default function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange, webResponsive = false }: { collapsed?: boolean; onCollapsedChange?: (collapsed: boolean) => void; webResponsive?: boolean }) {
  const navigate = useNavigate()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [localCollapsed, setLocalCollapsed] = useState(initialSidebarCollapsed)
  const collapsed = controlledCollapsed ?? localCollapsed
  const setCollapsed = (value: boolean) => {
    if (controlledCollapsed === undefined) setLocalCollapsed(value)
    onCollapsedChange?.(value)
  }
  const { isAdmin } = usePlan()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '72px' : '240px')
    return () => { document.documentElement.style.removeProperty('--sidebar-width') }
  }, [collapsed])

  const openAdmin = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (window.bx?.shell?.openExternal) window.bx.shell.openExternal('https://bx.uz/admin')
    else window.open('https://bx.uz/admin', '_blank', 'noopener,noreferrer')
  }

  return (
    <aside
      data-testid="app-sidebar"
      data-collapsed={collapsed}
      className={`relative z-20 flex-shrink-0 select-none flex-col border-r border-bx-border bg-bx-surface shadow-[4px_0_24px_rgba(15,23,42,0.025)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.08)] ${webResponsive ? 'hidden md:flex' : 'flex'}`}
      style={{ width: collapsed ? 72 : 240, minWidth: collapsed ? 72 : 240 }}
      aria-label="Основная навигация"
    >
      <div
        data-testid="sidebar-header"
        className={`flex flex-shrink-0 items-center border-b border-bx-border ${collapsed ? 'h-28 flex-col justify-center gap-1 px-2 py-2' : 'h-16 gap-2 px-3'}`}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className={`group flex min-h-11 min-w-0 items-center rounded-xl outline-none transition-colors hover:bg-blue-500/[0.07] focus-visible:ring-2 focus-visible:ring-blue-500 ${collapsed ? 'h-11 w-11 justify-center' : 'flex-1 gap-2.5 px-1.5 text-left'}`}
          title={collapsed ? 'BX · На главную' : undefined}
          aria-label="BX — перейти на рабочий стол"
        >
          <span data-testid="bx-brand-mark" className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-[11px] font-black tracking-tight text-bx-on-accent shadow-lg shadow-blue-600/20">BX</span>
          {!collapsed && <span className="min-w-0"><span className="block text-sm font-black leading-tight text-bx-text">BX</span><span className="mt-0.5 block truncate text-[9px] font-semibold text-bx-muted">Помощник бухгалтера</span></span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted outline-none transition-colors hover:border-blue-500/30 hover:bg-blue-500/[0.07] hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
          aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          <Icon name="arrowR" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <nav className={`custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? 'px-2' : 'px-2.5'}`} aria-label="Разделы приложения">
        <div className="space-y-1">
          {PRIMARY_NAVIGATION.map(item => <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined} aria-label={item.label} className={({ isActive }) => navItemClass(isActive, collapsed)}>{({ isActive }) => <><NavIcon name={item.icon} active={isActive} collapsed={collapsed} />{!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}{isActive && !collapsed && <span className="h-1.5 w-1.5 rounded-full bg-bx-on-accent shadow-sm" aria-hidden="true" />}</>}</NavLink>)}
          {isAdmin && <a href="https://bx.uz/admin" onClick={openAdmin} className={navItemClass(false, collapsed)} title={collapsed ? 'Админка' : undefined} aria-label="Админка"><NavIcon name="settings" active={false} collapsed={collapsed} />{!collapsed && <span className="min-w-0 flex-1 truncate">Админка</span>}</a>}
        </div>
      </nav>

      <div className="flex-shrink-0 border-t border-bx-border p-2">
        {!collapsed && <div className="mb-2 rounded-xl border border-blue-500/10 bg-gradient-to-r from-blue-500/[0.06] to-violet-500/[0.04] px-3 py-2.5"><p className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Рабочее пространство</p><p className="mt-1 text-[9px] leading-relaxed text-bx-muted">Навигация BX · версия {APP_VERSION}</p></div>}
        <button onClick={() => setAboutOpen(true)} className={`flex min-h-11 w-full items-center rounded-xl text-bx-muted outline-none transition-colors hover:bg-bx-bg hover:text-bx-text focus-visible:ring-2 focus-visible:ring-blue-500 ${collapsed ? 'justify-center' : 'gap-2.5 px-3 text-left'}`} title={collapsed ? `О программе · ${APP_VERSION}` : undefined} aria-label={`О программе. Версия ${APP_VERSION}`}>
          <Icon name="info" className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span><span className="block text-[10px] font-bold">О программе</span><span className="mt-0.5 block text-[8px] text-bx-muted">Версия {APP_VERSION}</span></span>}
        </button>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  )
}

function navItemClass(active: boolean, collapsed: boolean) {
  const layout = collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
  const state = active
    ? 'bg-blue-600 text-bx-on-accent shadow-md shadow-blue-600/20'
    : 'text-[color:var(--bx-sidebar-text)] hover:bg-bx-bg hover:text-bx-text'
  return `group relative flex min-h-10 w-full cursor-pointer items-center rounded-xl text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${layout} ${state}`
}

function NavIcon({ name, active, collapsed }: { name: string; active: boolean; collapsed: boolean }) {
  return <span className={`grid flex-shrink-0 place-items-center rounded-lg transition-colors ${collapsed ? 'h-9 w-9' : 'h-7 w-7'} ${active ? 'bg-bx-on-accent/10 text-bx-on-accent' : 'bg-bx-bg text-bx-muted group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}><Icon name={name} className="h-4 w-4" /></span>
}
