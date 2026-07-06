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
  { id: 'regime',   icon: 'trending', label: 'Оборот vs ОСН',      group: 'Налоги', desc: 'Какой режим выгоднее', component: <RegimeCompareCalc /> },
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
  'Налоги':           { text: 'text-blue-400',  chipBg: 'bg-blue-600/15 border-blue-500/30',  activeBg: 'bg-blue-600/20',  iconBg: 'bg-blue-600/20 text-blue-400',   grad: 'from-blue-600/15' },
  'Зарплата и кадры': { text: 'text-amber-400', chipBg: 'bg-amber-500/15 border-amber-500/30', activeBg: 'bg-amber-500/15', iconBg: 'bg-amber-500/20 text-amber-400', grad: 'from-amber-500/15' },
  'Прочее':           { text: 'text-cyan-400',  chipBg: 'bg-cyan-500/15 border-cyan-500/30',  activeBg: 'bg-cyan-500/15',  iconBg: 'bg-cyan-500/20 text-cyan-400',   grad: 'from-cyan-500/15' },
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

  const q = search.trim().toLowerCase()
  const visibleTabs = q
    ? TABS.filter(t => t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    : TABS

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель — список калькуляторов */}
      <aside className="w-60 flex-shrink-0 border-r border-[#1e2535] flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-white">Калькуляторы</h1>
          <p className="text-xs text-slate-500 mt-0.5">{TABS.length} расчётов для бухгалтера</p>
        </div>
        <div className="px-3 pb-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти калькулятор..."
            className="w-full bg-[#0f1117] text-slate-200 placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <nav className="flex-1 px-2 pb-4">
          {visibleTabs.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">Ничего не найдено</p>
          )}
          {GROUPS.map(g => {
            const items = visibleTabs.filter(t => t.group === g)
            if (items.length === 0) return null
            const a = ACCENT[g]
            return (
              <div key={g} className="mb-2">
                <p className={`px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest font-semibold ${a.text} opacity-70`}>{g}</p>
                <div className="space-y-0.5">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSetActive(t.id)}
                      className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                        active === t.id
                          ? `${a.activeBg} ${a.text}`
                          : 'text-slate-400 hover:bg-[#1e2535] hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active === t.id ? a.iconBg : 'bg-[#1e2535] text-slate-500'}`}>
                        <Icon name={t.icon} className="w-4 h-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm leading-tight ${active === t.id ? 'font-medium' : ''}`}>{t.label}</span>
                        <span className={`block text-[10px] mt-0.5 leading-tight ${active === t.id ? 'opacity-70' : 'text-slate-600'}`}>{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Правая панель — активный калькулятор */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* Hero-шапка с акцентом группы */}
          <div className={`rounded-2xl bg-gradient-to-br ${ACCENT[tab.group].grad} via-transparent to-transparent border border-[#1e2535] px-5 py-4 mb-4`}>
            <div className="flex items-center gap-3.5">
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCENT[tab.group].iconBg}`}>
                <Icon name={tab.icon} className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white leading-tight">{tab.label}</h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ACCENT[tab.group].chipBg} ${ACCENT[tab.group].text} font-semibold`}>
                    {tab.group}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{tab.desc} · законодательство РУз</p>
              </div>
            </div>
            {/* Быстрое переключение внутри группы */}
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {TABS.filter(t => t.group === tab.group).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSetActive(t.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                    t.id === tab.id
                      ? `${ACCENT[tab.group].chipBg} ${ACCENT[tab.group].text} font-medium`
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#1e2535]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Верстак калькулятора */}
          <div className="rounded-2xl bg-[#10141d] border border-[#1e2535] p-5">
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
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#1e2535] text-slate-400 flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
          <p className="text-sm font-semibold text-slate-300">Недавние расчёты</p>
        </div>
        <button onClick={handleClearHistory} className="text-[11px] text-slate-600 hover:text-red-400 transition-colors">Очистить</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.slice(0, 8).map(e => (
          <button
            key={e.ts}
            onClick={() => handleCopyEntry(e)}
            title={`${e.text}\n\nКлик — скопировать снова`}
            className="group px-3.5 py-2.5 bg-[#141820] hover:bg-[#18202f] border border-[#1e2535] hover:border-blue-500/40 rounded-xl text-left transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[11px] text-slate-500 truncate">{e.title}</span>
              <span className="text-[10px] text-slate-600 flex-shrink-0">
                {new Date(e.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-semibold tabular-nums truncate ${copiedTs === e.ts ? 'text-emerald-400' : 'text-slate-100'}`}>
                {copiedTs === e.ts ? 'Скопировано ✓' : e.main}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" viewBox="0 0 16 16" fill="none">
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
