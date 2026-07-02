import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';

// Сравнение налоговых режимов РУз: налог с оборота (4%) vs ОСН (НДС 12% + прибыль 15%).
// Упрощённая модель для быстрой прикидки «что выгоднее» — детальный расчёт
// зависит от вида деятельности, региона и структуры расходов.

const TURNOVER_RATE = 4;   // базовая ставка налога с оборота
const VAT_RATE = 12;
const PROFIT_RATE = 15;

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

export default function RegimeCompareCalc() {
  const [revenue, setRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [vatShare, setVatShare] = useState('70'); // % расходов с входящим НДС

  const rev = parseFloat(revenue.replace(/\s/g, '').replace(',', '.')) || 0;
  const exp = parseFloat(expenses.replace(/\s/g, '').replace(',', '.')) || 0;
  const share = Math.min(100, Math.max(0, parseFloat(vatShare.replace(',', '.')) || 0)) / 100;

  // Налог с оборота: выручка × 4%
  const turnoverTax = rev * (TURNOVER_RATE / 100);

  // ОСН: НДС к уплате + налог на прибыль
  const vatOut = rev * VAT_RATE / (100 + VAT_RATE);              // НДС в составе выручки
  const vatIn = exp * share * VAT_RATE / (100 + VAT_RATE);       // входящий НДС
  const vatDue = Math.max(0, vatOut - vatIn);
  const profitBase = Math.max(0, (rev - vatOut) - (exp - vatIn));
  const profitTax = profitBase * (PROFIT_RATE / 100);
  const osnTotal = vatDue + profitTax;

  const diff = Math.abs(turnoverTax - osnTotal);
  const winner = turnoverTax <= osnTotal ? 'Налог с оборота' : 'ОСН';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Выручка за период, с НДС (UZS)</label>
          <MoneyInput value={revenue} onChange={setRevenue} big autoFocus />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Расходы за период, с НДС (UZS)</label>
          <MoneyInput value={expenses} onChange={setExpenses} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Доля расходов с входящим НДС (%)</label>
          <input
            type="number" min="0" max="100" value={vatShare}
            onChange={e => setVatShare(e.target.value)}
            className="w-full bg-[#0f1117] text-slate-200 text-sm px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 tabular-nums"
          />
        </div>
      </div>

      {/* Вердикт */}
      {rev > 0 && (
        <div className={`rounded-xl px-4 py-3 border text-sm font-medium ${
          winner === 'Налог с оборота'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          Выгоднее: <b>{winner}</b> — экономия {fmt(diff)} UZS за период
        </div>
      )}

      <CalcResult
        title={`Сравнение режимов: оборот ${TURNOVER_RATE}% vs ОСН (НДС ${VAT_RATE}% + прибыль ${PROFIT_RATE}%)`}
        rows={[
          { label: `Налог с оборота (${TURNOVER_RATE}%)`, value: `${fmt(turnoverTax)} UZS` },
          { label: 'ОСН: НДС к уплате', value: `${fmt(vatDue)} UZS` },
          { label: 'ОСН: налог на прибыль', value: `${fmt(profitTax)} UZS` },
          { label: 'ОСН: итого нагрузка', value: `${fmt(osnTotal)} UZS` },
          { label: `Разница (выгоднее: ${winner.toLowerCase()})`, value: `${fmt(diff)} UZS`, highlight: true },
        ]}
      />

      <p className="text-[11px] text-slate-600">
        Упрощённая модель. Ставка оборота 4% — базовая (ст. 467 НК РУз, зависит от вида деятельности
        и региона), прибыль 15% (ст. 337), для IT-льгот — 7.5%. ОСН обязательна при выручке свыше 1 млрд сум/год.
      </p>
    </div>
  );
}
