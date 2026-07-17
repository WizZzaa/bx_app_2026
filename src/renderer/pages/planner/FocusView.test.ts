import { describe, expect, it } from 'vitest';
import { buildFocusGroups } from './FocusView';
import type { BxEvent } from './useEvents';

const event = (id: string, date: string, companyId: string | null, status: BxEvent['status'] = 'todo'): BxEvent => ({
  id,
  user_id: 'user-1',
  company_id: companyId,
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
  reminder_at: null,
  recurrence: null,
  assignee_id: null,
  created_at: '2026-07-16T00:00:00Z',
});

describe('buildFocusGroups', () => {
  it('keeps overdue and next 14 days, grouped by date and company', () => {
    const groups = buildFocusGroups([
      event('overdue', '2026-07-15', 'company-1'),
      event('today', '2026-07-16', 'company-2'),
      event('last-day', '2026-07-29', 'company-1'),
      event('later', '2026-07-30', 'company-1'),
      event('done', '2026-07-16', 'company-1', 'done'),
    ], '2026-07-29');

    expect(groups.map(group => group.date)).toEqual(['2026-07-15', '2026-07-16', '2026-07-29']);
    expect(groups.flatMap(group => group.companies).flatMap(group => group.events).map(item => item.id))
      .toEqual(['overdue', 'today', 'last-day']);
  });
});
