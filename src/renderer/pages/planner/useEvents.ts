import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/db/supabase';

export type EventType     = 'task' | 'tax_deadline' | 'reminder' | 'event';
export type EventStatus   = 'todo' | 'in_progress' | 'review' | 'done';
export type EventPriority = 'high' | 'normal' | 'low';
export type EventKind     = 'payment' | 'report' | null;

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
  reminder_at: string | null;
  created_at: string;
}

export type NewEvent = Omit<BxEvent, 'id' | 'user_id' | 'created_at'>;

const CACHE_KEY = 'bx_events_cache_v1';

function readCache(): BxEvent[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function writeCache(rows: BxEvent[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
}

export function useEvents(companyId?: string | null) {
  const [events, setEvents] = useState<BxEvent[]>(readCache);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('bx_events').select('*').order('date', { ascending: true });
      if (companyId) q = q.eq('company_id', companyId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as BxEvent[];
      writeCache(rows);
      setEvents(rows);
    } catch {
      setEvents(readCache());
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (input: NewEvent): Promise<BxEvent | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('bx_events').insert({ ...input, user_id: user.id }).select().single();
    if (error) { console.error(error); return null; }
    await load();
    return data as BxEvent;
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<Omit<BxEvent, 'id' | 'user_id' | 'created_at'>>) => {
    const { error } = await supabase.from('bx_events').update(patch).eq('id', id);
    if (error) { console.error(error); return; }
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...patch } : e);
      writeCache(next);
      return next;
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('bx_events').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setEvents(prev => { const next = prev.filter(e => e.id !== id); writeCache(next); return next; });
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    const { error } = await supabase.from('bx_events').delete().in('id', ids);
    if (error) { console.error(error); return; }
    setEvents(prev => { const next = prev.filter(e => !ids.includes(e.id)); writeCache(next); return next; });
  }, []);

  const cycleStatus = useCallback(async (id: string, current: EventStatus) => {
    const order: EventStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await update(id, { status: next });
  }, [update]);

  return { events, loading, reload: load, add, update, remove, bulkRemove, cycleStatus };
}
