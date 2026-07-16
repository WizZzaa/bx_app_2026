import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../lib/ui/Icon'
import { toLocalISO } from '../../lib/dates'
import {
  getMonthNorms,
  getSpecialDay,
  specialDaysForMonth,
  UZ_PRODUCTION_CALENDAR_2026_SOURCES,
  type SpecialDay,
} from '../../data/uzHolidays'
import { deadlinesForMonth, type TaxDeadline } from '../../data/taxCalendar'
import type { BxEvent } from './useEvents'
import type { CompanyMember } from './useCompanyMembers'

export interface CalCard {
  id: string
  title: string
  due_date: string
  board_id: string
  column_id: string
  priority: string
}

interface CalBoard {
  id: string
  columns?: Array<{ id: string }>
}

interface Props {
  events: BxEvent[]
  cards?: CalCard[]
  boards?: CalBoard[]
  onDayClick: (date: string) => void
  onAddEvent: (date: string) => void
  onEventClick: (event: BxEvent) => void
  onEventStatusChange?: (id: string, status: BxEvent['status']) => void | Promise<void>
  onCardClick?: (id: string) => void
  onEventDrop?: (id: string, date: string) => void
  onCardDrop?: (id: string, date: string) => void
  onAddDeadline?: (date: string, deadline: TaxDeadline) => void
  members?: CompanyMember[]
  companyId?: string | null
  companyRegime?: string | null
}

const VERIFIED_CALENDAR_YEAR = 2026
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const TYPE_META: Record<BxEvent['type'], { label: string; dot: string; chip: string }> = {
  task: { label: 'Задача', dot: 'bg-emerald-500', chip: 'border-emerald-500/25 bg-emerald-500/10' },
  tax_deadline: { label: 'Дедлайн', dot: 'bg-blue-500', chip: 'border-blue-500/25 bg-blue-500/10' },
  reminder: { label: 'Напоминание', dot: 'bg-amber-500', chip: 'border-amber-500/25 bg-amber-500/10' },
  event: { label: 'Событие', dot: 'bg-purple-500', chip: 'border-purple-500/25 bg-purple-500/10' },
}

const STATUS_LABEL: Record<BxEvent['status'], string> = {
  todo: 'Запланировано',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
}

const STATUS_OPTIONS: Array<{
  value: BxEvent['status']
  label: string
  description: string
  dot: string
}> = [
  { value: 'todo', label: 'Запланировано', description: 'Задача ждёт начала', dot: 'bg-slate-400' },
  { value: 'in_progress', label: 'В работе', description: 'Исполнение началось', dot: 'bg-blue-500' },
  { value: 'review', label: 'На проверке', description: 'Нужна проверка результата', dot: 'bg-amber-500' },
  { value: 'done', label: 'Готово', description: 'Работа завершена', dot: 'bg-emerald-500' },
]

const SPECIAL_META: Record<SpecialDay['type'], { label: string; dot: string; box: string }> = {
  holiday: { label: 'Праздник', dot: 'bg-red-500', box: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300' },
  additional_off: { label: 'Дополнительный выходной', dot: 'bg-red-400', box: 'border-red-500/20 bg-red-500/[0.07] text-red-700 dark:text-red-300' },
  transferred_off: { label: 'Перенесённый выходной', dot: 'bg-rose-400', box: 'border-rose-500/20 bg-rose-500/[0.07] text-rose-700 dark:text-rose-300' },
  pre_holiday: { label: 'Сокращённый день', dot: 'bg-amber-500', box: 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300' },
  transferred_work: { label: 'Перенесённый рабочий день', dot: 'bg-emerald-500', box: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' },
}

const toISO = toLocalISO

const mondayOf = (date: Date): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

const formatFullDate = (date: Date): string => date.toLocaleDateString('ru-RU', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).replace(/\sг\.$/, '')

const formatWeekday = (date: Date): string => date.toLocaleDateString('ru-RU', { weekday: 'long' })

const formatCalendarDate = (date: Date): string => date.toLocaleDateString('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric',
}).replace(/\sг\.$/, '')

const formatShortDate = (dateISO: string): string => {
  const [year, month, day] = dateISO.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const specialDateISO = (year: number, special: SpecialDay): string =>
  `${year}-${String(special.month).padStart(2, '0')}-${String(special.day).padStart(2, '0')}`

export default function CalendarView({
  events,
  cards = [],
  boards = [],
  onDayClick,
  onAddEvent,
  onEventClick,
  onEventStatusChange,
  onCardClick,
  onEventDrop,
  onCardDrop,
  onAddDeadline,
  members = [],
  companyId,
  companyRegime,
}: Props) {
  const now = new Date()
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [weekStart, setWeekStart] = useState(() => mondayOf(now))
  const [previewDate, setPreviewDate] = useState(() => toISO(now))
  const [contextMenu, setContextMenu] = useState<{ event: BxEvent; x: number; y: number } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<BxEvent['status'] | null>(null)
  const previewHoverTimer = useRef<number | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const todayISO = toISO(now)

  const memberByUserId = useMemo(
    () => new Map(members.map(member => [member.user_id, member])),
    [members],
  )

  const eventsByDate = useMemo(() => {
    const result = new Map<string, BxEvent[]>()
    for (const event of events) {
      const date = event.due_date || event.date
      result.set(date, [...(result.get(date) ?? []), event])
    }
    return result
  }, [events])

  const cardsByDate = useMemo(() => {
    const result = new Map<string, CalCard[]>()
    for (const card of cards) {
      if (!card.due_date) continue
      result.set(card.due_date, [...(result.get(card.due_date) ?? []), card])
    }
    return result
  }, [cards])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + index)
    return date
  }), [weekStart])

  const visibleYear = mode === 'week' ? weekStart.getFullYear() : year
  const monthDeadlines = useMemo(
    () => year === VERIFIED_CALENDAR_YEAR
      ? deadlinesForMonth(year, month, companyRegime ?? undefined)
      : [],
    [year, month, companyRegime],
  )
  const weekDeadlines = useMemo(() => {
    const periods = new Map<string, { year: number; month: number }>()
    for (const day of weekDays) {
      periods.set(`${day.getFullYear()}-${day.getMonth()}`, { year: day.getFullYear(), month: day.getMonth() })
    }
    return [...periods.values()].flatMap(period => period.year === VERIFIED_CALENDAR_YEAR
      ? deadlinesForMonth(period.year, period.month, companyRegime ?? undefined)
      : [])
  }, [weekDays, companyRegime])
  const visibleDeadlines = mode === 'week' ? weekDeadlines : monthDeadlines
  const deadlinesByDate = useMemo(() => {
    const result = new Map<string, TaxDeadline[]>()
    for (const { date, deadline } of visibleDeadlines) {
      result.set(date, [...(result.get(date) ?? []), deadline])
    }
    return result
  }, [visibleDeadlines])
  const monthSpecialDays = useMemo(
    () => specialDaysForMonth(year, month),
    [year, month],
  )
  const norms = useMemo(() => getMonthNorms(month + 1, year), [month, year])

  const previewParts = previewDate.split('-').map(Number)
  const previewDay = new Date(previewParts[0], previewParts[1] - 1, previewParts[2])
  const previewSpecial = getSpecialDay(previewDay)
  const previewDeadlines = deadlinesByDate.get(previewDate) ?? []
  const previewEvents = eventsByDate.get(previewDate) ?? []
  const previewCards = cardsByDate.get(previewDate) ?? []

  const findDeadlineEvent = (date: string, deadline: TaxDeadline) => events.find(event =>
    event.company_id === companyId
    && (event.due_date || event.date) === date
    && (
      event.source_key === `tax:${deadline.id}:${date}`
      || (event.type === 'tax_deadline' && event.title === deadline.title)
    ),
  )

  const cancelPreviewChange = () => {
    if (previewHoverTimer.current !== null) {
      window.clearTimeout(previewHoverTimer.current)
      previewHoverTimer.current = null
    }
  }

  const showDate = (date: Date) => {
    cancelPreviewChange()
    setPreviewDate(toISO(date))
  }

  const previewDateWithIntent = (date: Date) => {
    cancelPreviewChange()
    previewHoverTimer.current = window.setTimeout(() => {
      setPreviewDate(toISO(date))
      previewHoverTimer.current = null
    }, 180)
  }

  useEffect(() => () => cancelPreviewChange(), [])

  useEffect(() => {
    if (!contextMenu) return
    const closeOnPointerDown = (pointerEvent: PointerEvent) => {
      if (!contextMenuRef.current?.contains(pointerEvent.target as Node)) setContextMenu(null)
    }
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') setContextMenu(null)
    }
    const closeMenu = () => setContextMenu(null)

    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    window.requestAnimationFrame(() => contextMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus())

    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [contextMenu])

  const openContextMenu = (event: BxEvent, clientX: number, clientY: number) => {
    const menuWidth = 280
    const menuHeight = 350
    setUpdatingStatus(null)
    setContextMenu({
      event,
      x: Math.max(8, Math.min(clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(clientY, window.innerHeight - menuHeight - 8)),
    })
  }

  const openContextMenuFromButton = (keyboardEvent: React.KeyboardEvent<HTMLButtonElement>, event: BxEvent) => {
    if (!(keyboardEvent.key === 'ContextMenu' || (keyboardEvent.shiftKey && keyboardEvent.key === 'F10'))) return
    keyboardEvent.preventDefault()
    keyboardEvent.stopPropagation()
    const rect = keyboardEvent.currentTarget.getBoundingClientRect()
    openContextMenu(event, rect.left + Math.min(rect.width, 220), rect.bottom + 6)
  }

  const changeStatusFromMenu = async (status: BxEvent['status']) => {
    if (!contextMenu || !onEventStatusChange) return
    if (status === contextMenu.event.status) {
      setContextMenu(null)
      return
    }
    setUpdatingStatus(status)
    await onEventStatusChange(contextMenu.event.id, status)
    setUpdatingStatus(null)
    setContextMenu(null)
  }

  const handlePrev = () => {
    if (mode === 'week') {
      setWeekStart(current => {
        const next = new Date(current)
        next.setDate(next.getDate() - 7)
        setPreviewDate(toISO(next))
        return next
      })
      return
    }
    const next = new Date(year, month - 1, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setPreviewDate(toISO(next))
  }

  const handleNext = () => {
    if (mode === 'week') {
      setWeekStart(current => {
        const next = new Date(current)
        next.setDate(next.getDate() + 7)
        setPreviewDate(toISO(next))
        return next
      })
      return
    }
    const next = new Date(year, month + 1, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setPreviewDate(toISO(next))
  }

  const handleGoToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setWeekStart(mondayOf(now))
    setPreviewDate(todayISO)
  }

  const handleDrop = (event: React.DragEvent, date: string) => {
    event.preventDefault()
    const eventId = event.dataTransfer.getData('bx/event')
    const cardId = event.dataTransfer.getData('bx/card')
    if (eventId && onEventDrop) onEventDrop(eventId, date)
    else if (cardId && onCardDrop) onCardDrop(cardId, date)
  }

  const isCardDone = (card: CalCard): boolean => {
    const board = boards.find(item => item.id === card.board_id)
    const finalColumn = board?.columns?.at(-1)
    return finalColumn?.id === card.column_id
  }

  const EventChip = ({ event, roomy = false }: { event: BxEvent; roomy?: boolean }) => {
    const meta = TYPE_META[event.type]
    return (
      <button
        type="button"
        draggable
        onDragStart={dragEvent => {
          dragEvent.dataTransfer.setData('bx/event', event.id)
          dragEvent.dataTransfer.effectAllowed = 'move'
        }}
        onClick={clickEvent => { clickEvent.stopPropagation(); onEventClick(event) }}
        onContextMenu={mouseEvent => {
          mouseEvent.preventDefault()
          mouseEvent.stopPropagation()
          openContextMenu(event, mouseEvent.clientX, mouseEvent.clientY)
        }}
        onKeyDown={keyboardEvent => openContextMenuFromButton(keyboardEvent, event)}
        title={`${event.title}. Перетащите, чтобы изменить срок. Правый клик — быстрый статус`}
        aria-haspopup="menu"
        className={`flex w-full items-center gap-1.5 border text-left leading-tight text-bx-text transition-colors hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${roomy ? 'min-h-10 rounded-lg px-2.5 py-2 text-xs' : 'min-h-6 rounded-md px-1.5 py-1 text-[11px]'} ${meta.chip} ${event.status === 'done' ? 'opacity-60 line-through' : ''}`}
      >
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${meta.dot}`} />
        <span className="truncate">{event.title}</span>
      </button>
    )
  }

  const CardChip = ({ card, roomy = false }: { card: CalCard; roomy?: boolean }) => {
    const done = isCardDone(card)
    return (
      <button
        type="button"
        draggable
        onDragStart={dragEvent => {
          dragEvent.dataTransfer.setData('bx/card', card.id)
          dragEvent.dataTransfer.effectAllowed = 'move'
        }}
        onClick={clickEvent => { clickEvent.stopPropagation(); onCardClick?.(card.id) }}
        title={`${card.title}. Карточка доски`}
        className={`flex w-full items-center gap-1.5 border text-left leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${roomy ? 'min-h-10 rounded-lg px-2.5 py-2 text-xs' : 'min-h-6 rounded-md px-1.5 py-1 text-[11px]'} ${
          done
            ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-bx-muted line-through opacity-60'
            : 'border-cyan-500/25 bg-cyan-500/10 text-bx-text hover:border-cyan-500/50'
        }`}
      >
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-500" />
        <span className="truncate">{card.title}</span>
      </button>
    )
  }

  const renderDay = (day: Date, weekdayIndex: number, layout: 'month' | 'week') => {
    const date = toISO(day)
    const dayEvents = eventsByDate.get(date) ?? []
    const dayCards = cardsByDate.get(date) ?? []
    const special = getSpecialDay(day)
    const deadlineCount = deadlinesByDate.get(date)?.length ?? 0
    const isToday = date === todayISO
    const isWeekend = weekdayIndex >= 5
    const isRegularWeekend = isWeekend && special?.type !== 'transferred_work'
    const isPreviewed = date === previewDate
    const maxVisible = layout === 'month' ? 2 : 8
    const visibleItems = [...dayEvents.map(event => ({ type: 'event' as const, event })), ...dayCards.map(card => ({ type: 'card' as const, card }))].slice(0, maxVisible)
    const hiddenCount = dayEvents.length + dayCards.length - visibleItems.length
    const specialMeta = special ? SPECIAL_META[special.type] : null

    return (
      <div
        key={date}
        data-calendar-date={date}
        onClick={() => showDate(day)}
        onMouseEnter={() => previewDateWithIntent(day)}
        onMouseLeave={cancelPreviewChange}
        onFocus={() => showDate(day)}
        onDragOver={event => event.preventDefault()}
        onDrop={event => handleDrop(event, date)}
        className={`group/day relative flex cursor-pointer flex-col rounded-xl border bg-bx-surface p-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          layout === 'month' ? 'min-h-[112px]' : 'min-h-[360px]'
        } ${
          isPreviewed
            ? 'border-blue-500/60 bg-blue-500/[0.07]'
            : specialMeta
              ? specialMeta.box
              : isRegularWeekend
                ? 'border-rose-300 bg-rose-50/80 hover:border-rose-400 dark:border-rose-500/35 dark:bg-rose-500/[0.08] dark:hover:border-rose-400/55'
                : 'border-bx-border hover:border-bx-border-2'
        }`}
      >
        {isRegularWeekend && (
          <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-rose-400/70 dark:bg-rose-400/60" />
        )}
        <div className="mb-1.5 flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={event => { event.stopPropagation(); onDayClick(date) }}
                aria-label={`Открыть ${formatFullDate(day)}. ${dayEvents.length} задач, ${deadlineCount} бухгалтерских сроков`}
                className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isToday ? 'bg-blue-600 text-white' : isRegularWeekend ? 'text-rose-700 dark:text-rose-300' : 'text-bx-text'
              }`}
              >
                {day.getDate()}
              </button>
              {layout === 'week' && <span className="text-xs font-semibold uppercase text-bx-muted">{WEEKDAYS[weekdayIndex]}</span>}
              {isRegularWeekend && !special && (
                <span className="line-clamp-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-rose-700 dark:text-rose-300">
                  {weekdayIndex === 5 ? 'выходной · 5-дн.' : 'выходной'}
                </span>
              )}
            </div>
            {special && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold leading-tight">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${specialMeta?.dot}`} />
                <span className="line-clamp-2">{special.name}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={event => { event.stopPropagation(); onAddEvent(date) }}
            aria-label={`Добавить задачу на ${formatFullDate(day)}`}
            title="Добавить задачу"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-bx-border bg-bx-surface-2 text-bx-muted opacity-100 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:opacity-0 lg:group-hover/day:opacity-100 lg:group-focus-within/day:opacity-100"
          >
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>

        {deadlineCount > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-blue-500/10 px-1.5 py-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {deadlineCount} бух. {deadlineCount === 1 ? 'срок' : 'срока'}
          </div>
        )}

        <div className="space-y-1">
          {visibleItems.map(item => item.type === 'event'
            ? <EventChip key={`event-${item.event.id}`} event={item.event} />
            : <CardChip key={`card-${item.card.id}`} card={item.card} />)}
          {hiddenCount > 0 && (
            <span className="block px-1 text-[10px] font-semibold text-bx-muted">Ещё {hiddenCount} — наведите или откройте день</span>
          )}
        </div>
      </div>
    )
  }

  const renderWeekDay = (day: Date, weekdayIndex: number) => {
    const date = toISO(day)
    const dayEvents = eventsByDate.get(date) ?? []
    const dayCards = cardsByDate.get(date) ?? []
    const deadlines = deadlinesByDate.get(date) ?? []
    const special = getSpecialDay(day)
    const specialMeta = special ? SPECIAL_META[special.type] : null
    const isToday = date === todayISO
    const isWeekend = weekdayIndex >= 5 && special?.type !== 'transferred_work'
    const isPreviewed = date === previewDate
    const items = [
      ...dayEvents.map(event => ({ type: 'event' as const, event })),
      ...dayCards.map(card => ({ type: 'card' as const, card })),
    ]

    return (
      <article
        key={date}
        data-calendar-date={date}
        data-calendar-layout="week"
        onMouseEnter={() => previewDateWithIntent(day)}
        onMouseLeave={cancelPreviewChange}
        onFocus={() => showDate(day)}
        onDragOver={event => event.preventDefault()}
        onDrop={event => handleDrop(event, date)}
        className={`relative grid overflow-hidden rounded-2xl border transition-colors sm:grid-cols-[150px_minmax(0,1fr)] ${
          isPreviewed
            ? 'border-blue-500/60 bg-blue-500/[0.06] ring-1 ring-blue-500/10'
            : specialMeta
              ? specialMeta.box
              : isWeekend
                ? 'border-rose-300 bg-rose-50/80 dark:border-rose-500/35 dark:bg-rose-500/[0.08]'
                : 'border-bx-border bg-bx-surface hover:border-bx-border-2'
        }`}
      >
        {isWeekend && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-rose-400/75" />}
        <div className="flex items-center gap-3 border-b border-bx-border/70 px-3 py-3 sm:flex-col sm:items-stretch sm:justify-center sm:border-b-0 sm:border-r">
          <button
            type="button"
            onClick={() => showDate(day)}
            aria-label={`Показать справа ${formatFullDate(day)}`}
            aria-pressed={isPreviewed}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors hover:bg-bx-surface-2/70 focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-2"
          >
            <span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl text-lg font-black tabular-nums ${isToday ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-text'}`}>{day.getDate()}</span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-bx-text">{formatWeekday(day)}</span>
              <span className="mt-0.5 block text-[10px] font-semibold text-bx-muted">{formatShortDate(date)}{isToday ? ' · сегодня' : ''}</span>
            </span>
          </button>
          {(isWeekend || special) && (
            <span className={`hidden text-[10px] font-bold leading-snug sm:block ${isWeekend ? 'text-rose-700 dark:text-rose-300' : ''}`}>
              {special?.name ?? (weekdayIndex === 5 ? 'Выходной · пятидневка' : 'Выходной')}
            </span>
          )}
        </div>

        <div className="min-w-0 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {deadlines.length > 0 && (
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-blue-500/10 px-2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {deadlines.length} бух. {deadlines.length === 1 ? 'срок' : 'срока'}
              </span>
            )}
            {special && (
              <span className="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-red-500/10 px-2 text-[10px] font-bold text-red-700 dark:text-red-300">
                <span className={`h-1.5 w-1.5 rounded-full ${specialMeta?.dot}`} />
                {SPECIAL_META[special.type].label}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDayClick(date)}
                className="min-h-10 rounded-xl px-3 text-[11px] font-bold text-bx-muted outline-none transition-colors hover:bg-bx-surface-2 hover:text-bx-text focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Открыть день
              </button>
              <button
                type="button"
                onClick={() => onAddEvent(date)}
                aria-label={`Добавить задачу на ${formatFullDate(day)}`}
                className="grid h-10 w-10 place-items-center rounded-xl border border-bx-border bg-bx-surface-2 text-bx-muted outline-none transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
          </div>

          {items.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {items.map(item => item.type === 'event'
                ? <EventChip key={`week-event-${item.event.id}`} event={item.event} roomy />
                : <CardChip key={`week-card-${item.card.id}`} card={item.card} roomy />)}
            </div>
          ) : (
            <div className="flex min-h-10 items-center rounded-xl border border-dashed border-bx-border px-3 text-[11px] font-medium text-bx-muted">
              Свободный день · можно запланировать задачу
            </div>
          )}
        </div>
      </article>
    )
  }

  const periodTitle = mode === 'month'
    ? `${MONTHS[month]} ${year}`
    : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0, 3).toLowerCase()} — ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0, 3).toLowerCase()} ${weekDays[6].getFullYear()}`

  const weekStats = useMemo(() => ({
    events: weekDays.reduce((sum, day) => sum + (eventsByDate.get(toISO(day))?.length ?? 0), 0),
    deadlines: weekDays.reduce((sum, day) => sum + (deadlinesByDate.get(toISO(day))?.length ?? 0), 0),
  }), [weekDays, eventsByDate, deadlinesByDate])

  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7
  const monthCells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startWeekday + 1
    return dayNumber > 0 && dayNumber <= daysInMonth ? new Date(year, month, dayNumber) : null
  })

  const PreviewPanel = () => (
    <aside
      aria-label="Предпросмотр дня"
      onMouseEnter={cancelPreviewChange}
      className="rounded-2xl border border-bx-border bg-bx-surface p-4 shadow-sm lg:sticky lg:top-0"
    >
      <div className="flex items-start justify-between gap-3 border-b border-bx-border pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">Что в этот день</p>
          <h3 className="mt-1 leading-tight">
            <span className="block text-base font-bold capitalize text-bx-text">{formatWeekday(previewDay)}</span>
            <span className="mt-1 block text-sm font-semibold text-bx-muted">{formatCalendarDate(previewDay)}</span>
          </h3>
          <p className="mt-1.5 text-[10px] leading-relaxed text-bx-muted">Наведение срабатывает после короткой паузы — панель не переключается, пока вы ведёте к ней курсор.</p>
        </div>
        <button
          type="button"
          onClick={() => onAddEvent(previewDate)}
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bx-surface"
          aria-label={`Добавить задачу на ${formatFullDate(previewDay)}`}
          title="Добавить задачу"
        >
          <Icon name="plus" className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {previewSpecial && (
          <div className={`rounded-xl border p-3 ${SPECIAL_META[previewSpecial.type].box}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={`h-2 w-2 rounded-full ${SPECIAL_META[previewSpecial.type].dot}`} />
              {SPECIAL_META[previewSpecial.type].label}
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-snug">{previewSpecial.name}</p>
            {previewSpecial.note && <p className="mt-1 text-xs leading-relaxed opacity-80">{previewSpecial.note}</p>}
          </div>
        )}

        {previewDeadlines.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-bx-text">Бухгалтерские сроки</h4>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">{previewDeadlines.length}</span>
            </div>
            <div className="space-y-2">
              {previewDeadlines.map(deadline => {
                const existingEvent = findDeadlineEvent(previewDate, deadline)
                return (
                  <div key={deadline.id} className="rounded-xl border border-bx-border bg-bx-bg p-3">
                    <p className="text-xs font-semibold leading-snug text-bx-text">{deadline.title}</p>
                    <p className="mt-1 text-[11px] text-bx-muted">{deadline.taxType}{deadline.law ? ` · ${deadline.law}` : ''}</p>
                    <button
                      type="button"
                      onClick={() => existingEvent ? onEventClick(existingEvent) : onAddDeadline?.(previewDate, deadline)}
                      disabled={!existingEvent && (!onAddDeadline || !companyId)}
                      className="mt-2 min-h-8 rounded-lg px-2.5 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
                    >
                      {existingEvent ? 'Открыть задачу' : 'Добавить в задачи'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {previewEvents.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold text-bx-text">Задачи и события</h4>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{previewEvents.length}</span>
            </div>
            <div className="space-y-2">
              {previewEvents.map(event => (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  onContextMenu={mouseEvent => {
                    mouseEvent.preventDefault()
                    openContextMenu(event, mouseEvent.clientX, mouseEvent.clientY)
                  }}
                  onKeyDown={keyboardEvent => openContextMenuFromButton(keyboardEvent, event)}
                  aria-haspopup="menu"
                  title="Правый клик — быстрый статус"
                  className="w-full rounded-xl border border-bx-border bg-bx-bg p-3 text-left transition-colors hover:border-blue-500/40 hover:bg-blue-500/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-bx-text">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${TYPE_META[event.type].dot}`} />
                    <span className="leading-snug">{event.title}</span>
                  </span>
                  <span className="mt-1.5 block text-[11px] text-bx-muted">
                    {TYPE_META[event.type].label} · {STATUS_LABEL[event.status]}
                    {event.assignee_id ? ` · ${memberByUserId.get(event.assignee_id)?.invited_email ?? 'исполнитель'}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {previewCards.length > 0 && (
          <section>
            <h4 className="mb-2 text-xs font-bold text-bx-text">Карточки доски · {previewCards.length}</h4>
            <div className="space-y-2">{previewCards.map(card => <CardChip key={card.id} card={card} />)}</div>
          </section>
        )}

        {!previewSpecial && previewDeadlines.length === 0 && previewEvents.length === 0 && previewCards.length === 0 && (
          <div className="rounded-xl border border-dashed border-bx-border p-5 text-center">
            <Icon name="planner" className="mx-auto h-6 w-6 text-bx-muted" />
            <p className="mt-2 text-sm font-semibold text-bx-text">День свободен</p>
            <p className="mt-1 text-xs leading-relaxed text-bx-muted">Наведите на другую дату или добавьте задачу.</p>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-3 flex flex-shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-bx-border bg-bx-surface px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={handlePrev} aria-label="Предыдущий период" className="grid h-10 w-10 place-items-center rounded-xl text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span aria-hidden="true" className="text-xl">‹</span>
          </button>
          <h2 className="min-w-[190px] text-center text-lg font-bold text-bx-text">{periodTitle}</h2>
          <button type="button" onClick={handleNext} aria-label="Следующий период" className="grid h-10 w-10 place-items-center rounded-xl text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span aria-hidden="true" className="text-xl">›</span>
          </button>
          <button type="button" onClick={handleGoToday} className="min-h-10 rounded-xl border border-bx-border px-3 text-xs font-semibold text-bx-muted transition-colors hover:border-blue-500/40 hover:text-bx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Сегодня</button>
        </div>

        <div className="ml-auto flex rounded-xl border border-bx-border bg-bx-bg p-1">
          {([['month', 'Месяц'], ['week', 'Неделя']] as const).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${mode === value ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-t border-bx-border pt-2 xl:w-auto xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
          {(Object.keys(TYPE_META) as BxEvent['type'][]).map(type => (
            <span key={type} className="flex items-center gap-1.5 text-[11px] font-medium text-bx-muted">
              <span className={`h-2 w-2 rounded-full ${TYPE_META[type].dot}`} />
              {TYPE_META[type].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-bx-muted"><span className="h-2 w-2 rounded-full bg-red-500" />Праздник</span>
        </div>
        {onEventStatusChange && (
          <div className="flex w-full items-center gap-1.5 border-t border-bx-border pt-2 text-[10px] font-semibold text-bx-muted xl:w-auto xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
            <Icon name="settings" className="h-3.5 w-3.5" />
            Правый клик по задаче — быстрый статус
          </div>
        )}
      </header>

      {mode === 'week' ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
          {visibleYear !== VERIFIED_CALENDAR_YEAR && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Проверенные бухгалтерские сроки и производственный календарь доступны для 2026 года. Для этой недели неподтверждённые даты не показываются.
            </div>
          )}
          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section aria-labelledby="week-agenda-title" className="min-w-0 rounded-2xl border border-bx-border bg-bx-bg p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-bx-border pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">Семь дней без горизонтальной прокрутки</p>
                  <h3 id="week-agenda-title" className="mt-1 text-base font-extrabold text-bx-text">Недельная повестка</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-bx-border bg-bx-surface px-2.5 py-1 text-[10px] font-bold text-bx-muted">{weekStats.events} задач и событий</span>
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">{weekStats.deadlines} бух. сроков</span>
                </div>
              </div>
              <div className="space-y-2">
                {weekDays.map((day, index) => renderWeekDay(day, index))}
              </div>
            </section>
            <PreviewPanel />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {norms && (
            <section aria-label="Норма рабочего времени" className="mb-3 grid grid-cols-2 gap-2 rounded-2xl border border-bx-border bg-bx-surface p-3 text-xs sm:grid-cols-4">
              <div><span className="block text-[10px] uppercase tracking-wide text-bx-muted">Рабочих дней · 5-дн.</span><strong className="mt-1 block text-base text-bx-text">{norms.workdays5}</strong></div>
              <div><span className="block text-[10px] uppercase tracking-wide text-bx-muted">Рабочих дней · 6-дн.</span><strong className="mt-1 block text-base text-bx-text">{norms.workdays6}</strong></div>
              <div><span className="block text-[10px] uppercase tracking-wide text-bx-muted">Норма · 40 ч</span><strong className="mt-1 block text-base text-bx-text">{norms.hours40_5} ч</strong></div>
              <div><span className="block text-[10px] uppercase tracking-wide text-bx-muted">Выходных · 5-дн.</span><strong className="mt-1 block text-base text-bx-text">{norms.offDays5}</strong></div>
            </section>
          )}

          {year !== VERIFIED_CALENDAR_YEAR && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <Icon name="alert" className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Проверенные бухгалтерские сроки и производственный календарь доступны для 2026 года. Для {year} года неподтверждённые даты не показываются.
            </div>
          )}

          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
            <section aria-label={`Календарь: ${periodTitle}`} className="min-w-0 rounded-2xl border border-bx-border bg-bx-bg p-2">
              <div className="sticky top-0 z-10 grid grid-cols-7 gap-1 border-b border-bx-border bg-bx-bg/95 pb-1 backdrop-blur">
                {WEEKDAYS.map((weekday, index) => (
                  <div key={weekday} className={`rounded-lg py-2 text-center text-xs font-bold uppercase tracking-wide ${index >= 5 ? 'bg-rose-500/[0.07] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'text-bx-muted'}`}>{weekday}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1.5">
                {monthCells.map((day, index) => day
                  ? renderDay(day, index % 7, 'month')
                  : <div key={`empty-${index}`} aria-hidden="true" className="min-h-[112px] rounded-xl border border-transparent bg-bx-surface/30" />)}
              </div>
            </section>
            <PreviewPanel />
          </div>

          <section className="mt-4 pb-6" aria-labelledby="month-dates-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">Весь месяц одним списком</p>
                <h3 id="month-dates-title" className="mt-1 text-lg font-bold text-bx-text">Важные даты · {MONTHS[month].toLowerCase()} {year}</h3>
              </div>
              <p className="max-w-xl text-right text-[11px] leading-relaxed text-bx-muted">Список учитывает режим компании. Условные обязательства добавляйте только после проверки применимости.</p>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-2xl border border-bx-border bg-bx-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-bx-text">Бухгалтерские сроки</h4>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">{monthDeadlines.length}</span>
                </div>
                {monthDeadlines.length > 0 ? (
                  <div className="space-y-2">
                    {monthDeadlines.map(({ date, deadline }) => {
                      const existingEvent = findDeadlineEvent(date, deadline)
                      return (
                        <div key={`${date}-${deadline.id}`} className="flex items-start gap-3 rounded-xl border border-bx-border bg-bx-bg p-3">
                          <button type="button" onClick={() => { setPreviewDate(date); onDayClick(date) }} className="min-w-[58px] rounded-lg bg-blue-500/10 px-2 py-2 text-center text-xs font-bold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300">{formatShortDate(date)}</button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-snug text-bx-text">{deadline.title}</p>
                            <p className="mt-1 text-[11px] text-bx-muted">{deadline.taxType} · {deadline.kind === 'payment' ? 'уплата' : deadline.kind === 'report' ? 'отчёт' : 'отчёт и уплата'}{deadline.law ? ` · ${deadline.law}` : ''}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => existingEvent ? onEventClick(existingEvent) : onAddDeadline?.(date, deadline)}
                            disabled={!existingEvent && (!onAddDeadline || !companyId)}
                            className="min-h-9 flex-shrink-0 rounded-lg border border-blue-500/20 px-2.5 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
                          >
                            {existingEvent ? 'Открыть' : 'В задачи'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-bx-border p-4 text-center text-xs text-bx-muted">Для выбранного месяца нет подтверждённых сроков.</p>
                )}
              </div>

              <div className="rounded-2xl border border-bx-border bg-bx-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-bx-text">Праздники и особые дни</h4>
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:text-red-300">{monthSpecialDays.length}</span>
                </div>
                {monthSpecialDays.length > 0 ? (
                  <div className="space-y-2">
                    {monthSpecialDays.map(special => {
                      const date = specialDateISO(year, special)
                      const meta = SPECIAL_META[special.type]
                      return (
                        <button
                          type="button"
                          key={`${special.month}-${special.day}-${special.type}`}
                          onClick={() => setPreviewDate(date)}
                          className="flex w-full items-start gap-3 rounded-xl border border-bx-border bg-bx-bg p-3 text-left transition-colors hover:border-red-500/30 hover:bg-red-500/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="min-w-[58px] rounded-lg bg-red-500/10 px-2 py-2 text-center text-xs font-bold text-red-700 dark:text-red-300">{formatShortDate(date)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-bx-text"><span className={`h-2 w-2 rounded-full ${meta.dot}`} />{special.name}</span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-bx-muted">{meta.label}{special.note ? ` · ${special.note}` : ''}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-bx-border p-4 text-center text-xs text-bx-muted">В этом месяце нет официальных особых дат.</p>
                )}
                {year === VERIFIED_CALENDAR_YEAR && (
                  <div className="mt-3 border-t border-bx-border pt-3 text-[10px] leading-relaxed text-bx-muted">
                    Источники: {UZ_PRODUCTION_CALENDAR_2026_SOURCES.map((source, index) => (
                      <React.Fragment key={source.url}>{index > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">{source.shortLabel}</a></React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          aria-label={`Быстрые действия: ${contextMenu.event.title}`}
          className="fixed z-50 w-[272px] overflow-hidden rounded-2xl border border-bx-border bg-bx-surface shadow-2xl shadow-black/20 outline-none"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="border-b border-bx-border bg-bx-surface-2/70 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">Быстрый статус</p>
            <p className="mt-1 truncate text-sm font-bold text-bx-text" title={contextMenu.event.title}>{contextMenu.event.title}</p>
            <p className="mt-1 text-[11px] text-bx-muted">Текущий: {STATUS_LABEL[contextMenu.event.status]}</p>
          </div>

          <div className="p-2">
            {STATUS_OPTIONS.map(status => {
              const selected = contextMenu.event.status === status.value
              const saving = updatingStatus === status.value
              return (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  key={status.value}
                  disabled={updatingStatus !== null}
                  onClick={() => void changeStatusFromMenu(status.value)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${selected ? 'bg-blue-500/10' : 'hover:bg-bx-surface-2'}`}
                >
                  <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${status.dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-bx-text">{saving ? 'Сохраняем…' : status.label}</span>
                    <span className="mt-0.5 block text-[10px] text-bx-muted">{status.description}</span>
                  </span>
                  {selected && <Icon name="check" className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />}
                </button>
              )
            })}
          </div>

          <div className="border-t border-bx-border p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const selectedEvent = contextMenu.event
                setContextMenu(null)
                onEventClick(selectedEvent)
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold text-bx-text outline-none transition-colors hover:bg-bx-surface-2 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Icon name="note" className="h-4 w-4 text-bx-muted" />
              Открыть карточку
              <Icon name="arrowR" className="ml-auto h-4 w-4 text-bx-muted" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
