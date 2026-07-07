import React, { useMemo, useState } from 'react';
import { deadlinesForMonth, TaxDeadline } from '../../data/taxCalendar';

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

interface Props {
  onPickDeadline: (date: string, deadline: TaxDeadline) => void;
}

export default function TaxCalendar({ onPickDeadline }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const deadlines = useMemo(() => {
    const map = new Map<string, TaxDeadline[]>();
    for (const { date, deadline } of deadlinesForMonth(year, month)) {
      const arr = map.get(date) ?? [];
      arr.push(deadline);
      map.set(date, arr);
    }
    return map;
  }, [year, month]);

  // Сетка месяца (Пн-первый)
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Пн=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }
  function dateStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const selectedDeadlines = selected ? deadlines.get(selected) ?? [] : [];

  return (
    <div className="rounded-xl border border-bx-border bg-bx-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-bx-text">📅 Налоговый календарь</h2>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-6 h-6 rounded hover:bg-bx-surface-2 text-bx-muted text-xs">‹</button>
          <span className="text-xs text-bx-text w-28 text-center">{MONTHS[month]} {year}</span>
          <button onClick={next} className="w-6 h-6 rounded hover:bg-bx-surface-2 text-bx-muted text-xs">›</button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(w => <div key={w} className="text-[10px] text-bx-muted text-center">{w}</div>)}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStr(d);
          const has = deadlines.has(ds);
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          return (
            <button
              key={i}
              onClick={() => setSelected(isSel ? null : ds)}
              className={`relative h-8 rounded text-xs transition-colors ${
                isSel ? 'bg-blue-600 text-white'
                : isToday ? 'bg-blue-500/20 text-blue-300'
                : 'text-bx-muted hover:bg-bx-surface-2'
              }`}
            >
              {d}
              {has && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-amber-400'}`} />}
            </button>
          );
        })}
      </div>

      {/* Selected day deadlines */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-bx-border">
          {selectedDeadlines.length === 0 ? (
            <p className="text-xs text-bx-muted">На {selected} нет дедлайнов</p>
          ) : (
            <div className="space-y-1.5">
              {selectedDeadlines.map(dl => (
                <div key={dl.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${dl.kind === 'payment' ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <span className="text-bx-text flex-1">{dl.title}</span>
                  <button
                    onClick={() => onPickDeadline(selected, dl)}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    + в задачи
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
