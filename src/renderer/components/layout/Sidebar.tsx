import React, { useState } from 'react'
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

export default function Sidebar() {
  const navigate = useNavigate()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const { isAdmin } = usePlan()

  // Группировка меню по логическим слоям
  const SECTIONS: MenuSection[] = [
    {
      label: 'Главное',
      items: [
        { to: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
        { to: '/calendar',  icon: 'planner',   label: 'Календарь' },
        { to: '/planner',    icon: 'planner',   label: 'Канбан-доска' },
        { to: '/ai',         icon: 'ai',        label: 'AI-Консультант' },
        { to: '/news',       icon: 'news',      label: 'Новости' },
      ]
    },
    {
      label: 'Учет и кадры',
      items: [
        { to: '/hr',         icon: 'hr',        label: 'Сотрудники' },
        { to: '/counterparties', icon: 'users', label: 'Организации' },
        { to: '/documents',  icon: 'note',      label: 'Документы' },
        { to: '/finance',    icon: 'finance',   label: 'Контроль оплат' },
        { to: '/ecp',        icon: 'ecp',       label: 'ЭЦП' },
      ]
    },
    {
      label: 'Инструменты',
      items: [
        { to: '/calc',       icon: 'calc',      label: 'Калькуляторы' },
        { to: '/tools',      icon: 'tools',     label: 'Утилиты' },
        { to: '/templates',  icon: 'templates', label: 'Шаблоны' },
        { to: '/knowledge',  icon: 'knowledge', label: 'База знаний' },
        { to: '/reference',  icon: 'reference', label: 'Справочники' },
        { to: '/services',   icon: 'services',  label: 'Сервисы' },
      ]
    },
    {
      label: 'Поддержка',
      items: [
        { to: '/support',    icon: 'info',      label: 'Поддержка' },
      ]
    }
  ]

  if (isAdmin) {
    SECTIONS.push({
      label: 'Администрирование',
      items: [
        { to: '/admin', icon: 'settings', label: 'Админка', external: true }
      ]
    })
  }

  return (
    <aside className="flex flex-col bg-[#e2e6fb] dark:bg-bx-surface border-r border-[#c5cbfa] dark:border-bx-border select-none z-10" style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}>
      {/* Logo — кликабельный, ведет на главную страницу */}
      <button
        onClick={() => navigate('/')}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        className="flex items-center gap-2.5 px-4 py-4.5 border-b border-[#c5cbfa] dark:border-bx-border w-full text-left transition-colors hover:bg-white/20 dark:hover:bg-white/[0.02] group"
        title="На главную"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0 transition-all duration-300"
          style={{
            background: logoHovered
              ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
              : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: logoHovered ? '0 0 14px rgba(59,130,246,0.4)' : 'none',
            transform: logoHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          BX
        </div>
        <div>
          <div className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-blue-300 transition-colors">
            BX
          </div>
          <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
            {logoHovered ? '↩ На главную' : 'Помощник Бухгалтера'}
          </div>
        </div>
      </button>

      {/* Навигация с группировкой */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <p className="px-3 mb-1 text-[8.5px] font-extrabold uppercase tracking-[0.15em] text-[#6b75a4] dark:text-slate-500">{section.label}</p>
            {section.items.map((item) => {
              const { to, icon, label, external } = item

              if (external) {
                return (
                  <a
                    key={to}
                    href="https://bx.uz/admin"
                    onClick={(e) => {
                      e.preventDefault()
                      if (window.bx?.shell?.openExternal) {
                        window.bx.shell.openExternal('https://bx.uz/admin')
                      } else {
                        window.open('https://bx.uz/admin', '_blank', 'noopener,noreferrer')
                      }
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs transition-all cursor-pointer rounded-lg text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/[0.03] hover:translate-x-0.5 font-semibold animate-none"
                  >
                    <Icon name={icon} className="w-4 h-4 flex-shrink-0 opacity-80" />
                    <span className="truncate">{label}</span>
                  </a>
                )
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 text-xs transition-all cursor-pointer rounded-lg font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/20'
                        : 'text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white border-transparent hover:bg-slate-900/5 dark:hover:bg-white/[0.03] hover:translate-x-0.5'
                    }`
                  }
                >
                  <Icon name={icon} className="w-4 h-4 flex-shrink-0 opacity-80 animate-none" />
                  <span className="truncate">{label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer — О программе */}
      <button
        onClick={() => setAboutOpen(true)}
        className="px-4 py-3 border-t border-[#c5cbfa] dark:border-bx-border text-left hover:bg-white/20 dark:hover:bg-white/[0.02] transition-colors group flex-shrink-0 w-full"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs group-hover:scale-110 transition-transform">ℹ️</span>
          <div className="flex-1">
            <div className="text-[10px] text-slate-700 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-slate-200 transition-colors font-semibold">О программе</div>
            <div className="text-[9px] text-slate-500">Версия {APP_VERSION}</div>
          </div>
        </div>
      </button>

      {/* Модалка о программе */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  )
}
