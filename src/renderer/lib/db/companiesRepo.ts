import { supabase } from './supabase';
import type {
  Company,
  CompanyProfileActivity,
  CompanyProfileForm,
  CompanyProfileProposal,
  CompanyProfileRole,
} from './types';

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

export function buildCompanyArchiveUpdate() {
  return { is_active: false } as const;
}

export const companiesRepo = {
  async list(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('bx_companies')
      .select('*')
      .eq('is_active', true)
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
    // Companies can own documents, tasks, payments and team history. Archiving
    // keeps those relations intact and is the only safe user-facing removal.
    const { error } = await supabase.from('bx_companies').update(buildCompanyArchiveUpdate()).eq('id', id);
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

  async role(id: string): Promise<CompanyProfileRole | null> {
    const { data, error } = await supabase.rpc('bx_company_role', { p_company_id: id });
    if (error) throw error;
    return (data as CompanyProfileRole | null) ?? null;
  },

  async saveProfile(
    id: string,
    profile: CompanyProfileForm,
    role: CompanyProfileRole,
  ): Promise<{ kind: 'saved'; company: Company } | { kind: 'proposed'; proposal: CompanyProfileProposal }> {
    if (role === 'assistant') {
      const { data, error } = await supabase
        .rpc('bx_propose_company_profile', { p_company_id: id, p_profile: profile, p_note: null });
      if (error) throw error;
      return { kind: 'proposed', proposal: data as CompanyProfileProposal };
    }
    const { data, error } = await supabase
      .rpc('bx_apply_company_profile', { p_company_id: id, p_profile: profile });
    if (error) throw error;
    return { kind: 'saved', company: data as Company };
  },

  async profileTimeline(id: string): Promise<{
    activity: CompanyProfileActivity[];
    proposals: CompanyProfileProposal[];
  }> {
    const [activityResult, proposalResult] = await Promise.all([
      supabase.from('bx_company_profile_activity').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('bx_company_profile_proposals').select('*').eq('company_id', id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (activityResult.error) throw activityResult.error;
    if (proposalResult.error) throw proposalResult.error;
    return {
      activity: (activityResult.data ?? []) as CompanyProfileActivity[],
      proposals: (proposalResult.data ?? []) as CompanyProfileProposal[],
    };
  },

  async decideProposal(id: string, accept: boolean): Promise<CompanyProfileProposal> {
    const { data, error } = await supabase
      .rpc('bx_decide_company_profile_proposal', { p_proposal_id: id, p_accept: accept });
    if (error) throw error;
    return data as CompanyProfileProposal;
  },
};
