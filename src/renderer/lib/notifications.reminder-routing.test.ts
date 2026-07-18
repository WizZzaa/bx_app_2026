import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkReminders, requestNotificationPermission } from './notifications'
import type { BxEvent } from '../pages/planner/useEvents'

const dueEvent = {
  id: 'reminder-routing-1',
  user_id: 'user-1',
  title: 'Сдать отчёт',
  date: '2026-07-18',
  type: 'task',
  status: 'todo',
  priority: 'normal',
  reminder_at: '2020-01-01T00:00:00.000Z',
  created_at: '2026-07-18T00:00:00.000Z',
} as BxEvent

describe('planner reminder routing', () => {
  beforeEach(() => {
    localStorage.clear()
    delete (window as unknown as { bx?: unknown }).bx
  })

  it('routes reminders through Electron so main can suppress a duplicate toast', async () => {
    const showNotification = vi.fn(async () => false)
    ;(window as unknown as { bx?: unknown }).bx = { tray: { showNotification } }

    expect(await requestNotificationPermission()).toBe(true)
    checkReminders([dueEvent])
    checkReminders([dueEvent])

    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(showNotification).toHaveBeenCalledWith('BX — Напоминание', 'Сдать отчёт', '/planner')
  })
})
