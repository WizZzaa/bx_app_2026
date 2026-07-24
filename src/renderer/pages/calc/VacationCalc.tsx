import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';
import { takeCalcPrefill, toMoneyString } from './prefill';
import { useRegulatoryNumber } from '../../lib/calculatorRegulatory';
import { Field } from '../../components/ui/FormControls';

// Отпускные РУз: средний заработок × количество дней отпуска
// Среднедневной = (Сумма за 12 мес / 12) / среднее кол-во рабочих дней в месяце
// Ст. 158 ТК РУз, Постановление МТиСН

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function VacationCalc() {
  const NDFL_RATE = useRegulatoryNumber('tax.ndfl.standard');
  const [annualIncome, setAnnualIncome] = useState(() => {
    const pre = takeCalcPrefill('vacation');
    return pre?.annual ? toMoneyString(pre.annual) : '';
  });
  const [vacDays, setVacDays] = useState('15');
  const [calcMethod, setCalcMethod] = useState<'calendar' | 'working'>('calendar');

  const annual = parseFloat(annualIncome.replace(/\s/g, '').replace(',', '.')) || 0;
  const days = parseInt(vacDays) || 0;

  // Среднедневной заработок:
  // Календарный: годовой / 365
  // Рабочий: (годовой / 12) / 25.4 (среднее рабочих дней в месяце)
  const avgDailyCalendar = annual / 365;
  const avgDailyWorking = annual / 12 / 25.4;
  const avgDaily = calcMethod === 'calendar' ? avgDailyCalendar : avgDailyWorking;
  const vacationPay = avgDaily * days;

  const ndfl = vacationPay * (NDFL_RATE / 100);
  const net = vacationPay - ndfl;

  return (
    <div className="bx-a7-calc-form space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setCalcMethod('calendar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${calcMethod === 'calendar' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Календарные дни
        </button>
        <button
          onClick={() => setCalcMethod('working')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${calcMethod === 'working' ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}
        >
          Рабочие дни
        </button>
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
        <Field label="Дней отпуска" type="number" value={vacDays} onChange={e => setVacDays(e.target.value)} min="1" />
        <div className="flex flex-col justify-end">
          <p className="text-xs text-bx-muted">Мин. отпуск: 15 дней (ТК РУз)</p>
          <p className="text-xs text-bx-muted">Осн. отпуск: 21 день</p>
        </div>
      </div>

      <CalcResult
        title={`Отпускные (${calcMethod === 'calendar' ? 'календарные' : 'рабочие'} дни)`}
        rows={[
          { label: 'Среднедневной заработок', value: `${fmt(avgDaily)} UZS` },
          { label: `Дней отпуска (${calcMethod === 'calendar' ? 'кал.' : 'раб.'})`, value: `${days} дн.` },
          { label: 'Начислено отпускных', value: `${fmt(vacationPay)} UZS`, highlight: true },
          { label: `НДФЛ (${NDFL_RATE}%)`, value: `${fmt(ndfl)} UZS` },
          { label: 'К выплате (без НДФЛ)', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-bx-muted">
        Расчёт по ст. 158 ТК РУз. Среднедневной по календарным: доход/365, по рабочим: (доход/12)/25.4.
      </p>
    </div>
  );
}
