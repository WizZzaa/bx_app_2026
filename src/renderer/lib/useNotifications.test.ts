import { describe, expect, it } from 'vitest'
import { buildTaskNotification, type TaskNotificationRow } from './useNotifications'

const BASE_ROW: TaskNotificationRow = {
  id: 'notification-1',
  event_id: 'event-1',
  company_id: 'company-1',
  notification_type: 'assignment',
  event_title: 'Сдать отчёт',
  company_name: 'ООО «Тест»',
  due_date: '2026-07-20',
  created_at: '2026-07-16T10:00:00.000Z',
  read_at: null,
}

describe('buildTaskNotification', () => {
  it('shows the assigned task, company and local due date', () => {
    const notification = buildTaskNotification(BASE_ROW)

    expect(notification.title).toBe('Вам назначена задача')
    expect(notification.body).toContain('Сдать отчёт')
    expect(notification.body).toContain('ООО «Тест»')
    expect(notification.body).toContain('20 июл. 2026 г.')
    expect(notification.event_id).toBe('event-1')
    expect(notification.read).toBe(false)
  })

  it('marks a reassignment with the correct title and read state', () => {
    const notification = buildTaskNotification({
      ...BASE_ROW,
      notification_type: 'reassignment',
      read_at: '2026-07-16T10:05:00.000Z',
    })

    expect(notification.title).toBe('Задача переназначена вам')
    expect(notification.read).toBe(true)
  })
})
