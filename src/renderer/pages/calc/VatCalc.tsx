import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';

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
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'add' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Начислить НДС
        </button>
        <button
          onClick={() => setMode('extract')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'extract' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Выделить НДС
        </button>
      </div>

      <div>
        <label className="block text-xs text-bx-muted mb-1.5">
          {mode === 'add' ? 'Сумма без НДС (UZS)' : 'Сумма с НДС (UZS)'}
        </label>
        <MoneyInput value={amount} onChange={setAmount} big autoFocus />
      </div>

      <CalcResult
        title={`НДС ${VAT_RATE}% — ${mode === 'add' ? 'начисление' : 'выделение'}`}
        rows={[
          { label: 'Ставка НДС', value: `${VAT_RATE}%` },
          { label: mode === 'add' ? 'Сумма без НДС' : 'База (без НДС)', value: `${fmt(base)} UZS` },
          { label: 'Сумма НДС', value: `${fmt(vatAmount)} UZS`, highlight: true },
          { label: mode === 'add' ? 'Итого с НДС' : 'Сумма с НДС (введено)', value: `${fmt(total)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">Ставка НДС в Узбекистане — 12% (ст. 258 НК РУз)</p>
    </div>
  );
}
