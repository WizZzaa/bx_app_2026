import { describe, expect, it } from 'vitest'
import { buildTaskNotification, type TaskNotificationRow } from './useNotifications'

const ROW: TaskNotificationRow = {
  id: 'notification-change-1',
  event_id: 'event-1',
  company_id: 'company-1',
  notification_type: 'status_changed',
  event_title: 'Сдать отчёт',
  company_name: 'ООО «Тест»',
  due_date: '2026-07-21',
  details: 'На проверке',
  created_at: '2026-07-17T00:30:00.000Z',
  read_at: null,
}

// Regression: TEAM-002 — существенные изменения командной задачи не отображались в уведомлениях
// Found by /qa on 2026-07-17
// Report: .gstack/qa-reports/qa-report-localhost-2026-07-17.md
describe('task change notifications', () => {
  it('shows the new workflow status', () => {
    const notification = buildTaskNotification(ROW)
    expect(notification.title).toBe('Статус задачи изменён')
    expect(notification.body).toContain('новый статус: На проверке')
  })

  it('shows acceptance and deadline changes as distinct actions', () => {
    expect(buildTaskNotification({ ...ROW, notification_type: 'accepted' }).title).toBe('Исполнитель принял задачу')
    const deadline = buildTaskNotification({ ...ROW, notification_type: 'due_date_changed' })
    expect(deadline.title).toBe('Срок задачи изменён')
    expect(deadline.body).toContain('21 июл. 2026 г.')
  })
})
