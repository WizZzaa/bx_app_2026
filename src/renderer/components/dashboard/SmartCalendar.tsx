import React from 'react'
import { holidayName, workdayStats, getSpecialDay, dayTooltip, isPreHoliday, isNonWorkingSpecialDay, isTransferredWorkday, getMonthNorms } from '../../data/uzHolidays'

// Умный календарь: производственный (выходные + праздники РУз 2026)
// совмещён с налоговым (дедлайны) и задачами. Используется на главной и Рабочем столе.

export interface CalendarMarks {
  deadlines: Set<number>
  tasks: Set<number>
}

export default function SmartCalendar({ marks, onOpen }: { marks: CalendarMarks; onOpen: () => void }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const monthName = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Пн = 0
  const workdays = workdayStats(year, month)
  const norms = getMonthNorms(month + 1)
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <button
      onClick={onOpen}
      className="text-left rounded-2xl bg-bx-surface border border-bx-border hover:border-blue-500/40 transition-colors p-4 flex flex-col"
      aria-label="Открыть производственный + налоговый календарь"
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-bx-text capitalize">{monthName}</span>
        <span className="text-[10px] text-bx-muted">произв. + налоговый</span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center flex-1">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
          <span key={d} className={`text-[9px] font-semibold uppercase ${i >= 5 ? 'text-red-400/60' : 'text-bx-muted'}`}>{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} />
          const date = new Date(year, month, day)
          const special = getSpecialDay(date)
          const holiday = holidayName(date)
          const isToday = day === today
          const weekend = i % 7 >= 5
          const hasDeadline = marks.deadlines.has(day)
          const hasTask = marks.tasks.has(day)
          const tip = dayTooltip(date)
          const isPreHol = isPreHoliday(date)
          const isNonWork = isNonWorkingSpecialDay(date)
          const isTransWork = isTransferredWorkday(date)

          // Определение стиля числа
          let numClass = 'text-bx-text'
          if (isToday) numClass = 'bg-blue-600 text-white font-bold'
          else if (isNonWork) numClass = 'bg-red-500/15 text-red-400 font-semibold'
          else if (isPreHol) numClass = 'bg-amber-500/10 text-amber-400 font-semibold'
          else if (isTransWork) numClass = 'bg-emerald-500/10 text-emerald-400 font-semibold'
          else if (weekend) numClass = 'text-red-400/70'

          return (
            <span key={day} className="flex flex-col items-center gap-[2px]" title={tip ?? undefined}>
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] tabular-nums ${numClass}`}
              >
                {day}
              </span>
              <span className="flex gap-[3px] h-[4px]">
                {hasDeadline && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                {hasTask && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                {isPreHol && !hasDeadline && !hasTask && <span className="w-1 h-1 rounded-full bg-amber-400/50" />}
              </span>
            </span>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[9px] text-bx-muted flex-wrap gap-y-1">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />дедлайн</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />задача</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />праздник</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />предпразд.</span>
        </span>
        <span className="tabular-nums">
          раб. дней: {workdays.total} · осталось {workdays.left}
          {norms && <> · {norms.hours40_5}ч</>}
        </span>
      </div>
    </button>
  )
}
