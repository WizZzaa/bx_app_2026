import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartCalendar from '../components/dashboard/SmartCalendar'
import WidgetBoundary from '../components/WidgetBoundary'
import CurrencyWidget from '../components/widgets/CurrencyWidget'
import HoroscopeWidget from '../components/widgets/HoroscopeWidget'
import NotificationsWidget from '../components/widgets/NotificationsWidget'
import WeatherWidget from '../components/widgets/WeatherWidget'
import { todayISO } from '../lib/dates'
import { loadEcpKeys } from '../lib/ecpStorage'
import { useCompany } from '../lib/CompanyContext'
import { usePlan } from '../lib/plan'
import { defaultRuntimeWidgetPolicy, isRuntimeWidgetAllowed, loadRuntimeWidgetPolicy, trackWidgetEvent, type RuntimeWidgetPolicy } from '../lib/adminWidgetPolicy'
import Icon from '../lib/ui/Icon'
import { useEvents } from './planner/useEvents'

type ServiceVisibility = { weather: boolean; notifications: boolean; horoscope: boolean }
const DEFAULT_WIDGETS: ServiceVisibility = { weather: true, notifications: true, horoscope: true }
const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-300' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-300' },
  slate: { bg: 'bg-bx-surface-2', text: 'text-bx-text' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-300' },
}

async function getExpiringEcpCount() {
  try { const keys = await loadEcpKeys(); const soon = new Date(); soon.setDate(soon.getDate() + 30); return keys.filter(key => new Date(key.expiresAt) <= soon).length } catch { return 0 }
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  if (hour < 23) return 'Добрый вечер'
  return 'Доброй ночи'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { active, companies } = useCompany()
  const { plan, role } = usePlan()
  const todayStr = todayISO()
  const { events, loading } = useEvents(active?.id ?? null)
  const [ecpExpiring, setEcpExpiring] = useState(0)
  const [configOpen, setConfigOpen] = useState(false)
  const [visible, setVisible] = useState<ServiceVisibility>(DEFAULT_WIDGETS)
  const [visibilityReady, setVisibilityReady] = useState(false)
  const [widgetPolicy, setWidgetPolicy] = useState<RuntimeWidgetPolicy>(() => defaultRuntimeWidgetPolicy())

  useEffect(() => { getExpiringEcpCount().then(setEcpExpiring) }, [])
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bx_dashboard_widgets') || '{}')
      setVisible({ weather: saved.weather ?? true, notifications: saved.notifications ?? true, horoscope: saved.horoscope ?? true })
    } catch { setVisible(DEFAULT_WIDGETS) }
    setVisibilityReady(true)
  }, [])

  useEffect(() => {
    let activeRequest = true
    const startedAt = performance.now()
    void loadRuntimeWidgetPolicy().then(policy => {
      if (!activeRequest) return
      setWidgetPolicy(policy)
      void trackWidgetEvent('dashboard-policy', 'load_success', performance.now() - startedAt)
    }).catch(() => { void trackWidgetEvent('dashboard-policy', 'load_error', performance.now() - startedAt) })
    return () => { activeRequest = false }
  }, [])

  const allowed = (id: string) => isRuntimeWidgetAllowed(widgetPolicy, id, { plan, role, placement: 'dashboard' })
  const updateVisible = (next: ServiceVisibility, changed?: keyof ServiceVisibility) => {
    setVisible(next)
    localStorage.setItem('bx_dashboard_widgets', JSON.stringify(next))
    if (changed) void trackWidgetEvent(changed === 'notifications' ? 'notification-center' : changed === 'horoscope' ? 'accounting-horoscope' : changed, next[changed] ? 'toggle_show' : 'toggle_hide')
  }
  const todayEvents = events.filter(event => (event.due_date || event.date) === todayStr && event.status !== 'done')
  const overdueEvents = events.filter(event => event.due_date && event.due_date < todayStr && event.status !== 'done' && (event.type === 'task' || event.type === 'reminder'))
  const upcomingTax = events.filter(event => event.type === 'tax_deadline' && event.status !== 'done' && (event.due_date || event.date) >= todayStr).sort((a, b) => (a.due_date || a.date).localeCompare(b.due_date || b.date)).slice(0, 3)
  const monthPrefix = todayStr.slice(0, 7)
  const deadlines = new Set<number>()
  const tasks = new Set<number>()
  events.forEach(event => { const date = event.due_date || event.date; if (event.status !== 'done' && date?.startsWith(monthPrefix)) (event.type === 'tax_deadline' ? deadlines : tasks).add(Number(date.slice(8, 10))) })
  const calendarEntries = events.filter(event => event.status !== 'done').map(event => ({ id: event.id, date: event.due_date || event.date, title: event.title, type: event.type, priority: event.priority }))
  const addTaskOnDate = (date: string) => navigate('/planner', { state: { newTask: { date } } })
  const openCalendarEntry = (id: string) => { localStorage.setItem('bx_planner_open_event_id', id); navigate('/planner') }

  const stats = [
    { icon: 'clock', label: 'Сегодня', value: todayEvents.length, tone: 'blue', to: '/planner' },
    { icon: 'alert', label: 'Просрочено', value: overdueEvents.length, tone: overdueEvents.length ? 'rose' : 'slate', to: '/planner' },
    { icon: 'building', label: 'Компаний', value: companies.length, tone: 'emerald', to: '/counterparties' },
    { icon: 'ecp', label: 'ЭЦП истекает', value: ecpExpiring || '—', tone: 'amber', to: '/ecp' },
  ]

  useEffect(() => {
    if (!visibilityReady) return
    const visibleWidgetIds = [
      'currency-rates',
      'smart-calendar',
      'quick-actions',
      ...(visible.weather ? ['weather'] : []),
      ...(visible.notifications ? ['notification-center'] : []),
      ...(visible.horoscope ? ['accounting-horoscope'] : []),
    ]
    visibleWidgetIds
      .filter(id => allowed(id))
      .forEach(id => { void trackWidgetEvent(id, 'view') })
  }, [visibilityReady, visible.weather, visible.notifications, visible.horoscope, widgetPolicy, plan, role])

  return (
    <main className="z-10 flex-1 overflow-y-auto bg-bx-bg px-5 py-5 text-bx-text sm:px-6">
      <div className="bx-page-container space-y-4">
        <header className="relative overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface px-6 py-5 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-500/[0.10] blur-3xl" />
          <div className="relative flex flex-col gap-5 2xl:flex-row 2xl:items-center">
            <div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">{active?.name || 'Рабочее пространство BX'}</p><h1 className="mt-1.5 text-2xl font-black tracking-tight text-bx-text">{greeting()}, всё под контролем</h1><p className="mt-1 text-xs capitalize text-bx-muted">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map(stat => <button key={stat.label} onClick={() => navigate(stat.to)} className="flex min-w-[126px] items-center gap-2.5 rounded-xl border border-bx-border bg-bx-bg/70 p-2.5 text-left transition-colors hover:border-blue-500/30"><span className={`grid h-8 w-8 place-items-center rounded-lg ${TONES[stat.tone].bg} ${TONES[stat.tone].text}`}><Icon name={stat.icon} className="h-3.5 w-3.5" /></span><span><span className="block text-sm font-black tabular-nums text-bx-text">{loading ? '…' : stat.value}</span><span className="block text-[8px] font-extrabold uppercase tracking-wide text-bx-muted">{stat.label}</span></span></button>)}
            </div>
            <div className="flex gap-2"><button onClick={() => setConfigOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text" title="Настроить сервисные виджеты"><Icon name="settings" className="h-4 w-4" /></button><button onClick={() => navigate('/planner')} className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white hover:bg-blue-500"><Icon name="planner" className="h-4 w-4" />Открыть фокус</button></div>
          </div>
        </header>

        {configOpen && <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-bx-border bg-bx-surface p-3 shadow-sm"><span className="mr-2 text-[10px] font-extrabold uppercase tracking-wide text-bx-muted">Сервисные блоки</span>{([['weather', 'Погода'], ['notifications', 'Оповещения'], ['horoscope', 'Бухо-гороскоп']] as const).filter(([key]) => allowed(key === 'notifications' ? 'notification-center' : key === 'horoscope' ? 'accounting-horoscope' : key)).map(([key, label]) => <label key={key} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-xl bg-bx-bg px-3 text-xs font-bold text-bx-text"><input type="checkbox" checked={visible[key]} onChange={event => updateVisible({ ...visible, [key]: event.target.checked }, key)} className="accent-blue-600" />{label}</label>)}</section>}

        {allowed('currency-rates') && <CurrencyWidget />}

        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-12">
          {allowed('smart-calendar') && <div className="2xl:col-span-5"><SmartCalendar marks={{ deadlines, tasks }} entries={calendarEntries} onOpen={() => navigate('/planner')} onAdd={addTaskOnDate} onOpenEntry={openCalendarEntry} /></div>}
          <article className="flex min-h-[430px] flex-col rounded-[26px] border border-bx-border bg-bx-surface p-5 shadow-sm 2xl:col-span-4">
            <SectionHeader icon="clock" tone="blue" eyebrow="Рабочий фокус" title="На сегодня" action="Все задачи" onAction={() => navigate('/planner')} />
            {overdueEvents.length > 0 && <div className="mt-4 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3 text-[10px] text-rose-700 dark:text-rose-300"><Icon name="alert" className="h-4 w-4 flex-shrink-0" /><b>{overdueEvents.length} просроченных задач — проверьте сроки.</b></div>}
            <div className="mt-4 space-y-2">
              {todayEvents.slice(0, 5).map(event => <button key={event.id} onClick={() => navigate('/planner')} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-bx-border/70 bg-bx-bg px-3 text-left transition-colors hover:border-blue-500/30"><span className={`h-2 w-2 rounded-full ${event.priority === 'high' ? 'bg-rose-500' : event.type === 'tax_deadline' ? 'bg-amber-500' : 'bg-blue-500'}`} /><span className="min-w-0 flex-1 truncate text-xs font-bold text-bx-text">{event.title}</span><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button>)}
              {!loading && todayEvents.length === 0 && <EmptyState title="Сегодня свободно" text="Можно заняться следующими задачами или запланировать новую." />}
            </div>
            <button onClick={() => navigate('/planner')} className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white hover:bg-blue-500"><Icon name="plus" className="h-4 w-4" />Добавить задачу</button>
          </article>
          <article className="flex min-h-[430px] flex-col rounded-[26px] border border-bx-border bg-bx-surface p-5 shadow-sm lg:col-span-2 2xl:col-span-3">
            <SectionHeader icon="planner" tone="amber" eyebrow="Ближайший горизонт" title="Обязательства" />
            <div className="mt-4 space-y-2">
              {upcomingTax.map(event => { const date = event.due_date || event.date; const left = Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()) / 86400000); return <button key={event.id} onClick={() => navigate('/planner')} className="w-full rounded-xl border border-bx-border/70 bg-bx-bg p-3 text-left transition-colors hover:border-blue-500/30"><div className="flex items-center gap-2"><span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[9px] font-black text-blue-600 dark:text-blue-300">{new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span><span className="text-[9px] font-bold text-bx-muted">{left === 0 ? 'Сегодня' : `через ${left} д.`}</span></div><p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed text-bx-text">{event.title}</p></button> })}
              {!loading && upcomingTax.length === 0 && <EmptyState title="Сроков рядом нет" text="Ближайшие бухгалтерские даты появятся здесь." />}
            </div>
            {allowed('quick-actions') && <div className="mt-auto grid grid-cols-2 gap-2 pt-4"><QuickAction icon="news" label="Новости" onClick={() => navigate('/news')} /><QuickAction icon="ai" label="Спросить AI" onClick={() => navigate('/ai')} /><QuickAction icon="calc" label="Расчёты" onClick={() => navigate('/calc')} /><QuickAction icon="templates" label="Шаблоны" onClick={() => navigate('/templates')} /></div>}
          </article>
        </section>

        {((visible.weather && allowed('weather')) || (visible.notifications && allowed('notification-center')) || (visible.horoscope && allowed('accounting-horoscope'))) && <section className="pb-5" aria-labelledby="services-heading"><div className="mb-3 flex items-end justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Полезное рядом</p><h2 id="services-heading" className="mt-1 text-lg font-black text-bx-text">Сервисные виджеты</h2></div><button onClick={() => setConfigOpen(true)} className="text-[10px] font-bold text-bx-muted hover:text-bx-text">Настроить</button></div><div className={`grid auto-rows-fr gap-4 ${[visible.weather && allowed('weather'), visible.notifications && allowed('notification-center'), visible.horoscope && allowed('accounting-horoscope')].filter(Boolean).length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'} 2xl:grid-cols-3`}>{visible.weather && allowed('weather') && <WidgetBoundary name="Погода" widgetId="weather"><WeatherWidget /></WidgetBoundary>}{visible.notifications && allowed('notification-center') && <WidgetBoundary name="Оповещения" widgetId="notification-center"><NotificationsWidget /></WidgetBoundary>}{visible.horoscope && allowed('accounting-horoscope') && <WidgetBoundary name="Бухо-гороскоп" widgetId="accounting-horoscope"><HoroscopeWidget /></WidgetBoundary>}</div></section>}
      </div>
    </main>
  )
}

function SectionHeader({ icon, tone, eyebrow, title, action, onAction }: { icon: string; tone: string; eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  const style = TONES[tone] || TONES.blue
  return <header className="flex items-center gap-2.5"><span className={`grid h-9 w-9 place-items-center rounded-xl ${style.bg} ${style.text}`}><Icon name={icon} className="h-4 w-4" /></span><div><p className={`text-[8px] font-extrabold uppercase tracking-[0.14em] ${style.text}`}>{eyebrow}</p><h2 className="text-sm font-black text-bx-text">{title}</h2></div>{action && <button onClick={onAction} className="ml-auto text-[9px] font-extrabold text-blue-600 hover:text-blue-500 dark:text-blue-300">{action}</button>}</header>
}

function EmptyState({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-dashed border-bx-border py-8 text-center"><Icon name="check" className="mx-auto h-5 w-5 text-emerald-500" /><p className="mt-2 text-xs font-black text-bx-text">{title}</p><p className="mx-auto mt-1 max-w-[220px] text-[10px] leading-relaxed text-bx-muted">{text}</p></div> }
function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) { return <button onClick={onClick} className="flex min-h-14 flex-col items-start justify-between rounded-xl border border-bx-border bg-bx-bg p-2.5 text-left transition-colors hover:border-blue-500/30"><Icon name={icon} className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" /><span className="text-[9px] font-bold text-bx-text">{label}</span></button> }
