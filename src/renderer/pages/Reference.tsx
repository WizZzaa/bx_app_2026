import React, { useState } from 'react';
import FinanceTab from './reference/FinanceTab';
import AccountingTab from './reference/AccountingTab';
import { GovTab, VedTab, LawTab } from './reference/MiscTabs';

const tabs = [
  { id: 'finance', label: '💰 Финансы и Налоги' },
  { id: 'accounting', label: '📒 Учёт и Стандарты' },
  { id: 'gov', label: '🏛 Госорганы' },
  { id: 'ved', label: '🌍 ВЭД, Труд, Статистика' },
  { id: 'law', label: '⚖️ Право и Ответственность' },
];

export default function Reference() {
  const [active, setActive] = useState('finance');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Справочники</h1>
        <p className="text-sm text-slate-500 mt-0.5">Нормативная база Республики Узбекистан.</p>
      </div>

      {/* Баннер о сверке */}
      <div className="text-xs text-slate-400 bg-[#141820] border border-[#1e2535] rounded-lg px-4 py-2.5 flex items-start gap-2">
        <span className="text-emerald-400">✓</span>
        <span>
          Ключевые показатели (БРВ, МРОТ, ставка ЦБ) сверены 03.07.2026 — отмечены зелёным бейджем.
          Записи с «⚠ не проверено» требуют сверки с{' '}
          <a className="underline" href="https://lex.uz" target="_blank" rel="noreferrer">lex.uz</a>,{' '}
          <a className="underline" href="https://soliq.uz" target="_blank" rel="noreferrer">soliq.uz</a>,{' '}
          <a className="underline" href="https://cbu.uz" target="_blank" rel="noreferrer">cbu.uz</a>.
        </span>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
              active === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-[#1e2535] text-slate-400 hover:text-slate-200 hover:bg-[#2a3447]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {active === 'finance' && <FinanceTab />}
      {active === 'accounting' && <AccountingTab />}
      {active === 'gov' && <GovTab />}
      {active === 'ved' && <VedTab />}
      {active === 'law' && <LawTab />}
    </div>
  );
}
