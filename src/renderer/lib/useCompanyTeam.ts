import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './db/supabase';
import {
  canManageCompanyTeam,
  normalizeInviteEmail,
  type CompanyRole,
  type CompanyTeamMember,
  type IncomingCompanyInvite,
} from './companyTeam';

export function useCompanyTeam(companyId?: string | null) {
  const [members, setMembers] = useState<CompanyTeamMember[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingCompanyInvite[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setCurrentUserId(authData.user?.id ?? null);

      const { data: inviteRows, error: inviteError } = await supabase
        .rpc('get_bx_pending_organization_invites');
      if (inviteError) throw inviteError;
      setIncomingInvites((inviteRows ?? []) as IncomingCompanyInvite[]);

      if (!companyId) {
        setMembers([]);
        return;
      }

      const { data: memberRows, error: memberError } = await supabase
        .from('bx_organization_members')
        .select('id, organization_id, user_id, invited_email, role, status')
        .eq('organization_id', companyId)
        .order('status')
        .order('role')
        .order('invited_email');
      if (memberError) throw memberError;
      setMembers((memberRows ?? []) as CompanyTeamMember[]);
    } catch (loadError) {
      console.error('Не удалось загрузить команду компании:', loadError);
      setMembers([]);
      setIncomingInvites([]);
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить команду');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { void reload(); }, [reload]);

  const invite = useCallback(async (email: string, role: CompanyRole) => {
    if (!companyId) throw new Error('Сначала выберите компанию');
    const invitedEmail = normalizeInviteEmail(email);
    if (!invitedEmail) throw new Error('Укажите email участника');

    const { error: inviteError } = await supabase
      .from('bx_organization_members')
      .insert({
        organization_id: companyId,
        invited_email: invitedEmail,
        role,
        status: 'pending',
      });
    if (inviteError) throw inviteError;
    await reload();
  }, [companyId, reload]);

  const removeMember = useCallback(async (memberId: string) => {
    const { error: removeError } = await supabase
      .from('bx_organization_members')
      .delete()
      .eq('id', memberId);
    if (removeError) throw removeError;
    await reload();
  }, [reload]);

  const acceptInvite = useCallback(async (inviteId: string) => {
    const { data, error: acceptError } = await supabase
      .rpc('accept_bx_organization_invite', { p_invite_id: inviteId });
    if (acceptError) throw acceptError;
    if (!data) throw new Error('Приглашение уже обработано или предназначено другому пользователю');
    await reload();
  }, [reload]);

  const rejectInvite = useCallback(async (inviteId: string) => {
    const { data, error: rejectError } = await supabase
      .rpc('reject_bx_organization_invite', { p_invite_id: inviteId });
    if (rejectError) throw rejectError;
    if (!data) throw new Error('Приглашение уже обработано или предназначено другому пользователю');
    await reload();
  }, [reload]);

  const canManage = useMemo(
    () => canManageCompanyTeam(members, currentUserId),
    [currentUserId, members],
  );

  return {
    members,
    incomingInvites,
    currentUserId,
    canManage,
    loading,
    error,
    reload,
    invite,
    removeMember,
    acceptInvite,
    rejectInvite,
  };
}
