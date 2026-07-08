import React from 'react';
import type { BxEvent, EventStatus } from './useEvents';
import type { CalCard } from './CalendarView';
import type { BxBoard } from './useBoards';

interface Props {
  date: string;
  events: BxEvent[];
  cards: CalCard[];
  boards: BxBoard[];
  onEventClick: (e: BxEvent) => void;
  onCardClick: (id: string) => void;
  onEventStatusChange: (id: string, status: EventStatus) => void;
  onCardStatusChange: (id: string, boardId: string, done: boolean) => void;
  onDeleteEvent: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onAddClick: (date: string) => void;
  onClose: () => void;
}

const TYPE_ICON: Record<string, string> = {
  task: '✅',
  tax_deadline: '📋',
  reminder: '🔔',
  event: '📅',
};

const PRI_COLOR: Record<string, string> = {
  high: 'text-red-400',
  normal: 'text-yellow-500',
  low: 'text-green-500',
};

export default function DailyTasksModal({
  date,
  events,
  cards,
  boards,
  onEventClick,
  onCardClick,
  onEventStatusChange,
  onCardStatusChange,
  onDeleteEvent,
  onDeleteCard,
  onAddClick,
  onClose,
}: Props) {
  const isCardDone = (c: CalCard) => {
    const board = boards.find(b => b.id === c.board_id);
    if (!board || !board.columns || board.columns.length === 0) return false;
    return c.column_id === board.columns[board.columns.length - 1].id;
  };

  const formattedDate = React.useMemo(() => {
    const d = new Date(date);
    const day = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
    return `Дела на ${day}, ${weekday}`;
  }, [date]);

  const boardName = (id: string) => boards.find(b => b.id === id)?.name ?? 'Доска';
  const boardIcon = (id: string) => boards.find(b => b.id === id)?.icon ?? '🗂️';

  const hasItems = events.length > 0 || cards.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[440px] max-w-[92vw] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bx-border flex-shrink-0">
          <h3 className="text-sm font-semibold text-bx-text capitalize-first">{formattedDate}</h3>
          <button onClick={onClose} className="text-bx-muted hover:text-bx-text text-lg leading-none">
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!hasItems && (
            <div className="text-center py-10 text-bx-muted space-y-1">
              <span className="text-2xl block">🌟</span>
              <p className="text-xs">На этот день запланированных дел нет</p>
            </div>
          )}

          {/* Events */}
          {events.map(ev => (
            <div
              key={`e-${ev.id}`}
              className="flex items-center gap-2.5 px-3 py-2 bg-bx-surface-2/40 border border-bx-border/40 hover:border-blue-500/20 rounded-xl transition-all group"
            >
              <input
                type="checkbox"
                checked={ev.status === 'done'}
                onChange={() => onEventStatusChange(ev.id, ev.status === 'done' ? 'todo' : 'done')}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer flex-shrink-0"
              />
              <span className="text-sm flex-shrink-0">{TYPE_ICON[ev.type] || '📌'}</span>
              <button
                onClick={() => {
                  onEventClick(ev);
                  onClose();
                }}
                className="flex-1 min-w-0 text-left"
              >
                <span
                  className={`text-xs block truncate ${
                    ev.status === 'done' ? 'text-bx-muted line-through' : 'text-bx-text hover:text-white'
                  }`}
                >
                  {ev.title}
                </span>
              </button>
              {ev.priority === 'high' && (
                <span className="text-[9px] px-1 bg-red-500/10 text-red-400 rounded flex-shrink-0">важно</span>
              )}
              <button
                onClick={() => onDeleteEvent(ev.id)}
                className="text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Удалить задачу"
              >
                🗑️
              </button>
            </div>
          ))}

          {/* Cards */}
          {cards.map(cd => {
            const done = isCardDone(cd);
            return (
              <div
                key={`c-${cd.id}`}
                className="flex items-center gap-2.5 px-3 py-2 bg-bx-surface-2/40 border border-bx-border/40 hover:border-cyan-500/20 rounded-xl transition-all group"
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onCardStatusChange(cd.id, cd.board_id, !done)}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm flex-shrink-0">{boardIcon(cd.board_id)}</span>
                <button
                  onClick={() => {
                    onCardClick(cd.id);
                    onClose();
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <span
                    className={`text-xs block truncate ${
                      done ? 'text-bx-muted line-through' : 'text-bx-text hover:text-white'
                    }`}
                  >
                    {cd.title}
                  </span>
                </button>
                <span className="text-[9px] px-1 bg-cyan-500/10 text-cyan-400 rounded flex-shrink-0 max-w-[80px] truncate">
                  {boardName(cd.board_id)}
                </span>
                <button
                  onClick={() => onDeleteCard(cd.id)}
                  className="text-bx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Удалить карточку"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-bx-border bg-bx-surface flex-shrink-0">
          <button
            onClick={() => {
              onAddClick(date);
              onClose();
            }}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>+</span> Добавить задачу или событие
          </button>
        </div>
      </div>
    </div>
  );
}
