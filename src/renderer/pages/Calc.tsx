import React, { useState, useEffect } from 'react'
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

interface Tab {
  id: string
  icon: string
  label: string
  desc: string
  group: string
  component: React.ReactNode
}

const TABS: Tab[] = [
  // Налоги
  { id: 'vat',      icon: 'percent',  label: 'НДС',                group: 'Налоги', desc: 'Начислить или выделить 12%', component: <VatCalc /> },
  { id: 'ndfl',     icon: 'user',     label: 'НДФЛ',               group: 'Налоги', desc: 'Подоходный 12%, льгота БРВ', component: <NdflCalc /> },
  { id: 'regime',   icon: 'trending', label: 'Оборот vs ОСН',      group: 'Налоги', desc: 'Какой regime выгоднее', component: <RegimeCompareCalc /> },
  { id: 'penalty',  icon: 'clock',    label: 'Пени',               group: 'Налоги', desc: '0.033%/день или ставка ЦБ', component: <PenaltyCalc /> },
  { id: 'dividend', icon: 'finance',  label: 'Дивиденды',          group: 'Налоги', desc: 'Резидент 5% / нерезидент', component: <DividendCalc /> },
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

const GROUPS = ['Налоги', 'Зарплата и кадры', 'Прочее']

const ACCENT: Record<string, { text: string; chipBg: string; activeBg: string; iconBg: string; grad: string }> = {
  'Налоги':           { text: 'text-blue-600 dark:text-blue-400',  chipBg: 'bg-blue-500/10 dark:bg-blue-600/10 border-blue-500/20',  activeBg: 'bg-blue-500/10 dark:bg-blue-600/10 border-blue-500/20',  iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',   grad: 'from-blue-500/5 dark:from-blue-600/5' },
  'Зарплата и кадры': { text: 'text-amber-700 dark:text-amber-400', chipBg: 'bg-amber-500/10 border-amber-500/20', activeBg: 'bg-amber-500/10 border-amber-500/20', iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', grad: 'from-amber-500/5' },
  'Прочее':           { text: 'text-cyan-700 dark:text-cyan-400',  chipBg: 'bg-cyan-500/10 border-cyan-500/20',  activeBg: 'bg-cyan-500/10 border-cyan-500/20',  iconBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',   grad: 'from-cyan-500/5' },
}

const LAST_CALC_KEY = 'bx_calc_last'

const Calc = () => {
  const [active, setActiveRaw] = useState(() => {
    const pre = peekCalcPrefill()
    if (pre && TABS.some(t => t.id === pre.calc)) return pre.calc
    const last = localStorage.getItem(LAST_CALC_KEY)
    return last && TABS.some(t => t.id === last) ? last : 'vat'
  })
  const [search, setSearch] = useState('')
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
  const visibleTabs = q
    ? TABS.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    : TABS

  return (
    <div className="flex-1 flex overflow-hidden z-10 font-sans bg-bx-bg text-bx-text">
      {/* Левая панель — список калькуляторов */}
      <aside className="w-64 flex-shrink-0 border-r border-bx-border bg-bx-surface-2/65 dark:bg-bx-surface flex flex-col z-10 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xs font-black text-bx-text uppercase tracking-wider">Калькуляторы</h1>
          <p className="text-[10px] text-bx-muted mt-0.5">{TABS.length} готовых бухотчетов</p>
        </div>
        
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bx-muted">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск калькулятора..."
              className="w-full bg-bx-surface text-bx-text placeholder-bx-muted text-xs pl-9 pr-3 py-2 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 shadow-inner transition-all font-semibold"
            />
          </div>
        </div>

        <nav className="flex-1 px-2.5 pb-4 space-y-3.5 overflow-y-auto custom-scrollbar">
          {visibleTabs.length === 0 && (
            <p className="text-xs text-bx-muted text-center py-4 italic font-medium">Ничего не найдено</p>
          )}
          {GROUPS.map(g => {
            const items = visibleTabs.filter(t => t.group === g)
            if (items.length === 0) return null
            const a = ACCENT[g]
            return (
              <div key={g} className="flex flex-col gap-0.5">
                <p className={`px-3 mb-1 text-[9px] uppercase tracking-[0.12em] font-extrabold ${a.text}`}>{g}</p>
                <div className="space-y-0.5">
                  {items.map(t => {
                    const isTabActive = active === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSetActive(t.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                          isTabActive
                            ? 'bg-blue-600 text-white font-extrabold border-transparent shadow-md'
                            : 'text-bx-text border-transparent hover:bg-bx-surface/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isTabActive ? 'bg-white/20 text-white' : `${a.iconBg} border border-bx-border/50`}`}>
                          <Icon name={t.icon} className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-xs font-bold leading-tight ${isTabActive ? 'text-white' : 'text-bx-text'}`}>{t.label}</span>
                          <span className={`block text-[9px] mt-0.5 leading-snug truncate ${isTabActive ? 'text-white/85' : 'text-bx-muted'}`}>{t.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Правая панель — активный калькулятор */}
      <div className="flex-1 overflow-y-auto bg-bx-bg">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* Hero-шапка с акцентом группы */}
          <div className={`rounded-3xl bg-gradient-to-br ${ACCENT[tab.group].grad} via-transparent to-transparent border border-bx-border px-5 py-4.5 mb-5 bg-bx-surface shadow-sm`}>
            <div className="flex items-center justify-between gap-3.5 flex-wrap">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCENT[tab.group].iconBg} shadow-inner`}>
                  <Icon name={tab.icon} className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-extrabold text-bx-text leading-tight">{tab.label}</h2>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border ${ACCENT[tab.group].chipBg} ${ACCENT[tab.group].text} font-bold uppercase`}>
                      {tab.group}
                    </span>
                  </div>
                  <p className="text-[11px] text-bx-muted mt-1">{tab.desc} · Законодательство РУз</p>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                className="px-3.5 py-2 bg-bx-surface border border-bx-border hover:bg-bx-surface-2 text-bx-text text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-bx-muted"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                PDF
              </button>
            </div>
            {/* Быстрое переключение внутри группы */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {TABS.filter(t => t.group === tab.group).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSetActive(t.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                    t.id === tab.id
                      ? `${ACCENT[tab.group].chipBg} ${ACCENT[tab.group].text} font-bold`
                      : 'border-transparent text-bx-muted hover:text-bx-text hover:bg-bx-surface-2/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Верстак калькулятора */}
          <div id="calc-content-to-export" className="rounded-3xl bg-bx-surface border border-bx-border p-5 shadow-sm">
            {tab.component}
          </div>

          <CalcHistoryPanel />
        </div>
      </div>
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
    <div className="mt-8 pb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-bx-surface-2 border border-bx-border text-bx-muted flex items-center justify-center shadow-inner">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          <p className="text-xs font-bold text-bx-text uppercase tracking-wider">Недавние расчёты</p>
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
    </div>
  )
}

export default Calc
