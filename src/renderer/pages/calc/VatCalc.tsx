import React, { useState } from 'react';
import { Row } from './CalcRow';

const VAT_RATE = 12;

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function VatCalc() {
  const [mode, setMode] = useState<'add' | 'extract'>('add');
  const [amount, setAmount] = useState('');

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0;
  const rate = VAT_RATE / 100;

  const vatAmount = mode === 'add' ? val * rate : val - val / (1 + rate);
  const total = mode === 'add' ? val + vatAmount : val;
  const base = mode === 'add' ? val : val / (1 + rate);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'add' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Начислить НДС
        </button>
        <button
          onClick={() => setMode('extract')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'extract' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Выделить НДС
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          {mode === 'add' ? 'Сумма без НДС (UZS)' : 'Сумма с НДС (UZS)'}
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-[#0f1117] text-slate-200 text-lg px-4 py-3 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
        <div className="divide-y divide-[#1e2535]">
          <Row label="Ставка НДС" value={`${VAT_RATE}%`} />
          <Row label={mode === 'add' ? 'Сумма без НДС' : 'База (без НДС)'} value={`${fmt(base)} UZS`} />
          <Row label="Сумма НДС" value={`${fmt(vatAmount)} UZS`} highlight />
          <Row label={mode === 'add' ? 'Итого с НДС' : 'Сумма с НДС (введено)'} value={`${fmt(total)} UZS`} />
        </div>
      </div>

      <p className="text-[11px] text-slate-600">Ставка НДС в Узбекистане — 12% (ст. 258 НК РУз)</p>
    </div>
  );
}
