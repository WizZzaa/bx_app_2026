import { describe, expect, it } from 'vitest';
import { groupEventsByStatus } from './SystemTaskBoard';
import type { BxEvent } from './useEvents';

const event = (id: string, status: BxEvent['status'], date: string): BxEvent => ({
  id,
  user_id: 'user-1',
  company_id: 'company-1',
  type: 'task',
  title: `Task ${id}`,
  date,
  due_date: date,
  status,
  priority: 'normal',
  tags: null,
  tax_type: null,
  kind: null,
  regime: null,
  note: null,
  source: 'manual',
  source_key: null,
  reminder_at: null,
  recurrence: null,
  assignee_id: null,
  created_at: '2026-07-16T00:00:00Z',
});

describe('groupEventsByStatus', () => {
  it('uses the canonical event status as board columns', () => {
    const groups = groupEventsByStatus([
      event('later', 'todo', '2026-07-18'),
      event('active', 'in_progress', '2026-07-16'),
      event('earlier', 'todo', '2026-07-17'),
    ]);

    expect(groups.todo.map(item => item.id)).toEqual(['earlier', 'later']);
    expect(groups.in_progress.map(item => item.id)).toEqual(['active']);
    expect(groups.review).toEqual([]);
  });
});
