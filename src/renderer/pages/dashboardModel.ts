import type { BxEvent } from './planner/useEvents'

export interface DashboardTaskSummary {
  nearest: BxEvent | null
  active: BxEvent[]
}

const effectiveDate = (event: BxEvent): string => event.due_date || event.date

const priorityWeight: Record<BxEvent['priority'], number> = {
  high: 0,
  normal: 1,
  low: 2,
}

export function summarizeDashboardTasks(events: BxEvent[]): DashboardTaskSummary {
  const active = events
    .filter(event => event.status !== 'done')
    .sort((left, right) => effectiveDate(left).localeCompare(effectiveDate(right))
      || priorityWeight[left.priority] - priorityWeight[right.priority]
      || left.created_at.localeCompare(right.created_at))

  return { nearest: active[0] ?? null, active }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function dashboardDeadlineStatus(date: string, today: string): string {
  const target = new Date(`${date}T12:00:00Z`).getTime()
  const base = new Date(`${today}T12:00:00Z`).getTime()
  const days = Math.round((target - base) / MS_PER_DAY)

  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`
  if (days === 0) return 'Срок сегодня'
  if (days === 1) return 'Срок завтра'
  return `Через ${days} дн.`
}

export function isPermissionError(message: string | null): boolean {
  if (!message) return false
  return /permission|row.level|42501|access denied|нет доступа/i.test(message)
}
