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

export default function CalendarView({ events, cards = [], onDayClick, onEventClick, onCardClick }: Props) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const todayStr = toISO(now);

  // Grid: month starts on Mon(0-indexed)
  const firstDay = new Date(year, month, 1);
  // JS getDay: 0=Sun, 1=Mon ... we want Mon=0
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }
  function goToday() { setYear(now.getFullYear()); setMonth(now.getMonth()); }

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
        <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e2535] text-slate-400 hover:text-slate-200 transition-colors">‹</button>
        <h2 className="text-base font-semibold text-white min-w-[160px] text-center">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e2535] text-slate-400 hover:text-slate-200 transition-colors">›</button>
        <button onClick={goToday} className="ml-2 text-xs px-2.5 py-1 bg-[#1e2535] text-slate-400 hover:text-slate-200 rounded-lg transition-colors">Сегодня</button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3">
          {[['tax_deadline','Дедлайн'],['task','Задача'],['reminder','Напомин.'],['event','Событие']].map(([type,label]) => (
            <span key={type} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${TYPE_COLOR[type]}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Карточка
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d,i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1 ${i >= 5 ? 'text-slate-600' : 'text-slate-500'}`}>{d}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 gap-1">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} className="h-20 rounded-lg bg-[#0a0d13]" />;
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
                    title={holiday ?? undefined}
                    className={`h-20 rounded-lg border p-1.5 cursor-pointer transition-all overflow-hidden
                      ${isToday ? 'border-blue-500/60 bg-blue-500/5' : holiday ? 'border-red-500/25 hover:border-red-500/40' : 'border-[#1e2535] hover:border-[#2a3447]'}
                      ${isPast && !isToday ? 'opacity-60' : ''}
                      ${holiday ? 'bg-red-500/[0.04]' : isWeekend ? 'bg-[#0a0d14]' : 'bg-[#0f1117]'}
                    `}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0
                        ${isToday ? 'bg-blue-600 text-white' : holiday ? 'text-red-400 font-semibold' : isWeekend ? 'text-slate-600' : 'text-slate-400'}`}>
                        {day.getDate()}
                      </div>
                      {holiday && <span className="text-[8px] text-red-400/70 truncate leading-tight">{holiday}</span>}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0,3).map(ev => (
                        <div key={ev.id}
                          onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                          className={`text-[9px] leading-tight px-1 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 ${TYPE_COLOR[ev.type]}`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-slate-600">+{dayEvents.length - 3}</div>
                      )}
                      {dayCards.slice(0, Math.max(0, 3 - dayEvents.length) + 1).map(cd => (
                        <div key={cd.id}
                          onClick={e => { e.stopPropagation(); onCardClick?.(cd.id); }}
                          className="text-[9px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          📋 {cd.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
