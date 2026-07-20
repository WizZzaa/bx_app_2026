import React, { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BxMotion } from '../lib/ui/BxMotion'
import Icon from '../lib/ui/Icon'
import {
  ALL_CATALOG_DESTINATIONS,
  FUNCTION_CATALOG_GROUPS,
  type AppNavigationItem,
} from '../components/layout/navigation'

const normalize = (value: string) => value.trim().toLocaleLowerCase('ru-RU')

export function matchesFunctionSearch(item: AppNavigationItem, query: string): boolean {
  const normalized = normalize(query)
  if (!normalized) return true
  return [item.label, item.description, ...(item.keywords ?? [])]
    .some(value => normalize(value).includes(normalized))
}

export default function FunctionCatalog() {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => FUNCTION_CATALOG_GROUPS
    .map(group => ({ ...group, items: group.items.filter(item => matchesFunctionSearch(item, query)) }))
    .filter(group => group.items.length > 0), [query])
  const visibleCount = groups.reduce((total, group) => total + group.items.length, 0)

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-bx-bg text-bx-text" aria-labelledby="function-catalog-title">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <BxMotion preset="route">
          <header className="overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
              <div className="min-w-0">
                <p className="text-sm font-bold text-bx-accent">Рабочее пространство BX</p>
                <h1 id="function-catalog-title" data-route-heading tabIndex={-1} className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.025em] outline-none sm:text-4xl">
                  Все функции — на отдельной странице
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-bx-muted">
                  Здесь собраны внутренние разделы, которые раньше занимали весь сайдбар. Внешние порталы вынесены в самостоятельный каталог и больше не смешиваются с функциями BX.
                </p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-bx-text">Найти функцию</span>
                <span className="relative block">
                  <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bx-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Например, документы или валюты"
                    className="min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg py-3 pl-12 pr-4 text-base text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-bx-accent focus:ring-2 focus:ring-bx-accent/20"
                  />
                </span>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-bx-muted" aria-live="polite">
              <span className="rounded-full border border-bx-border bg-bx-bg px-3 py-1.5 font-semibold text-bx-text">{visibleCount} из {ALL_CATALOG_DESTINATIONS.length}</span>
              <span>Все прежние рабочие маршруты сохранены.</span>
            </div>
          </header>
        </BxMotion>

        {groups.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {groups.map((group, groupIndex) => (
              <BxMotion key={group.id} preset={groupIndex < 2 ? 'raise' : 'fade'} className={group.span === 'lg' ? 'lg:col-span-7' : 'lg:col-span-5'}>
                <section className="h-full rounded-[24px] border border-bx-border bg-bx-surface p-4 shadow-sm sm:p-6" aria-labelledby={`function-group-${group.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 id={`function-group-${group.id}`} className="text-xl font-bold tracking-[-0.015em]">{group.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-bx-muted">{group.description}</p>
                    </div>
                    <span className="rounded-full bg-bx-surface-2 px-3 py-1.5 text-xs font-bold text-bx-muted">{group.items.length}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.items.map(item => <FunctionCard key={item.id} item={item} />)}
                  </div>
                </section>
              </BxMotion>
            ))}
          </div>
        ) : (
          <section className="mt-6 rounded-[24px] border border-dashed border-bx-border bg-bx-surface p-8 text-center" role="status">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bx-surface-2 text-bx-muted"><Icon name="search" className="h-6 w-6" /></span>
            <h2 className="mt-4 text-xl font-bold">Функция не найдена</h2>
            <p className="mx-auto mt-2 max-w-lg text-base text-bx-muted">Попробуйте другое название или сбросьте поиск — ни один раздел не удалён.</p>
            <button type="button" onClick={() => setQuery('')} className="mt-5 min-h-11 rounded-xl bg-bx-accent px-5 text-sm font-bold text-bx-on-accent outline-none transition-colors hover:bg-bx-accent-hover focus-visible:ring-2 focus-visible:ring-bx-accent focus-visible:ring-offset-2">Показать все функции</button>
          </section>
        )}
      </div>
    </div>
  )
}

function FunctionCard({ item }: { item: AppNavigationItem }) {
  return (
    <NavLink
      to={item.to}
      className="group flex min-h-[148px] flex-col rounded-[20px] border border-bx-border bg-bx-bg p-4 text-left outline-none transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-bx-accent hover:bg-bx-surface-2 focus-visible:ring-2 focus-visible:ring-bx-accent focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
      aria-label={`Открыть: ${item.label}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-bx-border bg-bx-surface text-bx-accent"><Icon name={item.icon} className="h-5 w-5" /></span>
        {item.platform === 'windows-mixed' && <span className="rounded-full border border-bx-border bg-bx-surface px-2.5 py-1 text-xs font-bold text-bx-muted">Есть функции Windows</span>}
      </span>
      <strong className="mt-4 text-base font-bold text-bx-text">{item.label}</strong>
      <span className="mt-1 text-sm leading-relaxed text-bx-muted">{item.description}</span>
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-bx-accent">Открыть <Icon name="arrowR" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" /></span>
    </NavLink>
  )
}
