import React from 'react';
import Icon from '../../lib/ui/Icon';
import { todayISO } from '../../lib/dates';
import type { BxEvent, EventPriority, EventType } from './useEvents';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  task: 'Задача',
  tax_deadline: 'Обязательство',
  reminder: 'Напоминание',
  event: 'Событие',
};

const PRIORITY_META: Record<EventPriority, { label: string; className: string }> = {
  high: { label: 'Высокий приоритет', className: 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400' },
  normal: { label: 'Обычный приоритет', className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  low: { label: 'Низкий приоритет', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
};

export function formatPlannerDate(event: BxEvent): string {
  const date = event.due_date || event.date;
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

interface Props {
  event: BxEvent;
  assigneeLabel?: string | null;
  showDate?: boolean;
}

export default function PlannerEventSummary({ event, assigneeLabel, showDate = false }: Props) {
  const dueDate = event.due_date || event.date;
  const overdue = event.status !== 'done' && dueDate < todayISO();
  const priority = PRIORITY_META[event.priority];

  return (
    <div className="bx-planner-event-summary min-w-0">
      <div className="text-[13px] font-semibold leading-snug text-bx-text break-words">{event.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-bx-muted">
        <span className="inline-flex items-center rounded-md border border-bx-border bg-bx-surface-2 px-1.5 py-0.5 font-medium">
          {EVENT_TYPE_LABELS[event.type]}
        </span>
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-medium ${priority.className}`}>
          {priority.label}
        </span>
        {showDate && (
          <span className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-bx-muted'}`}>
            <Icon name={overdue ? 'alert' : 'clock'} className="h-3 w-3" />
            {overdue ? 'Просрочено · ' : ''}{formatPlannerDate(event)}
          </span>
        )}
        {event.kind && (
          <span className="font-medium">
            {event.kind === 'payment' ? 'Оплата' : event.kind === 'report' ? 'Отчёт' : 'Отчёт и оплата'}
          </span>
        )}
        {event.assignee_id && (
          <span className="inline-flex min-w-0 items-center gap-1 font-medium text-bx-muted">
            <Icon name="user" className="h-3 w-3 flex-shrink-0" />
            <span className="max-w-44 truncate">{assigneeLabel || 'Назначено участнику'}</span>
          </span>
        )}
      </div>
    </div>
  );
}
