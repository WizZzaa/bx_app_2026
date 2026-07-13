import React, { useState, useEffect, useMemo } from 'react'
import { useCompany } from '../lib/CompanyContext'
import { useEvents, type BxEvent, type EventStatus } from './planner/useEvents'
import { useCards, fetchDatedCards, fetchCardById, fetchBoardColumns, toggleCardDone, type DatedCard } from './planner/useCards'
import { useBoards } from './planner/useBoards'
import { toLocalISO } from '../lib/dates'
import { holidayName, getSpecialDay, dayTooltip, isPreHoliday, isNonWorkingSpecialDay, isTransferredWorkday, getMonthNorms, type SpecialDay } from '../data/uzHolidays'
import { deadlinesForMonth, type TaxDeadline } from '../data/taxCalendar'
import DailyTasksModal from './planner/DailyTasksModal'
import EventModal from './planner/EventModal'
import CardModal from './planner/CardModal'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const TYPE_COLOR: Record<string, string> = {
  task: 'bg-emerald-500',
  tax_deadline: 'bg-blue-500',
  reminder: 'bg-amber-500',
  event: 'bg-purple-500',
}

const mondayOf = (d: Date): Date => {
  const r = new Date(d)
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}

export default function CalendarPage() {
  const { active } = useCompany()
  const { events, add, update, remove, reload } = useEvents(active?.id ?? null)
  const { boards } = useBoards(active?.id ?? null)
  const [datedCards, setDatedCards] = useState<DatedCard[]>([])
  
  // Состояния текущей даты
  const now = new Date()
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [weekStart, setWeekStart] = useState(() => mondayOf(now))
  const todayStr = toLocalISO(now)

  // Выбранный день для открытия списка задач
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<BxEvent | null>(null)
  const [defDate, setDefDate] = useState('')

  // Состояние выбранной карточки Kanban
  const [activeCard, setActiveCard] = useState<any | null>(null)
  const [activeCardColumns, setActiveCardColumns] = useState<any[]>([])

  // Подключаем хук управления карточками
  const {
    updateCard,
    archiveCard,
    removeCard,
    duplicateCard,
    loadComments,
    addComment,
    removeComment
  } = useCards(activeCard?.board_id ?? null)
  
  // Чекбоксы настроек видимости (сохраняются в localStorage)
  const [showTax, setShowTax] = useState(() => localStorage.getItem('bx_cal_show_tax') !== 'false')
  const [showTasks, setShowTasks] = useState(() => localStorage.getItem('bx_cal_show_tasks') !== 'false')
  const [showHolidays, setShowHolidays] = useState(() => localStorage.getItem('bx_cal_show_holidays') !== 'false')

  useEffect(() => {
    fetchDatedCards().then(setDatedCards)
  }, [events])

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

  // Навигация
  const handlePrev = () => {
    if (mode === 'week') {
      setWeekStart(w => {
        const n = new Date(w)
        n.setDate(n.getDate() - 7)
        return n
      })
      return
    }
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
  }

  const handleNext = () => {
    if (mode === 'week') {
      setWeekStart(w => {
        const n = new Date(w)
        n.setDate(n.getDate() + 7)
        return n
      })
      return
    }
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
  }

  const handleGoToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setWeekStart(mondayOf(now))
  }

  // Индексация событий и карточек по датам
  const byDate = useMemo(() => {
    const map: Record<string, BxEvent[]> = {}
    events.forEach(ev => {
      const k = ev.due_date || ev.date
      if (!map[k]) map[k] = []
      map[k].push(ev)
    })
    return map
  }, [events])

  const cardsByDate = useMemo(() => {
    const map: Record<string, DatedCard[]> = {}
    datedCards.forEach(cd => {
      if (!cd.due_date) return
      if (!map[cd.due_date]) map[cd.due_date] = []
      map[cd.due_date].push(cd)
    })
    return map
  }, [datedCards])

  // Налоговые дедлайны текущего периода
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, TaxDeadline[]>()
    const m0 = mode === 'week' ? weekStart.getMonth() : month
    const y = mode === 'week' ? weekStart.getFullYear() : year
    deadlinesForMonth(y, m0).forEach(({ date, deadline }) => {
      const arr = map.get(date) ?? []
      arr.push(deadline)
      map.set(date, arr)
    })
    return map
  }, [year, month, mode, weekStart])

  // Нормы рабочего времени
  const norms = useMemo(() => getMonthNorms(month + 1), [month])

  // Тултип при наведении
  const [hoveredDay, setHoveredDay] = useState<{
    day: Date
    x: number
    y: number
    special: SpecialDay | null
    deadlines: TaxDeadline[]
    events: BxEvent[]
    cards: DatedCard[]
  } | null>(null)

  const handleMouseEnterDay = (e: React.MouseEvent, day: Date) => {
    const ds = toLocalISO(day)
    const rect = e.currentTarget.getBoundingClientRect()
    setHoveredDay({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
      special: getSpecialDay(day),
      deadlines: deadlinesByDate.get(ds) ?? [],
      events: byDate[ds] ?? [],
      cards: cardsByDate[ds] ?? []
    })
  }

  const handleMouseLeaveDay = () => {
    setHoveredDay(null)
  }

  // Определение стилей ячейки
  const getDayClasses = (day: Date, ds: string, isWeekend: boolean) => {
    const isToday = ds === todayStr
    const isPast = ds < todayStr
    const special = getSpecialDay(day)
    const hasDeadlines = deadlinesByDate.has(ds)

    let borderClass = 'border-bx-border hover:border-bx-border-2'
    let bgClass = isWeekend ? 'bg-bx-surface-2/20 dark:bg-bx-surface-2/5' : 'bg-bx-surface'

    if (isToday) {
      borderClass = 'border-blue-500/60'
      bgClass = 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]'
    } else if (special && showHolidays) {
      switch (special.type) {
        case 'holiday':
          borderClass = 'border-red-500/30 hover:border-red-500/50'
          bgClass = 'bg-red-500/[0.04]'
          break
        case 'additional_off':
        case 'transferred_off':
          borderClass = 'border-red-500/25 hover:border-red-500/40'
          bgClass = 'bg-red-500/[0.02]'
          break
        case 'pre_holiday':
          borderClass = 'border-amber-500/25 hover:border-amber-500/45'
          bgClass = 'bg-amber-500/[0.03]'
          break
        case 'transferred_work':
          borderClass = 'border-emerald-500/25 hover:border-emerald-500/45'
          bgClass = 'bg-emerald-500/[0.03]'
          break
      }
    }

    if (showTax && hasDeadlines && !isToday && !special) {
      borderClass = 'border-blue-500/20 hover:border-blue-500/40'
    }

    return { borderClass, bgClass, isToday, isPast, special, hasDeadlines }
  }

  const getDayNumberClass = (day: Date, isToday: boolean, isWeekend: boolean) => {
    if (isToday) return 'bg-blue-600 text-white font-bold'
    const special = getSpecialDay(day)
    if (special && showHolidays) {
      switch (special.type) {
        case 'holiday': return 'text-red-500 font-extrabold'
        case 'additional_off':
        case 'transferred_off': return 'text-red-500/80 font-bold'
        case 'pre_holiday': return 'text-amber-500 font-bold'
        case 'transferred_work': return 'text-emerald-600 dark:text-emerald-400 font-bold'
      }
    }
    if (isWeekend) return 'text-red-500/50 dark:text-red-400/50'
    return 'text-bx-text'
  }

  const getDayLabel = (day: Date): React.ReactNode => {
    if (!showHolidays) return null
    const special = getSpecialDay(day)
    if (!special) return null
    switch (special.type) {
      case 'holiday':
        return <span className="text-[7.5px] font-bold text-red-500 dark:text-red-400 truncate leading-none">🎉 {special.name}</span>
      case 'pre_holiday':
        return <span className="text-[7.5px] font-bold text-amber-500 truncate leading-none">⏰ −1ч</span>
      case 'transferred_work':
        return <span className="text-[7.5px] font-bold text-emerald-600 dark:text-emerald-400 truncate leading-none">🔧 раб. день</span>
      default:
        return <span className="text-[7.5px] font-bold text-red-400 truncate leading-none">🔴 вых.</span>
    }
  }

  // Расчет сетки периода
  const weekDays: Date[] = mode === 'week'
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d })
    : []

  const periodTitle = mode === 'month'
    ? `${MONTHS[month]} ${year}`
    : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0, 3).toLowerCase()} — ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0, 3).toLowerCase()} ${weekDays[6].getFullYear()}`

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

  async function openCardFromCalendar(id: string) {
    const card = await fetchCardById(id)
    if (!card) return
    const cols = await fetchBoardColumns(card.board_id)
    setActiveCardColumns(cols)
    setActiveCard(card)
  }

  return (
    <div className="flex flex-1 p-6 gap-6 overflow-hidden bg-bx-bg text-bx-text font-sans">
      
      {/* ЛЕВАЯ КОЛОНКА — Справка и фильтры в стиле Medcare */}
      <div className="w-[300px] flex flex-col gap-6 flex-shrink-0">
        
        {/* Блок Производственного календаря */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h3 className="font-extrabold text-sm text-bx-text">Производственные нормы</h3>
          </div>
          {norms ? (
            <div className="space-y-3.5 text-xs text-bx-muted">
              <div className="flex justify-between items-center py-1.5 border-b border-bx-border/50">
                <span>Рабочих дней (5-дн.):</span>
                <span className="font-extrabold text-bx-text text-right">{norms.workdays5}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-bx-border/50">
                <span>Рабочих дней (6-дн.):</span>
                <span className="font-extrabold text-bx-text text-right">{norms.workdays6}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-bx-border/50">
                <span>Норма часов (40ч):</span>
                <span className="font-extrabold text-bx-text text-right">{norms.hours40_5}ч</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-bx-border/50">
                <span>Норма часов (36ч):</span>
                <span className="font-extrabold text-bx-text text-right">{norms.hours36_6}ч</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span>Выходных (5-дн.):</span>
                <span className="font-extrabold text-bx-text text-right">{norms.offDays5}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-bx-muted">Нет данных по нормам месяца.</div>
          )}
          
          <div className="bg-bx-surface-2 p-3.5 rounded-xl border border-bx-border/50 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Справочно</span>
            <div className="text-xs flex justify-between text-bx-text">
              <span>МРОТ (2026 г.):</span>
              <span className="font-bold">1 360 000 сум</span>
            </div>
            <div className="text-xs flex justify-between text-bx-text">
              <span>БРВ (2026 г.):</span>
              <span className="font-bold">440 000 сум</span>
            </div>
          </div>
        </div>

        {/* Настройки и фильтры календаря */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-sm text-bx-text flex items-center gap-2">
            <span>⚙️</span> Настройка видов
          </h3>
          <div className="flex flex-col gap-3 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-bx-text select-none">
              <input
                type="checkbox"
                checked={showTax}
                onChange={toggleTax}
                className="rounded w-4 h-4 bg-bx-surface-2 border-bx-border text-blue-600 focus:ring-blue-500/20"
              />
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span>Бухгалтерские дедлайны</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-bx-text select-none">
              <input
                type="checkbox"
                checked={showTasks}
                onChange={toggleTasks}
                className="rounded w-4 h-4 bg-bx-surface-2 border-bx-border text-blue-600 focus:ring-blue-500/20"
              />
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Задачи и события</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-bx-text select-none">
              <input
                type="checkbox"
                checked={showHolidays}
                onChange={toggleHolidays}
                className="rounded w-4 h-4 bg-bx-surface-2 border-bx-border text-blue-600 focus:ring-blue-500/20"
              />
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <span>Праздники и выходные</span>
            </label>
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ОБЛАСТЬ — Полноразмерный календарь в стиле Medcare */}
      <div className="flex-1 bg-bx-surface border border-bx-border rounded-2xl p-6 shadow-sm flex flex-col overflow-hidden">
        
        {/* Навигационная панель календаря */}
        <div className="flex items-center gap-4 mb-5 flex-shrink-0 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-xl bg-bx-surface-2 border border-bx-border text-bx-text hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-lg font-bold">‹</button>
            <h2 className="text-lg font-black text-bx-text min-w-[210px] text-center capitalize">{periodTitle}</h2>
            <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-xl bg-bx-surface-2 border border-bx-border text-bx-text hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-lg font-bold">›</button>
            <button onClick={handleGoToday} className="text-xs px-3 py-1.5 bg-bx-surface-2 border border-bx-border hover:bg-slate-100 dark:hover:bg-white/5 text-bx-text rounded-xl font-semibold transition-colors cursor-pointer ml-1">Сегодня</button>
          </div>

          <div className="flex items-center gap-3">
            {/* Переключатель Месяц / Неделя */}
            <div className="flex bg-bx-surface-2 border border-bx-border rounded-xl p-0.5">
              {([['month', 'Месяц'], ['week', 'Неделя']] as const).map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${mode === m ? 'bg-blue-600 text-white shadow-sm' : 'text-bx-muted hover:text-bx-text'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Легенда */}
        <div className="flex gap-4 border-b border-bx-border/50 pb-3 mb-4 text-[10px] text-bx-muted flex-wrap">
          {showTax && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Бух. дедлайн
            </span>
          )}
          {showTasks && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Задача
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Напоминание
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block" /> Событие
              </span>
            </>
          )}
          {showHolidays && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30 inline-block" /> Выходной / праздник
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30 inline-block" /> Предпраздничный (-1ч)
              </span>
            </>
          )}
        </div>

        {/* РЕЖИМ: НЕДЕЛЯ */}
        {mode === 'week' && (
          <div className="flex-1 grid grid-cols-7 gap-3 overflow-hidden">
            {weekDays.map((day, ci) => {
              const ds = toLocalISO(day)
              const dayEvents = byDate[ds] ?? []
              const dayCards = cardsByDate[ds] ?? []
              const isWeekend = ci >= 5
              const { borderClass, bgClass, isToday, special, hasDeadlines } = getDayClasses(day, ds, isWeekend)
              
              const filteredEvents = dayEvents.filter(e => {
                if (e.type === 'tax_deadline' && !showTax) return false
                if (e.type !== 'tax_deadline' && !showTasks) return false
                return true
              })

              return (
                <div
                  key={ds}
                  onClick={() => setSelectedDay(ds)}
                  onMouseEnter={e => handleMouseEnterDay(e, day)}
                  onMouseLeave={handleMouseLeaveDay}
                  className={`flex flex-col rounded-2xl border p-3 cursor-pointer transition-all overflow-hidden group/cell ${borderClass} ${bgClass}`}
                >
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${getDayNumberClass(day, isToday, isWeekend)}`}>
                        {day.getDate()}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${isWeekend ? 'text-red-500/50' : 'text-bx-muted'}`}>{WEEKDAYS[ci]}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDefDate(ds); setEditingEvent(null); setEventModalOpen(true) }}
                      className="w-5 h-5 flex items-center justify-center rounded-lg bg-bx-surface-2 hover:bg-blue-600 hover:text-white text-bx-text text-xs transition-all opacity-0 group-hover/cell:opacity-100"
                    >
                      +
                    </button>
                  </div>
                  {getDayLabel(day)}
                  {showTax && hasDeadlines && (
                    <span className="text-[9px] text-blue-500 font-extrabold truncate mb-1">📋 Дедлайн налогов</span>
                  )}
                  <div className="space-y-1.5 overflow-y-auto mt-1 flex-1">
                    {filteredEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={e => { e.stopPropagation(); setEditingEvent(ev); setEventModalOpen(true) }}
                        className={`text-[9px] leading-tight px-1.5 py-1 rounded text-white truncate font-medium ${TYPE_COLOR[ev.type] || 'bg-slate-500'} ${ev.status === 'done' ? 'opacity-40 line-through' : ''}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {showTasks && dayCards.map(cd => (
                      <div
                        key={cd.id}
                        className="text-[9px] leading-tight px-1.5 py-1 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold truncate"
                      >
                        📋 {cd.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* РЕЖИМ: МЕСЯЦ */}
        {mode === 'month' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Заголовки дней недели */}
            <div className="grid grid-cols-7 mb-2 flex-shrink-0 border-b border-bx-border pb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`text-center text-xs font-black uppercase tracking-wider ${i >= 5 ? 'text-red-500/60 dark:text-red-400/60' : 'text-bx-muted'}`}>{d}</div>
              ))}
            </div>

            {/* Ячейки месяца */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-1.5 min-h-[85px]">
                  {row.map((day, ci) => {
                    if (!day) return <div key={ci} className="rounded-xl bg-bx-surface-2/30 border border-transparent" />
                    const ds = toLocalISO(day)
                    const dayEvents = byDate[ds] ?? []
                    const dayCards = cardsByDate[ds] ?? []
                    const isWeekend = ci >= 5
                    const { borderClass, bgClass, isToday, isPast, special, hasDeadlines } = getDayClasses(day, ds, isWeekend)
                    
                    const filteredEvents = dayEvents.filter(e => {
                      if (e.type === 'tax_deadline' && !showTax) return false
                      if (e.type !== 'tax_deadline' && !showTasks) return false
                      return true
                    })

                    return (
                      <div
                        key={ci}
                        onClick={() => setSelectedDay(ds)}
                        onMouseEnter={e => handleMouseEnterDay(e, day)}
                        onMouseLeave={handleMouseLeaveDay}
                        className={`rounded-2xl border p-2 cursor-pointer transition-all overflow-hidden flex flex-col justify-between group/cell relative
                          ${borderClass} ${bgClass}
                          ${isPast && !isToday ? 'opacity-65' : ''}
                        `}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <div className={`text-xs font-black w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${getDayNumberClass(day, isToday, isWeekend)}`}>
                                {day.getDate()}
                              </div>
                              {getDayLabel(day)}
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setDefDate(ds); setEditingEvent(null); setEventModalOpen(true) }}
                              className="w-4 h-4 rounded bg-bx-surface-2 hover:bg-blue-600 hover:text-white text-bx-text text-[10px] flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-pointer font-bold"
                            >
                              +
                            </button>
                          </div>

                          {showTax && hasDeadlines && !special && (
                            <div className="text-[7.5px] font-black text-blue-500 uppercase tracking-wide truncate mb-1">📋 Бух. дедлайн</div>
                          )}

                          <div className="space-y-1">
                            {filteredEvents.slice(0, 2).map(ev => (
                              <div
                                key={ev.id}
                                onClick={e => { e.stopPropagation(); setEditingEvent(ev); setEventModalOpen(true) }}
                                className={`text-[8.5px] font-bold leading-tight px-1 py-0.5 rounded text-white truncate ${TYPE_COLOR[ev.type] || 'bg-slate-500'} ${ev.status === 'done' ? 'opacity-40 line-through' : ''}`}
                              >
                                {ev.title}
                              </div>
                            ))}
                            {showTasks && dayEvents.length < 2 && dayCards.slice(0, 1).map(cd => (
                              <div
                                key={cd.id}
                                className="text-[8.5px] font-bold leading-tight px-1 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 truncate"
                              >
                                📋 {cd.title}
                              </div>
                            ))}
                            {(filteredEvents.length + (showTasks ? dayCards.length : 0)) > 2 && (
                              <div className="text-[7.5px] font-extrabold text-bx-muted leading-none pl-1 mt-0.5">
                                + {(filteredEvents.length + (showTasks ? dayCards.length : 0)) - 2} еще...
                              </div>
                            )}
                          </div>
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

      {/* Модальное окно просмотра задач за день */}
      {selectedDay && (
        <DailyTasksModal
          date={selectedDay}
          events={byDate[selectedDay] ?? []}
          cards={cardsByDate[selectedDay] ?? []}
          boards={boards}
          onClose={() => setSelectedDay(null)}
          onAddClick={(date) => {
            setDefDate(date)
            setEditingEvent(null)
            setEventModalOpen(true)
          }}
          onEventClick={(ev) => {
            setEditingEvent(ev)
            setEventModalOpen(true)
          }}
          onCardClick={openCardFromCalendar}
          onDeleteEvent={async (id) => {
            await remove(id)
            reload()
          }}
          onDeleteCard={async () => {
            // Заглушка удаления карточки с календаря
          }}
          onEventStatusChange={async (id, status) => {
            const nextStatus = status === 'done' ? 'done' : 'todo'
            await update(id, { status: nextStatus })
            reload()
          }}
          onCardStatusChange={async (id, boardId, done) => {
            await toggleCardDone(id, boardId, done)
            reload()
          }}
        />
      )}

      {/* Модальное окно редактирования/добавления событий */}
      {eventModalOpen && (
        <EventModal
          event={editingEvent}
          defaultDate={defDate}
          onClose={() => {
            setEventModalOpen(false)
            setEditingEvent(null)
          }}
          onSave={async (data) => {
            if (editingEvent) {
              await update(editingEvent.id, data)
            } else {
              await add({ ...data, company_id: active?.id ?? null })
            }
            setEventModalOpen(false)
            setEditingEvent(null)
            reload()
          }}
        />
      )}

      {/* Модальное окно просмотра карточки */}
      {activeCard && (
        <CardModal
          card={activeCard}
          columns={activeCardColumns}
          onClose={() => setActiveCard(null)}
          onUpdate={async (id, patch) => {
            await updateCard(id, patch)
            fetchDatedCards().then(setDatedCards)
          }}
          onArchive={async (id) => {
            await archiveCard(id)
            setActiveCard(null)
            fetchDatedCards().then(setDatedCards)
          }}
          onDelete={async (id) => {
            await removeCard(id)
            setActiveCard(null)
            fetchDatedCards().then(setDatedCards)
          }}
          onDuplicate={async (card) => {
            await duplicateCard(card)
            fetchDatedCards().then(setDatedCards)
          }}
          loadComments={loadComments}
          addComment={addComment}
          removeComment={removeComment}
        />
      )}

      {/* Всплывающий премиальный тултип при наведении */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 8}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 w-72 bg-bx-surface border border-bx-border rounded-2xl p-4 shadow-xl text-bx-text pointer-events-none transition-all duration-100 ease-out flex flex-col gap-3"
        >
          <div className="flex items-center justify-between border-b border-bx-border/50 pb-2 text-[10px] font-bold text-bx-muted">
            <span>
              {hoveredDay.day.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {hoveredDay.special && showHolidays && (
            <div className={`p-2 rounded-xl border text-xs flex flex-col gap-1 ${
              hoveredDay.special.type === 'holiday' 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300'
                : hoveredDay.special.type === 'additional_off' || hoveredDay.special.type === 'transferred_off'
                  ? 'bg-red-500/5 border-red-500/10 text-red-600 dark:text-red-300/90'
                  : hoveredDay.special.type === 'pre_holiday'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}>
              <div className="font-extrabold flex items-center gap-1.5">
                <span>
                  {hoveredDay.special.type === 'holiday' ? '🎉' 
                    : hoveredDay.special.type === 'pre_holiday' ? '⏰' 
                    : hoveredDay.special.type === 'transferred_work' ? '🔧' : '🔴'}
                </span>
                <span>{hoveredDay.special.name}</span>
              </div>
              {hoveredDay.special.note && (
                <p className="text-[10px] opacity-80 leading-relaxed">{hoveredDay.special.note}</p>
              )}
            </div>
          )}

          {showTax && hoveredDay.deadlines.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">📋 Налоговые дедлайны</span>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {hoveredDay.deadlines.map((dl) => (
                  <div key={dl.id} className="text-[11px] leading-snug p-2 rounded-xl bg-bx-surface-2 border border-bx-border flex flex-col gap-0.5 shadow-inner">
                    <div className="flex items-start gap-1 font-bold text-bx-text">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                      <span>{dl.title}</span>
                    </div>
                    {dl.law && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-400/80 font-mono pl-2">{dl.law}</span>
                    )}
                    {dl.note && (
                      <p className="text-[9px] text-bx-muted pl-2 leading-relaxed">{dl.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(hoveredDay.events.length > 0 || hoveredDay.cards.length > 0) && (
            <div className="flex flex-col gap-1 pt-2 border-t border-bx-border/50">
              {showTasks && hoveredDay.events.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-bx-muted">
                  <span>📌</span>
                  <span>Задач в планировщике: <b>{hoveredDay.events.length}</b></span>
                </div>
              )}
              {showTasks && hoveredDay.cards.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-bx-muted">
                  <span>📋</span>
                  <span>Карточек в Kanban: <b>{hoveredDay.cards.length}</b></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
