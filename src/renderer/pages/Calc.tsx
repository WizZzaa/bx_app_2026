import React, { useState, useEffect } from 'react';
import { readCalcHistory, clearCalcHistory, HISTORY_EVENT, type CalcHistoryEntry } from './calc/CalcResult';
import VatCalc from './calc/VatCalc';
import NdflCalc from './calc/NdflCalc';
import PenaltyCalc from './calc/PenaltyCalc';
import VacationCalc from './calc/VacationCalc';
import SickLeaveCalc from './calc/SickLeaveCalc';
import DividendCalc from './calc/DividendCalc';
import RecyclingCalc from './calc/RecyclingCalc';
import CurrencyConverter from './tools/CurrencyConverter';
import Icon from '../lib/ui/Icon';

interface Tab {
  id: string;
  icon: string;
  label: string;
  shortLabel: string;
  component: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'vat',      icon: 'percent',  label: 'НДС',                  shortLabel: 'НДС',     component: <VatCalc /> },
  { id: 'ndfl',     icon: 'user',     label: 'НДФЛ',                 shortLabel: 'НДФЛ',    component: <NdflCalc /> },
  { id: 'penalty',  icon: 'clock',    label: 'Пени',                  shortLabel: 'Пени',    component: <PenaltyCalc /> },
  { id: 'vacation', icon: 'sun',      label: 'Отпускные',             shortLabel: 'Отпуск',  component: <VacationCalc /> },
  { id: 'sick',     icon: 'cross',    label: 'Больничные',            shortLabel: 'Больн.',  component: <SickLeaveCalc /> },
  { id: 'dividend', icon: 'trending', label: 'Дивиденды',             shortLabel: 'Дивид.',  component: <DividendCalc /> },
  { id: 'recycling',icon: 'recycle',  label: 'Утилизационный сбор',   shortLabel: 'Утилиз.', component: <RecyclingCalc /> },
  { id: 'currency', icon: 'exchange', label: 'Конвертер валют',        shortLabel: 'Валюта',  component: <CurrencyConverter /> },
];

const LAST_CALC_KEY = 'bx_calc_last';

export default function Calc() {
  const [active, setActiveRaw] = useState(() => {
    const last = localStorage.getItem(LAST_CALC_KEY);
    return last && TABS.some(t => t.id === last) ? last : 'vat';
  });
  const [search, setSearch] = useState('');
  const tab = TABS.find(t => t.id === active) ?? TABS[0];

  function setActive(id: string) {
    setActiveRaw(id);
    localStorage.setItem(LAST_CALC_KEY, id);
  }

  const q = search.trim().toLowerCase();
  const visibleTabs = q ? TABS.filter(t => t.label.toLowerCase().includes(q)) : TABS;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель — список калькуляторов */}
      <aside className="w-52 flex-shrink-0 border-r border-[#1e2535] flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-white">Калькуляторы</h1>
          <p className="text-xs text-slate-500 mt-0.5">Расчёты для бухгалтера</p>
        </div>
        <div className="px-3 pb-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Найти калькулятор..."
            className="w-full bg-[#0f1117] text-slate-200 placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-[#1e2535] focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <nav className="flex-1 px-2 pb-4 space-y-0.5">
          {visibleTabs.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">Ничего не найдено</p>
          )}
          {visibleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                active === t.id
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-slate-400 hover:bg-[#1e2535] hover:text-slate-200'
              }`}
            >
              <Icon name={t.icon} className="w-[18px] h-[18px] flex-shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Правая панель — активный калькулятор */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Icon name={tab.icon} className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">{tab.label}</h2>
              <p className="text-xs text-slate-500">Законодательство РУз</p>
            </div>
          </div>
          {tab.component}
          <CalcHistoryPanel />
        </div>
      </div>
    </div>
  );
}

// ── Недавние расчёты (журнал «Копировать расчёт») ────────────────────────────
function CalcHistoryPanel() {
  const [items, setItems] = useState<CalcHistoryEntry[]>(readCalcHistory);
  const [copiedTs, setCopiedTs] = useState<number | null>(null);

  useEffect(() => {
    const onChange = () => setItems(readCalcHistory());
    window.addEventListener(HISTORY_EVENT, onChange);
    return () => window.removeEventListener(HISTORY_EVENT, onChange);
  }, []);

  if (items.length === 0) return null;

  async function copyEntry(e: CalcHistoryEntry) {
    try {
      await navigator.clipboard.writeText(e.text);
      setCopiedTs(e.ts);
      setTimeout(() => setCopiedTs(null), 1200);
    } catch { /* ignore */ }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">Недавние расчёты</p>
        <button onClick={clearCalcHistory} className="text-[11px] text-slate-600 hover:text-red-400 transition-colors">Очистить</button>
      </div>
      <div className="space-y-1.5">
        {items.map(e => (
          <button
            key={e.ts}
            onClick={() => copyEntry(e)}
            title={e.text}
            className="w-full flex items-center gap-3 px-3.5 py-2 bg-[#141820] hover:bg-[#1a2035] border border-[#1e2535] hover:border-blue-500/30 rounded-lg text-left transition-colors"
          >
            <span className="flex-1 text-xs text-slate-300 truncate">{e.title}</span>
            <span className={`text-xs font-semibold tabular-nums flex-shrink-0 ${copiedTs === e.ts ? 'text-emerald-400' : 'text-blue-400'}`}>
              {copiedTs === e.ts ? 'Скопировано ✓' : e.main}
            </span>
            <span className="text-[10px] text-slate-600 flex-shrink-0 w-10 text-right">
              {new Date(e.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-700 mt-1.5">Клик по строке — скопировать расчёт снова. Хранятся последние 15.</p>
    </div>
  );
}
