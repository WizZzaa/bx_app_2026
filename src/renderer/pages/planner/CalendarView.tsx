import React, { useState } from 'react';
import type { BxEvent } from './useEvents';
import { toLocalISO } from '../../lib/dates';
import { holidayName } from '../../data/uzHolidays';

export interface CalCard { id: string; title: string; due_date: string }

interface Props {
  events: BxEvent[];
  cards?: CalCard[];
  onDayClick: (date: string) => void;
  onEventClick: (e: BxEvent) => void;
  onCardClick?: (id: string) => void;
  onEventDrop?: (id: string, date: string) => void;
  onCardDrop?: (id: string, date: string) => void;
}

const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

const TYPE_COLOR: Record<string, string> = {
  task:         'bg-emerald-500',
  tax_deadline: 'bg-blue-500',
  reminder:     'bg-amber-500',
  event:        'bg-purple-500',
};

const toISO = toLocalISO;

/** Понедельник недели, в которую входит дата. */
function mondayOf(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

export default function CalendarView({ events, cards = [], onDayClick, onEventClick, onCardClick, onEventDrop, onCardDrop }: Props) {
  const now = new Date();
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [weekStart, setWeekStart] = useState(() => mondayOf(now));
  const todayStr = toISO(now);

  function prev() {
    if (mode === 'week') { setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; }); return; }
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (mode === 'week') { setWeekStart(w => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; }); return; }
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() {
    setYear(now.getFullYear()); setMonth(now.getMonth()); setWeekStart(mondayOf(now));
  }

  // Index events by date
  const byDate: Record<string, BxEvent[]> = {};
  for (const ev of events) {
    const k = ev.due_date || ev.date;
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(ev);
  }

  // Карточки с доски по дате
  const cardsByDate: Record<string, CalCard[]> = {};
  for (const cd of cards) {
    if (!cd.due_date) continue;
    if (!cardsByDate[cd.due_date]) cardsByDate[cd.due_date] = [];
    cardsByDate[cd.due_date].push(cd);
  }

  // ── Drag & drop ──
  function handleDrop(e: React.DragEvent, date: string) {
    e.preventDefault();
    const evId = e.dataTransfer.getData('bx/event');
    const cardId = e.dataTransfer.getData('bx/card');
    if (evId && onEventDrop) onEventDrop(evId, date);
    else if (cardId && onCardDrop) onCardDrop(cardId, date);
  }

  function EventChip({ ev }: { ev: BxEvent }) {
    return (
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('bx/event', ev.id); e.dataTransfer.effectAllowed = 'move'; }}
        onClick={e => { e.stopPropagation(); onEventClick(ev); }}
        title={`${ev.title} (перетащите, чтобы перенести срок)`}
        className={`text-[9px] leading-tight px-1 py-0.5 rounded text-bx-text truncate cursor-grab active:cursor-grabbing hover:opacity-80 ${TYPE_COLOR[ev.type]} ${ev.status === 'done' ? 'opacity-40 line-through' : ''}`}>
        {ev.recurrence ? '🔁 ' : ''}{ev.title}
      </div>
    );
  }

  function CardChip({ cd }: { cd: CalCard }) {
    return (
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('bx/card', cd.id); e.dataTransfer.effectAllowed = 'move'; }}
        onClick={e => { e.stopPropagation(); onCardClick?.(cd.id); }}
        title={`${cd.title} (перетащите, чтобы перенести срок)`}
        className="text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-grab active:cursor-grabbing hover:opacity-80 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
        📋 {cd.title}
      </div>
    );
  }

  // ── Заголовок периода ──
  const weekDays: Date[] = mode === 'week'
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; })
    : [];
  const periodTitle = mode === 'month'
    ? `${MONTHS[month]} ${year}`
    : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0,3).toLowerCase()} — ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0,3).toLowerCase()} ${weekDays[6].getFullYear()}`;

  // ── Сетка месяца ──
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > daysInMonth) { cells.push(null); continue; }
    cells.push(new Date(year, month, dayNum));
  }
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg bg-bx-surface-2 text-bx-muted hover:text-bx-text transition-colors">‹</button>
        <h2 className="text-base font-semibold text-bx-text min-w-[190px] text-center">{periodTitle}</h2>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg bg-bx-surface-2 text-bx-muted hover:text-bx-text transition-colors">›</button>
        <button onClick={goToday} className="ml-2 text-xs px-2.5 py-1 bg-bx-surface-2 text-bx-muted hover:text-bx-text rounded-lg transition-colors">Сегодня</button>

        {/* Месяц / Неделя */}
        <div className="flex bg-bx-bg border border-bx-border rounded-lg p-0.5">
          {([['month','Месяц'],['week','Неделя']] as const).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-0.5 text-[11px] rounded-md transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'text-bx-muted hover:text-bx-text'}`}>{l}</button>
          ))}
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3">
          {[['tax_deadline','Дедлайн'],['task','Задача'],['reminder','Напомин.'],['event','Событие']].map(([type,label]) => (
            <span key={type} className="flex items-center gap-1 text-[10px] text-bx-muted">
              <span className={`w-2 h-2 rounded-full ${TYPE_COLOR[type]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-bx-muted">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Карточка
          </span>
        </div>
      </div>

      {/* ── Неделя ── */}
      {mode === 'week' && (
        <div className="flex-1 grid grid-cols-7 gap-1.5 overflow-hidden">
          {weekDays.map((day, ci) => {
            const ds = toISO(day);
            const dayEvents = byDate[ds] ?? [];
            const dayCards = cardsByDate[ds] ?? [];
            const isToday = ds === todayStr;
            const isWeekend = ci >= 5;
            const holiday = holidayName(day);
            return (
              <div key={ds}
                onClick={() => onDayClick(ds)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, ds)}
                title={holiday ?? undefined}
                className={`flex flex-col rounded-lg border p-2 cursor-pointer transition-all overflow-hidden
                  ${isToday ? 'border-blue-500/60 bg-blue-500/5' : holiday ? 'border-red-500/25' : 'border-bx-border hover:border-bx-border-2'}
                  ${holiday ? 'bg-red-500/[0.04]' : isWeekend ? 'bg-bx-bg' : 'bg-bx-bg'}
                `}
              >
                <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
                  <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white' : holiday ? 'text-red-400' : isWeekend ? 'text-bx-muted' : 'text-bx-text'}`}>
                    {day.getDate()}
                  </span>
                  <span className={`text-[10px] uppercase ${isWeekend ? 'text-red-400/50' : 'text-bx-muted'}`}>{WEEKDAYS[ci]}</span>
                </div>
                {holiday && <span className="text-[9px] text-red-400/70 mb-1 truncate flex-shrink-0">🎉 {holiday}</span>}
                <div className="space-y-1 overflow-y-auto">
                  {dayEvents.map(ev => <EventChip key={ev.id} ev={ev} />)}
                  {dayCards.map(cd => <CardChip key={cd.id} cd={cd} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Месяц ── */}
      {mode === 'month' && (
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d,i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1 ${i >= 5 ? 'text-bx-muted' : 'text-bx-muted'}`}>{d}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} className="h-20 rounded-lg bg-bx-bg" />;
                const ds = toISO(day);
                const dayEvents = byDate[ds] ?? [];
                const dayCards = cardsByDate[ds] ?? [];
                const isToday = ds === todayStr;
                const isWeekend = ci >= 5;
                const isPast = ds < todayStr;
                const holiday = holidayName(day);
                return (
                  <div key={ci}
                    onClick={() => onDayClick(ds)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, ds)}
                    title={holiday ?? undefined}
                    className={`h-20 rounded-lg border p-1.5 cursor-pointer transition-all overflow-hidden
                      ${isToday ? 'border-blue-500/60 bg-blue-500/5' : holiday ? 'border-red-500/25 hover:border-red-500/40' : 'border-bx-border hover:border-bx-border-2'}
                      ${isPast && !isToday ? 'opacity-60' : ''}
                      ${holiday ? 'bg-red-500/[0.04]' : isWeekend ? 'bg-bx-bg' : 'bg-bx-bg'}
                    `}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0
                        ${isToday ? 'bg-blue-600 text-white' : holiday ? 'text-red-400 font-semibold' : isWeekend ? 'text-bx-muted' : 'text-bx-muted'}`}>
                        {day.getDate()}
                      </div>
                      {holiday && <span className="text-[8px] text-red-400/70 truncate leading-tight">{holiday}</span>}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0,3).map(ev => <EventChip key={ev.id} ev={ev} />)}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-bx-muted">+{dayEvents.length - 3}</div>
                      )}
                      {dayCards.slice(0, Math.max(0, 3 - dayEvents.length) + 1).map(cd => <CardChip key={cd.id} cd={cd} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
