import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory';
import { Field } from '../../components/ui/FormControls';

// Дивиденды РУз: ст. 382 НК РУз
// Резиденты: 5%  (физ. лица РУз)
// Нерезиденты: 10% (если иное не предусмотрено СИДН)

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function DividendCalc() {
  const RESIDENT_RATE = useRegulatoryNumber('tax.dividend.resident');
  const NONRESIDENT_RATE = useRegulatoryNumber('tax.dividend.nonresident');
  const [amount, setAmount] = useState('');
  const [resident, setResident] = useState(true);
  const [nonresidentRate, setNonresidentRate] = useState('');

  const val = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0;

  const manualNonresidentRate = Math.min(100, Math.max(0, Number(nonresidentRate.replace(',', '.')) || NONRESIDENT_RATE));
  const rate = resident ? RESIDENT_RATE : manualNonresidentRate;
  const tax = val * (rate / 100);
  const net = val - tax;

  return (
    <div className="bx-a7-calc-form space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setResident(true)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${resident ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Резидент РУз ({RESIDENT_RATE}%)
        </button>
        <button
          onClick={() => setResident(false)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!resident ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Нерезидент (указать ставку)
        </button>
      </div>

      <MoneyInput label="Сумма дивидендов" value={amount} onChange={setAmount} big autoFocus />

      {!resident && (
        <Field
            label="Ставка по проверенному СИДН или НК (%)"
            hint="BX не подбирает СИДН автоматически: страна, статус получателя и право на льготу требуют отдельной проверки."
            type="text"
            inputMode="decimal"
            value={nonresidentRate || String(NONRESIDENT_RATE)}
            onChange={e => setNonresidentRate(e.target.value)}
          />
      )}

      <CalcResult
        title={`Дивиденды — ${resident ? `резидент ${RESIDENT_RATE}%` : `нерезидент ${rate}%`}`}
        rows={[
          { label: 'Сумма дивидендов', value: `${fmt(val)} UZS` },
          { label: 'Ставка налога', value: `${rate}%` },
          { label: 'Налог у источника', value: `${fmt(tax)} UZS`, highlight: true },
          { label: 'Сумма к выплате (нетто)', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">
        Ст. 382 НК РУз. Базовые значения: резидент — {RESIDENT_RATE}%, нерезидент — {NONRESIDENT_RATE}% (или подтверждённая ставка СИДН).
        Налог удерживается у источника выплаты (ООО / АО).
      </p>
    </div>
  );
}
