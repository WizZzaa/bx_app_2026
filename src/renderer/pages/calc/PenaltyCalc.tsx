import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory';
import { DateField, Field } from '../../components/ui/FormControls';

// Пени по НК РУз: 0.033% за каждый день просрочки (ст. 120 НК РУз)
// Также можно считать через ставку ЦБ: Долг × ставка_ЦБ / 365 × дни
function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function PenaltyCalc() {
  const DAILY_RATE_PERCENT = useRegulatoryNumber('tax.penalty.daily');
  const CBU_POLICY_RATE = useRegulatoryNumber('indicator.cbu.policy_rate');
  const [mode, setMode] = useState<'fixed' | 'cbu'>('fixed');
  const [debt, setDebt] = useState('');
  const [days, setDays] = useState('');
  const [cbuRate, setCbuRate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debtVal = parseFloat(debt.replace(/\s/g, '').replace(',', '.')) || 0;

  let daysVal = parseInt(days) || 0;
  if (dateFrom && dateTo) {
    const d1 = new Date(dateFrom);
    const d2 = new Date(dateTo);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      daysVal = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
    }
  }

  const cbu = parseFloat(cbuRate.replace(',', '.')) || CBU_POLICY_RATE;
  const dailyRate = mode === 'fixed' ? DAILY_RATE_PERCENT / 100 : cbu / 100 / 365;
  const penaltyRaw = debtVal * dailyRate * daysVal;
  // Ст. 120 НК РУз: сумма пени не может превышать сумму задолженности
  const capped = penaltyRaw > debtVal && debtVal > 0;
  const penalty = capped ? debtVal : penaltyRaw;
  const total = debtVal + penalty;

  return (
    <div className="bx-a7-calc-form space-y-5">
      <div className="flex gap-2" role="group" aria-label="Способ расчёта пени">
        <button
          type="button"
          onClick={() => setMode('fixed')}
          aria-pressed={mode === 'fixed'}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'fixed' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          {DAILY_RATE_PERCENT}%/день (НК)
        </button>
        <button
          type="button"
          onClick={() => setMode('cbu')}
          aria-pressed={mode === 'cbu'}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'cbu' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          По ставке ЦБ
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MoneyInput label="Сумма долга" value={debt} onChange={setDebt} autoFocus />
        {mode === 'cbu' && (
          <Field
            label="Ставка ЦБ (%)"
            type="text"
            inputMode="decimal"
            value={cbuRate || String(CBU_POLICY_RATE)}
            onChange={e => setCbuRate(e.target.value)}
          />
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-bx-text">Период просрочки</legend>
        <div className="grid grid-cols-2 gap-3">
          <DateField label="Начало просрочки" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <DateField label="Дата расчёта" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <Field
          label="Или количество дней"
          hint="Ввод дней очистит выбранные даты."
          type="number"
          value={dateFrom || dateTo ? '' : days}
          onChange={e => { setDateFrom(''); setDateTo(''); setDays(e.target.value); }}
          placeholder="0"
          min="0"
        />
      </fieldset>

      <CalcResult
        title={`Пени ${mode === 'fixed' ? `${DAILY_RATE_PERCENT}%/день (ст. 120 НК)` : `по ставке ЦБ ${cbu}%`}`}
        rows={[
          { label: 'Сумма долга', value: `${fmt(debtVal)} UZS` },
          { label: 'Количество дней', value: `${daysVal} дн.` },
          { label: 'Ставка в день', value: `${mode === 'fixed' ? DAILY_RATE_PERCENT : (cbu / 365).toFixed(4)}%` },
          { label: capped ? 'Сумма пени (ограничена долгом)' : 'Сумма пени', value: `${fmt(penalty)} UZS`, highlight: true },
          { label: 'Итого к уплате (долг + пени)', value: `${fmt(total)} UZS` },
        ]}
      />
      {capped && (
        <p className="text-[11px] text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          Пеня ограничена суммой долга (ст. 120 НК РУз): расчётные {fmt(penaltyRaw)} UZS → {fmt(penalty)} UZS.
        </p>
      )}

      <p className="text-[11px] text-bx-muted">
        Ст. 120 НК РУз: пени = {DAILY_RATE_PERCENT}% за каждый день просрочки. Альтернатива: ставка ЦБ / 365 × дни.
      </p>
    </div>
  );
}
