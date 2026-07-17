import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/db/supabase';
import { COMPANY_ROLE_LABELS, type CompanyRole } from '../../lib/companyTeam';

export { COMPANY_ROLE_LABELS };
export type { CompanyRole };

export interface CompanyMember {
  id: string;
  organization_id: string;
  user_id: string;
  invited_email: string;
  role: CompanyRole;
  status: 'active';
}

export function useCompanyMembers(companyId?: string | null) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('bx_organization_members')
      .select('id, organization_id, user_id, invited_email, role, status')
      .eq('organization_id', companyId)
      .eq('status', 'active')
      .not('user_id', 'is', null)
      .order('role')
      .order('invited_email');

    if (queryError) {
      console.error('Не удалось загрузить команду компании:', queryError);
      setMembers([]);
      setError(queryError.message);
    } else {
      setMembers((data ?? []) as CompanyMember[]);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { reload(); }, [reload]);

  return { members, loading, error, reload };
}
