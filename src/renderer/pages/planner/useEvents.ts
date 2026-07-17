import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/db/supabase';
import { emitPlannerReload, subscribePlannerReload } from './plannerBus';
import { createCanonicalEvent } from './eventRepository';

export type EventType     = 'task' | 'tax_deadline' | 'reminder' | 'event';
export type EventStatus   = 'todo' | 'in_progress' | 'review' | 'done';
export type EventPriority = 'high' | 'normal' | 'low';
export type EventKind     = 'payment' | 'report' | 'both' | null;
export type EventRecurrence = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;

export interface BxEvent {
  id: string;
  user_id: string;
  company_id: string | null;
  type: EventType;
  title: string;
  date: string;        // YYYY-MM-DD
  due_date: string | null;
  status: EventStatus;
  priority: EventPriority;
  tags: string[] | null;
  tax_type: string | null;
  kind: EventKind;
  regime: string | null;
  note: string | null;
  source: 'manual' | 'tax' | 'seeded';
  source_key?: string | null;
  reminder_at: string | null;
  recurrence?: EventRecurrence; // требует колонку bx_events.recurrence
  assignee_id: string | null;
  created_at: string;
}

export type NewEvent = Omit<BxEvent, 'id' | 'user_id' | 'created_at'>;

export const EVENTS_PAGE_SIZE = 1000;

export async function collectEventPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = EVENTS_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function useEvents(companyId?: string | null) {
  const [events, setEvents] = useState<BxEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await collectEventPages<BxEvent>(async (from, to) => {
        let query = supabase
          .from('bx_events')
          .select('*')
          .order('date', { ascending: true })
          .order('created_at', { ascending: true })
          .order('id', { ascending: true });
        if (companyId) query = query.eq('company_id', companyId);
        const { data, error: pageError } = await query.range(from, to);
        if (pageError) throw pageError;
        return (data ?? []) as BxEvent[];
      });
      if (version === loadVersion.current) setEvents(rows);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Не удалось загрузить события';
      console.error('[useEvents] load failed:', message);
      if (version === loadVersion.current) setError(message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => subscribePlannerReload(load), [load]);

  const add = useCallback(async (input: NewEvent): Promise<BxEvent | null> => {
    const createdEvent = await createCanonicalEvent(input);
    if (!createdEvent) return null;
    await load();
    return createdEvent;
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<Omit<BxEvent, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> => {
    const { error } = await supabase.from('bx_events').update(patch).eq('id', id);
    if (error) { console.error(error); return false; }
    
    setEvents(prev => {
      return prev.map(e => e.id === id ? { ...e, ...patch } : e);
    });

    emitPlannerReload();
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('bx_events').delete().eq('id', id);
    if (error) { console.error(error); return false; }
    setEvents(prev => prev.filter(e => e.id !== id));

    emitPlannerReload();
    return true;
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    const { error } = await supabase.from('bx_events').delete().in('id', ids);
    if (error) { console.error(error); return; }
    setEvents(prev => prev.filter(e => !ids.includes(e.id)));

    emitPlannerReload();
  }, []);

  const cycleStatus = useCallback(async (id: string, current: EventStatus) => {
    const order: EventStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await update(id, { status: next });
  }, [update]);

  return { events, loading, error, reload: load, add, update, remove, bulkRemove, cycleStatus };
}
