import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/db/supabase'
import Icon from '../lib/ui/Icon'
import { LEGISLATION_NEWS, type NewsItem } from '../data/newsItems'

const NEWS_SOURCES = [
  { name: 'ГНК РУз', url: 'https://soliq.uz/news' },
  { name: 'Norma.uz', url: 'https://norma.uz' },
  { name: 'Lex.uz', url: 'https://lex.uz' },
  { name: 'Buxgalter.uz', url: 'https://buxgalter.uz' },
  { name: 'ЦБ РУз', url: 'https://cbu.uz/press-center/' },
]

function openLink(url: string) {
  if (typeof window !== 'undefined' && window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function News() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('Все')
  const [search, setSearch] = useState('')
  const [brvValue, setBrvValue] = useState('412 000')
  const [mrotValue, setMrotValue] = useState('1 271 000')
  const [refiValue, setRefiValue] = useState('14%')
  const [ndsValue, setNdsValue] = useState('12%')

  const loadDbData = useCallback(async () => {
    try {
      const { data: indicators } = await supabase.from('bx_ref_indicators').select('id, key')
      if (indicators) {
        const { data: values } = await supabase.from('bx_ref_indicator_values').select('indicator_id, value, valid_from').order('valid_from', { ascending: false })
        if (values) {
          const latest = (key: string) => {
            const indicator = indicators.find(item => item.key === key)
            return indicator ? values.find(value => value.indicator_id === indicator.id)?.value ?? null : null
          }
          const brv = latest('brv')
          const mrot = latest('mrot')
          const refi = latest('refi')
          if (brv) setBrvValue(Number(brv).toLocaleString('ru-RU'))
          if (mrot) setMrotValue(Number(mrot).toLocaleString('ru-RU'))
          if (refi) setRefiValue(`${refi}%`)
        }
      }
      const { data: taxes } = await supabase.from('bx_ref_taxes').select('name, rate')
      const nds = taxes?.find(tax => tax.name.toLowerCase().trim() === 'ндс')
      if (nds) setNdsValue(nds.rate)
    } catch (error) {
      console.warn('Ошибка загрузки индикаторов из БД:', error)
    }
  }, [])

  useEffect(() => { void loadDbData() }, [loadDbData])

  const categories = ['Все', 'Налоги', 'Ставки', 'Отчетность', 'ЭЦП']
  const query = search.trim().toLowerCase()
  const filteredNews = useMemo(() => LEGISLATION_NEWS.filter(item => {
    const matchesCategory = filter === 'Все' || item.tag === filter
    const haystack = `${item.title} ${item.summary} ${item.points.join(' ')}`.toLowerCase()
    return matchesCategory && (!query || haystack.includes(query))
  }), [filter, query])
  const featured = filteredNews[0]
  const rest = filteredNews.slice(1)

  const askAiAbout = (item: NewsItem) => navigate('/ai', { state: { prompt: `Объясни простыми словами, как изменение «${item.title}» влияет на бухгалтера и компанию. Проверь применимость, риски и действия. Данные новости:\n${item.points.map(point => `- ${point}`).join('\n')}\nИсточник: ${item.source}` } })
  const createTaskFromNews = (item: NewsItem) => navigate('/planner', { state: { newTask: { title: `Проверить изменение: ${item.title}`, note: `Источник: ${item.source}\nСсылка: ${item.url}\n\n${item.points.map((point, index) => `${index + 1}. ${point}`).join('\n')}` } } })

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto bg-bx-bg px-4 py-4 text-bx-text sm:px-6 sm:py-6">
      <div className="bx-page-container space-y-5">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.7fr)]">
          <header className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.10] via-bx-surface to-bx-surface p-6 sm:p-8">
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-violet-600 text-white"><Icon name="news" className="h-5 w-5" /></span><div><p className="text-xs font-black text-violet-700 dark:text-violet-300">Изменения законодательства</p><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Новости, из которых понятно, что делать</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-bx-muted">Откройте краткую суть, проверьте официальный источник и сразу передайте изменение в AI или Планировщик.</p></div></div>
            <div className="mt-6 flex flex-wrap gap-2"><button type="button" onClick={() => navigate('/planner')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white hover:bg-violet-700"><Icon name="planner" className="h-4 w-4" />Открыть план работ</button><button type="button" onClick={() => navigate('/ai')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bx-border bg-bx-surface px-4 text-sm font-black text-bx-text hover:border-violet-500/30"><Icon name="ai" className="h-4 w-4 text-violet-600" />Спросить AI</button></div>
          </header>
          <aside className="rounded-[28px] border border-bx-border bg-bx-surface p-5" aria-label="Как работать с новостями"><p className="text-xs font-black text-violet-700 dark:text-violet-300">Один безопасный сценарий</p><h2 className="mt-1 text-lg font-black">Прочитать → сверить → назначить</h2><ol className="mt-4 space-y-3">{[['1', 'Прочитайте краткую суть'], ['2', 'Откройте официальный источник'], ['3', 'Создайте задачу только после проверки']].map(([number, text]) => <li key={number} className="flex items-center gap-3 rounded-xl bg-bx-bg p-3"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-violet-500/10 text-xs font-black text-violet-700 dark:text-violet-300">{number}</span><span className="text-sm font-semibold">{text}</span></li>)}</ol></aside>
        </section>

        <section aria-label="Ключевые показатели" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicator label="БРВ" hint="Базовая величина" value={brvValue} unit="сум" />
          <Indicator label="МРОТ" hint="Минимальная оплата" value={mrotValue} unit="сум" />
          <Indicator label="НДС" hint="Базовая ставка" value={ndsValue} />
          <Indicator label="Ставка ЦБ" hint="Основная ставка" value={refiValue} />
        </section>

        <section className="rounded-[22px] border border-bx-border bg-bx-surface p-3 sm:p-4" aria-label="Поиск и фильтры новостей">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><label className="relative min-w-0 flex-1"><span className="sr-only">Поиск по новостям</span><Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bx-muted" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Налог, ставка, отчётность, ЭЦП…" className="min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg pl-10 pr-4 text-base text-bx-text outline-none placeholder:text-bx-muted focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15" /></label><div className="flex flex-wrap gap-2" aria-label="Темы новостей">{categories.map(category => { const count = category === 'Все' ? LEGISLATION_NEWS.length : LEGISLATION_NEWS.filter(item => item.tag === category).length; return <button type="button" key={category} onClick={() => setFilter(category)} aria-pressed={filter === category} className={`min-h-11 rounded-xl border px-3 text-xs font-black ${filter === category ? 'border-violet-600 bg-violet-600 text-white' : 'border-bx-border bg-bx-bg text-bx-muted hover:border-violet-500/30 hover:text-bx-text'}`}>{category} · {count}</button> })}</div></div>
          <details className="mt-3 rounded-xl border border-bx-border bg-bx-bg"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-xs font-black text-bx-text [&::-webkit-details-marker]:hidden"><span>Официальные новостные источники</span><Icon name="arrowR" className="h-4 w-4 rotate-90 text-bx-muted" /></summary><div className="flex flex-wrap gap-2 border-t border-bx-border p-3">{NEWS_SOURCES.map(source => <button type="button" key={source.url} onClick={() => openLink(source.url)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-bx-muted hover:bg-bx-surface hover:text-violet-700 dark:hover:text-violet-300">{source.name}<Icon name="external" className="h-3.5 w-3.5" /></button>)}</div></details>
        </section>

        {featured ? <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]" aria-label="Лента изменений"><article className="rounded-[26px] border border-violet-500/20 bg-violet-500/[0.06] p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">Главное</span><span className="rounded-lg border border-violet-500/20 bg-bx-surface px-2.5 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">{featured.tag}</span><span className="text-xs font-semibold text-bx-muted">{formatDate(featured.date)}</span></div><h2 className="mt-4 max-w-4xl text-2xl font-black leading-tight">{featured.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-bx-muted">{featured.summary}</p><div className="mt-5 grid gap-2 sm:grid-cols-3">{featured.points.map((point, index) => <div key={point} className="rounded-xl border border-bx-border bg-bx-surface p-3"><span className="text-[10px] font-black text-violet-600">0{index + 1}</span><p className="mt-2 text-xs font-semibold leading-5">{point}</p></div>)}</div><NewsActions item={featured} onRead={() => navigate(`/news/${featured.id}`)} onAi={() => askAiAbout(featured)} onTask={() => createTaskFromNews(featured)} /></article><aside className="space-y-3">{rest.map(item => <NewsRow key={item.id} item={item} onRead={() => navigate(`/news/${item.id}`)} />)}</aside></section> : <div className="rounded-[26px] border border-dashed border-bx-border bg-bx-surface py-14 text-center"><Icon name="search" className="mx-auto h-7 w-7 text-bx-muted" /><h2 className="mt-3 text-lg font-black">Ничего не найдено</h2><p className="mt-1 text-sm text-bx-muted">Измените запрос или сбросьте тему.</p><button type="button" onClick={() => { setSearch(''); setFilter('Все') }} className="mt-4 min-h-11 rounded-xl bg-violet-600 px-4 text-sm font-black text-white">Сбросить фильтры</button></div>}

        <p className="pb-4 text-center text-xs leading-relaxed text-bx-muted">Перед применением показателей и формулировок откройте официальный источник и проверьте дату действия нормы.</p>
      </div>
    </div>
  )
}

function Indicator({ label, hint, value, unit = '' }: { label: string; hint: string; value: string; unit?: string }) {
  return <div className="rounded-2xl border border-bx-border bg-bx-surface p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-bx-muted">{label}</span><span className="inline-flex items-center gap-1 text-[10px] font-bold text-bx-muted"><Icon name="check" className="h-3.5 w-3.5 text-violet-600" />Сверяйте дату</span></div><p className="mt-3 text-xl font-black tabular-nums text-bx-text">{value} <span className="text-xs text-bx-muted">{unit}</span></p><p className="mt-1 text-xs text-bx-muted">{hint}</p></div>
}

function NewsRow({ item, onRead }: { item: NewsItem; onRead: () => void }) {
  return <article className="rounded-[22px] border border-bx-border bg-bx-surface p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-black text-violet-700 dark:text-violet-300">{item.tag}</span><span className="text-[10px] font-semibold text-bx-muted">{formatDate(item.date)}</span></div><h2 className="mt-3 text-base font-black leading-snug">{item.title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-bx-muted">{item.summary}</p><button type="button" onClick={onRead} className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-black hover:border-violet-500/30">Открыть разбор<Icon name="arrowR" className="h-4 w-4 text-violet-600" /></button></article>
}

function NewsActions({ item, onRead, onAi, onTask }: { item: NewsItem; onRead: () => void; onAi: () => void; onTask: () => void }) {
  return <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onRead} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-black text-white hover:bg-violet-700"><Icon name="news" className="h-4 w-4" />Читать разбор</button><button type="button" onClick={onAi} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bx-border bg-bx-surface px-4 text-xs font-black hover:border-violet-500/30"><Icon name="ai" className="h-4 w-4 text-violet-600" />Разобрать с AI</button><button type="button" onClick={onTask} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bx-border bg-bx-surface px-4 text-xs font-black hover:border-violet-500/30"><Icon name="planner" className="h-4 w-4 text-violet-600" />В план работ</button><button type="button" onClick={() => openLink(item.url)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-bx-muted hover:text-bx-text">Источник<Icon name="external" className="h-4 w-4" /></button></div>
}
