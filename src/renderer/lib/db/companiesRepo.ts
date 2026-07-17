import { supabase } from './supabase';
import type { Company, CompanyProfileForm } from './types';

// Компании пользователя (контекст аутсорсера). Облачное хранилище (RLS).
// user_id проставляется в БД через default auth.uid().

export function buildCompanyInsert(input: CompanyProfileForm & { color?: string }) {
  return {
    name: input.name,
    inn: input.inn ?? null,
    regime: input.regime,
    color: input.color ?? null,
    legal_form: input.legal_form,
    profile_details: input.profile_details,
    registration_date: input.registration_date,
    bx_start_date: input.bx_start_date,
    is_vat_payer: input.is_vat_payer,
    work_weekdays: input.work_weekdays,
    notification_channels: input.notification_channels,
    preferred_language: input.preferred_language,
    enabled_obligation_rules: input.enabled_obligation_rules,
    profile_status: 'confirmed',
  };
}

export const companiesRepo = {
  async list(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('bx_companies')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async add(input: CompanyProfileForm & { color?: string }): Promise<Company> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Для создания компании необходимо войти в BX');

    const { data, error } = await supabase
      .from('bx_companies')
      .insert(buildCompanyInsert(input))
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('bx_companies').delete().eq('id', id);
    if (error) throw error;
  },

  async update(
    id: string,
    updates: Partial<CompanyProfileForm> & { color?: string | null; is_active?: boolean },
  ): Promise<Company> {
    const { data, error } = await supabase
      .from('bx_companies')
      .update({ ...updates, profile_status: 'confirmed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
