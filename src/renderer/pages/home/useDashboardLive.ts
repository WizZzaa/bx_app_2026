import { useEffect, useState } from 'react'
import { widgetsApi } from '../../lib/widgetsApi'
import { db } from '../../lib/db/localDb'
import { deadlinesForMonth } from '../../data/taxCalendar'
import type { CurrencyRate, WeatherData } from '../../../shared/types'

// Живая сводка для главной. Только быстрые локальные источники
// (Dexie, localStorage-кэши) + курсы/погода через widgetsApi — без запросов к Supabase,
// чтобы дашборд рисовался мгновенно и работал офлайн.

export interface NextDeadline {
  title: string
  date: string // YYYY-MM-DD
  daysLeft: number
}

export interface TodayTask {
  title: string
  type: string        // 'task' | 'tax_deadline' | 'reminder' | 'event'
  status: string
  priority?: string
}

/** Метки дней текущего месяца: day (1-31) → есть ли дедлайн / задача */
export interface DayMarks {
  deadlines: Set<number>
  tasks: Set<number>
}

export interface DashboardLive {
  rates: CurrencyRate[] | null
  weather: WeatherData | null
  nextDeadline: NextDeadline | null
  tasksToday: number
  overdue: number
  ecpExpiring: number
  activeEmployees: number | null
  monthIncome: number
  monthExpense: number
  hasFinanceData: boolean
  todayTasks: TodayTask[]
  dayMarks: DayMarks
}

interface CachedEvent {
  type: string
  title: string
  date: string
  status: string
  priority?: string
}

interface CachedEcpKey { expiresAt: string }

const todayStr = () => new Date().toISOString().slice(0, 10)

function readEventsCache(): CachedEvent[] {
  try { return JSON.parse(localStorage.getItem('bx_events_cache_v1') || '[]') } catch { return [] }
}

function readEcpKeys(): CachedEcpKey[] {
  try { return JSON.parse(localStorage.getItem('bx_ecp_keys') || '[]') } catch { return [] }
}

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
}

function computeNextDeadline(events: CachedEvent[]): NextDeadline | null {
  const today = todayStr()
  const upcoming = events
    .filter(e => e.type === 'tax_deadline' && e.status !== 'done' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (upcoming) {
    return { title: upcoming.title, date: upcoming.date, daysLeft: daysBetween(today, upcoming.date) }
  }
  // Кэш событий пуст — берём ближайший из шаблонов налогового календаря
  const now = new Date()
  const candidates = [
    ...deadlinesForMonth(now.getFullYear(), now.getMonth()),
    ...deadlinesForMonth(now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), (now.getMonth() + 1) % 12),
  ].filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const c = candidates[0]
  return c ? { title: c.deadline.title, date: c.date, daysLeft: daysBetween(today, c.date) } : null
}

export function useDashboardLive(): DashboardLive {
  const [rates, setRates] = useState<CurrencyRate[] | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [local, setLocal] = useState({
    nextDeadline: null as NextDeadline | null,
    tasksToday: 0,
    overdue: 0,
    ecpExpiring: 0,
    activeEmployees: null as number | null,
    monthIncome: 0,
    monthExpense: 0,
    hasFinanceData: false,
    todayTasks: [] as TodayTask[],
    dayMarks: { deadlines: new Set<number>(), tasks: new Set<number>() } as DayMarks,
  })

  useEffect(() => {
    let alive = true
    widgetsApi.getRates().then(d => { if (alive) setRates(d) }).catch(() => {})
    widgetsApi.getWeather().then(d => { if (alive) setWeather(d) }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    const today = todayStr()

    // Синхронные localStorage-кэши: задачи, дедлайны, ЭЦП
    const events = readEventsCache()
    const active = events.filter(e => e.status !== 'done')
    const tasksToday = active.filter(e => e.date === today).length
    const overdue = active.filter(e => e.date < today).length
    const nextDeadline = computeNextDeadline(events)
    const ecpExpiring = readEcpKeys().filter(k => {
      const d = daysBetween(today, k.expiresAt.slice(0, 10))
      return d >= 0 && d <= 30
    }).length

    // Список «Сегодня»: сперва просроченное с высоким приоритетом, потом задачи дня
    const prio = (e: CachedEvent) => (e.priority === 'high' ? 0 : e.priority === 'normal' ? 1 : 2)
    const todayTasks: TodayTask[] = active
      .filter(e => e.date === today)
      .sort((a, b) => prio(a) - prio(b))
      .slice(0, 5)

    // Метки дней текущего месяца для мини-календаря
    const monthPrefix = today.slice(0, 7)
    const dayMarks: DayMarks = { deadlines: new Set(), tasks: new Set() }
    for (const e of active) {
      if (!e.date?.startsWith(monthPrefix)) continue
      const day = Number(e.date.slice(8, 10))
      if (e.type === 'tax_deadline') dayMarks.deadlines.add(day)
      else dayMarks.tasks.add(day)
    }
    if (dayMarks.deadlines.size === 0) {
      // Кэш пуст — точки дедлайнов из шаблонов налогового календаря
      const now = new Date()
      for (const d of deadlinesForMonth(now.getFullYear(), now.getMonth())) {
        dayMarks.deadlines.add(Number(d.date.slice(8, 10)))
      }
    }

    setLocal(prev => ({ ...prev, nextDeadline, tasksToday, overdue, ecpExpiring, todayTasks, dayMarks }))

    // Dexie: финансы за текущий месяц + штат (может быть заблокирована вторым экземпляром)
    ;(async () => {
      try {
        const monthPrefix = today.slice(0, 7)
        const txs = await db.transactions.toArray()
        const monthTxs = txs.filter(t => t.date?.startsWith(monthPrefix))
        const toUzs = (t: { amount: number; exchange_rate?: number }) => t.amount * (t.exchange_rate || 1)
        const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + toUzs(t), 0)
        const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + toUzs(t), 0)
        const activeEmployees = await db.employees.where('status').equals('active').count()
        if (alive) setLocal(prev => ({
          ...prev, monthIncome, monthExpense, activeEmployees,
          hasFinanceData: monthTxs.length > 0,
        }))
      } catch {
        // IndexedDB недоступна — оставляем нули, дашборд не падает
      }
    })()

    return () => { alive = false }
  }, [])

  return { rates, weather, ...local }
}

/** Компактный формат сумм UZS: 12.4 млн, 980 тыс, 1.2 млрд */
export function fmtUzs(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + ' млрд'
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + ' млн'
  if (abs >= 1e3) return Math.round(n / 1e3) + ' тыс'
  return String(Math.round(n))
}
