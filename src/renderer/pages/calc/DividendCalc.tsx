import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';

// Дивиденды РУз: ст. 382 НК РУз
// Резиденты: 5%  (физ. лица РУз)
// Нерезиденты: 10% (если иное не предусмотрено СИДН)

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

const TREATIES: Record<string, number> = {
  none: 10,
  russia: 10,
  germany: 5,
  china: 10,
  usa: 10,
  uk: 5,
  france: 5,
};

const TREATY_LABELS: Record<string, string> = {
  none: 'Без СИДН / стандарт',
  russia: 'Россия (СИДН)',
  germany: 'Германия (СИДН, 5%)',
  china: 'Китай (СИДН)',
  usa: 'США (СИДН)',
  uk: 'Великобритания (5%)',
  france: 'Франция (5%)',
};

export default function DividendCalc() {
  const [amount, setAmount] = useState('');
  const [resident, setResident] = useState(true);
  const [treaty, setTreaty] = useState('none');

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0;

  const rate = resident ? 5 : TREATIES[treaty] ?? 10;
  const tax = val * (rate / 100);
  const net = val - tax;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setResident(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${resident ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Резидент РУз (5%)
        </button>
        <button
          onClick={() => setResident(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!resident ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Нерезидент (5–10%)
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Сумма дивидендов (UZS)</label>
        <MoneyInput value={amount} onChange={setAmount} big autoFocus />
      </div>

      {!resident && (
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Страна — применимое СИДН</label>
          <select
            value={treaty}
            onChange={e => setTreaty(e.target.value)}
            className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm"
          >
            {Object.entries(TREATY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}

      <CalcResult
        title={`Дивиденды — ${resident ? 'резидент 5%' : `нерезидент ${rate}%`}`}
        rows={[
          { label: 'Сумма дивидендов', value: `${fmt(val)} UZS` },
          { label: 'Ставка налога', value: `${rate}%` },
          { label: 'Налог у источника', value: `${fmt(tax)} UZS`, highlight: true },
          { label: 'Сумма к выплате (нетто)', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-slate-600">
        Ст. 382 НК РУз. Резиденты — 5%. Нерезиденты — 10% (или ставка СИДН, если она ниже).
        Налог удерживается у источника выплаты (ООО / АО).
      </p>
    </div>
  );
}
