import React, { useState, useEffect } from 'react';
import type { BxEvent, EventType, EventStatus, EventPriority, EventRecurrence, NewEvent } from './useEvents';
import { COMPANY_ROLE_LABELS, type CompanyMember } from './useCompanyMembers';
import { todayISO } from '../../lib/dates';

interface Props {
  event?: BxEvent | null;
  defaultDate?: string;
  defaultType?: EventType;
  defaultEvent?: Partial<NewEvent> | null;
  members?: CompanyMember[];
  membersLoading?: boolean;
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

export default function EventModal({ event, defaultDate, defaultType, defaultEvent, members = [], membersLoading = false, onSave, onDelete, onClose }: Props) {
  const isEdit = Boolean(event);
  const [type,     setType]     = useState<EventType>(event?.type ?? defaultEvent?.type ?? defaultType ?? 'task');
  const [title,    setTitle]    = useState(event?.title ?? defaultEvent?.title ?? '');
  const [date,     setDate]     = useState(event?.date ?? defaultEvent?.date ?? defaultDate ?? today);
  const [dueDate,  setDueDate]  = useState(event?.due_date ?? defaultEvent?.due_date ?? '');
  const [status,   setStatus]   = useState<EventStatus>(event?.status ?? defaultEvent?.status ?? 'todo');
  const [priority, setPriority] = useState<EventPriority>(event?.priority ?? defaultEvent?.priority ?? 'normal');
  const [note,     setNote]     = useState(event?.note ?? defaultEvent?.note ?? '');
  const [tags,     setTags]     = useState<string[]>(event?.tags ?? defaultEvent?.tags ?? []);
  const [assigneeId, setAssigneeId] = useState(event?.assignee_id ?? defaultEvent?.assignee_id ?? '');
  const getInitialReminderStates = () => {
    if (event?.reminder_at && event.due_date) {
      const due = new Date(event.due_date + 'T00:00:00')
      const rem = new Date(event.reminder_at)
      const diffMs = due.getTime() - rem.getTime()
      const diffDays = Math.round(diffMs / 86400000)
      const hours = String(rem.getHours()).padStart(2, '0')
      const minutes = String(rem.getMinutes()).padStart(2, '0')
      const time = `${hours}:${minutes}`
      if (diffDays >= 0 && diffDays <= 7) {
        return { remind: true, days: diffDays, time }
      }
    }
    return { remind: false, days: 0, time: '09:00' }
  }

  const initReminder = getInitialReminderStates()
  const [remind,   setRemind]   = useState(initReminder.remind);
  const [remindDays, setRemindDays] = useState(initReminder.days);
  const [remindTime, setRemindTime] = useState(initReminder.time);
  const [recurrence, setRecurrence] = useState<EventRecurrence>(event?.recurrence ?? defaultEvent?.recurrence ?? null);
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
      company_id: event?.company_id ?? defaultEvent?.company_id ?? null,
      type,
      title: title.trim(),
      date,
      due_date: dueDate || null,
      status,
      priority,
      tags: tags.length ? tags : null,
      tax_type: type === 'tax_deadline' ? (tags[0] ?? event?.tax_type ?? defaultEvent?.tax_type ?? null) : null,
      kind: type === 'tax_deadline' ? (event?.kind ?? defaultEvent?.kind ?? null) : null,
      regime: type === 'tax_deadline' ? (event?.regime ?? defaultEvent?.regime ?? null) : null,
      note: note.trim() || null,
      source: event?.source ?? defaultEvent?.source ?? 'manual',
      source_key: event?.source_key ?? defaultEvent?.source_key ?? null,
      reminder_at: (() => {
        if (!remind || !dueDate) return null;
        const due = new Date(dueDate + 'T00:00:00');
        due.setDate(due.getDate() - remindDays);
        const yyyy = due.getFullYear();
        const mm = String(due.getMonth() + 1).padStart(2, '0');
        const dd = String(due.getDate()).padStart(2, '0');
        return new Date(`${yyyy}-${mm}-${dd}T${remindTime}:00`).toISOString();
      })(),
      recurrence,
      assignee_id: assigneeId || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bx-border">
          <div>
            <h2 className="text-base font-semibold text-bx-text">{isEdit ? 'Редактировать задачу' : 'Новая задача или событие'}</h2>
            <p className="text-[10px] text-bx-muted mt-0.5">Компания, исполнитель, срок и напоминание — в одном окне</p>
          </div>
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

          {/* Исполнитель */}
          <div>
            <label className="text-xs text-bx-muted block mb-1.5">Исполнитель</label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              disabled={membersLoading}
              className="w-full bg-bx-bg text-bx-text px-3 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm disabled:opacity-60"
            >
              <option value="">Не назначен</option>
              {members.map(member => (
                <option key={member.id} value={member.user_id}>
                  {member.invited_email} · {COMPANY_ROLE_LABELS[member.role]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-bx-muted mt-1">
              {membersLoading
                ? 'Загружаем команду…'
                : members.length > 0
                  ? 'В списке только активные участники выбранной компании.'
                  : 'Пригласить участников можно в Настройки → Моя команда.'}
            </p>
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
            <div className="space-y-2 border-t border-bx-border/40 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-blue-500" />
                <span className="text-xs text-bx-text font-medium">Включить напоминание</span>
              </label>
              {remind && (
                <div className="flex items-center gap-2 pl-5.5 text-xs text-bx-muted">
                  <span>За</span>
                  <select
                    value={remindDays}
                    onChange={e => setRemindDays(Number(e.target.value))}
                    className="bg-bx-bg text-bx-text text-xs rounded border border-bx-border-2 px-1.5 py-1 focus:outline-none"
                  >
                    <option value={0}>день дедлайна (0 дн.)</option>
                    <option value={1}>1 день</option>
                    <option value={2}>2 дня</option>
                    <option value={3}>3 дня</option>
                    <option value={5}>5 дней</option>
                    <option value={7}>7 дней</option>
                  </select>
                  <span>в</span>
                  <input
                    type="time"
                    value={remindTime}
                    onChange={e => setRemindTime(e.target.value)}
                    className="bg-bx-bg text-bx-text text-xs rounded border border-bx-border-2 px-1.5 py-1 focus:outline-none w-18 text-center"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-bx-border">
          <div className="flex items-center gap-3">
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
