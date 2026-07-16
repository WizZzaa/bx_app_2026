import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../../shared/version'
import AboutModal from '../AboutModal'
import Icon from '../../lib/ui/Icon'
import { usePlan } from '../../lib/plan'

interface MenuItem {
  to: string
  icon: string
  label: string
  external?: boolean
}

interface MenuSection {
  label: string
  items: MenuItem[]
}

const STORAGE_KEY = 'bx_sidebar_collapsed'

function initialCollapsed() {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return window.innerWidth < 1180
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const { isAdmin } = usePlan()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '72px' : '240px')
    return () => { document.documentElement.style.removeProperty('--sidebar-width') }
  }, [collapsed])

  const sections: MenuSection[] = [
    {
      label: 'Главное',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
        { to: '/planner', icon: 'planner', label: 'Планировщик' },
        { to: '/ai', icon: 'ai', label: 'AI-Консультант' },
        { to: '/news', icon: 'news', label: 'Новости' },
      ],
    },
    {
      label: 'Учёт и команда',
      items: [
        { to: '/hr', icon: 'hr', label: 'Сотрудники' },
        { to: '/counterparties', icon: 'users', label: 'Организации' },
        { to: '/documents', icon: 'note', label: 'Документы' },
        { to: '/templates', icon: 'templates', label: 'Шаблоны' },
        { to: '/finance', icon: 'finance', label: 'Контроль оплат' },
      ],
    },
    {
      label: 'Инструменты',
      items: [
        { to: '/currency', icon: 'exchange', label: 'Курсы валют' },
        { to: '/calc', icon: 'calc', label: 'Калькуляторы' },
        { to: '/tools', icon: 'tools', label: 'Утилиты' },
        { to: '/translator', icon: 'languages', label: 'Переводчик' },
        { to: '/knowledge', icon: 'knowledge', label: 'База знаний' },
        { to: '/reference', icon: 'reference', label: 'Справочники' },
        { to: '/services', icon: 'services', label: 'Сервисы' },
      ],
    },
    { label: 'Помощь', items: [{ to: '/support', icon: 'info', label: 'Поддержка' }] },
  ]

  if (isAdmin) sections.push({ label: 'Управление', items: [{ to: '/admin', icon: 'settings', label: 'Админка', external: true }] })

  const openAdmin = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (window.bx?.shell?.openExternal) window.bx.shell.openExternal('https://bx.uz/admin')
    else window.open('https://bx.uz/admin', '_blank', 'noopener,noreferrer')
  }

  return (
    <aside
      data-testid="app-sidebar"
      data-collapsed={collapsed}
      className="relative z-20 flex flex-shrink-0 select-none flex-col border-r border-bx-border bg-bx-surface shadow-[4px_0_24px_rgba(15,23,42,0.025)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.08)]"
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
          aria-label="BX — перейти на дашборд"
        >
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-[11px] font-black tracking-tight text-white shadow-lg shadow-blue-600/20">BX</span>
          {!collapsed && <span className="min-w-0"><span className="block text-sm font-black leading-tight text-bx-text">BX</span><span className="mt-0.5 block truncate text-[9px] font-semibold text-bx-muted">Помощник бухгалтера</span></span>}
        </button>
        <button
          onClick={() => setCollapsed(value => !value)}
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted outline-none transition-colors hover:border-blue-500/30 hover:bg-blue-500/[0.07] hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
          aria-label={collapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          <Icon name="arrowR" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <nav className={`custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? 'px-2' : 'px-2.5'}`} aria-label="Разделы приложения">
        <div className={collapsed ? 'space-y-2.5' : 'space-y-4'}>
          {sections.map((section, sectionIndex) => (
            <section key={section.label} aria-label={section.label}>
              {collapsed ? (
                sectionIndex > 0 && <div className="mx-auto mb-2.5 h-px w-7 bg-bx-border" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-bx-muted">{section.label}</p>
              )}
              <div className="space-y-1">
                {section.items.map(item => item.external ? (
                  <a key={item.to} href="https://bx.uz/admin" onClick={openAdmin} className={navItemClass(false, collapsed)} title={collapsed ? item.label : undefined} aria-label={item.label}>
                    <NavIcon name={item.icon} active={false} collapsed={collapsed} />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!collapsed && <Icon name="arrowR" className="h-3 w-3 text-bx-muted" />}
                  </a>
                ) : (
                  <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined} aria-label={item.label} className={({ isActive }) => navItemClass(isActive, collapsed)}>
                    {({ isActive }) => <><NavIcon name={item.icon} active={isActive} collapsed={collapsed} />{!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}{isActive && !collapsed && <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.65)]" aria-hidden="true" />}</>}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
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
    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
    : 'text-[color:var(--bx-sidebar-text)] hover:bg-bx-bg hover:text-bx-text'
  return `group relative flex min-h-10 w-full cursor-pointer items-center rounded-xl text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${layout} ${state}`
}

function NavIcon({ name, active, collapsed }: { name: string; active: boolean; collapsed: boolean }) {
  return <span className={`grid flex-shrink-0 place-items-center rounded-lg transition-colors ${collapsed ? 'h-9 w-9' : 'h-7 w-7'} ${active ? 'bg-white/12 text-white' : 'bg-bx-bg text-bx-muted group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}><Icon name={name} className="h-4 w-4" /></span>
}
