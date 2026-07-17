import React, { useMemo, useState } from 'react';
import Icon from '../../lib/ui/Icon';
import { todayISO } from '../../lib/dates';
import type { BxEvent, EventStatus, EventType } from './useEvents';
import type { CompanyMember } from './useCompanyMembers';
import PlannerEventSummary, { EVENT_TYPE_LABELS } from './PlannerEventSummary';

interface Props {
  events: BxEvent[];
  loading?: boolean;
  members?: CompanyMember[];
  onEventClick: (event: BxEvent) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
  onAdd: (status: EventStatus) => void;
}

const COLUMNS: Array<{ status: EventStatus; title: string; hint: string; dot: string; accent: string }> = [
  { status: 'todo', title: 'К выполнению', hint: 'Очередь', dot: 'bg-slate-500', accent: 'bg-slate-500' },
  { status: 'in_progress', title: 'В работе', hint: 'Сейчас', dot: 'bg-blue-500', accent: 'bg-blue-500' },
  { status: 'review', title: 'На проверке', hint: 'Ждёт решения', dot: 'bg-amber-500', accent: 'bg-amber-500' },
  { status: 'done', title: 'Готово', hint: 'Завершено', dot: 'bg-emerald-500', accent: 'bg-emerald-500' },
];

const PRIORITY_BORDER = {
  high: 'border-l-red-500',
  normal: 'border-l-amber-500',
  low: 'border-l-emerald-500',
} as const;

export function groupEventsByStatus(events: BxEvent[]): Record<EventStatus, BxEvent[]> {
  const groups: Record<EventStatus, BxEvent[]> = { todo: [], in_progress: [], review: [], done: [] };
  for (const event of events) groups[event.status].push(event);
  for (const items of Object.values(groups)) {
    items.sort((left, right) => {
      const leftDate = left.due_date || left.date;
      const rightDate = right.due_date || right.date;
      return leftDate.localeCompare(rightDate) || left.title.localeCompare(right.title, 'ru');
    });
  }
  return groups;
}

export default function SystemTaskBoard({ events, members = [], loading, onEventClick, onStatusChange, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<EventType | ''>('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<EventStatus | null>(null);
  const memberByUserId = useMemo(() => new Map(members.map(member => [member.user_id, member])), [members]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return events.filter(event => {
      if (type && event.type !== type) return false;
      if (query && !event.title.toLocaleLowerCase('ru').includes(query)) return false;
      return true;
    });
  }, [events, search, type]);

  const groups = useMemo(() => groupEventsByStatus(visibleEvents), [visibleEvents]);
  const activeCount = visibleEvents.filter(event => event.status !== 'done').length;
  const overdueCount = visibleEvents.filter(event => event.status !== 'done' && (event.due_date || event.date) < todayISO()).length;

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
      <header className="flex flex-shrink-0 flex-col gap-4 rounded-3xl border border-bx-border bg-bx-surface px-4 py-4 shadow-sm lg:flex-row lg:items-center">
        <div className="min-w-0 lg:mr-auto">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icon name="planner" className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-bx-text">Рабочая доска</h2>
              <p className="text-[10px] font-medium text-bx-muted">{activeCount} активно{overdueCount > 0 ? ` · ${overdueCount} просрочено` : ' · без просрочки'}</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Поиск задач и событий</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bx-muted" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Найти задачу или событие…"
              className="h-11 w-full rounded-xl border border-bx-border bg-bx-bg pl-9 pr-3 text-xs text-bx-text outline-none transition-colors placeholder:text-bx-muted focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>
          <label>
            <span className="sr-only">Тип записи</span>
            <select
              value={type}
              onChange={event => setType(event.target.value as EventType | '')}
              className="h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-[11px] font-semibold text-bx-text outline-none transition-colors focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 sm:w-44"
            >
              <option value="">Все типы</option>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(key => <option key={key} value={key}>{EVENT_TYPE_LABELS[key]}</option>)}
            </select>
          </label>
        </div>
        {loading && <span className="text-[10px] font-semibold text-bx-muted animate-pulse">Обновляем…</span>}
      </header>

      <p className="sr-only">Одна запись отображается во Фокусе, Календаре и на Доске.</p>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto pb-2 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map(column => (
          <section
            key={column.status}
            onDragOver={event => {
              event.preventDefault();
              setDragOverStatus(column.status);
            }}
            onDragLeave={event => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverStatus(null);
            }}
            onDrop={event => {
              event.preventDefault();
              if (dragId) onStatusChange(dragId, column.status);
              setDragId(null);
              setDragOverStatus(null);
            }}
            className={`relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl border bg-bx-surface shadow-sm transition-all ${dragOverStatus === column.status ? 'border-blue-500/60 bg-blue-500/[0.04] ring-2 ring-blue-500/15' : 'border-bx-border'}`}
          >
            <div className={`absolute inset-x-0 top-0 h-1 ${column.accent}`} />
            <header className="flex items-center gap-2 border-b border-bx-border px-3.5 py-3.5">
              <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
              <div>
                <h3 className="text-xs font-extrabold text-bx-text">{column.title}</h3>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-bx-muted">{column.hint}</p>
              </div>
              <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full border border-bx-border bg-bx-bg px-1.5 text-[10px] font-black tabular-nums text-bx-muted">{groups[column.status].length}</span>
            </header>

            <div className="min-h-28 flex-1 space-y-2 overflow-y-auto p-2.5">
              {groups[column.status].map(event => (
                <button
                  key={event.id}
                  draggable
                  onDragStart={() => setDragId(event.id)}
                  onDragEnd={() => { setDragId(null); setDragOverStatus(null); }}
                  onClick={() => onEventClick(event)}
                  aria-label={`Открыть: ${event.title}`}
                  className={`w-full cursor-grab rounded-xl border border-bx-border border-l-[3px] ${PRIORITY_BORDER[event.priority]} bg-bx-bg px-3 py-3 text-left shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-blue-500/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500/50 active:cursor-grabbing ${dragId === event.id ? 'scale-[0.98] opacity-45' : ''}`}
                >
                  <PlannerEventSummary
                    event={event}
                    showDate
                    assigneeLabel={event.assignee_id ? memberByUserId.get(event.assignee_id)?.invited_email : null}
                  />
                </button>
              ))}
              {groups[column.status].length === 0 && (
                <div className={`flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-[10px] font-semibold transition-colors ${dragOverStatus === column.status ? 'border-blue-500/50 text-blue-500' : 'border-bx-border text-bx-muted'}`}>
                  <Icon name={column.status === 'done' ? 'check' : 'note'} className="h-5 w-5" />
                  {dragOverStatus === column.status ? 'Переместить сюда' : 'Здесь пока пусто'}
                </div>
              )}
            </div>

            <button
              onClick={() => onAdd(column.status)}
              className="m-2.5 mt-0 flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-bx-border text-[11px] font-bold text-bx-muted outline-none transition-colors hover:border-blue-500/35 hover:bg-blue-500/5 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:hover:text-blue-400"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              Добавить
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
