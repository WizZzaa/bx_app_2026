import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { APP_VERSION } from '../../../shared/version'
import AboutModal from '../AboutModal'
import Icon from '../../lib/ui/Icon'
import { usePlan } from '../../lib/plan'
import { useCompany } from '../../lib/CompanyContext'
import { useEvents } from '../../pages/planner/useEvents'
import { getSpecialDay, isNonWorkingSpecialDay, isPreHoliday } from '../../data/uzHolidays'

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
        { to: '/planner',    icon: 'planner',   label: 'Планировщик' },
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
    <aside className="flex flex-col bg-slate-950/10 dark:bg-slate-950/20 backdrop-blur-xl border-r border-slate-900/5 dark:border-white/5 select-none z-10" style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}>
      {/* Logo — кликабельный, ведет на главную страницу */}
      <button
        onClick={() => navigate('/')}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        className="flex items-center gap-2.5 px-4 py-4.5 border-b border-slate-900/5 dark:border-white/5 w-full text-left transition-colors hover:bg-white/[0.02] group"
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
          <div className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
            BX
          </div>
          <div className="text-[9px] text-slate-500 leading-tight group-hover:text-slate-400 transition-colors">
            {logoHovered ? '↩ На главную' : 'Помощник Бухгалтера'}
          </div>
        </div>
      </button>

      {/* Навигация с группировкой */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <p className="px-3 mb-1 text-[8.5px] font-extrabold uppercase tracking-[0.15em] text-slate-500">{section.label}</p>
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
                    className="flex items-center gap-2.5 px-3 py-2 text-xs transition-all cursor-pointer rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5"
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
                    `flex items-center gap-2.5 px-3 py-2 text-xs transition-all cursor-pointer rounded-lg ${
                      isActive
                        ? 'bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.05)]'
                        : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-900/5 dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5'
                    }`
                  }
                >
                  <Icon name={icon} className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="truncate">{label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}

        {/* Добавляем мини-календарь в конец навигационного списка */}
        <SidebarCalendar />
      </nav>

      {/* Footer — О программе */}
      <button
        onClick={() => setAboutOpen(true)}
        className="px-4 py-3 border-t border-slate-900/5 dark:border-white/5 text-left hover:bg-slate-900/5 dark:hover:bg-white/[0.02] transition-colors group flex-shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs group-hover:scale-110 transition-transform">ℹ️</span>
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">О программе</div>
            <div className="text-[9px] text-slate-500">Версия {APP_VERSION}</div>
          </div>
        </div>
      </button>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  )
}

function SidebarCalendar() {
  const { active } = useCompany()
  const { events } = useEvents(active?.id ?? null)
  
  // Состояния текущей даты
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Состояния фильтров из localStorage
  const [showTax, setShowTax] = useState(() => localStorage.getItem('bx_cal_show_tax') !== 'false')
  const [showTasks, setShowTasks] = useState(() => localStorage.getItem('bx_cal_show_tasks') !== 'false')
  const [showHolidays, setShowHolidays] = useState(() => localStorage.getItem('bx_cal_show_holidays') !== 'false')

  const toggleTax = () => {
    setShowTax(v => {
      const next = !v
      localStorage.setItem('bx_cal_show_tax', String(next))
      return next
    })
  }

  const toggleTasks = () => {
    setShowTasks(v => {
      const next = !v
      localStorage.setItem('bx_cal_show_tasks', String(next))
      return next
    })
  }

  const toggleHolidays = () => {
    setShowHolidays(v => {
      const next = !v
      localStorage.setItem('bx_cal_show_holidays', String(next))
      return next
    })
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Пн = 0
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Сбор данных о дедлайнах и задачах по дням
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const dayDeadlines = new Set<number>()
  const dayTasks = new Set<number>()

  events.forEach(e => {
    if (e.status === 'done') return
    const d = e.due_date || e.date
    if (d?.startsWith(monthPrefix)) {
      const day = Number(d.slice(8, 10))
      if (e.type === 'tax_deadline') {
        dayDeadlines.add(day)
      } else {
        dayTasks.add(day)
      }
    }
  })

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className="mt-4 px-3.5 py-3 bg-slate-900/5 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 rounded-2xl flex flex-col gap-2.5 font-sans max-w-full text-[11px] shadow-sm">
      {/* Шапка календаря */}
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-slate-800 dark:text-white capitalize leading-tight tracking-wide">{monthName}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handlePrevMonth} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-[10px]">◀</button>
          <button onClick={handleNextMonth} className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-[10px]">▶</button>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-y-0.5 text-center font-bold text-slate-400 dark:text-slate-500">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <span key={d} className="text-[8.5px] uppercase tracking-wider">{d}</span>
        ))}
      </div>

      {/* Ячейки календаря */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />
          const date = new Date(year, month, day)
          const isToday = isCurrentMonth && day === today.getDate()
          const weekend = i % 7 >= 5
          
          const hasDeadline = dayDeadlines.has(day)
          const hasTask = dayTasks.has(day)
          const isNonWork = isNonWorkingSpecialDay(date)
          const isPreHol = isPreHoliday(date)

          let textClass = 'text-slate-700 dark:text-slate-300'
          let bgClass = 'hover:bg-slate-900/5 dark:hover:bg-white/5'

          if (isToday) {
            textClass = 'text-white font-bold'
            bgClass = 'bg-blue-600 dark:bg-blue-600/70 border border-blue-500/50 shadow-md shadow-blue-500/10'
          } else if (showHolidays && isNonWork) {
            textClass = 'text-red-500 dark:text-red-400 font-extrabold'
            bgClass = 'bg-red-500/10 hover:bg-red-500/20'
          } else if (showHolidays && isPreHol) {
            textClass = 'text-amber-500 dark:text-amber-400 font-semibold'
            bgClass = 'bg-amber-500/10 hover:bg-amber-500/20'
          } else if (weekend) {
            textClass = 'text-red-500/60 dark:text-red-400/60 font-medium'
          }

          return (
            <div key={day} className="flex flex-col items-center justify-center relative">
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] tabular-nums transition-colors ${textClass} ${bgClass}`}>
                {day}
              </span>
              {/* Точки-индикаторы событий под цифрой */}
              <div className="flex gap-[2px] h-[3px] mt-0.5 justify-center">
                {showTax && hasDeadline && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                {showTasks && hasTask && <span className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Чекбоксы настроек под календарем */}
      <div className="border-t border-slate-900/5 dark:border-white/5 pt-2 mt-1 space-y-1.5 text-[9.5px]">
        <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none">
          <input
            type="checkbox"
            checked={showTax}
            onChange={toggleTax}
            className="rounded w-3.5 h-3.5 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-white/10 accent-blue-600"
          />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <span>Дедлайны налогов</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none">
          <input
            type="checkbox"
            checked={showTasks}
            onChange={toggleTasks}
            className="rounded w-3.5 h-3.5 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-white/10 accent-blue-600"
          />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
          <span>Задачи бухгалтера</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none">
          <input
            type="checkbox"
            checked={showHolidays}
            onChange={toggleHolidays}
            className="rounded w-3.5 h-3.5 bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-white/10 accent-blue-600"
          />
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 flex-shrink-0" />
          <span>Выходные и праздники</span>
        </label>
      </div>
    </div>
  )
}
