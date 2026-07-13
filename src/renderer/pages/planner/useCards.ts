import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/db/supabase';
import type { BoardColumn } from './useBoards';
import { emitPlannerReload, subscribePlannerReload } from './plannerBus';
import type { BxEvent } from './useEvents';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface BxCard {
  id: string;
  user_id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'normal' | 'low';
  labels: string[] | null;
  checklist: ChecklistItem[];
  due_date: string | null;
  start_date: string | null;
  cover_color: string | null;
  position: number;
  archived: boolean;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BxComment {
  id: string;
  card_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export type NewCard = {
  board_id: string;
  column_id: string;
  title: string;
  description?: string | null;
  priority?: 'high' | 'normal' | 'low';
  labels?: string[] | null;
  due_date?: string | null;
};

const cacheKey = (boardId: string) => `bx_cards_cache_${boardId}`;

function readCache(boardId: string): BxCard[] {
  try { return JSON.parse(localStorage.getItem(cacheKey(boardId)) || '[]'); } catch { return []; }
}
function writeCache(boardId: string, rows: BxCard[]) {
  localStorage.setItem(cacheKey(boardId), JSON.stringify(rows));
}

async function syncLinkedEventStatus(cardId: string, columnId: string, boardId: string) {
  try {
    const { data: card } = await supabase.from('bx_cards').select('event_id').eq('id', cardId).single();
    if (!card || !card.event_id) return;

    const { data: board } = await supabase.from('bx_boards').select('columns').eq('id', boardId).single();
    if (!board || !board.columns || board.columns.length === 0) return;

    const cols = board.columns as any[];
    const lastColId = cols[cols.length - 1].id;
    const isDone = columnId === lastColId;

    await supabase.from('bx_events').update({
      status: isDone ? 'done' : 'todo',
      updated_at: new Date().toISOString()
    }).eq('id', card.event_id);
    
    emitPlannerReload();
  } catch (e) {
    console.error('Failed to sync linked event status:', e);
  }
}

export function useCards(boardId: string | null) {
  const [cards, setCards] = useState<BxCard[]>(() => boardId ? readCache(boardId) : []);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!boardId) { setCards([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bx_cards').select('*')
        .eq('board_id', boardId).eq('archived', false)
        .order('position', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as BxCard[];
      writeCache(boardId, rows);
      setCards(rows);
    } catch {
      setCards(readCache(boardId));
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { load(); }, [load]);

  // Доска перечитывается по общей шине планировщика — чтобы правки событий,
  // двигающие связанную карточку, сразу отражались на Kanban.
  useEffect(() => subscribePlannerReload(load), [load]);

  const addCard = useCallback(async (input: NewCard): Promise<BxCard | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const colCards = cards.filter(c => c.column_id === input.column_id);
    const maxPos = colCards.reduce((m, c) => Math.max(m, c.position), 0);
    const row = {
      user_id: user.id,
      board_id: input.board_id,
      column_id: input.column_id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'normal',
      labels: input.labels ?? null,
      checklist: [] as ChecklistItem[],
      due_date: input.due_date ?? null,
      position: maxPos + 1,
    };
    const { data, error } = await supabase.from('bx_cards').insert(row).select().single();
    if (error) { console.error(error); return null; }
    setCards(prev => { const next = [...prev, data as BxCard]; if (boardId) writeCache(boardId, next); return next; });
    return data as BxCard;
  }, [cards, boardId]);

  const updateCard = useCallback(async (id: string, patch: Partial<Omit<BxCard,'id'|'user_id'|'created_at'>>) => {
    const withTs = { ...patch, updated_at: new Date().toISOString() };
    setCards(prev => { const next = prev.map(c => c.id === id ? { ...c, ...withTs } : c); if (boardId) writeCache(boardId, next); return next; });
    const { error } = await supabase.from('bx_cards').update(withTs).eq('id', id);
    if (error) console.error(error);
    if (patch.column_id && boardId) {
      syncLinkedEventStatus(id, patch.column_id, boardId).catch((err: any): void => console.warn(err));
    }
  }, [boardId]);

  const removeCard = useCallback(async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card && card.event_id) {
      await supabase.from('bx_events').delete().eq('id', card.event_id);
    }
    setCards(prev => { const next = prev.filter(c => c.id !== id); if (boardId) writeCache(boardId, next); return next; });
    const { error } = await supabase.from('bx_cards').delete().eq('id', id);
    if (error) console.error(error);
    emitPlannerReload();
  }, [cards, boardId]);

  const archiveCard = useCallback(async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (card && card.event_id) {
      await supabase.from('bx_events').delete().eq('id', card.event_id);
    }
    setCards(prev => { const next = prev.filter(c => c.id !== id); if (boardId) writeCache(boardId, next); return next; });
    const { error } = await supabase.from('bx_cards').update({ archived: true, event_id: null }).eq('id', id);
    if (error) console.error(error);
    emitPlannerReload();
  }, [cards, boardId]);

  // ─── Архив ────────────────────────────────────────────────────────────
  const loadArchived = useCallback(async (): Promise<BxCard[]> => {
    if (!boardId) return [];
    const { data, error } = await supabase
      .from('bx_cards').select('*')
      .eq('board_id', boardId).eq('archived', true)
      .order('updated_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []) as BxCard[];
  }, [boardId]);

  const restoreCard = useCallback(async (id: string) => {
    const { error } = await supabase.from('bx_cards').update({ archived: false }).eq('id', id);
    if (error) { console.error(error); return; }
    await load();
  }, [load]);

  // ─── Дубликат ─────────────────────────────────────────────────────────
  const duplicateCard = useCallback(async (src: BxCard): Promise<BxCard | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const colCards = cards.filter(c => c.column_id === src.column_id);
    const maxPos = colCards.reduce((m, c) => Math.max(m, c.position), 0);
    const row = {
      user_id: user.id,
      board_id: src.board_id,
      column_id: src.column_id,
      title: `${src.title} (копия)`,
      description: src.description,
      priority: src.priority,
      labels: src.labels,
      checklist: (src.checklist ?? []).map(i => ({ ...i })),
      due_date: src.due_date,
      start_date: src.start_date,
      cover_color: src.cover_color,
      position: maxPos + 1,
    };
    const { data, error } = await supabase.from('bx_cards').insert(row).select().single();
    if (error) { console.error(error); return null; }
    setCards(prev => { const next = [...prev, data as BxCard]; if (boardId) writeCache(boardId, next); return next; });
    return data as BxCard;
  }, [cards, boardId]);

  // Перемещение карточки в колонку на позицию index (drag&drop)
  const moveCard = useCallback(async (cardId: string, toColumn: string, beforeCardId: string | null) => {
    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card) return prev;
      // карточки целевой колонки без самой перемещаемой
      const target = prev.filter(c => c.column_id === toColumn && c.id !== cardId).sort((a,b) => a.position - b.position);
      let newPos: number;
      if (beforeCardId === null) {
        // в конец
        newPos = target.length ? target[target.length - 1].position + 1 : 1;
      } else {
        const idx = target.findIndex(c => c.id === beforeCardId);
        if (idx <= 0) {
          newPos = target.length ? target[0].position - 1 : 1;
        } else {
          newPos = (target[idx - 1].position + target[idx].position) / 2;
        }
      }
      const next = prev.map(c => c.id === cardId ? { ...c, column_id: toColumn, position: newPos } : c);
      if (boardId) writeCache(boardId, next);
      // persist
      supabase.from('bx_cards').update({ column_id: toColumn, position: newPos, updated_at: new Date().toISOString() }).eq('id', cardId)
        .then(({ error }) => { if (error) console.error(error); });
      if (boardId) {
        syncLinkedEventStatus(cardId, toColumn, boardId).catch((err: any): void => console.warn(err));
      }
      return next;
    });
  }, [boardId]);

  // ─── Комментарии ──────────────────────────────────────────────────────
  const loadComments = useCallback(async (cardId: string): Promise<BxComment[]> => {
    const { data, error } = await supabase.from('bx_card_comments').select('*').eq('card_id', cardId).order('created_at', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []) as BxComment[];
  }, []);

  const addComment = useCallback(async (cardId: string, body: string): Promise<BxComment | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('bx_card_comments').insert({ card_id: cardId, user_id: user.id, body }).select().single();
    if (error) { console.error(error); return null; }
    return data as BxComment;
  }, []);

  const removeComment = useCallback(async (id: string) => {
    const { error } = await supabase.from('bx_card_comments').delete().eq('id', id);
    if (error) console.error(error);
  }, []);

  return {
    cards, loading, reload: load,
    addCard, updateCard, removeCard, archiveCard, moveCard,
    loadArchived, restoreCard, duplicateCard,
    loadComments, addComment, removeComment,
  };
}

// Отдельный хук: карточки со сроком по ВСЕМ доскам — для Календаря
export interface DatedCard { id: string; title: string; due_date: string; board_id: string; column_id: string; priority: string; event_id: string | null; }

export async function fetchDatedCards(): Promise<DatedCard[]> {
  const { data, error } = await supabase
    .from('bx_cards')
    .select('id,title,due_date,board_id,column_id,priority,event_id')
    .not('due_date', 'is', null)
    .eq('archived', false);
  if (error) { console.error(error); return []; }
  return (data ?? []) as DatedCard[];
}

export async function fetchCardById(id: string): Promise<BxCard | null> {
  const { data, error } = await supabase.from('bx_cards').select('*').eq('id', id).single();
  if (error) { console.error(error); return null; }
  return data as BxCard;
}

/** Все неархивные карточки со всех досок — для вкладки «Все задачи». */
export interface AllCard {
  id: string; title: string; due_date: string | null;
  board_id: string; column_id: string; priority: string; event_id: string | null;
}

export async function fetchAllCards(): Promise<AllCard[]> {
  const { data, error } = await supabase
    .from('bx_cards')
    .select('id,title,due_date,board_id,column_id,priority,event_id')
    .eq('archived', false)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) { console.error(error); return []; }
  return (data ?? []) as AllCard[];
}

export async function fetchBoardColumns(boardId: string): Promise<BoardColumn[]> {
  const { data, error } = await supabase
    .from('bx_boards')
    .select('columns')
    .eq('id', boardId)
    .single();
  if (error) {
    console.error(error);
    return [];
  }
  return (data?.columns ?? []) as BoardColumn[];
}

export async function toggleCardDone(cardId: string, boardId: string, makeDone: boolean): Promise<string | null> {
  const { data: board, error: bError } = await supabase
    .from('bx_boards')
    .select('columns')
    .eq('id', boardId)
    .single();
  if (bError || !board || !board.columns || board.columns.length === 0) return null;
  const cols = board.columns as BoardColumn[];
  const targetCol = makeDone ? cols[cols.length - 1] : cols[0];
  if (!targetCol) return null;

  const { error } = await supabase
    .from('bx_cards')
    .update({ column_id: targetCol.id, updated_at: new Date().toISOString() })
    .eq('id', cardId);
  if (error) {
    console.error(error);
    return null;
  }
  syncLinkedEventStatus(cardId, targetCol.id, boardId).catch((err: any): void => console.warn(err));
  return targetCol.id;
}

export async function createCardFromEvent(event: BxEvent, companyId: string | null): Promise<BxCard | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let board: any = null;

  if (companyId) {
    const { data: companyBoards } = await supabase
      .from('bx_boards')
      .select('*')
      .eq('company_id', companyId)
      .order('position', { ascending: true });
    if (companyBoards && companyBoards.length > 0) {
      board = companyBoards.find(b => b.is_default) || companyBoards[0];
    }
  }

  if (!board) {
    const { data: globalBoards } = await supabase
      .from('bx_boards')
      .select('*')
      .is('company_id', null)
      .order('position', { ascending: true });
    if (globalBoards && globalBoards.length > 0) {
      board = globalBoards.find(b => b.is_default) || globalBoards[0];
    }
  }

  if (!board) {
    return null;
  }

  const columns = board.columns as any[];
  if (!columns || columns.length === 0) return null;
  const firstColId = columns[0].id;

  const { data: existingCards } = await supabase
    .from('bx_cards')
    .select('position')
    .eq('board_id', board.id)
    .eq('column_id', firstColId);

  const maxPos = (existingCards ?? []).reduce((m, c) => Math.max(m, c.position), 0);

  const row = {
    user_id: user.id,
    board_id: board.id,
    column_id: firstColId,
    title: event.title,
    description: event.note || `Дедлайн: ${event.due_date || event.date}. Источник: Налоговый календарь Узбекистана.`,
    priority: event.priority || 'normal',
    labels: event.tags || [],
    checklist: [],
    due_date: event.due_date || event.date,
    position: maxPos + 1,
    event_id: event.id
  };

  const { data: newCard, error } = await supabase
    .from('bx_cards')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Failed to create card from event:', error);
    return null;
  }

  // Обновим статус события на todo, так как к нему привязана активная карточка
  await supabase
    .from('bx_events')
    .update({ status: 'todo' })
    .eq('id', event.id);

  emitPlannerReload();
  return newCard as BxCard;
}
