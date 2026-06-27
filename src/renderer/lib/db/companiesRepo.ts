import { supabase } from './supabase';
import type { Company } from './types';

// Компании пользователя (контекст аутсорсера). Облачное хранилище (RLS).
// user_id проставляется в БД через default auth.uid().

export const companiesRepo = {
  async list(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('bx_companies')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async add(input: { name: string; inn?: string; regime?: string; color?: string }): Promise<Company> {
    const { data, error } = await supabase
      .from('bx_companies')
      .insert({ name: input.name, inn: input.inn ?? null, regime: input.regime ?? null, color: input.color ?? null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('bx_companies').delete().eq('id', id);
    if (error) throw error;
  },
};
