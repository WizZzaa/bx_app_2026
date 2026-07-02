import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { calcPayroll, DEFAULT_RATES } from '../hr/payroll';

// Зарплата «в обе стороны»: начислено → на руки и на руки → начислено.
// Математика — общая с разделом «Сотрудники» (hr/payroll.ts):
// НДФЛ 12%, из него ИНПС 0.1%; соцналог 12% сверх (платит работодатель).

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function SalaryCalc() {
  const [direction, setDirection] = useState<'gross2net' | 'net2gross'>('gross2net');
  const [amount, setAmount] = useState('');

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0;

  // Удержания линейны (всего ровно НДФЛ%), поэтому обратный расчёт — деление
  const gross = direction === 'gross2net' ? val : val / (1 - DEFAULT_RATES.ndfl / 100);
  const p = calcPayroll(gross);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setDirection('gross2net')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'gross2net' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Начислено → на руки
        </button>
        <button
          onClick={() => setDirection('net2gross')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'net2gross' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          На руки → начислено
        </button>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">
          {direction === 'gross2net' ? 'Начисленная зарплата (UZS)' : 'Сумма «на руки» (UZS)'}
        </label>
        <MoneyInput value={amount} onChange={setAmount} big autoFocus />
      </div>

      <CalcResult
        title={`Зарплата: ${direction === 'gross2net' ? 'начислено → на руки' : 'на руки → начислено'}`}
        rows={[
          { label: 'Начислено (gross)', value: `${fmt(p.gross)} UZS`, highlight: direction === 'net2gross' },
          { label: `НДФЛ (${DEFAULT_RATES.ndfl}% с учётом ИНПС)`, value: `${fmt(p.ndfl)} UZS` },
          { label: `ИНПС (${DEFAULT_RATES.inps}%)`, value: `${fmt(p.inps)} UZS` },
          { label: 'Удержано всего', value: `${fmt(p.totalWithheld)} UZS` },
          { label: 'На руки (net)', value: `${fmt(p.net)} UZS`, highlight: direction === 'gross2net' },
          { label: `Соцналог работодателя (${DEFAULT_RATES.social}%)`, value: `${fmt(p.social)} UZS` },
          { label: 'Полная стоимость для работодателя', value: `${fmt(p.employerCost)} UZS` },
        ]}
      />

      <p className="text-[11px] text-slate-600">
        НДФЛ 12% (ст. 366 НК РУз), ИНПС 0.1% вычитается из НДФЛ, соцналог 12% (бюджетные — 25%).
        Расчёт совпадает с разделом «Сотрудники».
      </p>
    </div>
  );
}
