import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KB_ARTICLES } from '../data/knowledge'
import { todayISO } from '../lib/dates'
import Icon from '../lib/ui/Icon'
import { widgetsApi } from '../lib/widgetsApi'
import type { CurrencyRate } from '../../shared/types'
import { useEvents } from './planner/useEvents'

const FAVORITES = [
  { icon: 'ai', label: 'AI-консультант', route: '/ai' },
  { icon: 'translate', label: 'Переводчик', route: '/translator' },
  { icon: 'book', label: 'База знаний', route: '/knowledge' },
  { icon: 'calc', label: 'Калькуляторы', route: '/calc' },
  { icon: 'templates', label: 'Документы', route: '/templates' },
]

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
  const today = todayISO()
  const { events, loading } = useEvents(null)
  const [question, setQuestion] = useState('')
  const [rates, setRates] = useState<CurrencyRate[]>([])

  useEffect(() => {
    let active = true
    void widgetsApi.getRates(['USD', 'EUR']).then(value => {
      if (active) setRates(value)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const upcomingDeadline = useMemo(() => events
    .filter(event => event.type === 'tax_deadline' && event.status !== 'done' && (event.due_date || event.date) >= today)
    .sort((a, b) => (a.due_date || a.date).localeCompare(b.due_date || b.date))[0], [events, today])

  const latestArticles = useMemo(() => [...KB_ARTICLES]
    .filter(article => article.editorialStatus !== 'draft' && article.editorialStatus !== 'archived')
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 3), [])

  const importantChange = latestArticles[0]

  const askAi = (event: FormEvent) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt) return
    navigate('/ai', { state: { prompt } })
  }

  return (
    <main className="z-10 flex-1 overflow-y-auto bg-bx-bg px-5 py-5 text-bx-text sm:px-6">
      <div className="bx-page-container space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h1 className="text-lg font-black tracking-tight">{greeting()}</h1>
          <p className="text-xs capitalize text-bx-muted">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </header>

        <section className="rounded-[28px] border border-blue-500/20 bg-bx-surface p-5 shadow-sm sm:p-7" aria-labelledby="dashboard-ai-title">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><Icon name="ai" className="h-5 w-5" /></span>
            <h2 id="dashboard-ai-title" className="mt-3 text-xl font-black">Что нужно решить?</h2>
            <p className="mt-1 text-xs text-bx-muted">Ответ по бухгалтерии Узбекистана со ссылками на источники</p>
            <form onSubmit={askAi} className="mt-5 flex items-end gap-2 rounded-2xl border border-bx-border bg-bx-bg p-2 focus-within:border-blue-500/50">
              <label htmlFor="dashboard-ai-question" className="sr-only">Вопрос для AI-консультанта</label>
              <textarea id="dashboard-ai-question" value={question} onChange={event => setQuestion(event.target.value)} rows={2} maxLength={2000} placeholder="Например: когда сдавать отчёт по налогу с оборота?" className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-bx-muted" />
              <button type="submit" disabled={!question.trim()} className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-40" aria-label="Спросить BX"><Icon name="arrowR" className="h-4 w-4" /></button>
            </form>
          </div>
        </section>

        {importantChange && <button onClick={() => navigate(`/knowledge?id=${importantChange.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-left hover:border-violet-500/35"><Icon name="news" className="h-4 w-4 flex-shrink-0 text-violet-600 dark:text-violet-300" /><span className="text-[10px] font-black uppercase tracking-wide text-violet-700 dark:text-violet-300">Важное изменение</span><span className="min-w-0 flex-1 truncate text-xs font-bold">{importantChange.title}</span><Icon name="arrowR" className="h-3.5 w-3.5 text-bx-muted" /></button>}

        <section className="rounded-[24px] border border-bx-border bg-bx-surface p-4 shadow-sm" aria-labelledby="favorites-title">
          <div className="flex items-center justify-between"><h2 id="favorites-title" className="text-sm font-black">Избранные сервисы</h2><button onClick={() => navigate('/tools')} className="text-[10px] font-bold text-blue-600 dark:text-blue-300">Все сервисы</button></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">{FAVORITES.map(item => <button key={item.route} onClick={() => navigate(item.route)} className="flex min-h-16 items-center gap-2.5 rounded-xl border border-bx-border bg-bx-bg px-3 text-left hover:border-blue-500/30"><Icon name={item.icon} className="h-4 w-4 text-blue-600 dark:text-blue-300" /><span className="text-[10px] font-bold">{item.label}</span></button>)}</div>
        </section>

        <section className="grid gap-2 sm:grid-cols-3" aria-label="Ключевые показатели">
          {['USD', 'EUR'].map(code => { const rate = rates.find(item => item.code === code); return <div key={code} className="rounded-2xl border border-bx-border bg-bx-surface px-4 py-3"><p className="text-[9px] font-black uppercase tracking-wide text-bx-muted">Курс ЦБ · {code}</p><p className="mt-1 text-base font-black tabular-nums">{rate ? `${rate.value.toLocaleString('ru-RU')} сум` : '—'}</p></div> })}
          <button onClick={() => navigate('/planner')} className="rounded-2xl border border-bx-border bg-bx-surface px-4 py-3 text-left hover:border-blue-500/30"><p className="text-[9px] font-black uppercase tracking-wide text-bx-muted">Ближайший срок</p><p className="mt-1 truncate text-xs font-black">{loading ? 'Загрузка…' : upcomingDeadline?.title || 'Нет ближайших сроков'}</p>{upcomingDeadline && <p className="mt-1 text-[10px] text-bx-muted">{new Date(`${upcomingDeadline.due_date || upcomingDeadline.date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>}</button>
        </section>

        <section className="rounded-[24px] border border-bx-border bg-bx-surface p-4 shadow-sm" aria-labelledby="latest-materials-title">
          <div className="flex items-center justify-between"><h2 id="latest-materials-title" className="text-sm font-black">Последние проверенные материалы</h2><button onClick={() => navigate('/knowledge')} className="text-[10px] font-bold text-blue-600 dark:text-blue-300">Открыть базу</button></div>
          <div className="mt-3 divide-y divide-bx-border/70">{latestArticles.map(article => <button key={article.id} onClick={() => navigate(`/knowledge?id=${article.id}`)} className="flex w-full items-center gap-3 py-3 text-left first:pt-1 last:pb-1"><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{article.title}</span><span className="mt-1 block text-[10px] text-bx-muted">{article.category} · проверено {new Date(`${article.updated}T12:00:00`).toLocaleDateString('ru-RU')}</span></span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">Проверено</span></button>)}</div>
        </section>
      </div>
    </main>
  )
}
