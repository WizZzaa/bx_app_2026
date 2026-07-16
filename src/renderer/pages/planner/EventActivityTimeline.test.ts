import { describe, expect, it } from 'vitest'
import { describeEventActivity } from './EventActivityTimeline'
import type { EventActivity } from './useEventActivity'
import type { CompanyMember } from './useCompanyMembers'

const member: CompanyMember = {
  id: 'member-1',
  organization_id: 'company-1',
  user_id: 'user-2',
  invited_email: 'wife@example.com',
  role: 'accountant',
  status: 'active',
}

const activity: EventActivity = {
  id: 'activity-1',
  event_id: 'event-1',
  company_id: 'company-1',
  actor_id: 'user-1',
  activity_type: 'assigned',
  from_value: null,
  to_value: 'user-2',
  created_at: '2026-07-17T00:30:00.000Z',
}

describe('describeEventActivity', () => {
  const members = new Map([[member.user_id, member]])

  it('names the assigned registered employee', () => {
    expect(describeEventActivity(activity, members)).toBe('Назначено: wife@example.com')
  })

  it('explains status and deadline changes', () => {
    expect(describeEventActivity({ ...activity, activity_type: 'status_changed', from_value: 'todo', to_value: 'review' }, members)).toBe('Статус: К выполнению → На проверке')
    expect(describeEventActivity({ ...activity, activity_type: 'due_date_changed', from_value: '2026-07-20', to_value: null }, members)).toContain('20 июл. 2026 г. → Без срока')
  })
})
