import React, { useState, useEffect } from 'react'
import '../styles/a7-calculators-tools.css'
import { readCalcHistory, clearCalcHistory, HISTORY_EVENT, type CalcHistoryEntry } from './calc/CalcResult'
import { peekCalcPrefill } from './calc/prefill'
import VatCalc from './calc/VatCalc'
import NdflCalc from './calc/NdflCalc'
import SalaryCalc from './calc/SalaryCalc'
import RegimeCompareCalc from './calc/RegimeCompareCalc'
import PenaltyCalc from './calc/PenaltyCalc'
import VacationCalc from './calc/VacationCalc'
import SickLeaveCalc from './calc/SickLeaveCalc'
import DividendCalc from './calc/DividendCalc'
import RecyclingCalc from './calc/RecyclingCalc'
import InpsCalc from './calc/InpsCalc'
import CurrencyConverter from './tools/CurrencyConverter'
import TaxCalculator from './tools/TaxCalculator'
import DateCalc from './tools/DateCalc'
import Icon from '../lib/ui/Icon'
import { useToast } from '../lib/ui/ToastContext'
import { CALCULATOR_PROPOSALS } from '../data/workbenchCatalog'
import { ProposalWorkbench } from '../components/workspace/ProposalWorkbench'
import { useWorkbenchFavorites } from '../lib/useWorkbenchFavorites'
import { WorkbenchActions, WorkbenchCanvas, WorkbenchCatalogNav } from '../components/workspace/WorkbenchChrome'
import { RegulatoryRateGate } from '../components/calculators/RegulatoryRateGate'
import { calculatorRequiresManualConfirmation } from '../data/calculatorRegulatoryValues'
import { todayISO } from '../lib/dates'

interface Tab {
  id: string
  icon: string
  label: string
  desc: string
  group: string
  component: React.ReactNode
  status?: 'ready' | 'proposal'
}

const READY_TABS: Tab[] = [
  // Налоги
  { id: 'vat',      icon: 'percent',  label: 'НДС',                group: 'Налоги', desc: 'Начислить или выделить НДС', component: <VatCalc /> },
  { id: 'ndfl',     icon: 'user',     label: 'НДФЛ',               group: 'Налоги', desc: 'Подоходный налог и льгота БРВ', component: <NdflCalc /> },
  { id: 'regime',   icon: 'trending', label: 'Выбор налогового режима', group: 'Налоги', desc: 'Оборот, специальный или общий НДС', component: <RegimeCompareCalc /> },
  { id: 'penalty',  icon: 'clock',    label: 'Пени',               group: 'Налоги', desc: 'Дневная пеня или ставка ЦБ', component: <PenaltyCalc /> },
  { id: 'dividend', icon: 'finance',  label: 'Дивиденды',          group: 'Налоги', desc: 'Резидент, нерезидент и ручная ставка СИДН', component: <DividendCalc /> },
  { id: 'taxcalc',  icon: 'reference',label: 'Налоги по данным',   group: 'Налоги', desc: 'Оборот, НДС, НДФЛ из Финансов', component: <TaxCalculator /> },
  // Зарплата и кадры
  { id: 'salary',   icon: 'hr',       label: 'Зарплата',           group: 'Зарплата и кадры', desc: 'Начислено ↔ на руки', component: <SalaryCalc /> },
  { id: 'inps',     icon: 'finance',  label: 'ИНПС',               group: 'Зарплата и кадры', desc: 'Накопительный пенсионный 0.1%', component: <InpsCalc /> },
  { id: 'vacation', icon: 'sun',      label: 'Отпускные',          group: 'Зарплата и кадры', desc: 'Средний заработок × дни', component: <VacationCalc /> },
  { id: 'sick',     icon: 'cross',    label: 'Больничные',         group: 'Зарплата и кадры', desc: '60/80/100% по стажу', component: <SickLeaveCalc /> },
  // Прочее
  { id: 'recycling',icon: 'recycle',  label: 'Утилизационный сбор',group: 'Прочее', desc: 'Авто, коммерческие, мото', component: <RecyclingCalc /> },
  { id: 'currency', icon: 'exchange', label: 'Конвертер валют',    group: 'Прочее', desc: 'Курс ЦБ РУз, в т.ч. на дату', component: <CurrencyConverter /> },
  { id: 'datecalc', icon: 'planner',  label: 'Калькулятор дат',    group: 'Прочее', desc: 'Рабочие дни, праздники РУз', component: <DateCalc /> },
]

const PROPOSAL_TABS: Tab[] = CALCULATOR_PROPOSALS.map(proposal => ({
  id: proposal.id,
  icon: proposal.icon,
  label: proposal.title,
  group: proposal.sector,
  desc: proposal.summary,
  component: <ProposalWorkbench proposal={proposal} />,
  status: 'proposal',
}))

const TABS: Tab[] = [...READY_TABS, ...PROPOSAL_TABS]
const GROUPS = ['Налоги', 'Зарплата и кадры', 'Прочее', 'Документы и право', 'Агро', 'Строительство']

const ACCENT = Object.fromEntries(GROUPS.map(group => [group, {
  text: 'text-violet-700 dark:text-violet-300',
  chipBg: 'bg-violet-500/10 border-violet-500/20',
  activeBg: 'bg-violet-500/10 border-violet-500/20',
  iconBg: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  grad: 'from-violet-500/[0.07]',
}])) as Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }>

const LAST_CALC_KEY = 'bx_calc_last'

const Calc = () => {
  const [active, setActiveRaw] = useState(() => {
    const pre = peekCalcPrefill()
    if (pre && TABS.some(t => t.id === pre.calc)) return pre.calc
    const last = localStorage.getItem(LAST_CALC_KEY)
    return last && TABS.some(t => t.id === last) ? last : 'vat'
  })
  const [search, setSearch] = useState('')
  const [workspaceRevision, setWorkspaceRevision] = useState(0)
  const { favorites, toggleFavorite } = useWorkbenchFavorites('calculator')
  const tab = TABS.find(t => t.id === active) ?? TABS[0]

  const handleSetActive = (id: string) => {
    setActiveRaw(id)
    localStorage.setItem(LAST_CALC_KEY, id)
  }

  const toast = useToast()

  const handleExportPDF = async () => {
    if (!window.bx?.pdf?.generate) {
      toast.error('Экспорт PDF доступен только в Electron')
      return
    }
    const element = document.getElementById('calc-content-to-export')
    if (!element) return

    const clone = element.cloneNode(true) as HTMLElement
    const originalInputs = element.querySelectorAll('input, select, textarea')
    const clonedInputs = clone.querySelectorAll('input, select, textarea')
    originalInputs.forEach((original, idx) => {
      const cloned = clonedInputs[idx] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      if (cloned) {
        cloned.setAttribute('value', (original as HTMLInputElement).value || '')
        if (original instanceof HTMLSelectElement) {
          const selectedOption = cloned.querySelectorAll('option')[original.selectedIndex]
          if (selectedOption) selectedOption.setAttribute('selected', 'selected')
        }
      }
    })

    const cleanTitle = `Калькулятор_${tab.label}`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tab.label}</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;line-height:1.6;margin:40px;color:#000;background:#fff}
      h1{font-size:18px;margin-bottom:20px;border-bottom:1px solid #ddd;padding-bottom:10px}
      .calc-result, .bg-bx-surface-2, .bg-slate-500\\/5 {background:#f8fafc !important;border:1px solid #e2e8f0 !important;border-radius:8px;padding:15px;margin-top:15px;color:#000 !important}
      table{width:100%;border-collapse:collapse;margin-top:15px}
      th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;color:#000 !important}
      th{background:#f1f5f9}
      input, select, textarea { background: none; border: none; font-weight: bold; width: auto; font-family: inherit; font-size: inherit; color:#000 !important }
      button { display: none !important }
      .text-emerald-400, .text-green-400 { color: #15803d !important }
      .text-red-400 { color: #b91c1c !important }
      .text-bx-text { color: #000 !important }
      .text-bx-muted { color: #475569 !important }
      @media print{body{margin:18mm}}</style></head><body>
      <h1>Расчет: ${tab.label}</h1>
      <div>${clone.innerHTML}</div>
      </body></html>`

    const ok = await window.bx.pdf.generate(html, `${cleanTitle}.pdf`)
    if (ok) {
      toast.success('Расчёт успешно экспортирован в PDF')
    }
  }

  const q = search.trim().toLowerCase()
  const visibleTabs = TABS.filter(t =>
    !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.group.toLowerCase().includes(q))

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(item => item.id === active)) {
      const nextId = visibleTabs[0].id
      setActiveRaw(nextId)
      localStorage.setItem(LAST_CALC_KEY, nextId)
    }
  }, [active, q])

  return (
    <div className="bx-a7-workbench bx-a7-workbench--calc z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-bx-bg font-sans text-bx-text lg:flex-row">
      <aside className="bx-a7-workbench__catalog z-10 flex w-full flex-shrink-0 flex-col overflow-hidden border-b border-bx-border bg-bx-surface lg:w-[320px] lg:border-b-0 lg:border-r 2xl:w-[344px]">
        <WorkbenchCatalogNav
          ariaLabel="Категории калькуляторов"
          activeId={active}
          emptyText="Подходящих калькуляторов нет"
          groups={GROUPS}
          items={visibleTabs}
          search={search}
          searchLabel="Поиск калькулятора"
          searchPlaceholder="Найти калькулятор…"
          onSearchChange={setSearch}
          onSelect={handleSetActive}
        />
      </aside>

      {/* Правая панель — активный калькулятор */}
      <main className="bx-a7-workbench__content flex-1 overflow-y-auto bg-bx-bg">
        <div className="bx-a7-workbench__inner px-4 py-4 sm:px-6 sm:py-6">
          {/* Hero-шапка с акцентом группы */}
          <header className={`bx-a7-workbench__hero rounded-3xl bg-gradient-to-br ${ACCENT[tab.group].grad} via-transparent to-transparent border border-bx-border px-5 py-4.5 mb-5 bg-bx-surface shadow-sm`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full min-w-0 items-start gap-3.5 sm:flex-1 sm:items-center">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCENT[tab.group].iconBg} shadow-inner`}>
                  <Icon name={tab.icon} className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-extrabold text-bx-text leading-tight">{tab.label}</h2>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border ${ACCENT[tab.group].chipBg} ${ACCENT[tab.group].text} font-bold uppercase`}>
                      {tab.group}
                    </span>
                    {(tab.status === 'proposal' || calculatorRequiresManualConfirmation(tab.id, todayISO())) && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
                        {tab.status === 'proposal' ? 'На согласование' : 'Сверка ставок'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-bx-muted mt-1">{tab.desc} · Расчёт по правилам Республики Узбекистан</p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <WorkbenchActions
                  isFavorite={favorites.includes(tab.id)}
                  onToggleFavorite={() => toggleFavorite(tab.id)}
                  onReset={() => setWorkspaceRevision(value => value + 1)}
                  onExport={tab.status !== 'proposal' ? handleExportPDF : undefined}
                />
              </div>
            </div>
          </header>

          {/* Верстак калькулятора */}
          <div id="calc-content-to-export">
            <WorkbenchCanvas resetKey={`${tab.id}-${workspaceRevision}`}>
              <RegulatoryRateGate calculatorId={tab.id}>{tab.component}</RegulatoryRateGate>
            </WorkbenchCanvas>
          </div>

          <CalcHistoryPanel />
        </div>
      </main>
    </div>
  )
}

const CalcHistoryPanel = () => {
  const [items, setItems] = useState<CalcHistoryEntry[]>(readCalcHistory)
  const [copiedTs, setCopiedTs] = useState<number | null>(null)

  useEffect(() => {
    const handleOnChange = () => setItems(readCalcHistory())
    window.addEventListener(HISTORY_EVENT, handleOnChange)
    return () => window.removeEventListener(HISTORY_EVENT, handleOnChange)
  }, [])

  if (items.length === 0) return null

  const handleCopyEntry = async (e: CalcHistoryEntry) => {
    try {
      await navigator.clipboard.writeText(e.text)
      setCopiedTs(e.ts)
      setTimeout(() => setCopiedTs(null), 1200)
    } catch {
      // ignore
    }
  }

  const handleClearHistory = () => {
    clearCalcHistory()
  }

  return (
    <section className="bx-a7-history mt-8 pb-6" aria-labelledby="bx-a7-history-title">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-bx-surface-2 border border-bx-border text-bx-muted flex items-center justify-center shadow-inner">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          <p id="bx-a7-history-title" className="text-xs font-bold text-bx-text uppercase tracking-wider">Недавние расчёты</p>
        </div>
        <button onClick={handleClearHistory} className="text-[11px] text-bx-muted hover:text-red-500 transition-colors cursor-pointer">Очистить</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.slice(0, 8).map(e => (
          <button
            key={e.ts}
            onClick={() => handleCopyEntry(e)}
            title={`${e.text}\n\nКлик — скопировать снова`}
            className="group px-3.5 py-3 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-blue-500/20 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold text-bx-muted uppercase tracking-wider truncate">{e.title}</span>
              <span className="text-[10px] text-bx-muted font-mono flex-shrink-0">
                {new Date(e.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className={`text-xs font-bold tabular-nums truncate ${copiedTs === e.ts ? 'text-emerald-600 dark:text-emerald-400' : 'text-bx-text'}`}>
                {copiedTs === e.ts ? 'Скопировано ✓' : e.main}
              </span>
              <svg className="w-3.5 h-3.5 text-bx-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 3 4v5A1.5 1.5 0 0 0 4.5 10.5H5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default Calc
