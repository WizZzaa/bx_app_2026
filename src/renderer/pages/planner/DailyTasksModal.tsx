import React from 'react';
import { createPortal } from 'react-dom';
import type { BxEvent, EventStatus } from './useEvents';
import type { CalCard } from './CalendarView';
import type { BxBoard } from './useBoards';
import Icon from '../../lib/ui/Icon';
import './PlannerA2.css';

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

  return createPortal(
    <div
      className="bx-sheet-scrim fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="daily-tasks-title" className="bx-sheet bx-daily-sheet flex w-full max-w-[31rem] flex-col overflow-hidden">
        {/* Header */}
        <header className="bx-sheet__header flex flex-shrink-0 items-start justify-between gap-4 px-5 py-5">
          <div>
            <p className="bx-planner-eyebrow text-[11px] font-black">Повестка дня</p>
            <h3 id="daily-tasks-title" className="mt-1 text-lg font-black capitalize-first text-bx-text">{formattedDate}</h3>
            <p className="mt-1 text-xs text-bx-muted">{events.length + cards.length} {events.length + cards.length === 1 ? 'запись' : 'записей'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="bx-sheet__close">
            <Icon name="crossSmall" />
          </button>
        </header>

        {/* List */}
        <div className="bx-sheet__body flex-1 space-y-2 overflow-y-auto p-4">
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
              className="bx-daily-row group flex items-center gap-3"
            >
              <input
                type="checkbox"
                checked={ev.status === 'done'}
                onChange={() => onEventStatusChange(ev.id, ev.status === 'done' ? 'todo' : 'done')}
                className="h-5 w-5 flex-shrink-0 cursor-pointer rounded accent-violet-600"
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
                    ev.status === 'done' ? 'text-bx-muted line-through' : 'text-bx-text hover:text-slate-900 dark:hover:text-white'
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
                className="bx-daily-row__delete"
                title="Удалить задачу"
                aria-label={`Удалить: ${ev.title}`}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}

          {/* Cards */}
          {cards.map(cd => {
            const done = isCardDone(cd);
            return (
              <div
                key={`c-${cd.id}`}
                className="bx-daily-row group flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onCardStatusChange(cd.id, cd.board_id, !done)}
                  className="h-5 w-5 flex-shrink-0 cursor-pointer rounded accent-violet-600"
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
                      done ? 'text-bx-muted line-through' : 'text-bx-text hover:text-slate-900 dark:hover:text-white'
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
                  className="bx-daily-row__delete"
                  title="Удалить карточку"
                  aria-label={`Удалить: ${cd.title}`}
                >
                  <Icon name="trash" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="bx-sheet__footer flex-shrink-0 p-4">
          <button
            onClick={() => {
              onAddClick(date);
              onClose();
            }}
            className="bx-planner-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black"
          >
            <Icon name="plus" className="h-4 w-4" /> Добавить задачу или событие
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
