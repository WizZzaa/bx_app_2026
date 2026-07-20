import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BxMotion } from '../lib/ui/BxMotion'
import Icon from '../lib/ui/Icon'
import {
  ALL_CATALOG_DESTINATIONS,
  APP_DESTINATIONS,
  FUNCTION_CATALOG_GROUPS,
  type AppNavigationItem,
} from '../components/layout/navigation'
import '../styles/function-catalog.css'

const normalize = (value: string) => value.trim().toLocaleLowerCase('ru-RU')
const SIDEBAR_RETURNS = [APP_DESTINATIONS.documentHub, APP_DESTINATIONS.counterparties, APP_DESTINATIONS.finance] as const

export function matchesFunctionSearch(item: AppNavigationItem, query: string): boolean {
  const normalized = normalize(query)
  if (!normalized) return true
  return [item.label, item.description, ...(item.keywords ?? [])]
    .some(value => normalize(value).includes(normalized))
}

export default function FunctionCatalog() {
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')
  const groups = useMemo(() => FUNCTION_CATALOG_GROUPS
    .filter(group => activeGroup === 'all' || group.id === activeGroup)
    .map(group => ({ ...group, items: group.items.filter(item => matchesFunctionSearch(item, query)) }))
    .filter(group => group.items.length > 0), [activeGroup, query])
  const visibleCount = groups.reduce((total, group) => total + group.items.length, 0)

  const resetFilters = () => {
    setQuery('')
    setActiveGroup('all')
  }

  return (
    <div className="bx-functions-page min-w-0 flex-1 overflow-y-auto text-bx-text" aria-labelledby="function-catalog-title">
      <div className="bx-functions-container">
        <BxMotion preset="route">
          <header className="bx-functions-hero">
            <div className="bx-functions-hero__copy">
              <p className="bx-functions-eyebrow"><span aria-hidden="true" /> Центр возможностей</p>
              <h1 id="function-catalog-title" data-route-heading tabIndex={-1}>
                Всё, что умеет BX — <em>в одном рабочем центре</em>
              </h1>
              <p className="bx-functions-lead">
                Выберите задачу, а не ищите пункт меню. Частые сценарии закреплены слева, остальные инструменты сгруппированы здесь по работе.
              </p>

              <label className="bx-functions-search">
                <span className="sr-only">Найти функцию</span>
                <Icon name="search" className="h-5 w-5" />
                <input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Найти документ, расчёт, сервис…"
                  aria-label="Найти функцию"
                />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Очистить поиск"><Icon name="crossSmall" className="h-4 w-4" /></button>}
              </label>
            </div>

            <aside className="bx-functions-hero__summary" aria-label="Сводка каталога">
              <div className="bx-functions-orbit" aria-hidden="true"><Icon name="tools" className="h-8 w-8" /></div>
              <p>Рабочая система</p>
              <strong>{ALL_CATALOG_DESTINATIONS.length}</strong>
              <span>специализированных инструментов для учёта, документов и ежедневных задач</span>
              <div className="bx-functions-summary-row">
                <span><b>4</b> направления</span>
                <span><b>3</b> вернули в меню</span>
              </div>
            </aside>
          </header>
        </BxMotion>

        <section className="bx-functions-pinned" aria-labelledby="sidebar-returns-title">
          <div className="bx-functions-pinned__intro">
            <span className="bx-functions-pinned__icon"><Icon name="dashboard" className="h-5 w-5" /></span>
            <div>
              <p>Быстрый доступ</p>
              <h2 id="sidebar-returns-title">Вернули в сайдбар</h2>
            </div>
          </div>
          <div className="bx-functions-pinned__items">
            {SIDEBAR_RETURNS.map(item => (
              <NavLink key={item.id} to={item.to} aria-label={`Открыть из сайдбара: ${item.label}`}>
                <span><Icon name={item.icon} className="h-4 w-4" /></span>
                <b>{item.label}</b>
                <Icon name="arrowR" className="h-4 w-4" />
              </NavLink>
            ))}
          </div>
        </section>

        <div className="bx-functions-toolbar">
          <div>
            <p className="bx-functions-eyebrow"><span aria-hidden="true" /> Каталог</p>
            <h2>Выберите рабочий сценарий</h2>
          </div>
          <nav className="bx-functions-filters" aria-label="Категории функций">
            <button type="button" aria-pressed={activeGroup === 'all'} onClick={() => setActiveGroup('all')}>Все</button>
            {FUNCTION_CATALOG_GROUPS.map(group => (
              <button key={group.id} type="button" aria-pressed={activeGroup === group.id} onClick={() => setActiveGroup(group.id)}>{group.title}</button>
            ))}
          </nav>
        </div>

        <div className="bx-functions-result-meta" aria-live="polite">
          <span>{visibleCount} из {ALL_CATALOG_DESTINATIONS.length}</span>
          <p>{query ? `Результаты по запросу «${query}»` : activeGroup === 'all' ? 'Все возможности BX' : FUNCTION_CATALOG_GROUPS.find(group => group.id === activeGroup)?.description}</p>
          {(query || activeGroup !== 'all') && <button type="button" onClick={resetFilters}>Сбросить фильтры</button>}
        </div>

        {groups.length > 0 ? (
          <div className="bx-functions-groups">
            {groups.map((group, groupIndex) => (
              <BxMotion key={group.id} preset={groupIndex === 0 ? 'raise' : 'fade'}>
                <section className={`bx-functions-group bx-functions-group--${group.id}`} aria-labelledby={`function-group-${group.id}`}>
                  <header>
                    <div>
                      <span>0{FUNCTION_CATALOG_GROUPS.findIndex(candidate => candidate.id === group.id) + 1}</span>
                      <div>
                        <h2 id={`function-group-${group.id}`}>{group.title}</h2>
                        <p>{group.description}</p>
                      </div>
                    </div>
                    <b>{group.items.length}</b>
                  </header>
                  <div className="bx-functions-grid">
                    {group.items.map(item => <FunctionCard key={item.id} item={item} groupId={group.id} />)}
                  </div>
                </section>
              </BxMotion>
            ))}
          </div>
        ) : (
          <section className="bx-functions-empty" role="status">
            <span><Icon name="search" className="h-6 w-6" /></span>
            <h2>Такой функции пока не нашли</h2>
            <p>Попробуйте более короткий запрос или вернитесь ко всему каталогу — ни один раздел не удалён.</p>
            <button type="button" onClick={resetFilters}>Показать все функции</button>
          </section>
        )}
      </div>
    </div>
  )
}

function FunctionCard({ item, groupId }: { item: AppNavigationItem; groupId: string }) {
  const width = cardWidth(item.id, groupId)
  return (
    <NavLink
      to={item.to}
      className={`bx-function-card bx-function-card--${width}`}
      aria-label={`Открыть: ${item.label}`}
    >
      <span className="bx-function-card__wash" aria-hidden="true"><Icon name={item.icon} className="h-full w-full" /></span>
      <span className="bx-function-card__top">
        <span className="bx-function-card__icon"><Icon name={item.icon} className="h-5 w-5" /></span>
        <span className="bx-function-card__arrow"><Icon name="arrowR" className="h-4 w-4" /></span>
      </span>
      <strong>{item.label}</strong>
      <span className="bx-function-card__description">{item.description}</span>
      {item.platform === 'windows-mixed' && <span className="bx-function-card__platform"><Icon name="monitor" className="h-3.5 w-3.5" /> Часть функций — в Windows</span>}
    </NavLink>
  )
}

function cardWidth(itemId: string, groupId: string): 'small' | 'medium' | 'large' {
  if (groupId === 'core') {
    if (itemId === 'ai') return 'large'
    if (itemId === 'translator' || itemId === 'planner') return 'small'
    return 'medium'
  }
  if (groupId === 'accounting') {
    if (itemId === 'finance') return 'large'
    return 'medium'
  }
  return 'medium'
}
