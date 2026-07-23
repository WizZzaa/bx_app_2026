import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KB_ARTICLES } from '../data/knowledge'
import { useCompany } from '../lib/CompanyContext'
import { todayISO } from '../lib/dates'
import { usePlan, type Plan, type PlanLimits } from '../lib/plan'
import { supabase } from '../lib/db/supabase'
import Icon from '../lib/ui/Icon'
import { BxMotion } from '../lib/ui/BxMotion'
import { parseUsageSnapshot, type UsageSnapshot } from '../lib/usageSnapshot'
import { widgetsApi } from '../lib/widgetsApi'
import { BentoGrid } from '../components/ui/BentoGrid'
import WeatherWidget from '../components/widgets/WeatherWidget'
import HoroscopeWidget from '../components/widgets/HoroscopeWidget'
import TaxCalendar from '../components/dashboard/TaxCalendar'
import { Skeleton, SkeletonGroup } from '../components/ui/Skeleton'
import { StatePanel } from '../components/ui/StatePanel'
import type { CurrencyRate } from '../../shared/types'
import type { Company } from '../lib/db/types'
import { dashboardDeadlineStatus, isPermissionError, summarizeDashboardTasks } from './dashboardModel'
import { useEvents, type BxEvent } from './planner/useEvents'
import './DashboardD1.css'
import './DashboardA1.css'

interface AsyncResource<T> {
  value: T
  loading: boolean
  error: string | null
  updatedAt: string | null
}

interface AiStatus {
  usage: UsageSnapshot | null
  lastAnswerAt: string | null
}

export interface DashboardD1ViewProps {
  today: string
  events: BxEvent[]
  eventsLoading: boolean
  eventsError: string | null
  rates: AsyncResource<CurrencyRate[]>
  ai: AsyncResource<AiStatus>
  online: boolean
  activeCompany: Company | null
  companyCount: number
  plan: Plan
  planLoading: boolean
  limits: PlanLimits
  onNavigate: (route: string, state?: unknown) => void
  onRetryEvents: () => void
  onRetryRates: () => void
  onRetryAi: () => void
  onCreateCompany: () => void
  onEditCompany: () => void
  showLiveWidgets?: boolean
}

const dateLabel = (date: string): string => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
})

const dateTimeLabel = (date: string | null): string => date
  ? new Date(date).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : 'ещё не обновлялось'

const planLabel: Record<Plan, string> = {
  free: 'Free',
  trial: 'Trial',
  standard: 'Standard',
  premium: 'Premium',
}

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

type DashboardViewport = 'mobile' | 'tablet' | 'desktop'

function readDashboardViewport(): DashboardViewport {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop'
  if (window.matchMedia('(max-width: 47.999rem)').matches) return 'mobile'
  if (window.matchMedia('(min-width: 64rem)').matches) return 'desktop'
  return 'tablet'
}

function useDashboardViewport(): DashboardViewport {
  const [viewport, setViewport] = useState(readDashboardViewport)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mobile = window.matchMedia('(max-width: 47.999rem)')
    const desktop = window.matchMedia('(min-width: 64rem)')
    const update = () => setViewport(readDashboardViewport())
    mobile.addEventListener('change', update)
    desktop.addEventListener('change', update)
    return () => {
      mobile.removeEventListener('change', update)
      desktop.removeEventListener('change', update)
    }
  }, [])
  return viewport
}

function DashboardHeader({
  today,
  events,
  eventsLoading,
  activeCompany,
  onNavigate,
}: {
  today: string
  events: BxEvent[]
  eventsLoading: boolean
  activeCompany: Company | null
  onNavigate: (route: string, state?: unknown) => void
}) {
  const summary = useMemo(() => summarizeDashboardTasks(events), [events])
  const nearestDate = summary.nearest?.due_date || summary.nearest?.date
  const fullDate = new Date(`${today}T12:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header className="bx-d1-dashboard-hero" aria-labelledby="bx-d1-dashboard-title">
      <div className="bx-d1-dashboard-hero__content">
        <p className="bx-d1-dashboard-eyebrow"><span aria-hidden="true" /> {fullDate}</p>
        <h1 id="bx-d1-dashboard-title">Главное на сегодня</h1>
        <p className="bx-d1-dashboard-hero__lead">
          {activeCompany
            ? `${activeCompany.name}: ближайшее дело, важные сроки и рабочие сигналы без лишнего шума.`
            : 'Ближайшее дело, важные сроки и рабочие сигналы без лишнего шума.'}
        </p>
        <div className="bx-d1-dashboard-hero__actions">
          <button type="button" className="bx-d1-action bx-d1-action--primary" onClick={() => onNavigate('/planner', { newTask: {} })}>
            <Icon name="plus" /> Новая задача
          </button>
          <button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={() => onNavigate('/functions')}>
            Все функции <Icon name="arrowR" />
          </button>
        </div>
      </div>

      <aside className="bx-d1-dashboard-hero__summary" aria-label="Сводка дня">
        <div className="bx-d1-dashboard-hero__date">
          <span aria-hidden="true"><Icon name="planner" /></span>
          <div><small>Сегодня</small><strong>{summary.active.length ? 'Фокус определён' : 'День можно спланировать'}</strong></div>
        </div>
        <dl>
          <div>
            <dt>В работе</dt>
            <dd>{eventsLoading ? '—' : summary.active.length}</dd>
          </div>
          <div>
            <dt>Ближайший срок</dt>
            <dd>{eventsLoading ? 'Обновляем' : nearestDate ? dashboardDeadlineStatus(nearestDate, today) : 'Всё спокойно'}</dd>
          </div>
        </dl>
      </aside>
    </header>
  )
}

function TodayCard({
  today,
  events,
  loading,
  error,
  onRetry,
  onPrimary,
  primaryRef,
}: {
  today: string
  events: BxEvent[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onPrimary: () => void
  primaryRef: React.RefObject<HTMLButtonElement | null>
}) {
  const summary = useMemo(() => summarizeDashboardTasks(events), [events])
  const nearest = summary.nearest

  return (
    <section className="bx-d1-dashboard-card bx-d1-dashboard-card--today" aria-labelledby="bx-d1-today-title">
      <div className="bx-d1-dashboard-card__heading">
        <div>
          <p className="bx-d1-dashboard-eyebrow">Фокус дня</p>
          <h2 id="bx-d1-today-title">Что требует внимания</h2>
        </div>
        <span className="bx-d1-dashboard-chip">{loading ? 'Обновляем' : `${summary.active.length} активных`}</span>
      </div>

      {loading ? (
        <SkeletonGroup className="bx-d1-dashboard-skeletons" label="Загрузка задач">
          <Skeleton height="1.75rem" width="70%" />
          <Skeleton height="1rem" width="48%" />
          <Skeleton height="2.75rem" width="10rem" />
        </SkeletonGroup>
      ) : error ? (
        <StatePanel
          status={isPermissionError(error) ? 'permission' : 'error'}
          title={isPermissionError(error) ? 'Нет доступа к задачам' : 'Задачи временно недоступны'}
          description={`Последнее успешное обновление: неизвестно. ${isPermissionError(error) ? 'Проверьте роль в компании.' : 'Данные не изменены — можно повторить чтение.'}`}
          action={<button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onRetry}>Повторить</button>}
        />
      ) : nearest ? (
        <>
          <div className="bx-d1-dashboard-priority">
            <span className="bx-d1-dashboard-priority__icon" aria-hidden="true"><Icon name={nearest.type === 'tax_deadline' ? 'planner' : 'check'} /></span>
            <div>
              <p className="bx-d1-dashboard-priority__status"><Icon name="clock" />{dashboardDeadlineStatus(nearest.due_date || nearest.date, today)}</p>
              <h3>{nearest.title}</h3>
              <p>{dateLabel(nearest.due_date || nearest.date)} · {nearest.type === 'tax_deadline' ? 'Налоговый срок' : 'Рабочая задача'}</p>
            </div>
          </div>
          {summary.active.length > 1 && (
            <ul className="bx-d1-dashboard-task-list" aria-label="Следующие задачи">
              {summary.active.slice(1, 3).map(task => (
                <li key={task.id}><span>{task.title}</span><time dateTime={task.due_date || task.date}>{dateLabel(task.due_date || task.date)}</time></li>
              ))}
            </ul>
          )}
          <button ref={primaryRef} type="button" className="bx-d1-action bx-d1-action--secondary bx-d1-action--focus" onClick={onPrimary}>
            Открыть план дня <Icon name="arrowR" />
          </button>
        </>
      ) : (
        <div className="bx-d1-dashboard-empty">
          <span className="bx-d1-dashboard-priority__icon" aria-hidden="true"><Icon name="check" /></span>
          <div><h3>Срочных задач нет</h3><p>План на сегодня свободен. Можно добавить новую задачу в планировщике.</p></div>
          <button ref={primaryRef} type="button" className="bx-d1-action bx-d1-action--secondary bx-d1-action--focus" onClick={onPrimary}>Открыть планировщик <Icon name="arrowR" /></button>
        </div>
      )}
    </section>
  )
}

function CompanyCard({
  company,
  companyCount,
  plan,
  planLoading,
  limits,
  onCreate,
  onEdit,
  onUpgrade,
}: {
  company: Company | null
  companyCount: number
  plan: Plan
  planLoading: boolean
  limits: PlanLimits
  onCreate: () => void
  onEdit: () => void
  onUpgrade: () => void
}) {
  const companyCreationLocked = Number.isFinite(limits.companies) && companyCount >= limits.companies

  return (
    <section className="bx-d1-dashboard-card bx-d1-dashboard-card--company" aria-labelledby="bx-d1-company-title">
      <div className="bx-d1-dashboard-card__heading">
        <div><p className="bx-d1-dashboard-eyebrow">Компания</p><h2 id="bx-d1-company-title">Рабочий контекст</h2></div>
        {!planLoading && <span className="bx-d1-dashboard-chip">{planLabel[plan]}</span>}
      </div>
      {planLoading ? (
        <SkeletonGroup className="bx-d1-dashboard-skeletons" label="Проверка тарифа"><Skeleton height="1.5rem" width="65%" /><Skeleton height="3rem" /></SkeletonGroup>
      ) : company ? (
        <div className="bx-d1-dashboard-company">
          <span className="bx-d1-dashboard-company__mark" aria-hidden="true"><Icon name="building" /></span>
          <div><h3>{company.name}</h3><p>{company.regime || 'Режим не указан'}{company.inn ? ` · ИНН ${company.inn}` : ''}</p></div>
          <button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onEdit}>Открыть профиль</button>
        </div>
      ) : companyCreationLocked ? (
        <StatePanel
          status="locked"
          title="Компания недоступна на текущем тарифе"
          description={`Тариф ${planLabel[plan]} включает ${limits.companies} компаний. Перейдите к тарифам, чтобы создать рабочий профиль.`}
          action={<button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onUpgrade}>Посмотреть тарифы</button>}
        />
      ) : (
        <StatePanel
          status="empty"
          title="Добавьте рабочую компанию"
          description={`Тариф ${planLabel[plan]} позволяет создать ${limits.companies} компанию. Профиль нужен для персональных сроков.`}
          action={<button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onCreate}>Создать компанию</button>}
        />
      )}
    </section>
  )
}

function DailyToolsCard({ rates, today, onNavigate, onRetry }: {
  rates: AsyncResource<CurrencyRate[]>
  today: string
  onNavigate: (route: string) => void
  onRetry: () => void
}) {
  const usd = rates.value.find(rate => rate.code === 'USD')
  const eur = rates.value.find(rate => rate.code === 'EUR')
  const [year, month, day] = today.split('-')
  const acceptedTodayLabels = new Set([today, `${day}.${month}.${year}`])
  const stale = rates.value.some(rate => rate.date && !acceptedTodayLabels.has(rate.date))
  const tools = [
    { icon: 'languages', title: 'Переводчик', detail: 'RU · O‘Z', route: '/translator' },
    { icon: 'exchange', title: 'Курсы и конвертер', detail: rates.loading ? 'Обновляем…' : usd ? `USD ${usd.value.toLocaleString('ru-RU')}` : 'Курсы ЦБ', route: '/currency' },
    { icon: 'planner', title: 'Календарь', detail: 'Сроки и задачи', route: '/planner' },
    { icon: 'reference', title: 'Справочники', detail: 'Проверенные данные', route: '/knowledge' },
  ]

  return (
    <section className="bx-d1-dashboard-card bx-d1-dashboard-card--tools" aria-labelledby="bx-d1-tools-title">
      <div className="bx-d1-dashboard-card__heading">
        <div><p className="bx-d1-dashboard-eyebrow">Ежедневные инструменты</p><h2 id="bx-d1-tools-title">Быстрый доступ</h2></div>
        {eur && <span className="bx-d1-dashboard-rate">EUR {eur.value.toLocaleString('ru-RU')}</span>}
      </div>
      <div className="bx-d1-dashboard-tools">
        {tools.map(tool => (
          <button key={tool.route} type="button" onClick={() => onNavigate(tool.route)}>
            <span aria-hidden="true"><Icon name={tool.icon} /></span>
            <strong>{tool.title}</strong>
            <small>{tool.detail}</small>
          </button>
        ))}
      </div>
      {(rates.error || stale) && (
        <div className="bx-d1-dashboard-module-state" role={rates.error ? 'alert' : 'status'}>
          <span><strong>{rates.error ? 'Курсы временно недоступны' : 'Курсы могут быть устаревшими'}</strong> · обновлено {dateTimeLabel(rates.updatedAt)}</span>
          <button type="button" onClick={onRetry}>Повторить</button>
        </div>
      )}
    </section>
  )
}

function AiCard({ ai, question, setQuestion, onAsk, onOpen, onRetry }: {
  ai: AsyncResource<AiStatus>
  question: string
  setQuestion: (value: string) => void
  onAsk: (event: FormEvent) => void
  onOpen: () => void
  onRetry: () => void
}) {
  const remaining = ai.value.usage?.resources.ai.remaining
  const exhausted = remaining === 0
  const latestSource = useMemo(() => [...KB_ARTICLES]
    .filter(article => article.editorialStatus !== 'draft' && article.editorialStatus !== 'archived')
    .sort((left, right) => right.updated.localeCompare(left.updated))[0], [])

  return (
    <section className="bx-d1-dashboard-card bx-d1-dashboard-card--ai" aria-labelledby="bx-d1-ai-title">
      <div className="bx-d1-dashboard-card__heading">
        <div><p className="bx-d1-dashboard-eyebrow">BX AI</p><h2 id="bx-d1-ai-title">Короткий вопрос</h2></div>
        <span className="bx-d1-dashboard-chip">{remaining === undefined ? 'Лимит с сервера' : `${remaining} осталось`}</span>
      </div>
      {ai.loading ? (
        <SkeletonGroup className="bx-d1-dashboard-skeletons" label="Проверка AI"><Skeleton height="3rem" /><Skeleton height="1rem" width="72%" /></SkeletonGroup>
      ) : ai.error ? (
        <StatePanel status="error" title="Статус AI недоступен" description={`Последнее успешное обновление: ${dateTimeLabel(ai.updatedAt)}. Вопросы не отправлялись.`} action={<button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onRetry}>Повторить</button>} />
      ) : exhausted ? (
        <StatePanel status="locked" title="Лимит AI исчерпан" description="Сервер подтвердил нулевой остаток. История ответов остаётся доступной." action={<button type="button" className="bx-d1-action bx-d1-action--secondary" onClick={onOpen}>Открыть историю</button>} />
      ) : (
        <>
          <form className="bx-d1-dashboard-ai-form" onSubmit={onAsk}>
            <label htmlFor="bx-d1-ai-question" className="sr-only">Вопрос для BX AI</label>
            <input id="bx-d1-ai-question" value={question} onChange={event => setQuestion(event.target.value)} maxLength={320} placeholder="Спросите о сроке или налоге" />
            <button type="submit" disabled={!question.trim()} aria-label="Задать вопрос BX AI"><Icon name="arrowR" /></button>
          </form>
          <dl className="bx-d1-dashboard-ai-meta">
            <div><dt>Последний ответ</dt><dd>{ai.value.lastAnswerAt ? `Готов · ${dateTimeLabel(ai.value.lastAnswerAt)}` : 'Ответов ещё нет'}</dd></div>
            <div><dt>Свежесть источников</dt><dd>{latestSource ? `Проверено ${dateLabel(latestSource.updated)}` : 'Требует проверки'}</dd></div>
          </dl>
        </>
      )}
    </section>
  )
}

export function DashboardD1View(props: DashboardD1ViewProps) {
  const [question, setQuestion] = useState('')
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [stickyPrimary, setStickyPrimary] = useState(false)
  const seenPrimary = useRef(false)
  const viewport = useDashboardViewport()
  const mobile = viewport === 'mobile'

  useEffect(() => {
    const target = primaryRef.current
    if (!mobile || !target || typeof IntersectionObserver === 'undefined') {
      setStickyPrimary(false)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        seenPrimary.current = true
        setStickyPrimary(false)
      } else if (seenPrimary.current && entry.boundingClientRect.top < 0) {
        setStickyPrimary(true)
      }
    }, { threshold: 0.05 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [mobile, props.events, props.eventsLoading, props.eventsError])

  const openPlanner = () => props.onNavigate('/planner')
  const askAi = (event: FormEvent) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt) return
    props.onNavigate('/ai', { prompt })
  }

  const todayCard = <TodayCard key="today" today={props.today} events={props.events} loading={props.eventsLoading} error={props.eventsError} onRetry={props.onRetryEvents} onPrimary={openPlanner} primaryRef={primaryRef} />
  const companyCard = <CompanyCard key="company" company={props.activeCompany} companyCount={props.companyCount} plan={props.plan} planLoading={props.planLoading} limits={props.limits} onCreate={props.onCreateCompany} onEdit={props.onEditCompany} onUpgrade={() => props.onNavigate('/account')} />
  const toolsCard = <DailyToolsCard key="tools" rates={props.rates} today={props.today} onNavigate={route => props.onNavigate(route)} onRetry={props.onRetryRates} />
  const aiCard = <AiCard key="ai" ai={props.ai} question={question} setQuestion={setQuestion} onAsk={askAi} onOpen={() => props.onNavigate('/ai')} onRetry={props.onRetryAi} />
  const weatherCard = props.showLiveWidgets ? <div key="weather" className="bx-d1-dashboard-live bx-d1-dashboard-live--weather"><WeatherWidget /></div> : null
  const horoscopeCard = props.showLiveWidgets ? <div key="horoscope" className="bx-d1-dashboard-live bx-d1-dashboard-live--horoscope"><HoroscopeWidget /></div> : null
  const taxCalendarCard = props.showLiveWidgets ? <section key="tax-calendar" className="bx-d1-dashboard-card bx-d1-dashboard-card--tax-calendar" aria-label="Бухгалтерский календарь"><TaxCalendar onPickDeadline={(date, deadline) => props.onNavigate('/planner', { newTask: { title: deadline.title, note: `Срок из бухгалтерского календаря BX · ${deadline.kind === 'payment' ? 'уплата' : 'отчётность'}`, date } })} /></section> : null
  const cards = props.showLiveWidgets
    ? viewport === 'mobile'
      ? [todayCard, taxCalendarCard, weatherCard, horoscopeCard, aiCard, toolsCard, companyCard]
      : viewport === 'tablet'
        ? [todayCard, weatherCard, taxCalendarCard, companyCard, aiCard, horoscopeCard, toolsCard]
        : [todayCard, weatherCard, taxCalendarCard, toolsCard, companyCard, aiCard, horoscopeCard]
    : viewport === 'mobile'
      ? [todayCard, aiCard, toolsCard, companyCard]
      : viewport === 'tablet'
        ? [todayCard, companyCard, aiCard, toolsCard]
        : [todayCard, companyCard, toolsCard, aiCard]
  const useDesktopWorkspace = props.showLiveWidgets && viewport === 'desktop'

  return (
    <div className="bx-d1-dashboard" data-testid="dashboard-d1">
      <div className="bx-d1-dashboard__container">
        {!props.online && (
          <section className="bx-d1-dashboard-notice" role="alert">
            <Icon name="alert" /><div><strong>Нет соединения</strong><span>Показываем уже загруженные данные. Изменения не выполняются.</span></div>
          </section>
        )}
        <BxMotion preset="raise">
          <DashboardHeader
            today={props.today}
            events={props.events}
            eventsLoading={props.eventsLoading}
            activeCompany={props.activeCompany}
            onNavigate={props.onNavigate}
          />
        </BxMotion>
        <BxMotion preset="raise">
          {useDesktopWorkspace ? (
            <section className="bx-d1-dashboard__workspace" aria-label="Рабочий стол">
              <div className="bx-d1-dashboard__main-column">
                {todayCard}
                {taxCalendarCard}
              </div>
              <aside className="bx-d1-dashboard__signal-column" aria-label="Сигналы и быстрые действия">
                {weatherCard}
                {toolsCard}
                {companyCard}
                {aiCard}
              </aside>
              {horoscopeCard && <div className="bx-d1-dashboard__pause">{horoscopeCard}</div>}
            </section>
          ) : (
            <BentoGrid as="section" className="bx-d1-dashboard__grid" aria-label="Рабочий стол">
              {cards}
            </BentoGrid>
          )}
        </BxMotion>
      </div>
      <div className={`bx-d1-dashboard-sticky ${stickyPrimary ? 'bx-d1-dashboard-sticky--visible' : ''}`} aria-hidden={!stickyPrimary}>
        <button type="button" tabIndex={stickyPrimary ? 0 : -1} className="bx-d1-action bx-d1-action--secondary bx-d1-action--focus" onClick={openPlanner}>Открыть план дня <Icon name="arrowR" /></button>
      </div>
    </div>
  )
}

export default function DashboardD1() {
  const navigate = useNavigate()
  const { active, companies, startCompanyCreation, startCompanyEdit } = useCompany()
  const { plan, limits, loading: planLoading } = usePlan()
  const { events, loading: eventsLoading, error: eventsError, reload: reloadEvents } = useEvents(null)
  const online = useOnlineStatus()
  const [rates, setRates] = useState<AsyncResource<CurrencyRate[]>>({ value: [], loading: true, error: null, updatedAt: null })
  const [ai, setAi] = useState<AsyncResource<AiStatus>>({ value: { usage: null, lastAnswerAt: null }, loading: true, error: null, updatedAt: null })

  const loadRates = useCallback(async () => {
    setRates(current => ({ ...current, loading: true, error: null }))
    try {
      const value = await widgetsApi.getRates(['USD', 'EUR'])
      setRates({ value, loading: false, error: null, updatedAt: new Date().toISOString() })
    } catch (error) {
      setRates(current => ({ ...current, loading: false, error: error instanceof Error ? error.message : 'Не удалось загрузить курсы' }))
    }
  }, [])

  const loadAi = useCallback(async () => {
    setAi(current => ({ ...current, loading: true, error: null }))
    try {
      const { data: usageData, error: usageError } = await supabase.rpc('bx_get_my_usage_snapshot')
      if (usageError) throw usageError
      const usage = parseUsageSnapshot(usageData)
      if (!usage) throw new Error('Сервер вернул некорректный снимок лимитов')

      const { data: chat, error: chatError } = await supabase
        .from('bx_ai_chats').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (chatError) throw chatError
      let lastAnswerAt: string | null = null
      if (chat?.id) {
        const { data: message, error: messageError } = await supabase
          .from('bx_ai_messages').select('created_at').eq('chat_id', chat.id).eq('role', 'assistant')
          .order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (messageError) throw messageError
        lastAnswerAt = message?.created_at ?? null
      }
      setAi({ value: { usage, lastAnswerAt }, loading: false, error: null, updatedAt: new Date().toISOString() })
    } catch (error) {
      setAi(current => ({ ...current, loading: false, error: error instanceof Error ? error.message : 'Не удалось проверить AI' }))
    }
  }, [])

  useEffect(() => { void loadRates() }, [loadRates])
  useEffect(() => { void loadAi() }, [loadAi])

  return (
    <DashboardD1View
      today={todayISO()}
      events={events}
      eventsLoading={eventsLoading}
      eventsError={eventsError}
      rates={rates}
      ai={ai}
      online={online}
      activeCompany={active}
      companyCount={companies.length}
      plan={plan}
      planLoading={planLoading}
      limits={limits}
      onNavigate={(route, state) => navigate(route, state === undefined ? undefined : { state })}
      onRetryEvents={() => void reloadEvents()}
      onRetryRates={() => void loadRates()}
      onRetryAi={() => void loadAi()}
      onCreateCompany={() => startCompanyCreation()}
      onEditCompany={() => { if (active) startCompanyEdit(active) }}
      showLiveWidgets
    />
  )
}
