import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../lib/CompanyContext'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'
import { buildIndex, groupSearchResults, search, type SearchItem } from '../lib/searchIndex'
import Icon from '../lib/ui/Icon'

const CATEGORY_ICONS: Record<string, string> = {
  Команда: 'plus', Раздел: 'dashboard', Статья: 'knowledge', Новость: 'news',
  Налог: 'reference', Показатель: 'reference', Счёт: 'finance', Стандарт: 'note',
  Компания: 'building', Задача: 'planner', Действие: 'tools', Идея: 'ai',
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { companies } = useCompany()
  const { isPro } = usePlan()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchItem[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setQuery('')
    setSelected(0)
    setLoading(true)
    window.setTimeout(() => inputRef.current?.focus(), 30)

    async function load() {
      const base = await buildIndex()
      const privateItems: SearchItem[] = companies.map(company => ({
        id: company.id,
        title: company.name,
        subtitle: company.inn ? `ИНН ${company.inn}` : 'Компания',
        category: 'Компания',
        route: `/companies/${company.id}`,
      }))
      if (isPro) {
        const { data } = await supabase.from('bx_events')
          .select('id, title, date, due_date, status')
          .neq('status', 'done')
          .order('date', { ascending: true })
          .limit(200)
        for (const event of data ?? []) privateItems.push({
          id: event.id,
          title: event.title,
          subtitle: `Задача · ${event.due_date || event.date}`,
          category: 'Задача',
          route: `/planner?event=${event.id}`,
        })
      }
      if (active) {
        setIndex([...base, ...privateItems])
        setLoading(false)
      }
    }
    void load().catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [companies, isPro, open])

  const results = useMemo(() => query.trim()
    ? search(index, query)
    : index.filter(item => item.category === 'Команда' || item.category === 'Раздел').slice(0, 12), [index, query])
  const groups = useMemo(() => groupSearchResults(results), [results])

  useEffect(() => setSelected(0), [query])
  useEffect(() => {
    dialogRef.current?.querySelector(`[data-result-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const run = (item: SearchItem) => {
    if (item.category === 'Задача' && item.id) localStorage.setItem('bx_planner_open_event_id', item.id)
    if (item.route === '/planner?new=task') navigate('/planner', { state: { newTask: {} } })
    else navigate(item.route)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'ArrowDown') { event.preventDefault(); setSelected(value => Math.min(value + 1, results.length - 1)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); setSelected(value => Math.max(value - 1, 0)) }
      if (event.key === 'Enter' && results[selected]) { event.preventDefault(); run(results[selected]) }
      if (event.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('input,button') ?? [])]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open, results, selected])

  if (!open) return null
  let resultIndex = -1
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="global-search-title" className="bx-animate-fade w-full max-w-2xl overflow-hidden rounded-2xl border border-bx-border-2 bg-bx-surface shadow-2xl">
        <h2 id="global-search-title" className="sr-only">Глобальный поиск BX</h2>
        <div className="flex items-center gap-3 border-b border-bx-border px-4 py-3">
          <Icon name="search" className="h-5 w-5 text-bx-muted" />
          <input ref={inputRef} role="combobox" aria-expanded="true" aria-autocomplete="list" value={query} onChange={event => setQuery(event.target.value)} aria-controls="global-search-results" aria-activedescendant={results[selected] ? `global-search-result-${selected}` : undefined} placeholder="Статьи, справочники, сервисы, компании и задачи…" className="min-h-11 flex-1 bg-transparent text-base text-bx-text outline-none placeholder:text-bx-muted" />
          <kbd className="rounded border border-bx-border-2 px-2 py-1 text-sm text-bx-muted">Esc</kbd>
        </div>
        <div id="global-search-results" role="listbox" aria-label="Результаты поиска" className="max-h-[60vh] overflow-y-auto py-2">
          {loading && <p role="status" className="px-4 py-8 text-center text-sm text-bx-muted">Собираем доступные результаты…</p>}
          {!loading && results.length === 0 && <p className="px-4 py-8 text-center text-sm text-bx-muted">Ничего не найдено. Попробуйте название, раздел или команду.</p>}
          {groups.map(group => <section key={group.category} aria-labelledby={`search-group-${group.category}`}>
            <h3 id={`search-group-${group.category}`} className="px-4 pb-1 pt-3 text-sm font-bold text-bx-muted">{group.category}</h3>
            {group.items.map(item => {
              resultIndex += 1
              const currentIndex = resultIndex
              const active = currentIndex === selected
              return <button id={`global-search-result-${currentIndex}`} role="option" aria-selected={active} data-result-index={currentIndex} key={`${item.category}:${item.id ?? item.route}:${item.title}`} onMouseEnter={() => setSelected(currentIndex)} onClick={() => run(item)} className={`flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left outline-none ${active ? 'bg-violet-500/12' : 'hover:bg-bx-surface-2'} focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bx-surface-2 text-bx-muted"><Icon name={CATEGORY_ICONS[item.category] ?? 'search'} className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-base font-bold text-bx-text">{item.title}</strong><span className="block truncate text-sm text-bx-muted">{item.subtitle}</span></span>
                <Icon name="arrowR" className="h-4 w-4 text-bx-muted" />
              </button>
            })}
          </section>)}
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-bx-border px-4 py-3 text-sm text-bx-muted"><span>↑ ↓ — выбор</span><span>Enter — открыть</span><span className="ml-auto">Ctrl/Cmd + K</span></div>
      </div>
    </div>
  )
}
