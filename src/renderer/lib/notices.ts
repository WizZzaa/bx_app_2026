import { todayISO } from './dates'

// Единый источник оповещений: просрочки, налоговые дедлайны, задачи на сегодня,
// истекающие сертификаты ЭЦП. Используется дашбордным виджетом и трей-агентом.

export type NoticeLevel = 'critical' | 'warning' | 'info'

export interface Notice {
  id: string
  level: NoticeLevel
  text: string
  time: string
  to: string // маршрут по клику
}

export interface EcpKeyLite { name: string; expiresAt: string }

interface CachedEvent { type: string; title: string; date: string; due_date?: string | null; status: string }

function daysTo(dateISO: string, today: string): number {
  return Math.round((new Date(dateISO).getTime() - new Date(today).getTime()) / 86400000)
}

export function buildNotices(keys: EcpKeyLite[]): Notice[] {
  const today = todayISO()
  const notices: Notice[] = []

  let events: CachedEvent[] = []
  try { events = JSON.parse(localStorage.getItem('bx_events_cache_v1') || '[]') } catch { /* пусто */ }
  const active = events.filter(e => e.status !== 'done')

  // Просроченные задачи и напоминания
  const overdue = active.filter(e => {
    const d = e.due_date || e.date
    return d < today && (e.type === 'task' || e.type === 'reminder')
  })
  if (overdue.length) {
    notices.push({
      id: 'overdue', level: 'critical', to: '/planner',
      text: overdue.length === 1
        ? `Просрочено: ${overdue[0].title}`
        : `Просрочено задач: ${overdue.length} — «${overdue[0].title}» и другие`,
      time: 'требует внимания',
    })
  }

  // Ближайшие налоговые дедлайны (7 дней)
  const deadlines = active
    .filter(e => e.type === 'tax_deadline')
    .map(e => ({ e, d: daysTo(e.due_date || e.date, today) }))
    .filter(x => x.d >= 0 && x.d <= 7)
    .sort((a, b) => a.d - b.d)
  for (const { e, d } of deadlines.slice(0, 3)) {
    notices.push({
      id: `dl-${e.title}-${d}`, level: d <= 2 ? 'critical' : 'warning', to: '/planner',
      text: e.title,
      time: d === 0 ? 'сегодня' : d === 1 ? 'завтра' : `через ${d} дн.`,
    })
  }

  // Задачи на сегодня
  const todayTasks = active.filter(e => (e.due_date || e.date) === today && e.type === 'task')
  if (todayTasks.length) {
    notices.push({
      id: 'today', level: 'info', to: '/planner',
      text: `Задач на сегодня: ${todayTasks.length}`,
      time: 'сегодня',
    })
  }

  // ЭЦП: сертификаты в окне контрольных точек 30/14/7/1 день.
  const expiring = keys
    .map(k => ({ k, d: daysTo(k.expiresAt.slice(0, 10), today) }))
    .filter(x => x.d <= 30)
    .sort((a, b) => a.d - b.d)
  for (const { k, d } of expiring.slice(0, 3)) {
    notices.push({
      id: `ecp-${k.name}`, level: d <= 14 ? 'critical' : 'warning', to: '/ecp',
      text: d < 0 ? `Сертификат ЭЦП «${k.name}» просрочен` : `Сертификат ЭЦП «${k.name}» истекает`,
      time: d < 0 ? `истёк ${Math.abs(d)} дн. назад` : d === 0 ? 'сегодня' : `через ${d} дн.`,
    })
  }

  const order: NoticeLevel[] = ['critical', 'warning', 'info']
  return notices.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level)).slice(0, 8)
}
