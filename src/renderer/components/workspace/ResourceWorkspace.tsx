import React from 'react'
import Icon from '../../lib/ui/Icon'

export function ResourceLayout({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-w-0 overflow-hidden bg-bx-bg text-bx-text">
      {sidebar}
      <div className="custom-scrollbar min-w-0 flex-1 overflow-y-auto">
        <div className="bx-page-container px-5 py-5 lg:px-7 lg:py-6">{children}</div>
      </div>
    </div>
  )
}

interface ResourceSidebarProps {
  icon: string
  title: string
  subtitle: string
  search?: string
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  onClear?: () => void
  label: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function ResourceSidebar({ icon, title, subtitle, search, searchPlaceholder, onSearch, onClear, label, children, footer }: ResourceSidebarProps) {
  return (
    <aside className="flex w-[244px] flex-shrink-0 flex-col border-r border-bx-border bg-bx-surface/70 2xl:w-[276px]" aria-label={label}>
      <div className="border-b border-bx-border px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-blue-500/15 bg-blue-500/10 text-blue-600 dark:text-blue-300">
            <Icon name={icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-tight text-bx-text">{title}</p>
            <p className="mt-1 text-[11px] leading-snug text-bx-muted">{subtitle}</p>
          </div>
        </div>

        {onSearch && (
          <label className="relative mt-4 block">
            <span className="sr-only">{searchPlaceholder}</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bx-muted" />
            <input
              value={search ?? ''}
              onChange={event => onSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-xl border border-bx-border-2 bg-bx-bg pl-10 pr-9 text-xs font-medium text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
            />
            {!!search && onClear && (
              <button type="button" onClick={onClear} aria-label="Очистить поиск" className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Icon name="crossSmall" className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-bx-muted">{label}</p>
        {!!search && onClear && <button type="button" onClick={onClear} className="min-h-8 rounded-lg px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-500/10 dark:text-blue-300">Сбросить</button>}
      </div>
      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-2.5 pb-4">{children}</nav>
      {footer && <div className="border-t border-bx-border p-3">{footer}</div>}
    </aside>
  )
}

export function ResourceNavItem({ icon, label, description, count, active, onClick, suffix }: { icon: string; label: string; description?: string; count?: number; active: boolean; onClick: () => void; suffix?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${active ? 'border-blue-500/20 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-transparent text-bx-text hover:border-bx-border hover:bg-bx-bg'}`}
    >
      <span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${active ? 'bg-white/15 text-white' : 'bg-bx-surface-2 text-bx-muted group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{label}</span>
        {description && <span className={`mt-1 block text-[10px] font-semibold leading-snug ${active ? 'text-blue-100' : 'text-bx-muted'}`}>{description}</span>}
      </span>
      {count !== undefined && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums ${active ? 'bg-white/15 text-white' : 'bg-bx-surface-2 text-bx-muted'}`}>{count}</span>}
      {suffix}
    </button>
  )
}

interface ResourceHeroProps {
  eyebrow: string
  title: string
  description: string
  icon: string
  stats?: Array<{ value: React.ReactNode; label: string }>
  actions?: React.ReactNode
}

export function ResourceHero({ eyebrow, title, description, icon, stats = [], actions }: ResourceHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface px-5 py-5 shadow-sm lg:px-6 lg:py-6">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col justify-between gap-5 2xl:flex-row 2xl:items-end">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20">
            <Icon name={icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">{eyebrow}</p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight tracking-[-0.025em] text-bx-text">{title}</h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-bx-muted">{description}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 2xl:justify-end">{actions}</div>}
      </div>
      {stats.length > 0 && (
        <dl className="relative mt-5 grid grid-cols-2 gap-2 border-t border-bx-border pt-4 sm:grid-cols-3 lg:flex lg:flex-wrap">
          {stats.map(stat => (
            <div key={stat.label} className="min-w-[128px] rounded-xl bg-bx-bg px-3.5 py-2.5">
              <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-bx-muted">{stat.label}</dt>
              <dd className="mt-1 text-sm font-black text-bx-text tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}

export function ResourceSectionTitle({ title, subtitle, count, action, headingLevel = 'h3' }: { title: string; subtitle?: string; count?: number; action?: React.ReactNode; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Heading className="text-base font-black text-bx-text">{title}</Heading>
          {count !== undefined && <span className="rounded-full bg-bx-surface-2 px-2 py-0.5 text-[10px] font-black text-bx-muted tabular-nums">{count}</span>}
        </div>
        {subtitle && <p className="mt-1 text-[11px] leading-relaxed text-bx-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function ResourceEmpty({ icon = 'search', title, description, action }: { icon?: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-dashed border-bx-border-2 bg-bx-surface px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bx-surface-2 text-bx-muted"><Icon name={icon} className="h-5 w-5" /></span>
      <h3 className="mt-4 text-sm font-black text-bx-text">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-bx-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const primaryActionClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-md shadow-blue-600/20 outline-none transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bx-surface disabled:cursor-not-allowed disabled:opacity-45'
export const secondaryActionClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-bx-border bg-bx-bg px-4 text-xs font-black text-bx-text outline-none transition-colors hover:border-blue-500/30 hover:bg-blue-500/[0.06] hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:text-blue-300'
