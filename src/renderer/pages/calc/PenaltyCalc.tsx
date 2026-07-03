import React, { useState } from 'react';
import CalcResult from './CalcResult';
import MoneyInput from './MoneyInput';

// Пени по НК РУз: 0.033% за каждый день просрочки (ст. 120 НК РУз)
// Также можно считать через ставку ЦБ: Долг × ставка_ЦБ / 365 × дни
const DAILY_RATE_PERCENT = 0.033;

function fmt(n: number) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function PenaltyCalc() {
  const [mode, setMode] = useState<'fixed' | 'cbu'>('fixed');
  const [debt, setDebt] = useState('');
  const [days, setDays] = useState('');
  const [cbuRate, setCbuRate] = useState('14'); // основная ставка ЦБ с 20.03.2025
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

  const cbu = parseFloat(cbuRate.replace(',', '.')) || 0;
  const dailyRate = mode === 'fixed' ? DAILY_RATE_PERCENT / 100 : cbu / 100 / 365;
  const penaltyRaw = debtVal * dailyRate * daysVal;
  // Ст. 120 НК РУз: сумма пени не может превышать сумму задолженности
  const capped = penaltyRaw > debtVal && debtVal > 0;
  const penalty = capped ? debtVal : penaltyRaw;
  const total = debtVal + penalty;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('fixed')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'fixed' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          0.033%/день (НК)
        </button>
        <button
          onClick={() => setMode('cbu')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'cbu' ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}
        >
          По ставке ЦБ
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Сумма долга (UZS)</label>
          <MoneyInput value={debt} onChange={setDebt} autoFocus />
        </div>
        {mode === 'cbu' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Ставка ЦБ (%)</label>
            <input
              type="text" inputMode="decimal" value={cbuRate} onChange={e => setCbuRate(e.target.value)}
              placeholder="13.5"
              className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Период просрочки</label>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-500">или укажите количество дней:</span>
          <input
            type="number" value={dateFrom || dateTo ? '' : days}
            onChange={e => { setDateFrom(''); setDateTo(''); setDays(e.target.value); }}
            placeholder="0" min="0"
            className="w-20 bg-[#0f1117] text-slate-200 px-2 py-1.5 rounded border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm"
          />
          <span className="text-xs text-slate-500">дн.</span>
        </div>
      </div>

      <CalcResult
        title={`Пени ${mode === 'fixed' ? '0.033%/день (ст. 120 НК)' : `по ставке ЦБ ${cbu}%`}`}
        rows={[
          { label: 'Сумма долга', value: `${fmt(debtVal)} UZS` },
          { label: 'Количество дней', value: `${daysVal} дн.` },
          { label: 'Ставка в день', value: `${mode === 'fixed' ? '0.033' : (cbu / 365).toFixed(4)}%` },
          { label: capped ? 'Сумма пени (ограничена долгом)' : 'Сумма пени', value: `${fmt(penalty)} UZS`, highlight: true },
          { label: 'Итого к уплате (долг + пени)', value: `${fmt(total)} UZS` },
        ]}
      />
      {capped && (
        <p className="text-[11px] text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          Пеня ограничена суммой долга (ст. 120 НК РУз): расчётные {fmt(penaltyRaw)} UZS → {fmt(penalty)} UZS.
        </p>
      )}

      <p className="text-[11px] text-slate-600">
        Ст. 120 НК РУз: пени = 0.033% за каждый день просрочки. Альтернатива: ставка ЦБ / 365 × дни.
      </p>
    </div>
  );
}
