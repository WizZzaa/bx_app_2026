import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { calcPayroll, DEFAULT_RATES } from '../hr/payroll';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory';

// Зарплата «в обе стороны»: начислено → на руки и на руки → начислено.
// Общая расчётная математика хранится в hr/payroll.ts; отдельного HR-раздела в интерфейсе нет.
// НДФЛ 12%, из него ИНПС 0.1%; соцналог 12% сверх (платит работодатель).

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function SalaryCalc() {
  const rates = {
    ...DEFAULT_RATES,
    ndfl: useRegulatoryNumber('tax.ndfl.standard'),
    inps: useRegulatoryNumber('payroll.inps'),
    social: useRegulatoryNumber('tax.social.standard'),
  };
  const [direction, setDirection] = useState<'gross2net' | 'net2gross'>('gross2net');
  const [amount, setAmount] = useState('');

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0;

  // Удержания линейны (всего ровно НДФЛ%), поэтому обратный расчёт — деление
  const gross = direction === 'gross2net' ? val : val / (1 - rates.ndfl / 100);
  const p = calcPayroll(gross, rates);

  return (
    <div className="bx-a7-calc-form space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setDirection('gross2net')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'gross2net' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Начислено → на руки
        </button>
        <button
          onClick={() => setDirection('net2gross')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'net2gross' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          На руки → начислено
        </button>
      </div>

      <div>
        <label className="block text-xs text-bx-muted mb-1.5">
          {direction === 'gross2net' ? 'Начисленная зарплата (UZS)' : 'Сумма «на руки» (UZS)'}
        </label>
        <MoneyInput value={amount} onChange={setAmount} big autoFocus />
      </div>

      <CalcResult
        title={`Зарплата: ${direction === 'gross2net' ? 'начислено → на руки' : 'на руки → начислено'}`}
        rows={[
          { label: 'Начислено (gross)', value: `${fmt(p.gross)} UZS`, highlight: direction === 'net2gross' },
          { label: `НДФЛ (${rates.ndfl}% с учётом ИНПС)`, value: `${fmt(p.ndfl)} UZS` },
          { label: `ИНПС (${rates.inps}%)`, value: `${fmt(p.inps)} UZS` },
          { label: 'Удержано всего', value: `${fmt(p.totalWithheld)} UZS` },
          { label: 'На руки (net)', value: `${fmt(p.net)} UZS`, highlight: direction === 'gross2net' },
          { label: `Соцналог работодателя (${rates.social}%)`, value: `${fmt(p.social)} UZS` },
          { label: 'Полная стоимость для работодателя', value: `${fmt(p.employerCost)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">
        НДФЛ {rates.ndfl}% (ст. 366 НК РУз), ИНПС {rates.inps}% вычитается из НДФЛ, соцналог {rates.social}% (бюджетные организации проверяют отдельную ставку).
        Ориентировочная проверка начислений. Кадровый и зарплатный учёт ведите в 1С.
      </p>
    </div>
  );
}
