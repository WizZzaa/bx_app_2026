import React, { useEffect, useState } from 'react'
import FinanceTab from '../reference/FinanceTab'
import AccountingTab from '../reference/AccountingTab'
import { GovTab, VedTab, LawTab } from '../reference/MiscTabs'
import { usePlan } from '../../lib/plan'
import PaywallModal from '../../components/PaywallModal'
import Icon from '../../lib/ui/Icon'
import {
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSidebar,
} from '../../components/workspace/ResourceWorkspace'

export type RefTabId = 'finance' | 'accounting' | 'gov' | 'ved' | 'law'

const tabs: Array<{ id: RefTabId; label: string; short: string; icon: string }> = [
  { id: 'finance', label: 'Финансы и налоги', short: 'Ставки, БРВ, МРОТ и КБК', icon: 'finance' },
  { id: 'accounting', label: 'Учёт и стандарты', short: 'План счетов и НСБУ', icon: 'book' },
  { id: 'gov', label: 'Государственные органы', short: 'Контакты по регионам', icon: 'government' },
  { id: 'ved', label: 'ВЭД, труд и статистика', short: 'Нормативы и пошлины', icon: 'globe' },
  { id: 'law', label: 'Право и ответственность', short: 'Штрафы и основания', icon: 'scales' },
]

export default function ReferenceView({ initialTab }: { initialTab?: RefTabId }) {
  const { plan } = usePlan()
  const [paywall, setPaywall] = useState(false)
  const [active, setActive] = useState<RefTabId>(initialTab ?? 'finance')
  const [search, setSearch] = useState('')
  useEffect(() => { if (initialTab) setActive(initialTab) }, [initialTab])

  const selected = tabs.find(tab => tab.id === active) ?? tabs[0]
  const normalizedSearch = search.trim().toLocaleLowerCase('ru-RU')
  const visibleTabs = normalizedSearch
    ? tabs.filter(tab => `${tab.label} ${tab.short}`.toLocaleLowerCase('ru-RU').includes(normalizedSearch))
    : tabs
  const handleTabClick = (tabId: RefTabId) => {
    if (plan === 'free') { setPaywall(true); return }
    setActive(tabId)
  }

  const sidebar = (
    <ResourceSidebar
      icon="reference"
      title="Справочники"
      subtitle="Нормативы Республики Узбекистан"
      search={search}
      searchPlaceholder="Налог, БРВ, счёт, штраф…"
      onSearch={setSearch}
      onClear={() => setSearch('')}
      label="Разделы данных"
      footer={(
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-[10px] font-semibold leading-relaxed text-amber-950 dark:text-amber-100">
          <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200"><Icon name="info" className="h-4 w-4" /></span>
          <span><strong className="block font-black">Проверяйте статус значения</strong><span className="mt-0.5 block">Непроверенные данные отмечены отдельно и не считаются подтверждёнными.</span></span>
        </div>
      )}
    >
      {visibleTabs.map(tab => <ResourceNavItem key={tab.id} icon={tab.icon} label={tab.label} description={active === tab.id ? tab.short : undefined} active={active === tab.id} onClick={() => handleTabClick(tab.id)} />)}
      {visibleTabs.length === 0 && <div className="rounded-xl border border-dashed border-bx-border p-4 text-center text-xs leading-relaxed text-bx-muted">Подходящего раздела нет. Попробуйте «налоги», «учёт» или «штрафы».</div>}
    </ResourceSidebar>
  )

  return (
    <ResourceLayout sidebar={sidebar}>
      <div className="space-y-5">
        <ResourceHero
          eyebrow="Поиск по нормативным данным"
          title={selected.label}
          description={`${selected.short}. Сначала найдите нужный раздел, затем сверяйте значение, дату проверки и официальный источник.`}
          icon={selected.icon}
          stats={[
            { value: '03.07.2026', label: 'последняя сверка' },
            { value: '3', label: 'официальных источника' },
            { value: tabs.length, label: 'разделов' },
          ]}
        />

        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3.5">
          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"><Icon name="shield" className="h-4 w-4" /></span>
          <div className="min-w-0 text-[11px] leading-relaxed text-bx-muted">
            <p className="font-black text-bx-text">Статус данных виден рядом со значением</p>
            <p className="mt-0.5">БРВ, МРОТ и ставка ЦБ сверены. Остальные записи проверяйте по <a href="https://lex.uz" target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline dark:text-blue-300">lex.uz</a>, <a href="https://soliq.uz" target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline dark:text-blue-300">soliq.uz</a> и <a href="https://cbu.uz" target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline dark:text-blue-300">cbu.uz</a>.</p>
          </div>
        </div>

        <section className="rounded-[22px] border border-bx-border bg-bx-surface p-5 shadow-sm lg:p-6" aria-label={selected.label}>
          {active === 'finance' && <FinanceTab />}
          {active === 'accounting' && <AccountingTab />}
          {active === 'gov' && <GovTab />}
          {active === 'ved' && <VedTab />}
          {active === 'law' && <LawTab />}
        </section>
      </div>
      {paywall && <PaywallModal feature="Справочные данные и показатели РУз" onClose={() => setPaywall(false)} />}
    </ResourceLayout>
  )
}
