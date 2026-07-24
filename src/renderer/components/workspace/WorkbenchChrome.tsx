import React from 'react'
import Icon from '../../lib/ui/Icon'
import { BxMotion } from '../../lib/ui/BxMotion'

export interface WorkbenchCatalogItem {
  id: string
  icon: string
  label: string
  group: string
  desc: string
  status?: 'ready' | 'proposal'
}

interface WorkbenchCatalogNavProps<T extends WorkbenchCatalogItem> {
  ariaLabel: string
  activeId: string
  emptyText: string
  groups: readonly string[]
  items: readonly T[]
  search: string
  searchLabel: string
  searchPlaceholder: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
}

export function WorkbenchCatalogNav<T extends WorkbenchCatalogItem>({
  ariaLabel,
  activeId,
  emptyText,
  groups,
  items,
  search,
  searchLabel,
  searchPlaceholder,
  onSearchChange,
  onSelect,
}: WorkbenchCatalogNavProps<T>) {
  const allGroupedItems = groups
    .map(group => ({ group, items: items.filter(item => item.group === group) }))
    .filter(section => section.items.length > 0)
  const activeGroup = items.find(item => item.id === activeId)?.group ?? allGroupedItems[0]?.group
  const isSearching = search.trim().length > 0
  const groupedItems = isSearching
    ? allGroupedItems
    : allGroupedItems.filter(section => section.group === activeGroup)
  const selectGroup = (group: string) => {
    const first = items.find(item => item.group === group)
    if (first) onSelect(first.id)
  }

  return (
    <div className="bx-a7-catalog-nav flex min-h-0 flex-1 flex-col" aria-label={ariaLabel}>
      <div className="bx-a7-catalog-nav__header flex-shrink-0 px-4 pb-3 pt-4">
        <p className="bx-a7-catalog-nav__eyebrow">Рабочая библиотека</p>
        <div className="bx-a7-catalog-nav__title-row">
          <h1>{ariaLabel === 'Категории калькуляторов' ? 'Расчёты' : 'Утилиты'}</h1>
          <span>{items.length}</span>
        </div>
        <p className="bx-a7-catalog-nav__hint">
          {ariaLabel === 'Категории калькуляторов'
            ? 'Сначала выберите категорию, затем нужный расчёт.'
            : 'Системные и документные инструменты отдельно от расчётов.'}
        </p>

        <div className="relative">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            aria-label={searchLabel}
            placeholder={searchPlaceholder}
            className="min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg pl-10 pr-3 text-sm font-semibold text-bx-text outline-none placeholder:text-bx-muted focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {!isSearching && allGroupedItems.length > 0 && (
          <div className="bx-a7-catalog-nav__categories" role="list" aria-label="Категории">
            {allGroupedItems.map(section => (
              <button
                key={section.group}
                type="button"
                aria-pressed={section.group === activeGroup}
                onClick={() => selectGroup(section.group)}
              >
                <span>{section.group}</span>
                <small>{section.items.length}</small>
              </button>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <label className="bx-a7-catalog-nav__mobile-select mt-3 block text-xs font-black text-bx-text lg:hidden">
            Инструмент
            <select
              value={activeId}
              onChange={event => onSelect(event.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm font-semibold text-bx-text outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
            >
              {allGroupedItems.map(section => (
                <optgroup key={section.group} label={section.group}>
                  {section.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="bx-a7-catalog-nav__tools custom-scrollbar hidden flex-1 space-y-4 overflow-y-auto px-2.5 pb-4 lg:block" aria-label={ariaLabel}>
        {items.length === 0 && (
          <div className="px-3 py-5 text-center">
            <p className="text-xs font-medium text-bx-muted">{emptyText}</p>
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="mt-2 min-h-11 rounded-lg px-3 text-xs font-bold text-violet-700 hover:bg-violet-500/[0.07] focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:text-violet-300"
            >
              Очистить поиск
            </button>
          </div>
        )}

        {groupedItems.map(section => (
          <section key={section.group} aria-labelledby={`${ariaLabel}-${section.group}`.replace(/\s+/g, '-').toLowerCase()}>
            <h2
              id={`${ariaLabel}-${section.group}`.replace(/\s+/g, '-').toLowerCase()}
              className="mb-1 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300"
            >
              {section.group}
            </h2>
            <div className="space-y-1">
              {section.items.map(item => {
                const isActive = activeId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    title={item.desc}
                    data-status={item.status ?? 'ready'}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${
                      isActive
                        ? 'border-violet-600 bg-violet-600 font-extrabold text-white'
                        : 'border-transparent text-bx-text hover:bg-violet-500/[0.07]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${isActive ? 'border-white/15 bg-white/20 text-white' : 'border-bx-border/60 bg-violet-500/10 text-violet-700 dark:text-violet-300'}`}>
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-xs">{item.label}</strong>
                      <small className="mt-0.5 block truncate">{item.desc}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </nav>
    </div>
  )
}

interface WorkbenchActionsProps {
  isFavorite: boolean
  onToggleFavorite: () => void
  onReset: () => void
  onExport?: () => void
}

export function WorkbenchActions({ isFavorite, onToggleFavorite, onReset, onExport }: WorkbenchActionsProps) {
  const buttonClass = 'min-h-11 rounded-xl border border-bx-border bg-bx-surface px-3 text-xs font-bold text-bx-muted transition-colors hover:border-violet-500/30 hover:text-bx-text focus:outline-none focus:ring-2 focus:ring-violet-500/40'

  return (
    <div className="bx-a7-workbench-actions flex flex-wrap items-center justify-end gap-2">
      <button type="button" onClick={onReset} className={buttonClass} title="Очистить поля текущего модуля">
        Сбросить
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        className={`${buttonClass} ${isFavorite ? '!border-amber-500/30 !bg-amber-500/10 !text-amber-700 dark:!text-amber-400' : ''}`}
      >
        {isFavorite ? '★ В избранном' : '☆ Избранное'}
      </button>
      {onExport && (
        <button type="button" onClick={onExport} className="min-h-11 rounded-xl bg-violet-600 px-3.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-bx-bg">
          PDF
        </button>
      )}
    </div>
  )
}

interface WorkbenchCanvasProps {
  children: React.ReactNode
  resetKey: React.Key
  fullHeight?: boolean
}

export function WorkbenchCanvas({ children, resetKey, fullHeight }: WorkbenchCanvasProps) {
  return (
    <div
      className={`bx-a7-workbench-canvas ${fullHeight ? 'h-full overflow-hidden p-4' : 'p-4 sm:p-5'} rounded-2xl border border-bx-border bg-bx-surface [&_button]:cursor-pointer [&_button]:focus-visible:outline-none [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-violet-500/40 [&_input]:min-h-11 [&_select]:min-h-11 [&_textarea]:leading-relaxed`}
    >
      <BxMotion key={resetKey} preset="fade" className={fullHeight ? 'h-full' : undefined}>
        {children}
      </BxMotion>
    </div>
  )
}

export function WorkbenchEmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-bx-border p-4 text-center">
      <Icon name="search" className="mx-auto h-5 w-5 text-bx-muted" />
      <p className="mt-2 text-xs font-semibold text-bx-muted">{text}</p>
    </div>
  )
}
