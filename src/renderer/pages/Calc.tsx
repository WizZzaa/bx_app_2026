import React, { useState } from 'react';
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

export default function Calc() {
  const [active, setActive] = useState('vat');
  const tab = TABS.find(t => t.id === active) ?? TABS[0];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Левая панель — список калькуляторов */}
      <aside className="w-52 flex-shrink-0 border-r border-[#1e2535] flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-white">Калькуляторы</h1>
          <p className="text-xs text-slate-500 mt-0.5">Расчёты для бухгалтера</p>
        </div>
        <nav className="flex-1 px-2 pb-4 space-y-0.5">
          {TABS.map(t => (
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
        </div>
      </div>
    </div>
  );
}
