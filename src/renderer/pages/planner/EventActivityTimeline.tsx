import React, { useMemo } from 'react'
import Icon from '../../lib/ui/Icon'
import type { BxEvent, EventStatus } from './useEvents'
import type { CompanyMember } from './useCompanyMembers'
import { useEventActivity, type EventActivity } from './useEventActivity'

const STATUS_LABELS: Record<EventStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Готово',
}

function valueLabel(value: string | null, members: Map<string, CompanyMember>, kind: 'member' | 'status' | 'date') {
  if (!value) return kind === 'date' ? 'Без срока' : 'Не назначен'
  if (kind === 'member') return members.get(value)?.invited_email ?? 'Участник команды'
  if (kind === 'status') return STATUS_LABELS[value as EventStatus] ?? value
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function describeEventActivity(activity: EventActivity, members: Map<string, CompanyMember>) {
  switch (activity.activity_type) {
    case 'created': return 'Задача создана'
    case 'assigned': return `Назначено: ${valueLabel(activity.to_value, members, 'member')}`
    case 'reassigned': return `Исполнитель: ${valueLabel(activity.from_value, members, 'member')} → ${valueLabel(activity.to_value, members, 'member')}`
    case 'accepted': return 'Исполнитель принял задачу в работу'
    case 'status_changed': return `Статус: ${valueLabel(activity.from_value, members, 'status')} → ${valueLabel(activity.to_value, members, 'status')}`
    case 'due_date_changed': return `Срок: ${valueLabel(activity.from_value, members, 'date')} → ${valueLabel(activity.to_value, members, 'date')}`
  }
}

export function EventActivityTimeline({ event, members }: { event: BxEvent; members: CompanyMember[] }) {
  const { activities, loading, error } = useEventActivity(event.id)
  const memberByUserId = useMemo(() => new Map(members.map(member => [member.user_id, member])), [members])

  return <section className="rounded-xl border border-bx-border bg-bx-bg p-3" aria-labelledby="event-activity-title">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="clock" className="h-3.5 w-3.5" /></span><div><h3 id="event-activity-title" className="text-xs font-black text-bx-text">Журнал задачи</h3><p className="text-[9px] text-bx-muted">Назначение, принятие, статус и срок</p></div></div>
      {loading && <span className="text-[9px] font-bold text-bx-muted animate-pulse">Обновляем…</span>}
    </div>
    {error ? <p role="alert" className="mt-3 text-[10px] font-bold text-red-600 dark:text-red-300">Журнал временно недоступен</p> : activities.length ? <ol className="mt-3 space-y-2 border-l border-bx-border pl-3">{activities.map(activity => <li key={activity.id} className="relative"><span aria-hidden="true" className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-blue-500" /><p className="text-[10px] font-bold leading-relaxed text-bx-text">{describeEventActivity(activity, memberByUserId)}</p><p className="mt-0.5 text-[9px] text-bx-muted">{activity.actor_id === event.user_id ? 'Автор задачи' : memberByUserId.get(activity.actor_id ?? '')?.invited_email ?? 'Система'} · {new Date(activity.created_at).toLocaleString('ru-RU')}</p></li>)}</ol> : !loading && <p className="mt-3 text-[10px] leading-relaxed text-bx-muted">Журнал начнёт заполняться после назначения или изменения задачи.</p>}
  </section>
}
