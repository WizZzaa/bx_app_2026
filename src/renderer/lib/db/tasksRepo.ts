import { supabase } from './supabase';
import type { TaskStatus, TaskPriority } from './types';

// Задачи: облако (bx_tasks, RLS) + локальный кэш для офлайн-чтения.
// Интерфейс асинхронный. company_id позволяет фильтровать по компании.

export interface TaskRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  company_id: string | null;
  source: 'manual' | 'tax';
  created_at: string;
}

const CACHE_KEY = 'bx_tasks_cache_v2';

function readCache(): TaskRow[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}
function writeCache(rows: TaskRow[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
}

export const tasksRepo = {
  /** Список задач (опц. по компании). При офлайне возвращает кэш. */
  async list(companyId?: string | null): Promise<TaskRow[]> {
    try {
      let q = supabase.from('bx_tasks').select('*').order('due_date', { ascending: true, nullsFirst: false });
      if (companyId) q = q.eq('company_id', companyId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as TaskRow[];
      writeCache(rows);
      return rows;
    } catch {
      const cache = readCache();
      return companyId ? cache.filter(t => t.company_id === companyId) : cache;
    }
  },

  async add(input: Omit<TaskRow, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('bx_tasks').insert({
      title: input.title,
      status: input.status,
      priority: input.priority,
      due_date: input.due_date,
      company_id: input.company_id,
      source: input.source,
    });
    if (error) throw error;
  },

  async update(id: string, patch: Partial<Pick<TaskRow, 'status' | 'priority' | 'title' | 'due_date'>>): Promise<void> {
    const { error } = await supabase.from('bx_tasks').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('bx_tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async cycleStatus(id: string, current: TaskStatus): Promise<void> {
    const order: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    await this.update(id, { status: next });
  },
};
