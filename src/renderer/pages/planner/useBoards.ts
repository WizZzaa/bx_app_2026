import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/db/supabase';
import { uid } from '../../lib/uid';

export interface BoardColumn {
  id: string;
  title: string;
  color: string;       // tailwind color name: slate | blue | amber | emerald | purple | red | pink | cyan
  wip: number | null;  // WIP limit, null = без лимита
}

export interface BxBoard {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  icon: string;
  color: string;
  columns: BoardColumn[];
  position: number;
  is_default: boolean;
  created_at: string;
}

const CACHE_KEY = 'bx_boards_cache_v1';

export const COLUMN_COLORS = ['slate','blue','amber','emerald','purple','red','pink','cyan'] as const;
export const BOARD_ICONS = ['📋','📊','💼','🏢','💰','📁','🧾','⚖️','🚀','📌','🗂️','✅'];

const col = (title: string, color: string, wip: number | null = null): BoardColumn => ({
  id: uid(), title, color, wip,
});

export function defaultColumns(): BoardColumn[] {
  return [
    col('К выполнению', 'slate'),
    col('В работе',     'blue'),
    col('На проверке',  'amber'),
    col('Готово',       'emerald'),
  ];
}

// Базовые доски, создаются при первом запуске
function baseBoardDefs(): { name: string; icon: string; color: string; columns: BoardColumn[]; is_default: boolean }[] {
  return [
    {
      name: 'Мои задачи', icon: '📋', color: 'blue', is_default: true,
      columns: [col('К выполнению','slate'), col('В работе','blue'), col('На проверке','amber'), col('Готово','emerald')],
    },
    {
      name: 'Отчётность и платежи', icon: '💰', color: 'emerald', is_default: false,
      columns: [col('Подготовить','slate'), col('На проверке','amber'), col('Сдать / оплатить','purple'), col('Сдано','emerald')],
    },
    {
      name: 'Клиенты', icon: '🏢', color: 'purple', is_default: false,
      columns: [col('Новые','slate'), col('В работе','blue'), col('Ждёт документы','amber'), col('Завершено','emerald')],
    },
  ];
}

// Локальный аварийный фолбэк (если облако недоступно) — чтобы UI никогда не зависал
function localBaseBoards(): BxBoard[] {
  const now = new Date().toISOString();
  return baseBoardDefs().map((d, i) => ({
    id: `local-${i}-${d.name}`,
    user_id: 'local',
    company_id: null as string | null,
    name: d.name, icon: d.icon, color: d.color,
    columns: d.columns, position: i, is_default: d.is_default,
    created_at: now,
  }));
}

function readCache(): BxBoard[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function writeCache(rows: BxBoard[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
}

export function useBoards(companyId?: string | null) {
  const [boards, setBoards] = useState<BxBoard[]>(readCache);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: selErr } = await supabase.from('bx_boards').select('*').order('position', { ascending: true });
      if (selErr) throw selErr;
      let rows = (data ?? []) as BxBoard[];

      // Первый запуск — создаём базовые доски в облаке
      if (rows.length === 0) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const seeds = baseBoardDefs().map((d, i) => ({
            user_id: user.id, company_id: null as string | null,
            name: d.name, icon: d.icon, color: d.color,
            columns: d.columns, position: i, is_default: d.is_default,
          }));
          const { data: created, error: insErr } = await supabase.from('bx_boards').insert(seeds).select();
          if (insErr) throw insErr;
          rows = ((created ?? []) as BxBoard[]).sort((a, b) => a.position - b.position);
        } else {
          // нет сессии — показываем локальные базовые доски
          rows = localBaseBoards();
        }
      }

      writeCache(rows);
      if (companyId) {
        setBoards(rows.filter(b => b.company_id === companyId || b.company_id === null));
      } else {
        setBoards(rows);
      }
    } catch (error: unknown) {
      console.error('[useBoards] load failed:', error instanceof Error ? error.message : error);
      setError(error instanceof Error ? error.message : 'Не удалось загрузить доски');
      // Никогда не зависаем: кэш → локальные базовые
      const cached = readCache();
      const finalRows = cached.length ? cached : localBaseBoards();
      if (companyId) {
        setBoards(finalRows.filter(b => b.company_id === companyId || b.company_id === null));
      } else {
        setBoards(finalRows);
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const createBoard = useCallback(async (name: string, icon: string, color: string): Promise<BxBoard | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const maxPos = boards.reduce((m, b) => Math.max(m, b.position), 0);
    const { data, error: insErr } = await supabase.from('bx_boards').insert({
      user_id: user.id, company_id: companyId ?? null,
      name, icon, color, columns: defaultColumns(), position: maxPos + 1, is_default: false,
    }).select().single();
    if (insErr) { console.error(insErr); return null; }
    await load();
    return data as BxBoard;
  }, [boards, companyId, load]);

  const updateBoard = useCallback(async (id: string, patch: Partial<Pick<BxBoard,'name'|'icon'|'color'|'columns'|'position'>>) => {
    setBoards(prev => { const next = prev.map(b => b.id === id ? { ...b, ...patch } : b); writeCache(next); return next; });
    if (id.startsWith('local-')) return; // локальные доски не пишем в облако
    const { error: updErr } = await supabase.from('bx_boards').update(patch).eq('id', id);
    if (updErr) console.error(updErr);
  }, []);

  const deleteBoard = useCallback(async (id: string) => {
    setBoards(prev => { const next = prev.filter(b => b.id !== id); writeCache(next); return next; });
    if (id.startsWith('local-')) return;
    const { error: delErr } = await supabase.from('bx_boards').delete().eq('id', id);
    if (delErr) console.error(delErr);
  }, []);

  return { boards, loading, error, reload: load, createBoard, updateBoard, deleteBoard };
}
