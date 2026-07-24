import React, { useState } from 'react';
import { UZ_HOLIDAYS, holidayName as isHoliday, isWorkday } from '../../data/uzHolidays';
import { todayISO } from '../../lib/dates';
import { DateField, Field } from '../../components/ui/FormControls';

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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Режим калькулятора дат">
        {MODES.map(m => (
          <button type="button" key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === m.id ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Разница ── */}
      {mode === 'diff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <DateField label="Начальная дата" value={date1} onChange={e => setDate1(e.target.value)} />
            <DateField label="Конечная дата" value={date2} onChange={e => setDate2(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setDate1(today); }}
              className="min-h-11 rounded-lg bg-bx-surface-2 px-3 py-2 text-xs text-bx-muted transition-colors hover:text-bx-text">
              Сегодня →
            </button>
          </div>
          {calDays !== null && (
            <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden">
              <div className="divide-y divide-bx-border">
                <Row label="Календарных дней" value={`${Math.abs(calDays)} дн.${calDays < 0 ? ' (назад)' : ''}`} highlight />
                <Row label="Рабочих дней (РУз)" value={`${Math.abs(workDays ?? 0)} раб. дн.`} highlight />
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
            <DateField label="Начальная дата" value={baseDate} onChange={e => setBaseDate(e.target.value)} />
            <Field label="Количество дней" type="number" value={addN} onChange={e => setAddN(e.target.value)} placeholder="30" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Тип прибавляемых дней">
            <span className="text-xs text-bx-muted self-center">Тип:</span>
            {(['calendar', 'work'] as const).map(t => (
              <button type="button" key={t} onClick={() => setAddMode(t)} aria-pressed={addMode === t}
                className={`min-h-11 rounded-lg px-3 py-2 text-xs transition-colors ${addMode === t ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}>
                {t === 'calendar' ? 'Календарные' : 'Рабочие (РУз)'}
              </button>
            ))}
            <button type="button" onClick={() => setBaseDate(today)} className="ml-auto min-h-11 rounded-lg bg-bx-surface-2 px-3 py-2 text-xs text-bx-muted transition-colors hover:text-bx-text">
              Сегодня
            </button>
          </div>
          {/* Быстрые шаблоны */}
          <div className="flex gap-2 flex-wrap">
            {[7, 10, 14, 30, 45, 60, 90].map(n => (
              <button type="button" key={n} onClick={() => setAddN(String(n))}
                className={`min-h-11 rounded-lg px-3 py-2 text-[11px] transition-colors ${addN === String(n) ? 'bg-blue-600/30 text-blue-700 dark:text-blue-300' : 'bg-bx-bg text-bx-muted hover:text-bx-muted'}`}>
                +{n}
              </button>
            ))}
          </div>
          {addResult && (
            <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden">
              <div className="divide-y divide-bx-border">
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
          <DateField label="Дата для проверки" value={checkDate} onChange={e => setCheckDate(e.target.value)} />
          <button type="button" onClick={() => setCheckDate(today)} className="min-h-11 rounded-lg bg-bx-surface-2 px-3 py-2 text-xs text-bx-muted transition-colors hover:text-bx-text">
            Сегодня
          </button>
          {checkResult && checkDate && (
            <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden">
              <div className="px-4 py-3 border-b border-bx-border">
                <p className="text-sm font-semibold text-bx-text">{fmtLong(new Date(checkDate))}</p>
              </div>
              <div className="divide-y divide-bx-border">
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
          <div className="border border-bx-border rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-bx-muted mb-2">Праздники РУз (фиксированные)</p>
            <div className="grid grid-cols-2 gap-1">
              {UZ_HOLIDAYS.map(h => (
                <p key={h.name} className="text-[11px] text-bx-muted">
                  <span className="text-bx-muted">{String(h.day).padStart(2,'0')}.{String(h.month).padStart(2,'0')}</span> — {h.name}
                </p>
              ))}
            </div>
            <p className="text-[11px] text-bx-muted mt-2">* Руза хайит (20 марта) и Курбан хайит (27 мая) включены на 2026 год</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-bx-muted">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-400' : 'text-bx-text'}`}>{value}</span>
    </div>
  );
}
