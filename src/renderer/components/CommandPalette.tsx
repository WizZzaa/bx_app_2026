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
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    return () => { previousFocusRef.current?.focus() }
  }, [open])

  useEffect(() => {
    if (!open) return
    let active = true
    setQuery('')
    setSelected(0)
    setLoading(true)
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30)

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
    return () => {
      active = false
      window.clearTimeout(focusTimer)
    }
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
      if (event.key === 'ArrowDown') { event.preventDefault(); setSelected(value => Math.min(value + 1, Math.max(0, results.length - 1))) }
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
    <div className="bx-command-palette-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="global-search-title" className="bx-command-palette">
        <h2 id="global-search-title" className="sr-only">Глобальный поиск BX</h2>
        <div className="bx-command-palette__search">
          <span className="bx-command-palette__search-icon"><Icon name="search" className="h-5 w-5" /></span>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-busy={loading}
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-controls="global-search-results"
            aria-activedescendant={results[selected] ? `global-search-result-${selected}` : undefined}
            placeholder="Найдите раздел, задачу или действие"
          />
          <button type="button" onClick={onClose} className="bx-command-palette__close" aria-label="Закрыть глобальный поиск">
            <kbd>Esc</kbd>
          </button>
        </div>
        <div id="global-search-results" role="listbox" aria-label="Результаты поиска" className="bx-command-palette__results">
          {loading && (
            <div role="status" className="bx-command-palette__state">
              <span className="bx-command-palette__spinner" aria-hidden="true" />
              <strong>Собираем доступные действия</strong>
              <p>Разделы появятся через мгновение.</p>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="bx-command-palette__state">
              <span className="bx-command-palette__state-icon" aria-hidden="true"><Icon name="search" className="h-5 w-5" /></span>
              <strong>Ничего не найдено</strong>
              <p>Попробуйте название раздела, компании или задачи.</p>
            </div>
          )}
          {groups.map(group => <section key={group.category} aria-labelledby={`search-group-${group.category}`}>
            <h3 id={`search-group-${group.category}`} className="bx-command-palette__group-title">{group.category}</h3>
            {group.items.map(item => {
              resultIndex += 1
              const currentIndex = resultIndex
              const active = currentIndex === selected
              return <button id={`global-search-result-${currentIndex}`} role="option" aria-selected={active} data-result-index={currentIndex} key={`${item.category}:${item.id ?? item.route}:${item.title}`} onMouseEnter={() => setSelected(currentIndex)} onClick={() => run(item)} className={`bx-command-palette__result ${active ? 'is-active' : ''}`}>
                <span className="bx-command-palette__result-icon"><Icon name={CATEGORY_ICONS[item.category] ?? 'search'} className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><strong>{item.title}</strong><span>{item.subtitle}</span></span>
                <Icon name="arrowR" className="h-4 w-4 shrink-0" />
              </button>
            })}
          </section>)}
        </div>
        <footer className="bx-command-palette__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> выбор</span>
          <span><kbd>Enter</kbd> открыть</span>
          <span className="ml-auto"><kbd>⌘K</kbd> поиск</span>
        </footer>
      </div>
    </div>
  )
}
