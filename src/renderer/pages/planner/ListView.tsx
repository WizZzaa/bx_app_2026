import React, { useState, useMemo } from 'react';
import type { BxEvent, EventStatus, EventType, EventPriority } from './useEvents';

interface Props {
  events: BxEvent[];
  onEdit: (e: BxEvent) => void;
  onStatusChange: (id: string, status: EventStatus) => void;
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

function isOverdue(e: BxEvent) {
  if (!e.due_date || e.status === 'done') return false;
  return new Date(e.due_date) < new Date(new Date().setHours(0,0,0,0));
}

type SortKey = 'date' | 'title' | 'status' | 'priority';

export default function ListView({ events, onEdit, onStatusChange, onDelete }: Props) {
  const [search, setSearch]       = useState('');
  const [typeF, setTypeF]         = useState<EventType | ''>('');
  const [statusF, setStatusF]     = useState<EventStatus | ''>('');
  const [priF, setPriF]           = useState<EventPriority | ''>('');
  const [sortKey, setSortKey]     = useState<SortKey>('date');
  const [sortAsc, setSortAsc]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || (e.note ?? '').toLowerCase().includes(search.toLowerCase()));
    if (typeF)   list = list.filter(e => e.type === typeF);
    if (statusF) list = list.filter(e => e.status === statusF);
    if (priF)    list = list.filter(e => e.priority === priF);

    list.sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === 'date')     { av = a.due_date || a.date; bv = b.due_date || b.date; }
      else if (sortKey === 'title')  { av = a.title; bv = b.title; }
      else if (sortKey === 'status') { av = a.status; bv = b.status; }
      else { const o = ['high','normal','low']; av = String(o.indexOf(a.priority)); bv = String(o.indexOf(b.priority)); }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [events, search, typeF, statusF, priF, sortKey, sortAsc]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)));
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

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center flex-shrink-0">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
          className="bg-bx-bg text-bx-text px-3 py-1.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm w-48" />

        <select value={typeF} onChange={e => setTypeF(e.target.value as EventType | '')}
          className="bg-bx-bg text-bx-muted px-2.5 py-1.5 rounded-lg border border-bx-border-2 text-xs focus:outline-none">
          <option value="">Все типы</option>
          <option value="task">Задача</option>
          <option value="tax_deadline">Дедлайн</option>
          <option value="reminder">Напоминание</option>
          <option value="event">Событие</option>
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
              <th className="py-2 px-2 text-left text-xs text-bx-muted font-medium">Теги</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ev => (
              <tr key={ev.id}
                className={`border-b border-bx-border/50 hover:bg-bx-surface-2/40 transition-colors cursor-pointer ${isOverdue(ev) ? 'bg-red-900/5' : ''}`}>
                <td className="py-2 px-2" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(ev.id)} onChange={() => toggleSelect(ev.id)} className="accent-blue-500" />
                </td>
                <td className="py-2 px-2 text-base">{TYPE_ICON[ev.type]}</td>
                <td className="py-2 px-2 max-w-xs" onClick={() => onEdit(ev)}>
                  <p className={`text-bx-text truncate ${isOverdue(ev) ? 'text-red-300' : ''}`}>{ev.title}</p>
                  {ev.note && <p className="text-[10px] text-bx-muted truncate">{ev.note}</p>}
                </td>
                <td className="py-2 px-2" onClick={e => { e.stopPropagation(); onStatusChange(ev.id, NEXT_STATUS[ev.status]); }}>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 ${STATUS_COLORS[ev.status]}`}>
                    {STATUS_LABELS[ev.status]}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className={`text-[11px] font-medium ${PRI_COLOR[ev.priority]}`}>
                    {ev.priority === 'high' ? '▲' : ev.priority === 'low' ? '▼' : '—'}
                  </span>
                </td>
                <td className="py-2 px-2 text-[11px] text-bx-muted whitespace-nowrap">
                  {isOverdue(ev) ? <span className="text-red-400">⚠ {fmtDate(ev.due_date)}</span> : fmtDate(ev.due_date || ev.date)}
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1 flex-wrap">
                    {(ev.tags ?? []).slice(0,2).map(t => (
                      <span key={t} className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-bx-muted">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm">Нет событий</p>
          </div>
        )}
      </div>
    </div>
  );
}
