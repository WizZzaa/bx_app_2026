import React, { useEffect, useMemo, useState } from 'react'
import { getSectionsSync, refreshServices } from '../lib/db/servicesRepo'
import type { ServiceSection } from '../data/services'
import Icon from '../lib/ui/Icon'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSectionTitle,
  ResourceSidebar,
  secondaryActionClass,
} from '../components/workspace/ResourceWorkspace'

export function serviceItemKey(sectionId: string, index: number, title: string, url: string): string {
  return `${sectionId}-${index}-${title}-${url}`
}

function openLink(url: string) {
  if (window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

function sectionIcon(section: ServiceSection) {
  const value = `${section.id} ${section.title}`.toLowerCase()
  if (value.includes('налог') || value.includes('гос')) return 'government'
  if (value.includes('банк') || value.includes('финанс')) return 'finance'
  if (value.includes('эдо') || value.includes('подпис')) return 'shield'
  if (value.includes('учёт') || value.includes('бух')) return 'book'
  return 'globe'
}

export default function Services() {
  const [sections, setSections] = useState<ServiceSection[]>(() => getSectionsSync())
  const [search, setSearch] = useState('')
  const [activeSecId, setActiveSecId] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let active = true
    refreshServices().then(value => { if (active) setSections(value) }).catch(() => { /* локальный каталог остаётся доступным */ })
    return () => { active = false }
  }, [])

  const total = useMemo(() => sections.reduce((sum, section) => sum + section.items.length, 0), [sections])
  const q = search.toLowerCase().trim()
  const filteredSections = useMemo(() => sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => !q || [item.title, item.desc, item.tag].some(value => value?.toLowerCase().includes(q))),
    }))
    .filter(section => section.items.length > 0 && (activeSecId === 'all' || section.id === activeSecId)), [sections, q, activeSecId])

  const visibleCount = filteredSections.reduce((sum, section) => sum + section.items.length, 0)
  const handleRefresh = async () => {
    setRefreshing(true)
    try { setSections(await refreshServices()) } catch { /* сохраняем локальный fallback */ }
    finally { setRefreshing(false) }
  }

  const reset = () => { setSearch(''); setActiveSecId('all') }

  const sidebar = (
    <ResourceSidebar
      icon="services"
      title="Сервисы"
      subtitle={`${total} проверяемых рабочих ресурсов`}
      search={search}
      searchPlaceholder="Найти портал или услугу"
      onSearch={setSearch}
      onClear={() => setSearch('')}
      label="Категории"
      footer={(
        <div className="flex items-start gap-2.5 rounded-xl bg-bx-bg px-3 py-3 text-[10px] leading-relaxed text-bx-muted">
          <Icon name="shield" className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
          Ссылки открываются во внешнем браузере. Перед вводом данных проверяйте домен.
        </div>
      )}
    >
      <ResourceNavItem icon="globe" label="Все ресурсы" count={total} active={activeSecId === 'all'} onClick={() => setActiveSecId('all')} />
      {sections.map(section => (
        <ResourceNavItem key={section.id} icon={sectionIcon(section)} label={section.title} count={section.items.length} active={activeSecId === section.id} onClick={() => setActiveSecId(section.id)} />
      ))}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div className="space-y-6">
        <ResourceHero
          eyebrow="Проверенный рабочий контур"
          title="Официальные сервисы — без поиска по закладкам"
          description="Единый каталог государственных порталов, банковских инструментов, ЭДО и бухгалтерских ресурсов Узбекистана. Выберите задачу — BX откроет нужный официальный сайт."
          icon="services"
          stats={[
            { value: total, label: 'ресурсов' },
            { value: sections.length, label: 'категорий' },
            { value: visibleCount, label: 'показано сейчас' },
          ]}
          actions={(
            <button type="button" onClick={handleRefresh} disabled={refreshing} className={secondaryActionClass}>
              <Icon name="recycle" className={`h-4 w-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              {refreshing ? 'Обновляем…' : 'Обновить каталог'}
            </button>
          )}
        />

        {filteredSections.length > 0 ? filteredSections.map(section => (
          <section key={section.id} className="space-y-3.5" aria-label={section.title}>
            <ResourceSectionTitle title={section.title} subtitle="Откроется в безопасной внешней вкладке" count={section.items.length} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {section.items.map((item, index) => (
                <button
                  type="button"
                  key={serviceItemKey(section.id, index, item.title, item.url)}
                  onClick={() => openLink(item.url)}
                  className="group flex min-h-[184px] cursor-pointer flex-col rounded-[20px] border border-bx-border bg-bx-surface p-4.5 text-left shadow-sm outline-none transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.035] focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-bx-border bg-bx-bg text-blue-600 dark:text-blue-300">
                      <Icon name={sectionIcon(section)} className="h-[18px] w-[18px]" />
                    </span>
                    {item.tag && <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700 dark:text-blue-300">{item.tag}</span>}
                  </div>
                  <h4 className="mt-4 text-sm font-black leading-snug text-bx-text transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-300">{item.title}</h4>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-bx-muted">{item.desc}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-bx-border pt-3 text-[10px] font-bold">
                    <span className="min-w-0 truncate text-bx-muted">{item.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    <span className="flex flex-shrink-0 items-center gap-1 text-blue-600 dark:text-blue-300">Открыть <Icon name="external" className="h-3.5 w-3.5" /></span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )) : (
          <ResourceEmpty
            title="Сервисы не найдены"
            description="Измените запрос или вернитесь ко всему каталогу — возможно, нужный портал находится в другой категории."
            action={<button type="button" onClick={reset} className={secondaryActionClass}>Сбросить фильтры</button>}
          />
        )}
      </div>
    </ResourceLayout>
  )
}
