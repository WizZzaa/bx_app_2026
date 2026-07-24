import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { takeCalcPrefill, toMoneyString } from './prefill';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory';
import { Field } from '../../components/ui/FormControls';

// Больничные РУз: % от среднего заработка в зависимости от стажа
// Ст. 284 ТК РУз + Положение о порядке назначения пособий
// Менее 2 лет: 60%, 2–5 лет: 80%, более 5 лет: 100%
// Мин. пособие: МРОТ (живое значение из справочника); максимум не ограничен

const STAZH_RULES = [
  { label: 'Менее 2 лет', maxYears: 2, pct: 60 },
  { label: 'От 2 до 5 лет', maxYears: 5, pct: 80 },
  { label: 'Более 5 лет', maxYears: Infinity, pct: 100 },
];

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function SickLeaveCalc() {
  const NDFL_RATE = useRegulatoryNumber('tax.ndfl.standard');
  const MROT = useRegulatoryNumber('indicator.mrot');
  const [annualIncome, setAnnualIncome] = useState(() => {
    const pre = takeCalcPrefill('sick');
    return pre?.annual ? toMoneyString(pre.annual) : '';
  });
  const [sickDays, setSickDays] = useState('10');
  const [stazh, setStazh] = useState(0); // index in STAZH_RULES

  const annual = parseFloat(annualIncome.replace(/\s/g, '').replace(',', '.')) || 0;
  const days = parseInt(sickDays) || 0;
  const rule = STAZH_RULES[stazh];

  const avgDaily = annual / 365;
  const minDaily = MROT / 25.4;

  const rawBenefit = avgDaily * days * (rule.pct / 100);
  const minBenefit = minDaily * days;
  const benefit = Math.max(rawBenefit, minBenefit);

  const ndfl = benefit * (NDFL_RATE / 100);
  const net = benefit - ndfl;

  return (
    <div className="bx-a7-calc-form space-y-5">
      <div>
        <label className="block text-xs text-bx-muted mb-2">Трудовой стаж</label>
        <div className="flex gap-2">
          {STAZH_RULES.map((r, i) => (
            <button
              key={i}
              onClick={() => setStazh(i)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${stazh === i ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
            >
              {r.label}<br />
              <span className="opacity-80">{r.pct}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MoneyInput
          label="Совокупный доход за 12 месяцев"
          value={annualIncome}
          onChange={setAnnualIncome}
          big
          autoFocus
          containerClassName="col-span-2"
        />
        <Field label="Дней болезни (раб.)" type="number" value={sickDays} onChange={e => setSickDays(e.target.value)} min="1" />
        <div className="flex flex-col justify-end">
          <p className="text-xs text-bx-muted">МРОТ (версия ставки): {fmt(MROT)} UZS</p>
          <p className="text-xs text-bx-muted">Коэфф. стажа: {rule.pct}%</p>
        </div>
      </div>

      <CalcResult
        title={`Больничные (стаж ${rule.label.toLowerCase()}, ${rule.pct}%)`}
        rows={[
          { label: 'Среднедневной заработок', value: `${fmt(avgDaily)} UZS` },
          { label: 'Коэффициент стажа', value: `${rule.pct}%` },
          { label: 'По среднему заработку', value: `${fmt(rawBenefit)} UZS` },
          { label: 'Минимальное пособие (МРОТ)', value: `${fmt(minBenefit)} UZS` },
          { label: 'Начислено пособия', value: `${fmt(benefit)} UZS`, highlight: true },
          { label: `НДФЛ (${NDFL_RATE}%)`, value: `${fmt(ndfl)} UZS` },
          { label: 'К выплате', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">Ст. 284 ТК РУз. Минимум — среднедневной МРОТ × дни. Финансируется из ГФСН.</p>
    </div>
  );
}
