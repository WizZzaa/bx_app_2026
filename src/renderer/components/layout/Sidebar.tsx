import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../../shared/version'
import AboutModal from '../AboutModal'
import Icon from '../../lib/ui/Icon'
import { usePlan } from '../../lib/plan'
import { APP_DESTINATIONS, SIDEBAR_NAVIGATION_GROUPS } from './navigation'

const STORAGE_KEY = 'bx_sidebar_collapsed'
const SIDEBAR_WIDTH = 264
const SIDEBAR_RAIL_WIDTH = 80

const PLAN_LABELS = {
  free: 'Free',
  trial: 'Trial',
  standard: 'Standard',
  premium: 'Premium',
} as const

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

export default function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  webResponsive = false,
}: {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  webResponsive?: boolean
}) {
  const navigate = useNavigate()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [localCollapsed, setLocalCollapsed] = useState(initialSidebarCollapsed)
  const collapsed = controlledCollapsed ?? localCollapsed
  const { isAdmin, plan } = usePlan()

  const setCollapsed = (value: boolean) => {
    if (controlledCollapsed === undefined) setLocalCollapsed(value)
    onCollapsedChange?.(value)
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? `${SIDEBAR_RAIL_WIDTH}px` : `${SIDEBAR_WIDTH}px`)
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
      className={`bx-app-sidebar relative z-20 flex-shrink-0 select-none flex-col ${webResponsive ? 'hidden md:flex' : 'flex'}`}
      style={{
        width: collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH,
        minWidth: collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH,
      }}
      aria-label="Основная навигация"
    >
      <div
        data-testid="sidebar-header"
        className={`bx-app-sidebar__header flex flex-shrink-0 items-center ${collapsed ? 'h-28 flex-col justify-center gap-2 px-2' : 'h-[72px] gap-2 px-3'}`}
      >
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={`bx-app-sidebar__brand group flex min-h-11 min-w-0 items-center rounded-[16px] outline-none ${collapsed ? 'h-11 w-11 justify-center' : 'flex-1 gap-3 px-1 text-left'}`}
          title={collapsed ? 'BX · На главную' : undefined}
          aria-label="BX — перейти на рабочий стол"
        >
          <span
            data-testid="bx-brand-mark"
            className="bx-app-brand-mark grid h-10 w-10 flex-shrink-0 place-items-center rounded-[14px] text-[11px] font-extrabold tracking-[-0.04em] text-bx-on-accent"
          >
            BX
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[15px] font-bold leading-tight tracking-[-0.025em] text-bx-text">BX</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium tracking-[0.01em] text-bx-muted">Помощник бухгалтера</span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="bx-app-sidebar__collapse grid h-11 w-11 flex-shrink-0 place-items-center rounded-[14px] text-bx-muted outline-none"
          aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          <Icon name="arrowR" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <nav className={`bx-app-sidebar__nav custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? 'px-2.5' : 'px-3'}`} aria-label="Разделы приложения">
        <div className="space-y-4">
          {SIDEBAR_NAVIGATION_GROUPS.map((group, groupIndex) => (
            <section key={group.id} aria-label={group.label} className={collapsed && groupIndex > 0 ? 'bx-app-sidebar__rail-group pt-4' : undefined}>
              {!collapsed && <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-bx-muted">{group.label}</p>}
              <div className="space-y-1.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={({ isActive }) => navItemClass(isActive, collapsed)}
                  >
                    {({ isActive }) => (
                      <>
                        <NavIcon name={item.icon} active={isActive} collapsed={collapsed} />
                        {!collapsed && <span className="relative z-[1] min-w-0 flex-1 truncate">{item.label}</span>}
                        {isActive && !collapsed && <span className="bx-app-nav-item__marker relative z-[1]" aria-hidden="true" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className={`bx-app-sidebar__footer flex-shrink-0 p-2.5 ${collapsed ? 'space-y-1.5' : 'space-y-2'}`}>
        <NavLink
          to={APP_DESTINATIONS.support.to}
          aria-label={APP_DESTINATIONS.support.label}
          title={collapsed ? APP_DESTINATIONS.support.label : undefined}
          className={({ isActive }) => utilityItemClass(isActive, collapsed)}
        >
          <Icon name={APP_DESTINATIONS.support.icon} className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">Поддержка</span>}
        </NavLink>
        {isAdmin && (
          <a href="https://bx.uz/admin" onClick={openAdmin} className={utilityItemClass(false, collapsed)} title={collapsed ? 'Админка' : undefined} aria-label="Админка">
            <Icon name="settings" className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">Админка</span>}
          </a>
        )}
        <NavLink
          to={APP_DESTINATIONS.settings.to}
          aria-label={APP_DESTINATIONS.settings.label}
          title={collapsed ? APP_DESTINATIONS.settings.label : undefined}
          className={({ isActive }) => utilityItemClass(isActive, collapsed)}
        >
          <Icon name={APP_DESTINATIONS.settings.icon} className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">Настройки</span>}
        </NavLink>
        <NavLink
          to={APP_DESTINATIONS.account.to}
          aria-label={APP_DESTINATIONS.account.label}
          title={collapsed ? `${APP_DESTINATIONS.account.label} · ${PLAN_LABELS[plan]}` : undefined}
          className={({ isActive }) => `bx-app-sidebar__account flex min-h-12 w-full items-center rounded-[16px] outline-none ${collapsed ? 'justify-center' : 'gap-3 px-2.5 text-left'} ${isActive ? 'is-active' : ''}`}
        >
          <span className="bx-app-sidebar__avatar grid h-9 w-9 flex-shrink-0 place-items-center rounded-full"><Icon name="user" className="h-4 w-4" /></span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-bx-text">Личный кабинет</span>
              <span className="mt-0.5 block text-[10px] text-bx-muted">{PLAN_LABELS[plan]} · BX {APP_VERSION}</span>
            </span>
          )}
          {!collapsed && <Icon name="arrowR" className="h-3.5 w-3.5 flex-shrink-0 text-bx-muted" />}
        </NavLink>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className={`bx-app-sidebar__about flex min-h-11 w-full items-center rounded-[14px] text-bx-muted outline-none ${collapsed ? 'justify-center' : 'gap-2.5 px-3 text-left'}`}
          title={collapsed ? `О программе · ${APP_VERSION}` : undefined}
          aria-label={`О программе. Версия ${APP_VERSION}`}
        >
          <Icon name="info" className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-[11px] font-medium">О программе</span>}
        </button>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  )
}

function navItemClass(active: boolean, collapsed: boolean) {
  const layout = collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
  const state = active ? 'bx-app-nav-item--active text-bx-accent' : 'text-[color:var(--bx-sidebar-text)]'
  return `bx-app-nav-item group relative flex min-h-11 w-full cursor-pointer items-center overflow-hidden rounded-[14px] text-[13px] font-semibold outline-none ${layout} ${state}`
}

function NavIcon({ name, active, collapsed }: { name: string; active: boolean; collapsed: boolean }) {
  return (
    <span className={`bx-app-nav-icon relative z-[1] grid flex-shrink-0 place-items-center rounded-[11px] ${collapsed ? 'h-10 w-10' : 'h-8 w-8'} ${active ? 'text-bx-accent' : 'text-bx-muted'}`}>
      <Icon name={name} className="h-4 w-4" />
    </span>
  )
}

function utilityItemClass(active: boolean, collapsed: boolean) {
  return `bx-app-sidebar__utility flex min-h-11 w-full items-center rounded-[14px] text-[12px] font-medium outline-none ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${active ? 'is-active text-bx-accent' : 'text-bx-muted'}`
}
