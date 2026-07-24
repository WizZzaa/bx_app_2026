import React, { useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import { DateField, Field, Select, Textarea } from '../../components/ui/FormControls'
import { Sheet } from '../../components/ui/Sheet'
import { todayISO } from '../../lib/dates'
import Icon from '../../lib/ui/Icon'
import { EventActivityTimeline } from './EventActivityTimeline'
import { COMPANY_ROLE_LABELS, type CompanyMember } from './useCompanyMembers'
import type { BxEvent, EventPriority, EventRecurrence, EventStatus, EventType, NewEvent } from './useEvents'
import './PlannerA2.css'

interface Props {
  event?: BxEvent | null
  defaultDate?: string
  defaultType?: EventType
  defaultEvent?: Partial<NewEvent> | null
  members?: CompanyMember[]
  membersLoading?: boolean
  onSave: (event: NewEvent) => void
  onDelete?: () => void
  onClose: () => void
}

const TYPE_LABELS: Record<EventType, string> = {
  task: 'Задача',
  tax_deadline: 'Дедлайн',
  reminder: 'Напоминание',
  event: 'Событие',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
}

const PRIORITY_LABELS: Record<EventPriority, string> = {
  high: 'Высокий',
  normal: 'Обычный',
  low: 'Низкий',
}

const TAX_TAGS = ['НДС', 'НДФЛ', 'Прибыль', 'Оборот', 'Имущество', 'Земля', 'Вода', 'Таможня', 'ЗП', 'Дивиденды']

const RECURRENCE_LABELS: Record<Exclude<EventRecurrence, null> | 'none', string> = {
  none: 'Не повторять',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
  quarterly: 'Ежеквартально',
  yearly: 'Ежегодно',
}

const today = todayISO()
type EventErrors = Partial<Record<'title' | 'date', string>>

export default function EventModal({
  event,
  defaultDate,
  defaultType,
  defaultEvent,
  members = [],
  membersLoading = false,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const isEdit = Boolean(event)
  const [type, setType] = useState<EventType>(event?.type ?? defaultEvent?.type ?? defaultType ?? 'task')
  const [title, setTitle] = useState(event?.title ?? defaultEvent?.title ?? '')
  const [date, setDate] = useState(event?.date ?? defaultEvent?.date ?? defaultDate ?? today)
  const [dueDate, setDueDate] = useState(event?.due_date ?? defaultEvent?.due_date ?? '')
  const [status, setStatus] = useState<EventStatus>(event?.status ?? defaultEvent?.status ?? 'todo')
  const [priority, setPriority] = useState<EventPriority>(event?.priority ?? defaultEvent?.priority ?? 'normal')
  const [note, setNote] = useState(event?.note ?? defaultEvent?.note ?? '')
  const [tags, setTags] = useState<string[]>(event?.tags ?? defaultEvent?.tags ?? [])
  const [assigneeId, setAssigneeId] = useState(event?.assignee_id ?? defaultEvent?.assignee_id ?? '')
  const [recurrence, setRecurrence] = useState<EventRecurrence>(event?.recurrence ?? defaultEvent?.recurrence ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState<EventErrors>({})
  const titleRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const initialReminder = (() => {
    if (!event?.reminder_at || !event.due_date) return { remind: false, days: 0, time: '09:00' }
    const due = new Date(`${event.due_date}T00:00:00`)
    const reminder = new Date(event.reminder_at)
    const diffDays = Math.round((due.getTime() - reminder.getTime()) / 86400000)
    if (diffDays < 0 || diffDays > 7) return { remind: false, days: 0, time: '09:00' }
    return {
      remind: true,
      days: diffDays,
      time: `${String(reminder.getHours()).padStart(2, '0')}:${String(reminder.getMinutes()).padStart(2, '0')}`,
    }
  })()

  const [remind, setRemind] = useState(initialReminder.remind)
  const [remindDays, setRemindDays] = useState(initialReminder.days)
  const [remindTime, setRemindTime] = useState(initialReminder.time)

  function toggleTag(tag: string) {
    setTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag])
  }

  function save() {
    const nextErrors: EventErrors = {}
    if (!title.trim()) nextErrors.title = 'Введите короткое и понятное название.'
    if (!date) nextErrors.date = 'Выберите дату задачи или события.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        if (nextErrors.title) titleRef.current?.focus()
        else if (nextErrors.date) dateRef.current?.focus()
      })
      return
    }

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
        if (!remind || !dueDate) return null
        const due = new Date(`${dueDate}T00:00:00`)
        due.setDate(due.getDate() - remindDays)
        const yyyy = due.getFullYear()
        const mm = String(due.getMonth() + 1).padStart(2, '0')
        const dd = String(due.getDate()).padStart(2, '0')
        return new Date(`${yyyy}-${mm}-${dd}T${remindTime}:00`).toISOString()
      })(),
      recurrence,
      assignee_id: assigneeId || null,
    })
  }

  const deleteControl = isEdit && onDelete
    ? confirmDelete
      ? (
          <div className="bx-planner-sheet__delete-confirm">
            <span>Удалить без восстановления?</span>
            <Button type="button" variant="danger" onClick={onDelete}>Удалить</Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>Оставить</Button>
          </div>
        )
      : <Button type="button" variant="ghost" className="bx-planner-sheet__destructive" onClick={() => setConfirmDelete(true)}>Удалить</Button>
    : null

  const footer = (
    <div className="bx-planner-sheet__footer">
      <div className="bx-planner-sheet__footer-leading">{deleteControl}</div>
      <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
      <Button type="submit" form="bx-planner-event-form">
        <Icon name={isEdit ? 'save' : 'plus'} className="h-4 w-4" />
        {isEdit ? 'Сохранить изменения' : 'Создать'}
      </Button>
    </div>
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? 'Задача или событие' : 'Новая задача или событие'}
      description="Сначала заполните главное. Повторение, метки и напоминание можно добавить ниже."
      closeLabel="Закрыть задачу или событие"
      initialFocusRef={titleRef}
      className="bx-planner-sheet bx-planner-event-sheet"
      footer={footer}
    >
      <form id="bx-planner-event-form" className="bx-planner-form" onSubmit={formEvent => { formEvent.preventDefault(); save() }} noValidate>
        <section className="bx-planner-form__section" aria-labelledby="planner-event-kind-title">
          <div className="bx-planner-form__heading">
            <span>1</span>
            <div><h3 id="planner-event-kind-title">Что запланировать</h3><p>Выберите тип и дайте записи понятное название.</p></div>
          </div>
          <div className="bx-planner-segmented" role="group" aria-label="Тип записи">
            {(Object.keys(TYPE_LABELS) as EventType[]).map(item => (
              <button type="button" key={item} onClick={() => setType(item)} aria-pressed={type === item}>{TYPE_LABELS[item]}</button>
            ))}
          </div>
          <Field
            ref={titleRef}
            label="Название"
            required
            error={errors.title}
            value={title}
            onChange={changeEvent => {
              setTitle(changeEvent.target.value)
              setErrors(current => ({ ...current, title: undefined }))
            }}
            placeholder="Например, отправить отчёт по НДС"
          />
        </section>

        <section className="bx-planner-form__section" aria-labelledby="planner-event-schedule-title">
          <div className="bx-planner-form__heading">
            <span>2</span>
            <div><h3 id="planner-event-schedule-title">Срок и ответственность</h3><p>Уточните дату, статус и исполнителя.</p></div>
          </div>
          <div className="bx-planner-form__grid">
            <DateField
              ref={dateRef}
              label="Дата"
              required
              error={errors.date}
              value={date}
              onChange={changeEvent => {
                setDate(changeEvent.target.value)
                setErrors(current => ({ ...current, date: undefined }))
              }}
            />
            <DateField label="Крайний срок" value={dueDate} onChange={changeEvent => setDueDate(changeEvent.target.value)} />
            <Select label="Статус" value={status} onChange={changeEvent => setStatus(changeEvent.target.value as EventStatus)}>
              {(Object.keys(STATUS_LABELS) as EventStatus[]).map(item => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
            </Select>
            <Select label="Приоритет" value={priority} onChange={changeEvent => setPriority(changeEvent.target.value as EventPriority)}>
              {(Object.keys(PRIORITY_LABELS) as EventPriority[]).map(item => <option key={item} value={item}>{PRIORITY_LABELS[item]}</option>)}
            </Select>
          </div>
          <Select
            label="Исполнитель"
            hint={membersLoading
              ? 'Загружаем команду…'
              : members.length > 0
                ? 'Показываем активных участников выбранной компании.'
                : 'Участников можно пригласить в Настройки → Моя команда.'}
            value={assigneeId}
            onChange={changeEvent => setAssigneeId(changeEvent.target.value)}
            disabled={membersLoading}
          >
            <option value="">Не назначен</option>
            {members.map(member => <option key={member.id} value={member.user_id}>{member.invited_email} · {COMPANY_ROLE_LABELS[member.role]}</option>)}
          </Select>
        </section>

        <details className="bx-planner-form__details">
          <summary>
            <span><span className="bx-planner-form__details-icon"><Icon name="settings" className="h-4 w-4" /></span><span><strong>Дополнительные настройки</strong><small>Повторение, метки, заметка и напоминание</small></span></span>
            <Icon name="arrowR" className="h-4 w-4" />
          </summary>
          <div className="bx-planner-form__details-body">
            <Select
              label="Повторение"
              hint={recurrence ? `После завершения будет создана следующая задача: ${RECURRENCE_LABELS[recurrence].toLowerCase()}.` : undefined}
              value={recurrence ?? 'none'}
              onChange={changeEvent => setRecurrence(changeEvent.target.value === 'none' ? null : changeEvent.target.value as Exclude<EventRecurrence, null>)}
            >
              {(Object.keys(RECURRENCE_LABELS) as (keyof typeof RECURRENCE_LABELS)[]).map(item => <option key={item} value={item}>{RECURRENCE_LABELS[item]}</option>)}
            </Select>
            <fieldset className="bx-planner-form__tags">
              <legend>Налоговые метки</legend>
              <div>{TAX_TAGS.map(tag => <button type="button" key={tag} onClick={() => toggleTag(tag)} aria-pressed={tags.includes(tag)}>#{tag}</button>)}</div>
            </fieldset>
            <Textarea label="Заметка" value={note} onChange={changeEvent => setNote(changeEvent.target.value)} rows={3} placeholder="Контекст, ссылка или ожидаемый результат" />
            {dueDate && (
              <div className="bx-planner-reminder">
                <label><input type="checkbox" checked={remind} onChange={changeEvent => setRemind(changeEvent.target.checked)} />Напомнить о крайнем сроке</label>
                {remind && (
                  <div className="bx-planner-form__grid">
                    <Select label="Когда" value={remindDays} onChange={changeEvent => setRemindDays(Number(changeEvent.target.value))}>
                      <option value={0}>В день срока</option><option value={1}>За 1 день</option><option value={2}>За 2 дня</option><option value={3}>За 3 дня</option><option value={5}>За 5 дней</option><option value={7}>За 7 дней</option>
                    </Select>
                    <Field label="Время" type="time" value={remindTime} onChange={changeEvent => setRemindTime(changeEvent.target.value)} />
                  </div>
                )}
              </div>
            )}
            {event && <EventActivityTimeline event={event} members={members} />}
          </div>
        </details>
      </form>
    </Sheet>
  )
}
