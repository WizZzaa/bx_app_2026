import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BxEvent, EventType, EventStatus, EventPriority, EventRecurrence, NewEvent } from './useEvents';
import { COMPANY_ROLE_LABELS, type CompanyMember } from './useCompanyMembers';
import { todayISO } from '../../lib/dates';
import { EventActivityTimeline } from './EventActivityTimeline';
import Icon from '../../lib/ui/Icon';
import './PlannerA2.css';

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
  task: 'Задача',
  tax_deadline: 'Дедлайн',
  reminder: 'Напоминание',
  event: 'Событие',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
};

const PRIORITY_LABELS: Record<EventPriority, string> = {
  high: 'Высокий',
  normal: 'Обычный',
  low: 'Низкий',
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

  return createPortal(
    <div className="bx-sheet-scrim fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form onSubmit={e => { e.preventDefault(); save(); }} role="dialog" aria-modal="true" aria-labelledby="planner-event-title" className="bx-sheet bx-event-sheet flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden">
        <header className="bx-sheet__header flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3"><span className="bx-planner-hero__icon grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl"><Icon name={isEdit ? 'planner' : 'plus'} className="h-5 w-5" /></span><div><p className="bx-planner-eyebrow text-xs font-black">{isEdit ? 'Редактирование' : 'Быстрое добавление'}</p><h2 id="planner-event-title" className="mt-1 text-xl font-black text-bx-text">{isEdit ? 'Задача или событие' : 'Новая задача или событие'}</h2><p className="mt-1 text-sm leading-relaxed text-bx-muted">Сначала главное. Повторение, теги и напоминание — в дополнительных настройках.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-bx-border bg-bx-surface text-bx-muted hover:text-bx-text"><Icon name="crossSmall" className="h-4 w-4" /></button>
        </header>

        <div className="bx-sheet__body custom-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <fieldset><legend className="mb-2 text-sm font-black text-bx-text">Что вы добавляете</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(TYPE_LABELS) as EventType[]).map(t => <button type="button" key={t} onClick={() => setType(t)} aria-pressed={type === t} className={`min-h-11 rounded-xl border px-3 text-sm font-black transition-colors ${type === t ? 'border-bx-accent/30 bg-bx-accent/10 text-bx-accent' : 'border-bx-border bg-bx-bg text-bx-muted hover:border-bx-accent/30 hover:text-bx-text'}`}>{TYPE_LABELS[t]}</button>)}</div></fieldset>

          <label className="block text-sm font-black text-bx-text">Название *<input autoFocus required value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: отправить отчёт по НДС" className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-base font-semibold text-bx-text outline-none focus:border-bx-accent" /></label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-black text-bx-text">Дата<input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-sm text-bx-text outline-none focus:border-violet-500" /></label>
            <label className="text-sm font-black text-bx-text">Крайний срок <span className="font-medium text-bx-muted">· необязательно</span><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-sm text-bx-text outline-none focus:border-violet-500" /></label>
            <label className="text-sm font-black text-bx-text">Статус<select value={status} onChange={e => setStatus(e.target.value as EventStatus)} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-sm text-bx-text outline-none focus:border-violet-500">{(Object.keys(STATUS_LABELS) as EventStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></label>
            <label className="text-sm font-black text-bx-text">Приоритет<select value={priority} onChange={e => setPriority(e.target.value as EventPriority)} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-sm text-bx-text outline-none focus:border-violet-500">{(Object.keys(PRIORITY_LABELS) as EventPriority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}</select></label>
          </div>

          <label className="block text-sm font-black text-bx-text">Исполнитель<select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} disabled={membersLoading} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-sm text-bx-text outline-none focus:border-violet-500 disabled:opacity-60"><option value="">Не назначен</option>{members.map(member => <option key={member.id} value={member.user_id}>{member.invited_email} · {COMPANY_ROLE_LABELS[member.role]}</option>)}</select><span className="mt-1.5 block text-xs font-medium leading-relaxed text-bx-muted">{membersLoading ? 'Загружаем команду…' : members.length > 0 ? 'Показываем активных участников выбранной компании.' : 'Участников можно пригласить в Настройки → Моя команда.'}</span></label>

          <details className="group rounded-2xl border border-bx-border bg-bx-bg">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-black text-bx-text outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bx-accent [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-bx-accent/10 text-bx-accent"><Icon name="settings" className="h-4 w-4" /></span>Дополнительные настройки</span><Icon name="arrowR" className="h-4 w-4 rotate-90 text-bx-muted transition-transform group-open:-rotate-90" /></summary>
            <div className="space-y-5 border-t border-bx-border p-4">
              <label className="block text-sm font-black text-bx-text">Повторение<select value={recurrence ?? 'none'} onChange={e => setRecurrence(e.target.value === 'none' ? null : e.target.value as Exclude<EventRecurrence, null>)} className="mt-2 min-h-12 w-full rounded-xl border border-bx-border bg-bx-surface px-4 text-sm text-bx-text outline-none focus:border-violet-500">{(Object.keys(RECURRENCE_LABELS) as (keyof typeof RECURRENCE_LABELS)[]).map(r => <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>)}</select>{recurrence && <span className="mt-1.5 block text-xs font-medium text-bx-muted">После завершения будет создана следующая задача: {RECURRENCE_LABELS[recurrence].toLowerCase()}.</span>}</label>
              <fieldset><legend className="mb-2 text-sm font-black text-bx-text">Налоговые метки</legend><div className="flex flex-wrap gap-2">{TAX_TAGS.map(t => <button type="button" key={t} onClick={() => toggleTag(t)} aria-pressed={tags.includes(t)} className={`min-h-10 rounded-xl border px-3 text-xs font-black ${tags.includes(t) ? 'border-bx-accent/30 bg-bx-accent/10 text-bx-accent' : 'border-bx-border bg-bx-surface text-bx-muted'}`}>#{t}</button>)}</div></fieldset>
              <label className="block text-sm font-black text-bx-text">Заметка<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Контекст, ссылка или ожидаемый результат" className="mt-2 w-full resize-y rounded-xl border border-bx-border bg-bx-surface px-4 py-3 text-sm text-bx-text outline-none focus:border-violet-500" /></label>
              {dueDate && <div className="rounded-xl border border-bx-border bg-bx-surface p-4"><label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black text-bx-text"><input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)} className="h-5 w-5 accent-violet-600" />Напомнить о крайнем сроке</label>{remind && <div className="mt-3 grid gap-3 pl-8 sm:grid-cols-2"><label className="text-xs font-bold text-bx-muted">Когда<select value={remindDays} onChange={e => setRemindDays(Number(e.target.value))} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm text-bx-text"><option value={0}>В день срока</option><option value={1}>За 1 день</option><option value={2}>За 2 дня</option><option value={3}>За 3 дня</option><option value={5}>За 5 дней</option><option value={7}>За 7 дней</option></select></label><label className="text-xs font-bold text-bx-muted">Время<input type="time" value={remindTime} onChange={e => setRemindTime(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm text-bx-text" /></label></div>}</div>}
              {event && <EventActivityTimeline event={event} members={members} />}
            </div>
          </details>
        </div>

        <footer className="bx-sheet__footer flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>{isEdit && onDelete && (confirmDelete ? <div className="flex items-center gap-2"><span className="text-sm font-bold text-red-600 dark:text-red-300">Удалить без восстановления?</span><button type="button" onClick={onDelete} className="min-h-10 rounded-xl bg-red-600 px-3 text-xs font-black text-white">Удалить</button><button type="button" onClick={() => setConfirmDelete(false)} className="min-h-10 px-2 text-xs font-black text-bx-muted">Отмена</button></div> : <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 rounded-xl px-3 text-sm font-black text-red-600 hover:bg-red-500/10 dark:text-red-300">Удалить</button>)}</div>
          <div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-bx-border px-5 text-sm font-black text-bx-text hover:bg-bx-bg">Отмена</button><button type="submit" disabled={!title.trim()} className="bx-planner-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black disabled:opacity-40"><Icon name={isEdit ? 'save' : 'plus'} className="h-4 w-4" />{isEdit ? 'Сохранить' : 'Создать'}</button></div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
