import React, { useMemo, useState } from 'react';
import { deadlinesForMonth, summarizeTaxDeadlineCatalog, TaxDeadline } from '../../data/taxCalendar';
import Icon from '../../lib/ui/Icon';

const TAX_DEADLINE_CATALOG = summarizeTaxDeadlineCatalog();

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
  const deadlineDates = [...deadlines.keys()].sort();
  const nearestDate = deadlineDates.find(date => date >= todayStr) ?? deadlineDates[0] ?? null;

  function showToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(todayStr);
  }

  return (
    <div className="bx-tax-calendar h-full">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Icon name="planner" className="h-5 w-5" /></span><div><p className="text-xs font-black text-violet-600 dark:text-violet-300">Бухгалтерский календарь</p><h2 className="mt-1 text-lg font-black text-bx-text">Сроки месяца</h2><p className="mt-1 text-xs text-bx-muted">Нажмите день, чтобы увидеть срок и добавить его в задачи.</p></div></div>
        <div className="flex items-center gap-1 rounded-xl border border-bx-border bg-bx-bg p-1">
          <button type="button" onClick={prev} aria-label="Предыдущий месяц" className="grid h-10 w-10 place-items-center rounded-lg text-bx-muted hover:bg-bx-surface hover:text-bx-text"><Icon name="arrowL" className="h-4 w-4" /></button>
          <span className="min-w-32 text-center text-sm font-black text-bx-text">{MONTHS[month]} {year}</span>
          <button type="button" onClick={next} aria-label="Следующий месяц" className="grid h-10 w-10 place-items-center rounded-lg text-bx-muted hover:bg-bx-surface hover:text-bx-text"><Icon name="arrowR" className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2"><button type="button" onClick={showToday} className="min-h-10 rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-black text-bx-text hover:border-violet-500/30">Сегодня</button>{nearestDate && <button type="button" onClick={() => setSelected(nearestDate)} className="min-h-10 rounded-xl border border-violet-500/20 bg-violet-500/[0.07] px-3 text-xs font-black text-violet-700 dark:text-violet-300">Ближайший срок · {new Date(`${nearestDate}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</button>}</div>

      {TAX_DEADLINE_CATALOG.ready === 0 && TAX_DEADLINE_CATALOG.needsReview > 0 && (
        <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-300">
          Сроки временно скрыты: {TAX_DEADLINE_CATALOG.needsReview} карточек ожидают проверки официальных источников. Созданные ранее задачи сохранены.
        </p>
      )}

      {/* Weekdays */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map(w => <div key={w} className="py-1 text-center text-xs font-bold text-bx-muted">{w}</div>)}
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
              aria-label={`${d} ${MONTHS[month]}${has ? ', есть бухгалтерский срок' : ''}`}
              className={`relative min-h-11 rounded-xl border text-sm font-bold transition-colors ${
                isSel ? 'border-violet-600 bg-violet-600 text-white'
                : isToday ? 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                : 'text-bx-muted hover:bg-bx-surface-2'
              }`}
            >
              {d}
              {has && <span className={`absolute bottom-1 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full ${isSel ? 'bg-white' : 'bg-amber-500'}`} />}
            </button>
          );
        })}
      </div>

      {/* Selected day deadlines */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-bx-border">
          {selectedDeadlines.length === 0 ? (
            <p className="text-sm text-bx-muted">На {new Date(`${selected}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} нет общих сроков. Персональную задачу можно создать в Планировщике.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedDeadlines.map(dl => (
                <div key={dl.id} className="flex flex-col gap-3 rounded-xl border border-bx-border bg-bx-bg p-3 text-sm sm:flex-row sm:items-center">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dl.kind === 'payment' ? 'bg-amber-500' : 'bg-violet-500'}`} />
                  <span className="flex-1 font-bold text-bx-text">{dl.title}</span>
                  <button
                    onClick={() => onPickDeadline(selected, dl)}
                    className="min-h-10 rounded-xl bg-violet-600 px-3 text-xs font-black text-white hover:bg-violet-700"
                  >
                    Добавить в задачи
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
