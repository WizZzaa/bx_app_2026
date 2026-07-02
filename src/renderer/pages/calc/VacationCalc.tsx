import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';

// Отпускные РУз: средний заработок × количество дней отпуска
// Среднедневной = (Сумма за 12 мес / 12) / среднее кол-во рабочих дней в месяце
// Ст. 158 ТК РУз, Постановление МТиСН

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function VacationCalc() {
  const [annualIncome, setAnnualIncome] = useState('');
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

  const ndfl = vacationPay * 0.12;
  const net = vacationPay - ndfl;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setCalcMethod('calendar')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${calcMethod === 'calendar' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Календарные дни
        </button>
        <button
          onClick={() => setCalcMethod('working')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${calcMethod === 'working' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          Рабочие дни
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Совокупный доход за 12 месяцев (UZS)</label>
          <MoneyInput value={annualIncome} onChange={setAnnualIncome} big autoFocus />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Дней отпуска</label>
          <input
            type="number" value={vacDays} onChange={e => setVacDays(e.target.value)} min="1"
            className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm"
          />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs text-slate-500">Мин. отпуск: 15 дней (ТК РУз)</p>
          <p className="text-xs text-slate-500">Осн. отпуск: 21 день</p>
        </div>
      </div>

      <CalcResult
        title={`Отпускные (${calcMethod === 'calendar' ? 'календарные' : 'рабочие'} дни)`}
        rows={[
          { label: 'Среднедневной заработок', value: `${fmt(avgDaily)} UZS` },
          { label: `Дней отпуска (${calcMethod === 'calendar' ? 'кал.' : 'раб.'})`, value: `${days} дн.` },
          { label: 'Начислено отпускных', value: `${fmt(vacationPay)} UZS`, highlight: true },
          { label: 'НДФЛ (12%)', value: `${fmt(ndfl)} UZS` },
          { label: 'К выплате (без НДФЛ)', value: `${fmt(net)} UZS` },
        ]}
      />

      <p className="text-[11px] text-slate-600">
        Расчёт по ст. 158 ТК РУз. Среднедневной по календарным: доход/365, по рабочим: (доход/12)/25.4.
      </p>
    </div>
  );
}
