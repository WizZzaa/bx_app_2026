import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/db/supabase';
import { emitPlannerReload, subscribePlannerReload } from './plannerBus';

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
  reminder_at: string | null;
  recurrence?: EventRecurrence; // требует колонку bx_events.recurrence
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

// Синк событие→карточка: правка события переносится на связанную карточку
// (статус → колонка, а также срок и заголовок).
async function syncLinkedCard(
  eventId: string,
  patch: { status?: EventStatus; due_date?: string | null; date?: string; title?: string }
) {
  try {
    const { data: card } = await supabase
      .from('bx_cards')
      .select('id, board_id')
      .eq('event_id', eventId)
      .eq('archived', false)
      .maybeSingle();
    if (!card) return;

    const cardPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.due_date !== undefined) cardPatch.due_date = patch.due_date;
    else if (patch.date !== undefined) cardPatch.due_date = patch.date;
    if (patch.title !== undefined) cardPatch.title = patch.title;

    if (patch.status !== undefined) {
      const { data: board } = await supabase
        .from('bx_boards')
        .select('columns')
        .eq('id', card.board_id)
        .maybeSingle();
      const cols = (board?.columns as any[]) ?? [];
      if (cols.length) {
        const targetCol = patch.status === 'done' ? cols[cols.length - 1] : cols[0];
        if (targetCol) cardPatch.column_id = targetCol.id;
      }
    }

    if (Object.keys(cardPatch).length > 1) {
      await supabase.from('bx_cards').update(cardPatch).eq('id', card.id);
    }
  } catch {
    // карточка не найдена / нет связи — не критично
  }
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

  useEffect(() => subscribePlannerReload(load), [load]);

  const add = useCallback(async (input: NewEvent): Promise<BxEvent | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const payload: Record<string, unknown> = { ...input, user_id: user.id };
    if (payload.recurrence == null) delete payload.recurrence;
    let { data, error } = await supabase.from('bx_events').insert(payload).select().single();
    if (error && 'recurrence' in payload) {
      console.warn('bx_events.recurrence недоступна, событие сохранено без повторения:', error.message);
      delete payload.recurrence;
      ({ data, error } = await supabase.from('bx_events').insert(payload).select().single());
    }
    if (error) { console.error(error); return null; }
    await load();

    emitPlannerReload();

    return data as BxEvent;
  }, [load]);

  const update = useCallback(async (id: string, patch: Partial<Omit<BxEvent, 'id' | 'user_id' | 'created_at'>>) => {
    const { error } = await supabase.from('bx_events').update(patch).eq('id', id);
    if (error) { console.error(error); return; }
    
    if (patch.status !== undefined || patch.due_date !== undefined || patch.date !== undefined || patch.title !== undefined) {
      await syncLinkedCard(id, patch);
    }

    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...patch } : e);
      writeCache(next);
      return next;
    });

    emitPlannerReload();
  }, []);

  const remove = useCallback(async (id: string) => {
    // Сначала сбрасываем ссылку на удаляемое событие в карточках
    await supabase.from('bx_cards').update({ event_id: null, updated_at: new Date().toISOString() }).eq('event_id', id);

    const { error } = await supabase.from('bx_events').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setEvents(prev => { const next = prev.filter(e => e.id !== id); writeCache(next); return next; });

    emitPlannerReload();
  }, []);

  const bulkRemove = useCallback(async (ids: string[]) => {
    // Сначала сбрасываем ссылку на удаляемые события в карточках
    await supabase.from('bx_cards').update({ event_id: null, updated_at: new Date().toISOString() }).in('event_id', ids);

    const { error } = await supabase.from('bx_events').delete().in('id', ids);
    if (error) { console.error(error); return; }
    setEvents(prev => { const next = prev.filter(e => !ids.includes(e.id)); writeCache(next); return next; });

    emitPlannerReload();
  }, []);

  const cycleStatus = useCallback(async (id: string, current: EventStatus) => {
    const order: EventStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await update(id, { status: next });
  }, [update]);

  return { events, loading, reload: load, add, update, remove, bulkRemove, cycleStatus };
}
