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
  onCardStatusChange: (id: string, boardId: string, done: boolean) => void;
}

type Item =
  | { kind: 'event'; date: string | null; ev: BxEvent }
  | { kind: 'card'; date: string | null; card: AllCard };

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  task:         { label: 'Задача',    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  tax_deadline: { label: 'Дедлайн',   cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  reminder:     { label: 'Напомин.',  cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  event:        { label: 'Событие',   cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
};

function fmtDue(d: string, today: string): { text: string; cls: string } {
  const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0)  return { text: `просрочено ${Math.abs(diff)} дн.`, cls: 'text-red-500 font-bold' };
  if (diff === 0) return { text: 'сегодня', cls: 'text-amber-600 dark:text-amber-400 font-bold' };
  if (diff === 1) return { text: 'завтра', cls: 'text-amber-600/80 dark:text-amber-400/80 font-bold' };
  return {
    text: new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    cls: 'text-bx-muted',
  };
}

export default function AllTasksView({ events, cards, boards, onEventClick, onCardClick, onEventStatusChange, onCardStatusChange }: Props) {
  const [hideDone, setHideDone] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'all' | 'month' | 'week' | 'day'>('all');
  
  const today = todayISO();
  const weekEnd = daysFromNowISO(7);

  const isCardDone = (c: AllCard) => {
    const board = boards.find(b => b.id === c.board_id);
    if (!board || !board.columns || board.columns.length === 0) return false;
    return c.column_id === board.columns[board.columns.length - 1].id;
  };

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`; // e.g. '2026-07'

    const items: Item[] = [
      ...events
        .filter(e => !hideDone || e.status !== 'done')
        .filter(e => !q || e.title.toLowerCase().includes(q))
        .filter(e => {
          const d = e.due_date || e.date;
          if (period === 'all') return true;
          if (!d) return false; // Задачи без срока скрываем при фильтрации по датам
          if (period === 'day') return d === today;
          if (period === 'week') return d >= today && d <= weekEnd;
          if (period === 'month') return d.startsWith(monthPrefix);
          return true;
        })
        .map<Item>(e => ({ kind: 'event', date: e.due_date || e.date, ev: e })),
      ...cards
        .filter(c => !hideDone || !isCardDone(c))
        .filter(c => !q || c.title.toLowerCase().includes(q))
        .filter(c => {
          const d = c.due_date;
          if (period === 'all') return true;
          if (!d) return false;
          if (period === 'day') return d === today;
          if (period === 'week') return d >= today && d <= weekEnd;
          if (period === 'month') return d.startsWith(monthPrefix);
          return true;
        })
        .map<Item>(c => ({ kind: 'card', date: c.due_date, card: c })),
    ];

    const bucket = (it: Item): string => {
      if (it.kind === 'event' && it.ev.status === 'done') return 'Выполнено';
      if (it.kind === 'card' && isCardDone(it.card)) return 'Выполнено';
      if (!it.date) return 'Без срока';
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
  }, [events, cards, boards, hideDone, search, today, weekEnd, period]);

  const boardName = (id: string) => boards.find(b => b.id === id)?.name ?? 'Доска';
  const boardIcon = (id: string) => boards.find(b => b.id === id)?.icon ?? '📋';
  const total = groups.reduce((s, g) => s + (g.name === 'Выполнено' ? 0 : g.items.length), 0);

  const GROUP_CLS: Record<string, string> = {
    'Просрочено': 'text-red-500 font-extrabold',
    'Сегодня': 'text-amber-500 dark:text-amber-400 font-extrabold',
    'Эта неделя': 'text-blue-500 dark:text-blue-400 font-extrabold',
    'Позже': 'text-bx-muted font-extrabold',
    'Без срока': 'text-bx-muted font-extrabold',
    'Выполнено': 'text-bx-muted font-extrabold',
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-6">
        
        {/* Фильтры и поиск */}
        <div className="bg-bx-surface border border-bx-border rounded-2xl p-5 shadow-sm mb-4 space-y-3.5 sticky top-0 z-10">
          
          {/* Поисковая строка */}
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по всем задачам и карточкам..."
              className="flex-1 bg-bx-surface-2 text-bx-text placeholder-bx-muted text-xs px-3.5 py-2.5 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500/50 shadow-inner"
            />
            <label className="flex items-center gap-1.5 text-xs text-bx-muted cursor-pointer flex-shrink-0 font-semibold select-none">
              <input 
                type="checkbox" 
                checked={hideDone} 
                onChange={e => setHideDone(e.target.checked)} 
                className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer" 
              />
              скрыть выполненные
            </label>
            <span className="text-xs text-bx-muted flex-shrink-0 font-bold bg-bx-bg/50 px-2 py-0.5 rounded-full">
              Задач: {total}
            </span>
          </div>

          {/* Переключатель периодов */}
          <div className="flex items-center justify-between border-t border-bx-border/40 pt-2.5 flex-wrap gap-2 text-xs">
            <span className="text-[10px] font-bold text-bx-muted uppercase tracking-wider">Фильтр по дате:</span>
            <div className="flex gap-1.5">
              {(['all', 'month', 'week', 'day'] as const).map(p => {
                const labels = { all: 'Все время', month: 'Этот месяц', week: 'Эта неделя', day: 'Сегодня' };
                const isSel = period === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border cursor-pointer ${
                      isSel 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-bx-surface-2 border-bx-border text-bx-muted hover:text-bx-text hover:bg-bx-border-2'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {groups.length === 0 && (
          <div className="text-center py-20 bg-bx-surface border border-bx-border border-dashed rounded-2xl">
            <span className="text-3xl block mb-2">✓</span>
            <p className="text-xs font-bold">Задач нет</p>
            <p className="text-[10px] text-bx-muted mt-1">На этот период все дела выполнены или не запланированы</p>
          </div>
        )}

        {groups.map(g => (
          <div key={g.name} className="mb-5">
            <p className={`text-[11px] uppercase tracking-widest font-semibold mb-2 ${GROUP_CLS[g.name] ?? 'text-bx-muted'}`}>
              {g.name} <span className="opacity-60 font-mono">· {g.items.length}</span>
            </p>
            <div className="space-y-1.5">
              {g.items.map(it => it.kind === 'event' ? (
                <div key={`e${it.ev.id}`}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-blue-500/30 rounded-xl transition-colors group">
                  <input
                    type="checkbox"
                    checked={it.ev.status === 'done'}
                    onChange={() => onEventStatusChange(it.ev.id, it.ev.status === 'done' ? 'todo' : 'done')}
                    className="w-4.5 h-4.5 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
                    title={it.ev.status === 'done' ? 'Вернуть в работу' : 'Отметить выполненной'}
                  />
                  <button onClick={() => onEventClick(it.ev)} className="flex-1 min-w-0 text-left">
                    <span className={`text-xs truncate block font-semibold ${it.ev.status === 'done' ? 'text-bx-muted line-through' : 'text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}`}>
                      {it.ev.recurrence ? '🔁 ' : ''}{it.ev.title}
                    </span>
                  </button>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_BADGE[it.ev.type]?.cls ?? ''}`}>
                    {TYPE_BADGE[it.ev.type]?.label ?? it.ev.type}
                  </span>
                  {it.ev.priority === 'high' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 flex-shrink-0">важно</span>}
                  {it.date && <span className={`text-[11px] w-24 text-right flex-shrink-0 font-mono ${fmtDue(it.date, today).cls}`}>{fmtDue(it.date, today).text}</span>}
                </div>
              ) : (
                <div key={`c${it.card.id}`}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border hover:border-cyan-500/30 rounded-xl transition-colors group">
                  <input
                    type="checkbox"
                    checked={isCardDone(it.card)}
                    onChange={() => onCardStatusChange(it.card.id, it.card.board_id, !isCardDone(it.card))}
                    className="w-4.5 h-4.5 rounded accent-cyan-500 cursor-pointer flex-shrink-0"
                    title={isCardDone(it.card) ? 'Вернуть в работу' : 'Отметить выполненной'}
                  />
                  <span className="w-4 text-center flex-shrink-0 text-xs">{boardIcon(it.card.board_id)}</span>
                  <button onClick={() => onCardClick(it.card.id)} className="flex-1 min-w-0 text-left">
                    <span className={`text-xs truncate block font-semibold ${isCardDone(it.card) ? 'text-bx-muted line-through' : 'text-bx-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'}`}>
                      {it.card.title}
                    </span>
                  </button>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex-shrink-0 max-w-[120px] truncate">
                    {boardName(it.card.board_id)}
                  </span>
                  {it.card.priority === 'high' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 flex-shrink-0">важно</span>}
                  {it.date && <span className={`text-[11px] w-24 text-right flex-shrink-0 font-mono ${fmtDue(it.date, today).cls}`}>{fmtDue(it.date, today).text}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
