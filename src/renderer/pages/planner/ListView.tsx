import React, { useState, useMemo } from 'react';
import type { BxEvent, EventStatus, EventType, EventPriority } from './useEvents';
import type { AllCard } from './useCards';
import type { BxBoard } from './useBoards';

interface Props {
  events: BxEvent[];
  cards: AllCard[];
  boards: BxBoard[];
  onEdit: (e: BxEvent) => void;
  onCardClick: (id: string) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
  onCardStatusChange: (id: string, boardId: string, done: boolean) => void;
  onDelete: (ids: string[]) => void;
}

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'К выполнению', in_progress: 'В работе', review: 'На проверке', done: 'Готово',
};
const STATUS_COLORS: Record<EventStatus, string> = {
  todo: 'bg-slate-500/20 text-bx-muted',
  in_progress: 'bg-blue-500/20 text-blue-400',
  review: 'bg-amber-500/20 text-amber-400',
  done: 'bg-emerald-500/20 text-emerald-400',
};
const TYPE_ICON: Record<EventType, string> = {
  task: '✅', tax_deadline: '📋', reminder: '🔔', event: '📅',
};
const PRI_COLOR: Record<EventPriority, string> = {
  high: 'text-red-400', normal: 'text-yellow-500', low: 'text-green-500',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
}

type SortKey = 'date' | 'title' | 'status' | 'priority';

interface UnifiedRow {
  id: string;
  kind: 'event' | 'card';
  type: EventType | 'card';
  title: string;
  note: string | null;
  status: EventStatus;
  priority: EventPriority;
  date: string | null;
  tags: string[] | null;
  eventRef?: BxEvent;
  cardRef?: AllCard;
}

export default function ListView({ events, cards, boards, onEdit, onCardClick, onStatusChange, onCardStatusChange, onDelete }: Props) {
  const [search, setSearch]       = useState('');
  const [typeF, setTypeF]         = useState<EventType | 'card' | ''>('');
  const [statusF, setStatusF]     = useState<EventStatus | ''>('');
  const [priF, setPriF]           = useState<EventPriority | ''>('');
  const [sortKey, setSortKey]     = useState<SortKey>('date');
  const [sortAsc, setSortAsc]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const isCardDone = (c: AllCard) => {
    const board = boards.find(b => b.id === c.board_id);
    if (!board || !board.columns || board.columns.length === 0) return false;
    return c.column_id === board.columns[board.columns.length - 1].id;
  };

  const unifiedRows = useMemo(() => {
    const rows: UnifiedRow[] = [
      ...events.map<UnifiedRow>(e => ({
        id: e.id,
        kind: 'event',
        type: e.type,
        title: e.title,
        note: e.note,
        status: e.status,
        priority: e.priority,
        date: e.due_date || e.date,
        tags: e.tags,
        eventRef: e,
      })),
      ...cards.map<UnifiedRow>(c => ({
        id: c.id,
        kind: 'card',
        type: 'card',
        title: c.title,
        note: null,
        status: isCardDone(c) ? 'done' : 'todo',
        priority: (c.priority || 'normal') as EventPriority,
        date: c.due_date,
        tags: null,
        cardRef: c,
      })),
    ];
    return rows;
  }, [events, cards, boards]);

  const isOverdue = (row: UnifiedRow) => {
    if (!row.date || row.status === 'done') return false;
    return new Date(row.date) < new Date(new Date().setHours(0,0,0,0));
  };

  const filtered = useMemo(() => {
    let list = [...unifiedRows];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q));
    }
    if (typeF)   list = list.filter(r => r.type === typeF);
    if (statusF) list = list.filter(r => r.status === statusF);
    if (priF)    list = list.filter(r => r.priority === priF);

    list.sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === 'date')     { av = a.date || '9999-12-31'; bv = b.date || '9999-12-31'; }
      else if (sortKey === 'title')  { av = a.title; bv = b.title; }
      else if (sortKey === 'status') { av = a.status; bv = b.status; }
      else { const o = ['high','normal','low']; av = String(o.indexOf(a.priority)); bv = String(o.indexOf(b.priority)); }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [unifiedRows, search, typeF, statusF, priF, sortKey, sortAsc]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));
  }
  function deleteSelected() {
    onDelete([...selected]);
    setSelected(new Set());
  }

  function thClick(k: SortKey) {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(true); }
  }
  function arrow(k: SortKey) { return sortKey === k ? (sortAsc ? ' ↑' : ' ↓') : ''; }

  const NEXT_STATUS: Record<EventStatus, EventStatus> = {
    todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo',
  };

  const boardName = (id: string) => boards.find(b => b.id === id)?.name ?? 'Доска';
  const boardIcon = (id: string) => boards.find(b => b.id === id)?.icon ?? '🗂️';

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center flex-shrink-0">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
          className="bg-bx-bg text-bx-text px-3 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm w-48" />

        <select value={typeF} onChange={e => setTypeF(e.target.value as EventType | 'card' | '')}
          className="bg-bx-bg text-bx-muted px-2.5 py-1.5 rounded-lg border border-bx-border-2 text-xs focus:outline-none">
          <option value="">Все типы</option>
          <option value="task">Задача</option>
          <option value="tax_deadline">Дедлайн</option>
          <option value="reminder">Напоминание</option>
          <option value="event">Событие</option>
          <option value="card">Карточка доски</option>
        </select>

        <select value={statusF} onChange={e => setStatusF(e.target.value as EventStatus | '')}
          className="bg-bx-bg text-bx-muted px-2.5 py-1.5 rounded-lg border border-bx-border-2 text-xs focus:outline-none">
          <option value="">Все статусы</option>
          {(Object.keys(STATUS_LABELS) as EventStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select value={priF} onChange={e => setPriF(e.target.value as EventPriority | '')}
          className="bg-bx-bg text-bx-muted px-2.5 py-1.5 rounded-lg border border-bx-border-2 text-xs focus:outline-none">
          <option value="">Все приоритеты</option>
          <option value="high">Высокий</option>
          <option value="normal">Средний</option>
          <option value="low">Низкий</option>
        </select>

        {selected.size > 0 && (
          <button onClick={deleteSelected}
            className="ml-auto text-xs px-3 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg transition-colors">
            Удалить выбранные ({selected.size})
          </button>
        )}
        <span className="text-xs text-bx-muted ml-auto">{filtered.length} записей</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bx-border">
              <th className="w-8 py-2 px-2">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="accent-blue-500" />
              </th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium w-8">Тип</th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium cursor-pointer hover:text-bx-text select-none" onClick={() => thClick('title')}>Название{arrow('title')}</th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium cursor-pointer hover:text-bx-text select-none" onClick={() => thClick('status')}>Статус{arrow('status')}</th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium cursor-pointer hover:text-bx-text select-none" onClick={() => thClick('priority')}>Приор.{arrow('priority')}</th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium cursor-pointer hover:text-bx-text select-none" onClick={() => thClick('date')}>Дата{arrow('date')}</th>
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium">Контекст / Теги</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id}
                className={`border-b border-bx-border/50 hover:bg-bx-surface-2/40 transition-colors cursor-pointer ${isOverdue(row) ? 'bg-red-900/5' : ''}`}>
                <td className="py-2 px-2" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="accent-blue-500" />
                </td>
                <td className="py-2 px-2 text-base">
                  {row.kind === 'event' ? TYPE_ICON[row.type as EventType] : boardIcon(row.cardRef!.board_id)}
                </td>
                <td className="py-2 px-2 max-w-xs" onClick={() => {
                  if (row.kind === 'event') onEdit(row.eventRef!);
                  else onCardClick(row.id);
                }}>
                  <p className={`text-bx-text truncate ${isOverdue(row) ? 'text-red-300' : ''} ${row.status === 'done' ? 'line-through text-bx-muted' : ''}`}>{row.title}</p>
                  {row.note && <p className="text-[10px] text-bx-muted truncate">{row.note}</p>}
                </td>
                <td className="py-2 px-2" onClick={e => {
                  e.stopPropagation();
                  if (row.kind === 'event') {
                    onStatusChange(row.id, NEXT_STATUS[row.status]);
                  } else {
                    onCardStatusChange(row.id, row.cardRef!.board_id, row.status !== 'done');
                  }
                }}>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 ${STATUS_COLORS[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className={`text-[11px] font-medium ${PRI_COLOR[row.priority]}`}>
                    {row.priority === 'high' ? '▲' : row.priority === 'low' ? '▼' : '—'}
                  </span>
                </td>
                <td className="py-2 px-2 text-[11px] text-bx-muted whitespace-nowrap">
                  {isOverdue(row) ? <span className="text-red-400">⚠ {fmtDate(row.date)}</span> : fmtDate(row.date)}
                </td>
                <td className="py-2 px-2">
                  {row.kind === 'event' ? (
                    <div className="flex gap-1 flex-wrap">
                      {(row.tags ?? []).slice(0,2).map(t => (
                        <span key={t} className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">
                      🗂️ {boardName(row.cardRef!.board_id)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-bx-muted">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm">Нет дел</p>
          </div>
        )}
      </div>
    </div>
  );
}
