import React, { useState, useEffect } from 'react';
import type { BxEvent, EventType, EventStatus, EventPriority, EventRecurrence, NewEvent } from './useEvents';
import { todayISO } from '../../lib/dates';

interface Props {
  event?: BxEvent | null;
  defaultDate?: string;
  defaultType?: EventType;
  onSave: (e: NewEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<EventType, string> = {
  task: '✅ Задача',
  tax_deadline: '📋 Дедлайн',
  reminder: '🔔 Напоминание',
  event: '📅 Событие',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
};

const PRIORITY_LABELS: Record<EventPriority, string> = {
  high: '🔴 Высокий',
  normal: '🟡 Средний',
  low: '🟢 Низкий',
};

const TAX_TAGS = ['НДС','НДФЛ','Прибыль','Оборот','Имущество','Земля','Вода','Таможня','ЗП','Дивиденды'];

const RECURRENCE_LABELS: Record<Exclude<EventRecurrence, null> | 'none', string> = {
  none: 'Не повторять',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  quarterly: 'Ежеквартально',
  yearly: 'Ежегодно',
};

const today = todayISO();

export default function EventModal({ event, defaultDate, defaultType, onSave, onDelete, onClose }: Props) {
  const isEdit = Boolean(event);
  const [type,     setType]     = useState<EventType>(event?.type     ?? defaultType ?? 'task');
  const [title,    setTitle]    = useState(event?.title    ?? '');
  const [date,     setDate]     = useState(event?.date     ?? defaultDate ?? today);
  const [dueDate,  setDueDate]  = useState(event?.due_date ?? '');
  const [status,   setStatus]   = useState<EventStatus>(event?.status   ?? 'todo');
  const [priority, setPriority] = useState<EventPriority>(event?.priority ?? 'normal');
  const [note,     setNote]     = useState(event?.note     ?? '');
  const [tags,     setTags]     = useState<string[]>(event?.tags ?? []);
  const [remind,   setRemind]   = useState(false);
  const [recurrence, setRecurrence] = useState<EventRecurrence>(event?.recurrence ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggleTag(t: string) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function save() {
    if (!title.trim()) return;
    onSave({
      company_id: null,
      type,
      title: title.trim(),
      date,
      due_date: dueDate || null,
      status,
      priority,
      tags: tags.length ? tags : null,
      tax_type: type === 'tax_deadline' ? (tags[0] ?? null) : null,
      kind: null,
      regime: null,
      note: note.trim() || null,
      source: 'manual',
      reminder_at: remind && dueDate ? new Date(dueDate + 'T09:00:00').toISOString() : null,
      recurrence,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bx-border">
          <h2 className="text-base font-semibold text-bx-text">{isEdit ? 'Редактировать' : 'Новое событие'}</h2>
          <button onClick={onClose} className="text-bx-muted hover:text-bx-text text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Тип */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Тип</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_LABELS) as EventType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${type === t ? 'bg-blue-600 text-white' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-text'}`}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Заголовок */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Заголовок</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) save(); }}
            />
          </div>

          {/* Дата + Дедлайн */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-bx-muted block mb-1.5">Дата</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
            <div>
              <label className="text-xs text-bx-muted block mb-1.5">Дедлайн (опц.)</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm" />
            </div>
          </div>

          {/* Статус + Приоритет */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-bx-muted block mb-1.5">Статус</label>
              <select value={status} onChange={e => setStatus(e.target.value as EventStatus)}
                className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none text-sm">
                {(Object.keys(STATUS_LABELS) as EventStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-bx-muted block mb-1.5">Приоритет</label>
              <select value={priority} onChange={e => setPriority(e.target.value as EventPriority)}
                className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none text-sm">
                {(Object.keys(PRIORITY_LABELS) as EventPriority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Повторение */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Повторение</label>
            <select value={recurrence ?? 'none'}
              onChange={e => setRecurrence(e.target.value === 'none' ? null : e.target.value as Exclude<EventRecurrence, null>)}
              className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none text-sm">
              {(Object.keys(RECURRENCE_LABELS) as (keyof typeof RECURRENCE_LABELS)[]).map(r => (
                <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
              ))}
            </select>
            {recurrence && (
              <p className="text-[10px] text-bx-muted mt-1">При завершении задачи автоматически создастся следующая ({RECURRENCE_LABELS[recurrence].toLowerCase()}).</p>
            )}
          </div>

          {/* Теги */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Теги</label>
            <div className="flex flex-wrap gap-1.5">
              {TAX_TAGS.map(t => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${tags.includes(t) ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-bx-surface-2 text-bx-muted hover:text-bx-muted'}`}>
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Заметка */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Заметка</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Дополнительная информация..."
              className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm resize-none" />
          </div>

          {/* Напоминание */}
          {dueDate && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-blue-500" />
              <span className="text-xs text-bx-muted">Напомнить в 09:00 в день дедлайна</span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-bx-border">
          <div>
            {isEdit && onDelete && (
              confirmDelete
                ? <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Удалить?</span>
                    <button onClick={onDelete} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Да</button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-bx-muted hover:text-bx-text">Отмена</button>
                  </div>
                : <button onClick={() => setConfirmDelete(true)} className="text-xs text-bx-muted hover:text-red-400 transition-colors">Удалить</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-bx-muted hover:text-bx-text transition-colors">Отмена</button>
            <button onClick={save} disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
              {isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
