import { supabase } from '../../lib/db/supabase';
import { emitPlannerReload } from './plannerBus';
import type { BxEvent, EventKind, EventPriority, EventRecurrence, EventStatus, EventType } from './useEvents';

/**
 * The only write gateway for manually created planner entries.
 *
 * Views are deliberately not allowed to invent their own event shapes: a task
 * started from a note, payment reminder or tray must appear exactly like a
 * task created from Focus, Calendar and Board.
 */
export interface CanonicalEventInput {
  company_id?: string | null;
  type?: EventType;
  title: string;
  date: string;
  due_date?: string | null;
  status?: EventStatus;
  priority?: EventPriority;
  tags?: string[] | null;
  tax_type?: string | null;
  kind?: EventKind;
  regime?: string | null;
  note?: string | null;
  source?: 'manual' | 'tax' | 'seeded';
  source_key?: string | null;
  reminder_at?: string | null;
  recurrence?: EventRecurrence;
  assignee_id?: string | null;
}

export async function createCanonicalEvent(input: CanonicalEventInput): Promise<BxEvent | null> {
  const title = input.title.trim();
  if (!title || !input.date) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload: Record<string, unknown> = {
    user_id: user.id,
    company_id: input.company_id ?? null,
    type: input.type ?? 'task',
    title,
    date: input.date,
    due_date: input.due_date ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'normal',
    tags: input.tags ?? null,
    tax_type: input.tax_type ?? null,
    kind: input.kind ?? null,
    regime: input.regime ?? null,
    note: input.note ?? null,
    source: input.source ?? 'manual',
    source_key: input.source_key ?? null,
    reminder_at: input.reminder_at ?? null,
    recurrence: input.recurrence ?? null,
    assignee_id: input.assignee_id ?? null,
  };

  let { data, error } = await supabase.from('bx_events').insert(payload).select().single();
  // Older self-hosted installations may not have the optional recurrence
  // column yet. A normal task must still be created there.
  if (error && 'recurrence' in payload) {
    delete payload.recurrence;
    ({ data, error } = await supabase.from('bx_events').insert(payload).select().single());
  }
  if (error) {
    console.error('[createCanonicalEvent] failed:', error.message);
    return null;
  }

  emitPlannerReload();
  return data as BxEvent;
}
