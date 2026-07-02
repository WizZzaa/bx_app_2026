import React, { useState } from 'react';
import { UZ_HOLIDAYS, holidayName as isHoliday, isWorkday } from '../../data/uzHolidays';
import { todayISO } from '../../lib/dates';

function addCalendarDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function addWorkdays(base: Date, n: number): Date {
  const d = new Date(base);
  let count = 0;
  const step = n >= 0 ? 1 : -1;
  while (count < Math.abs(n)) {
    d.setDate(d.getDate() + step);
    if (isWorkday(d)) count++;
  }
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function diffWorkdays(a: Date, b: Date): number {
  let count = 0;
  const d = new Date(a);
  const step = b >= a ? 1 : -1;
  while (d.toDateString() !== b.toDateString()) {
    d.setDate(d.getDate() + step);
    if (isWorkday(d)) count += step;
  }
  return count;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

type Mode = 'diff' | 'add' | 'check';

export default function DateCalc() {
  const [mode, setMode] = useState<Mode>('diff');

  // diff
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');

  // add
  const [baseDate, setBaseDate] = useState('');
  const [addN, setAddN] = useState('30');
  const [addMode, setAddMode] = useState<'calendar' | 'work'>('calendar');

  // check
  const [checkDate, setCheckDate] = useState('');

  const today = todayISO();

  // ── diff results ──
  let calDays: number | null = null;
  let workDays: number | null = null;
  if (date1 && date2) {
    const d1 = new Date(date1), d2 = new Date(date2);
    calDays = diffDays(d1, d2);
    workDays = diffWorkdays(d1, d2);
  }

  // ── add results ──
  let addResult: Date | null = null;
  if (baseDate && addN) {
    const n = parseInt(addN);
    if (!isNaN(n)) {
      addResult = addMode === 'calendar'
        ? addCalendarDays(new Date(baseDate), n)
        : addWorkdays(new Date(baseDate), n);
    }
  }

  // ── check results ──
  let checkResult: { workday: boolean; holiday: string | null; weekend: boolean } | null = null;
  if (checkDate) {
    const d = new Date(checkDate);
    const holiday = isHoliday(d);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    checkResult = { workday: isWorkday(d), holiday, weekend };
  }

  const MODES: { id: Mode; label: string }[] = [
    { id: 'diff', label: 'Разница между датами' },
    { id: 'add',  label: 'Прибавить дни к дате' },
    { id: 'check', label: 'Проверить дату' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === m.id ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Разница ── */}
      {mode === 'diff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Начальная дата</label>
              <input type="date" value={date1} onChange={e => setDate1(e.target.value)}
                className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Конечная дата</label>
              <input type="date" value={date2} onChange={e => setDate2(e.target.value)}
                className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setDate1(today); }}
              className="text-xs px-2.5 py-1 bg-[#1e2535] text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
              Сегодня →
            </button>
          </div>
          {calDays !== null && (
            <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
              <div className="divide-y divide-[#1e2535]">
                <Row label="Календарных дней" value={`${Math.abs(calDays)} дн.${calDays < 0 ? ' (назад)' : ''}`} highlight />
                <Row label="Рабочих дней (РУз)" value={`${Math.abs(workDays!)} раб. дн.`} highlight />
                <Row label="Полных недель" value={`${Math.floor(Math.abs(calDays) / 7)} нед. + ${Math.abs(calDays) % 7} дн.`} />
                <Row label="Полных месяцев (прибл.)" value={`${(Math.abs(calDays) / 30.4).toFixed(1)} мес.`} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Прибавить ── */}
      {mode === 'add' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Начальная дата</label>
              <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)}
                className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Количество дней</label>
              <input type="number" value={addN} onChange={e => setAddN(e.target.value)}
                placeholder="30"
                className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-slate-500 self-center">Тип:</span>
            {(['calendar', 'work'] as const).map(t => (
              <button key={t} onClick={() => setAddMode(t)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${addMode === t ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
                {t === 'calendar' ? 'Календарные' : 'Рабочие (РУз)'}
              </button>
            ))}
            <button onClick={() => setBaseDate(today)} className="ml-auto text-xs px-2.5 py-1 bg-[#1e2535] text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
              Сегодня
            </button>
          </div>
          {/* Быстрые шаблоны */}
          <div className="flex gap-2 flex-wrap">
            {[7, 10, 14, 30, 45, 60, 90].map(n => (
              <button key={n} onClick={() => setAddN(String(n))}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${addN === String(n) ? 'bg-blue-600/30 text-blue-400' : 'bg-[#0f1117] text-slate-600 hover:text-slate-400'}`}>
                +{n}
              </button>
            ))}
          </div>
          {addResult && (
            <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
              <div className="divide-y divide-[#1e2535]">
                <Row label="Результат" value={fmt(addResult)} highlight />
                <Row label="День недели и дата" value={fmtLong(addResult)} />
                <Row label="Рабочий день?" value={isWorkday(addResult) ? '✓ Да' : isHoliday(addResult) ? `Праздник: ${isHoliday(addResult)}` : '✕ Выходной'} />
                {!isWorkday(addResult) && (
                  <Row label="Следующий рабочий день" value={fmt(addWorkdays(addResult, 1))} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Проверить дату ── */}
      {mode === 'check' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Дата для проверки</label>
            <input type="date" value={checkDate} onChange={e => setCheckDate(e.target.value)}
              className="w-full bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm" />
          </div>
          <button onClick={() => setCheckDate(today)} className="text-xs px-2.5 py-1 bg-[#1e2535] text-slate-400 hover:text-slate-200 rounded-lg transition-colors">
            Сегодня
          </button>
          {checkResult && checkDate && (
            <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e2535]">
                <p className="text-sm font-semibold text-slate-200">{fmtLong(new Date(checkDate))}</p>
              </div>
              <div className="divide-y divide-[#1e2535]">
                <Row label="Статус"
                  value={checkResult.holiday ? `🎉 Праздник: ${checkResult.holiday}` : checkResult.weekend ? '🔴 Выходной' : '✅ Рабочий день'}
                  highlight={checkResult.workday}
                />
                {!checkResult.workday && (
                  <Row label="Следующий рабочий день" value={fmt(addWorkdays(new Date(checkDate), 1))} />
                )}
                {!checkResult.workday && (
                  <Row label="Предыдущий рабочий день" value={fmt(addWorkdays(new Date(checkDate), -1))} />
                )}
              </div>
            </div>
          )}
          <div className="border border-[#1e2535] rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-400 mb-2">Праздники РУз (фиксированные)</p>
            <div className="grid grid-cols-2 gap-1">
              {UZ_HOLIDAYS.map(h => (
                <p key={h.name} className="text-[11px] text-slate-600">
                  <span className="text-slate-500">{String(h.day).padStart(2,'0')}.{String(h.month).padStart(2,'0')}</span> — {h.name}
                </p>
              ))}
            </div>
            <p className="text-[11px] text-slate-700 mt-2">* Ураза-байрам и Курбан-байрам — переменные, не включены</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-400' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}
