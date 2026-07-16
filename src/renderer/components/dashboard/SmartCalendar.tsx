import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'
import { dayTooltip, getMonthNorms, getSpecialDay, isNonWorkingSpecialDay, isPreHoliday, isTransferredWorkday, workdayStats } from '../../data/uzHolidays'

export interface CalendarMarks { deadlines: Set<number>; tasks: Set<number> }
export interface CalendarEntry { id: string; date: string; title: string; type: string; priority?: string }

interface Props {
  marks: CalendarMarks
  entries: CalendarEntry[]
  onOpen: () => void
  onAdd: (date: string) => void
  onOpenEntry: (id: string) => void
}

export default function SmartCalendar({ marks, entries, onOpen, onAdd, onOpenEntry }: Props) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const [selectedDay, setSelectedDay] = useState(today)
  const monthName = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const workdays = workdayStats(year, month)
  const norms = getMonthNorms(month + 1)
  const cells: (number | null)[] = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const selectedDate = isoDate(year, month, selectedDay)
  const selectedEntries = entries.filter(entry => entry.date === selectedDate)
  const selectedDateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[26px] border border-bx-border bg-bx-surface p-5 shadow-sm" aria-label="Производственный и налоговый календарь">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name="planner" className="h-4.5 w-4.5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Рабочий календарь</p><h2 className="mt-0.5 text-base font-black capitalize text-bx-text">{monthName}</h2></div></div>
        <button onClick={onOpen} className="flex min-h-9 items-center gap-1.5 rounded-xl border border-bx-border bg-bx-bg px-3 text-[10px] font-bold text-bx-text transition-colors hover:border-blue-500/40">В планировщик <Icon name="arrowR" className="h-3.5 w-3.5" /></button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[9px] font-semibold text-bx-muted"><Icon name="info" className="h-3.5 w-3.5" />Наведите на дату — задачи появятся под календарём.</p>
      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, i) => <span key={label} className={`pb-1 text-[9px] font-extrabold uppercase tracking-wider ${i >= 5 ? 'text-rose-500' : 'text-bx-muted'}`}>{label}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />
          const date = new Date(year, month, day)
          const special = getSpecialDay(date)
          const isToday = day === today
          const isSelected = day === selectedDay
          const weekend = i % 7 >= 5
          const hasDeadline = marks.deadlines.has(day)
          const hasTask = marks.tasks.has(day)
          const entryCount = entries.filter(entry => entry.date === isoDate(year, month, day)).length
          const isPreHol = isPreHoliday(date)
          const isNonWork = isNonWorkingSpecialDay(date)
          const isTransWork = isTransferredWorkday(date)
          const description = dayTooltip(date) || (hasDeadline ? 'Есть бухгалтерский срок' : hasTask ? 'Есть задача' : weekend ? 'Выходной' : 'Рабочий день')
          const tone = isToday ? 'bg-blue-600 text-white ring-2 ring-blue-500/20' : isNonWork ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300' : isPreHol ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300' : isTransWork ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : weekend ? 'border-rose-500/15 bg-rose-500/[0.045] text-rose-500' : 'border-transparent text-bx-text hover:border-blue-500/25 hover:bg-blue-500/[0.06]'
          return (
            <button key={day} type="button" onMouseEnter={() => setSelectedDay(day)} onFocus={() => setSelectedDay(day)} onClick={() => setSelectedDay(day)} aria-pressed={isSelected} title={description} aria-label={`${day} ${monthName}: ${entryCount ? `${entryCount} задач` : description}${special ? `, ${special.name}` : ''}`} className={`relative flex min-h-9 flex-col items-center justify-center rounded-xl border text-xs font-bold tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${tone} ${isSelected && !isToday ? 'ring-2 ring-blue-500/35' : ''}`}>
              {day}
              <span className="absolute bottom-0.5 flex h-1 gap-0.5">{hasDeadline && <span className="h-1 w-1 rounded-full bg-amber-400" />}{hasTask && <span className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500'}`} />}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/[0.07] to-violet-500/[0.04] p-3" aria-live="polite">
        <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="text-[8px] font-extrabold uppercase tracking-[0.13em] text-blue-600 dark:text-blue-300">Выбранный день</p><h3 className="mt-0.5 truncate text-xs font-black capitalize text-bx-text">{selectedDateLabel}</h3></div><button onClick={() => onAdd(selectedDate)} className="flex min-h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-[10px] font-extrabold text-white shadow-md shadow-blue-600/15 hover:bg-blue-500"><Icon name="plus" className="h-3.5 w-3.5" />Добавить</button></div>
        <div className="mt-2 space-y-1.5">
          {selectedEntries.slice(0, 3).map(entry => <button key={entry.id} onClick={() => onOpenEntry(entry.id)} className="flex min-h-9 w-full items-center gap-2 rounded-xl border border-bx-border/60 bg-bx-surface/80 px-2.5 text-left hover:border-blue-500/30"><span className={`h-2 w-2 flex-shrink-0 rounded-full ${entry.type === 'tax_deadline' ? 'bg-amber-500' : entry.priority === 'high' ? 'bg-rose-500' : 'bg-blue-500'}`} /><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-bx-text">{entry.title}</span><span className="text-[8px] font-bold uppercase text-bx-muted">{entry.type === 'tax_deadline' ? 'срок' : 'задача'}</span><Icon name="arrowR" className="h-3 w-3 text-bx-muted" /></button>)}
          {!selectedEntries.length && <div className="flex min-h-10 items-center gap-2 rounded-xl border border-dashed border-bx-border px-3 text-[10px] text-bx-muted"><Icon name="check" className="h-3.5 w-3.5 text-emerald-500" />На эту дату задач нет — можно запланировать новую.</div>}
          {selectedEntries.length > 3 && <button onClick={onOpen} className="w-full text-center text-[9px] font-bold text-blue-600 dark:text-blue-300">Ещё {selectedEntries.length - 3} в планировщике</button>}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-bx-border pt-3"><CalendarMetric value={workdays.total} label="рабочих дней" /><CalendarMetric value={workdays.left} label="осталось" /><CalendarMetric value={norms?.hours40_5 ?? '—'} label="часов по норме" /></div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold text-bx-muted"><Legend color="bg-amber-400" label="дедлайн" /><Legend color="bg-blue-500" label="задача" /><Legend color="bg-rose-400" label="выходной / праздник" /></div>
    </section>
  )
}

function isoDate(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
function CalendarMetric({ value, label }: { value: string | number; label: string }) { return <div className="rounded-xl bg-bx-bg px-2 py-2 text-center"><p className="text-sm font-black tabular-nums text-bx-text">{value}</p><p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-bx-muted">{label}</p></div> }
function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span> }
