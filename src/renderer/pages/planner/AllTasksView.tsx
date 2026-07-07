import React, { useMemo, useState } from 'react';
import type { BxEvent, EventStatus } from './useEvents';
import type { AllCard } from './useCards';
import type { BxBoard } from './useBoards';
import { todayISO, daysFromNowISO } from '../../lib/dates';

// «Все задачи» — единый список: события планировщика (задачи, дедлайны,
// напоминания) + карточки со всех канбан-досок, сгруппированные по срокам.

interface Props {
  events: BxEvent[];
  cards: AllCard[];
  boards: BxBoard[];
  onEventClick: (e: BxEvent) => void;
  onCardClick: (id: string) => void;
  onEventStatusChange: (id: string, status: EventStatus) => void;
}

type Item =
  | { kind: 'event'; date: string | null; ev: BxEvent }
  | { kind: 'card'; date: string | null; card: AllCard };

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  task:         { label: 'Задача',    cls: 'bg-emerald-500/10 text-emerald-400' },
  tax_deadline: { label: 'Дедлайн',   cls: 'bg-blue-500/10 text-blue-400' },
  reminder:     { label: 'Напомин.',  cls: 'bg-amber-500/10 text-amber-400' },
  event:        { label: 'Событие',   cls: 'bg-purple-500/10 text-purple-400' },
};

function fmtDue(d: string, today: string): { text: string; cls: string } {
  const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0)  return { text: `просрочено ${Math.abs(diff)} дн.`, cls: 'text-red-400' };
  if (diff === 0) return { text: 'сегодня', cls: 'text-amber-400' };
  if (diff === 1) return { text: 'завтра', cls: 'text-amber-400/80' };
  return {
    text: new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    cls: 'text-bx-muted',
  };
}

export default function AllTasksView({ events, cards, boards, onEventClick, onCardClick, onEventStatusChange }: Props) {
  const [hideDone, setHideDone] = useState(true);
  const [search, setSearch] = useState('');
  const today = todayISO();
  const weekEnd = daysFromNowISO(7);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items: Item[] = [
      ...events
        .filter(e => !hideDone || e.status !== 'done')
        .filter(e => !q || e.title.toLowerCase().includes(q))
        .map<Item>(e => ({ kind: 'event', date: e.due_date || e.date, ev: e })),
      ...cards
        .filter(c => !q || c.title.toLowerCase().includes(q))
        .map<Item>(c => ({ kind: 'card', date: c.due_date, card: c })),
    ];

    const bucket = (it: Item): string => {
      if (!it.date) return 'Без срока';
      if (it.kind === 'event' && it.ev.status === 'done') return 'Выполнено';
      if (it.date < today) return 'Просрочено';
      if (it.date === today) return 'Сегодня';
      if (it.date <= weekEnd) return 'Эта неделя';
      return 'Позже';
    };

    const order = ['Просрочено', 'Сегодня', 'Эта неделя', 'Позже', 'Без срока', 'Выполнено'];
    const map = new Map<string, Item[]>();
    for (const it of items) {
      const b = bucket(it);
      if (!map.has(b)) map.set(b, []);
      map.get(b)!.push(it);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
    }
    return order.filter(g => map.has(g)).map(g => ({ name: g, items: map.get(g)! }));
  }, [events, cards, hideDone, search, today, weekEnd]);

  const boardName = (id: string) => boards.find(b => b.id === id)?.name ?? 'Доска';
  const boardIcon = (id: string) => boards.find(b => b.id === id)?.icon ?? '📋';
  const total = groups.reduce((s, g) => s + (g.name === 'Выполнено' ? 0 : g.items.length), 0);

  const GROUP_CLS: Record<string, string> = {
    'Просрочено': 'text-red-400',
    'Сегодня': 'text-amber-400',
    'Эта неделя': 'text-blue-400',
    'Позже': 'text-bx-muted',
    'Без срока': 'text-bx-muted',
    'Выполнено': 'text-bx-muted',
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-6">
        {/* Панель */}
        <div className="flex items-center gap-3 mb-4 sticky top-0 bg-bx-bg py-2 z-10">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по всем задачам и карточкам..."
            className="flex-1 bg-bx-surface text-bx-text placeholder-slate-600 text-sm px-3.5 py-2 rounded-lg border border-bx-border focus:outline-none focus:border-blue-500/50"
          />
          <label className="flex items-center gap-1.5 text-xs text-bx-muted cursor-pointer flex-shrink-0">
            <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} className="accent-blue-500" />
            скрыть выполненные
          </label>
          <span className="text-xs text-bx-muted flex-shrink-0">всего: {total}</span>
        </div>

        {groups.length === 0 && (
          <p className="text-sm text-bx-muted text-center py-12">Задач нет — отличный день ✓</p>
        )}

        {groups.map(g => (
          <div key={g.name} className="mb-5">
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2 ${GROUP_CLS[g.name] ?? 'text-bx-muted'}`}>
              {g.name} <span className="opacity-60">· {g.items.length}</span>
            </p>
            <div className="space-y-1">
              {g.items.map(it => it.kind === 'event' ? (
                <div key={`e${it.ev.id}`}
                  className="flex items-center gap-3 px-3.5 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-blue-500/30 rounded-lg transition-colors group">
                  <input
                    type="checkbox"
                    checked={it.ev.status === 'done'}
                    onChange={() => onEventStatusChange(it.ev.id, it.ev.status === 'done' ? 'todo' : 'done')}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
                    title={it.ev.status === 'done' ? 'Вернуть в работу' : 'Отметить выполненной'}
                  />
                  <button onClick={() => onEventClick(it.ev)} className="flex-1 min-w-0 text-left">
                    <span className={`text-sm truncate block ${it.ev.status === 'done' ? 'text-bx-muted line-through' : 'text-bx-text group-hover:text-white'}`}>
                      {it.ev.recurrence ? '🔁 ' : ''}{it.ev.title}
                    </span>
                  </button>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_BADGE[it.ev.type]?.cls ?? ''}`}>
                    {TYPE_BADGE[it.ev.type]?.label ?? it.ev.type}
                  </span>
                  {it.ev.priority === 'high' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex-shrink-0">важно</span>}
                  {it.date && <span className={`text-[11px] w-24 text-right flex-shrink-0 ${fmtDue(it.date, today).cls}`}>{fmtDue(it.date, today).text}</span>}
                </div>
              ) : (
                <button key={`c${it.card.id}`} onClick={() => onCardClick(it.card.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-2 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-cyan-500/30 rounded-lg transition-colors group text-left">
                  <span className="w-4 text-center flex-shrink-0 text-xs">{boardIcon(it.card.board_id)}</span>
                  <span className="flex-1 min-w-0 text-sm text-bx-text group-hover:text-white truncate">{it.card.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 flex-shrink-0 max-w-[120px] truncate">
                    {boardName(it.card.board_id)}
                  </span>
                  {it.card.priority === 'high' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex-shrink-0">важно</span>}
                  {it.date && <span className={`text-[11px] w-24 text-right flex-shrink-0 ${fmtDue(it.date, today).cls}`}>{fmtDue(it.date, today).text}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
