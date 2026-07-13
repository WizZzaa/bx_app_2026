import React, { useState, useMemo } from 'react'
import type { BxEvent } from './useEvents'
import { toLocalISO } from '../../lib/dates'
import { holidayName, getSpecialDay, dayTooltip, isPreHoliday, isNonWorkingSpecialDay, isTransferredWorkday, getMonthNorms } from '../../data/uzHolidays'
import { deadlinesForMonth } from '../../data/taxCalendar'

export interface CalCard {
  id: string
  title: string
  due_date: string
  board_id: string
  column_id: string
  priority: string
}

interface Props {
  events: BxEvent[]
  cards?: CalCard[]
  boards?: any[]
  onDayClick: (date: string) => void
  onAddEvent: (date: string) => void
  onEventClick: (e: BxEvent) => void
  onCardClick?: (id: string) => void
  onEventDrop?: (id: string, date: string) => void
  onCardDrop?: (id: string, date: string) => void
}

const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

const TYPE_COLOR: Record<string, string> = {
  task:         'bg-emerald-500',
  tax_deadline: 'bg-blue-500',
  reminder:     'bg-amber-500',
  event:        'bg-purple-500',
}

const toISO = toLocalISO

/** Понедельник недели, в которую входит дата. */
const mondayOf = (d: Date): Date => {
  const r = new Date(d)
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

/** Составить текст тултипа из всех элементов дня. */
const buildTooltip = (day: Date, dayEvents: BxEvent[], dayCards: CalCard[], deadlineTexts: string[]): string => {
  const parts: string[] = []

  // Производственный календарь
  const calTip = dayTooltip(day)
  if (calTip) parts.push(calTip)

  // Налоговые дедлайны
  if (deadlineTexts.length > 0) {
    parts.push('📋 Налоговые дедлайны:')
    for (const t of deadlineTexts) parts.push(`  • ${t}`)
  }

  // События планировщика
  if (dayEvents.length > 0) {
    parts.push(`📌 Задач/событий: ${dayEvents.length}`)
  }

  // Карточки
  if (dayCards.length > 0) {
    parts.push(`📋 Карточек: ${dayCards.length}`)
  }

  return parts.join('\n')
}

export default function CalendarView({ events, cards = [], boards = [], onDayClick, onAddEvent, onEventClick, onCardClick, onEventDrop, onCardDrop }: Props) {
  const now = new Date()
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based
  const [weekStart, setWeekStart] = useState(() => mondayOf(now))
  const todayStr = toISO(now)

  const handlePrev = () => {
    if (mode === 'week') { setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() - 7); return n }); return }
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const handleNext = () => {
    if (mode === 'week') { setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() + 7); return n }); return }
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }
  const handleGoToday = () => {
    setYear(now.getFullYear()); setMonth(now.getMonth()); setWeekStart(mondayOf(now))
  }

  // Index events by date
  const byDate: Record<string, BxEvent[]> = {}
  for (const ev of events) {
    const k = ev.due_date || ev.date
    if (!byDate[k]) byDate[k] = []
    byDate[k].push(ev)
  }

  // Карточки с доски по дате
  const cardsByDate: Record<string, CalCard[]> = {}
  for (const cd of cards) {
    if (!cd.due_date) continue
    if (!cardsByDate[cd.due_date]) cardsByDate[cd.due_date] = []
    cardsByDate[cd.due_date].push(cd)
  }

  // Налоговые дедлайны текущего месяца
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, string[]>()
    const m0 = mode === 'week' ? weekStart.getMonth() : month
    const y = mode === 'week' ? weekStart.getFullYear() : year
    for (const { date, deadline } of deadlinesForMonth(y, m0)) {
      const arr = map.get(date) ?? []
      arr.push(deadline.title)
      map.set(date, arr)
    }
    return map
  }, [year, month, mode, weekStart])

  // Нормы рабочего времени текущего месяца
  const norms = useMemo(() => getMonthNorms(month + 1), [month])

  // ── Drag & drop ──
  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    const evId = e.dataTransfer.getData('bx/event')
    const cardId = e.dataTransfer.getData('bx/card')
    if (evId && onEventDrop) onEventDrop(evId, date)
    else if (cardId && onCardDrop) onCardDrop(cardId, date)
  }

  const EventChip = ({ ev }: { ev: BxEvent }) => (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('bx/event', ev.id); e.dataTransfer.effectAllowed = 'move' }}
      onClick={e => { e.stopPropagation(); onEventClick(ev) }}
      title={`${ev.title} (перетащите, чтобы перенести срок)`}
      className={`text-[9px] leading-tight px-1 py-0.5 rounded text-bx-text truncate cursor-grab active:cursor-grabbing hover:opacity-80 ${TYPE_COLOR[ev.type]} ${ev.status === 'done' ? 'opacity-40 line-through' : ''}`}>
      {ev.recurrence ? '🔁 ' : ''}{ev.title}
    </div>
  )

  const CardChip = ({ cd }: { cd: CalCard }) => {
    const isDone = () => {
      const brd = boards.find(b => b.id === cd.board_id)
      if (!brd || !brd.columns || brd.columns.length === 0) return false
      return brd.columns[brd.columns.length - 1].id === cd.column_id
    }
    const done = isDone()

    return (
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('bx/card', cd.id); e.dataTransfer.effectAllowed = 'move' }}
        onClick={e => { e.stopPropagation(); onCardClick?.(cd.id) }}
        title={`${cd.title} (перетащите, чтобы перенести срок)`}
        className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity ${
          done
            ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20 line-through opacity-50'
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
        }`}>
        📋 {cd.title}
      </div>
    )
  }

  /** Функция определения стиля ячейки дня. */
  const getDayClasses = (day: Date, ds: string, isWeekend: boolean) => {
    const isToday = ds === todayStr
    const isPast = ds < todayStr
    const special = getSpecialDay(day)
    const hasDeadlines = deadlinesByDate.has(ds)

    let borderClass = 'border-bx-border hover:border-bx-border-2'
    let bgClass = isWeekend ? 'bg-bx-bg' : 'bg-bx-bg'

    if (isToday) {
      borderClass = 'border-blue-500/60'
      bgClass = 'bg-blue-500/5'
    } else if (special) {
      switch (special.type) {
        case 'holiday':
          borderClass = 'border-red-500/30 hover:border-red-500/50'
          bgClass = 'bg-red-500/[0.06]'
          break
        case 'additional_off':
        case 'transferred_off':
          borderClass = 'border-red-500/20 hover:border-red-500/40'
          bgClass = 'bg-red-500/[0.03]'
          break
        case 'pre_holiday':
          borderClass = 'border-amber-500/25 hover:border-amber-500/45'
          bgClass = 'bg-amber-500/[0.04]'
          break
        case 'transferred_work':
          borderClass = 'border-emerald-500/25 hover:border-emerald-500/45'
          bgClass = 'bg-emerald-500/[0.04]'
          break
      }
    }

    if (hasDeadlines && !isToday && !special) {
      borderClass = 'border-blue-500/20 hover:border-blue-500/40'
    }

    return { borderClass, bgClass, isToday, isPast, special, hasDeadlines }
  }

  /** Цвет номера дня. */
  const getDayNumberClass = (day: Date, isToday: boolean, isWeekend: boolean) => {
    if (isToday) return 'bg-blue-600 text-white'
    const special = getSpecialDay(day)
    if (special) {
      switch (special.type) {
        case 'holiday': return 'text-red-400 font-bold'
        case 'additional_off':
        case 'transferred_off': return 'text-red-400/80 font-semibold'
        case 'pre_holiday': return 'text-amber-400 font-semibold'
        case 'transferred_work': return 'text-emerald-400 font-semibold'
      }
    }
    if (isWeekend) return 'text-bx-muted'
    return 'text-bx-text'
  }

  /** Короткая метка рядом с числом. */
  const getDayLabel = (day: Date): React.ReactNode => {
    const special = getSpecialDay(day)
    if (!special) return null
    switch (special.type) {
      case 'holiday':
        return <span className="text-[7px] text-red-400/80 truncate leading-tight">🎉 {special.name}</span>
      case 'additional_off':
      case 'transferred_off':
        return <span className="text-[7px] text-red-400/60 truncate leading-tight">🔴 выходной</span>
      case 'pre_holiday':
        return <span className="text-[7px] text-amber-400/70 truncate leading-tight">⏰ −1ч</span>
      case 'transferred_work':
        return <span className="text-[7px] text-emerald-400/70 truncate leading-tight">🔧 рабочая</span>
    }
  }

  // ── Заголовок периода ──
  const weekDays: Date[] = mode === 'week'
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d })
    : []
  const periodTitle = mode === 'month'
    ? `${MONTHS[month]} ${year}`
    : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0,3).toLowerCase()} — ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0,3).toLowerCase()} ${weekDays[6].getFullYear()}`

  // ── Сетка месяца ──
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1
    if (dayNum < 1 || dayNum > daysInMonth) { cells.push(null); continue }
    cells.push(new Date(year, month, dayNum))
  }
  const rows: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={handlePrev} aria-label="Предыдущий период" tabIndex={0} className="w-7 h-7 flex items-center justify-center rounded-lg bg-bx-surface-2 text-bx-muted hover:text-bx-text transition-colors">‹</button>
        <h2 className="text-base font-semibold text-bx-text min-w-[190px] text-center">{periodTitle}</h2>
        <button onClick={handleNext} aria-label="Следующий период" tabIndex={0} className="w-7 h-7 flex items-center justify-center rounded-lg bg-bx-surface-2 text-bx-muted hover:text-bx-text transition-colors">›</button>
        <button onClick={handleGoToday} aria-label="Перейти к сегодня" tabIndex={0} className="ml-2 text-xs px-2.5 py-1 bg-bx-surface-2 text-bx-muted hover:text-bx-text rounded-lg transition-colors">Сегодня</button>

        {/* Месяц / Неделя */}
        <div className="flex bg-bx-bg border border-bx-border rounded-lg p-0.5">
          {([['month','Месяц'],['week','Неделя']] as const).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} tabIndex={0} aria-label={`Вид: ${l}`}
              className={`px-2.5 py-0.5 text-[11px] rounded-md transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>{l}</button>
          ))}
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {[['tax_deadline','Дедлайн'],['task','Задача'],['reminder','Напомин.'],['event','Событие']].map(([type,label]) => (
            <span key={type} className="flex items-center gap-1 text-[10px] text-bx-muted">
              <span className={`w-2 h-2 rounded-full ${TYPE_COLOR[type]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-bx-muted">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Карточка
          </span>
          <span className="flex items-center gap-1 text-[10px] text-bx-muted">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Праздник
          </span>
          <span className="flex items-center gap-1 text-[10px] text-bx-muted">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Предпразд.
          </span>
        </div>
      </div>

      {/* Нормы рабочего времени */}
      {mode === 'month' && norms && (
        <div className="flex items-center gap-4 mb-2 px-1 text-[10px] text-bx-muted flex-shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            Раб. дней (5‑дн.): <span className="text-bx-text font-semibold">{norms.workdays5}</span>
          </span>
          <span className="flex items-center gap-1">
            Раб. дней (6‑дн.): <span className="text-bx-text font-semibold">{norms.workdays6}</span>
          </span>
          <span className="flex items-center gap-1">
            Норма часов (40ч/5дн): <span className="text-bx-text font-semibold">{norms.hours40_5}ч</span>
          </span>
          <span className="flex items-center gap-1">
            Выходных (5-дн.): <span className="text-bx-text font-semibold">{norms.offDays5}</span>
          </span>
        </div>
      )}

      {/* ── Неделя ── */}
      {mode === 'week' && (
        <div className="flex-1 grid grid-cols-7 gap-1.5 overflow-hidden">
          {weekDays.map((day, ci) => {
            const ds = toISO(day)
            const dayEvents = byDate[ds] ?? []
            const dayCards = cardsByDate[ds] ?? []
            const isWeekend = ci >= 5
            const { borderClass, bgClass, isToday, special, hasDeadlines } = getDayClasses(day, ds, isWeekend)
            const tip = buildTooltip(day, dayEvents, dayCards, deadlinesByDate.get(ds) ?? [])

            return (
              <div key={ds}
                onClick={() => onDayClick(ds)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, ds)}
                title={tip || undefined}
                className={`flex flex-col rounded-lg border p-2 cursor-pointer transition-all overflow-hidden group/cell ${borderClass} ${bgClass}`}
              >
                <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${getDayNumberClass(day, isToday, isWeekend)}`}>
                      {day.getDate()}
                    </span>
                    <span className={`text-[10px] uppercase ${isWeekend ? 'text-red-400/50' : 'text-bx-muted'}`}>{WEEKDAYS[ci]}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onAddEvent(ds) }}
                    title="Добавить задачу"
                    aria-label="Добавить задачу"
                    tabIndex={0}
                    className="w-5 h-5 flex items-center justify-center rounded-md bg-bx-surface-2 hover:bg-blue-600 hover:text-white text-bx-muted text-xs transition-all opacity-0 group-hover/cell:opacity-100"
                  >
                    +
                  </button>
                </div>
                {getDayLabel(day)}
                {hasDeadlines && (
                  <span className="text-[8px] text-blue-400/80 truncate mb-0.5">📋 Дедлайн</span>
                )}
                <div className="space-y-1 overflow-y-auto">
                  {dayEvents.map(ev => <EventChip key={ev.id} ev={ev} />)}
                  {dayCards.map(cd => <CardChip key={cd.id} cd={cd} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Месяц ── */}
      {mode === 'month' && (
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d,i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1 ${i >= 5 ? 'text-red-400/60' : 'text-bx-muted'}`}>{d}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} className="h-20 rounded-lg bg-bx-bg" />
                const ds = toISO(day)
                const dayEvents = byDate[ds] ?? []
                const dayCards = cardsByDate[ds] ?? []
                const isWeekend = ci >= 5
                const { borderClass, bgClass, isToday, isPast, special, hasDeadlines } = getDayClasses(day, ds, isWeekend)
                const tip = buildTooltip(day, dayEvents, dayCards, deadlinesByDate.get(ds) ?? [])

                return (
                  <div key={ci}
                    onClick={() => onDayClick(ds)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, ds)}
                    title={tip || undefined}
                    className={`h-20 rounded-lg border p-1.5 cursor-pointer transition-all overflow-hidden group/cell
                      ${borderClass} ${bgClass}
                      ${isPast && !isToday ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <div className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${getDayNumberClass(day, isToday, isWeekend)}`}>
                          {day.getDate()}
                        </div>
                        {getDayLabel(day)}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onAddEvent(ds) }}
                        title="Добавить задачу"
                        aria-label="Добавить задачу"
                        tabIndex={0}
                        className="w-4 h-4 rounded bg-bx-surface-2 hover:bg-blue-600 hover:text-white text-bx-muted text-[10px] flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity"
                      >
                        +
                      </button>
                    </div>
                    {hasDeadlines && !special && (
                      <div className="text-[7px] text-blue-400/70 truncate mb-0.5">📋 дедлайн</div>
                    )}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0,3).map(ev => <EventChip key={ev.id} ev={ev} />)}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-bx-muted">+{dayEvents.length - 3}</div>
                      )}
                      {dayCards.slice(0, Math.max(0, 3 - dayEvents.length) + 1).map(cd => <CardChip key={cd.id} cd={cd} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
