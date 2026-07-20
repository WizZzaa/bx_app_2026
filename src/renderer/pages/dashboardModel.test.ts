import { describe, expect, it } from 'vitest'
import { dashboardDeadlineStatus, isPermissionError, summarizeDashboardTasks } from './dashboardModel'
import type { BxEvent } from './planner/useEvents'

const event = (patch: Partial<BxEvent>): BxEvent => ({
  id: 'event-1',
  user_id: 'user-1',
  company_id: null,
  type: 'task',
  title: 'Задача',
  date: '2026-07-20',
  due_date: null,
  status: 'todo',
  priority: 'normal',
  tags: null,
  tax_type: null,
  kind: null,
  regime: null,
  note: null,
  source: 'manual',
  reminder_at: null,
  assignee_id: null,
  created_at: '2026-07-19T10:00:00Z',
  ...patch,
})

describe('dashboard task model', () => {
  it('selects the nearest unfinished event without mutating the source list', () => {
    const source = [
      event({ id: 'later', date: '2026-07-25' }),
      event({ id: 'done', date: '2026-07-18', status: 'done' }),
      event({ id: 'nearest', date: '2026-07-20', priority: 'high' }),
    ]
    const before = source.map(item => item.id)

    const summary = summarizeDashboardTasks(source)

    expect(summary.nearest?.id).toBe('nearest')
    expect(summary.active.map(item => item.id)).toEqual(['nearest', 'later'])
    expect(source.map(item => item.id)).toEqual(before)
  })

  it('produces textual, non-colour-only deadline states', () => {
    expect(dashboardDeadlineStatus('2026-07-19', '2026-07-20')).toBe('Просрочено на 1 дн.')
    expect(dashboardDeadlineStatus('2026-07-20', '2026-07-20')).toBe('Срок сегодня')
    expect(dashboardDeadlineStatus('2026-07-21', '2026-07-20')).toBe('Срок завтра')
    expect(dashboardDeadlineStatus('2026-07-25', '2026-07-20')).toBe('Через 5 дн.')
  })

  it('recognises permission failures without hiding ordinary errors', () => {
    expect(isPermissionError('Postgres 42501: permission denied')).toBe(true)
    expect(isPermissionError('network timeout')).toBe(false)
  })
})
