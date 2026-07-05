import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../../shared/version'
import AboutModal from '../AboutModal'
import Icon from '../../lib/ui/Icon'
import { usePlan } from '../../lib/plan'

const nav = [
  { to: '/dashboard', icon: 'dashboard', label: 'Дашборд' },
  { to: '/planner',    icon: 'planner',   label: 'Планировщик' },
  { to: '/calc',       icon: 'calc',      label: 'Калькуляторы' },
  { to: '/tools',      icon: 'tools',     label: 'Утилиты' },
  { to: '/reference',  icon: 'reference', label: 'Справочники' },
  { to: '/services',   icon: 'services',  label: 'Сервисы' },
  { to: '/news',       icon: 'news',      label: 'Новости' },
  { to: '/knowledge',  icon: 'knowledge', label: 'База знаний' },
  { to: '/templates',  icon: 'templates', label: 'Шаблоны' },
  { to: '/hr',         icon: 'hr',        label: 'Сотрудники' },
  { to: '/finance',    icon: 'finance',   label: 'Контроль оплат' },
  { to: '/counterparties', icon: 'users', label: 'Организации' },
  { to: '/ecp',        icon: 'ecp',       label: 'ЭЦП' },
  { to: '/check-inn',  icon: 'search',    label: 'Проверка ИНН' },
  { to: '/ai',         icon: 'ai',        label: 'AI-Консультант' },
  { to: '/support',    icon: 'info',      label: 'Поддержка' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [logoHovered, setLogoHovered] = useState(false)
  const { isAdmin } = usePlan()

  const menuItems = isAdmin
    ? [...nav, { to: '/admin', icon: 'settings', label: 'Админка' }]
    : nav

  return (
    <aside className="flex flex-col bg-bx-surface border-r border-bx-border select-none" style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}>
      {/* Logo — кликабельный, ведёт на главную страницу */}
      <button
        onClick={() => navigate('/')}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        className="flex items-center gap-2 px-4 py-5 border-b border-bx-border w-full text-left transition-colors hover:bg-bx-surface-2 group"
        title="На главную"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 transition-all duration-200"
          style={{
            background: logoHovered
              ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
              : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: logoHovered ? '0 0 16px rgba(99,102,241,0.5)' : 'none',
            transform: logoHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          BX
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-tight group-hover:text-blue-300 transition-colors">
            BX
          </div>
          <div className="text-[10px] text-slate-500 leading-tight group-hover:text-slate-400 transition-colors">
            {logoHovered ? '↩ На главную' : 'Помощник Бухгалтера'}
          </div>
        </div>
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer rounded-lg mx-2 my-0.5 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-slate-400 hover:bg-bx-surface-2 hover:text-slate-200'
              }`
            }
          >
            <Icon name={icon} className="w-[18px] h-[18px] flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer — О программе */}
      <button
        onClick={() => setAboutOpen(true)}
        className="px-4 py-3 border-t border-bx-border text-left hover:bg-bx-surface-2 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm group-hover:scale-110 transition-transform">ℹ️</span>
          <div className="flex-1">
            <div className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">О программе</div>
            <div className="text-[10px] text-slate-600">версия {APP_VERSION}</div>
          </div>
        </div>
      </button>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  )
}
