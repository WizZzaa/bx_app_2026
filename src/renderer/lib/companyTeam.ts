export type CompanyRole = 'owner' | 'accountant' | 'assistant' | 'viewer';
export type CompanyMemberStatus = 'pending' | 'active';

export interface CompanyTeamMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  invited_email: string;
  role: CompanyRole;
  status: CompanyMemberStatus;
}

export interface IncomingCompanyInvite {
  id: string;
  invited_email: string;
  role: CompanyRole;
  status: 'pending';
  organization_id: string;
  company_name: string;
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'Владелец',
  accountant: 'Бухгалтер',
  assistant: 'Помощник',
  viewer: 'Наблюдатель',
};

export const COMPANY_ROLE_DESCRIPTIONS: Record<CompanyRole, string> = {
  owner: 'Управляет компанией, командой и задачами',
  accountant: 'Работает с данными компании и назначает задачи',
  assistant: 'Работает с данными компании и назначает задачи',
  viewer: 'Просматривает доступные данные без управления командой',
};

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function canManageCompanyTeam(members: CompanyTeamMember[], userId: string | null): boolean {
  if (!userId) return false;
  return members.some(member => (
    member.status === 'active'
    && member.user_id === userId
    && member.role === 'owner'
  ));
}

export function getCompanyTeamErrorMessage(error: unknown): string {
  const details = typeof error === 'object' && error !== null
    ? error as { message?: unknown; code?: unknown }
    : null;
  const message = error instanceof Error
    ? error.message
    : typeof details?.message === 'string'
      ? details.message
      : String(error ?? '');
  const code = typeof details?.code === 'string' ? details.code : '';
  if (message.includes('duplicate key') || code === '23505') {
    return 'Этот email уже есть в команде или приглашение уже ожидает ответа';
  }
  if (message.includes('row-level security') || code === '42501') {
    return 'Только владелец компании может управлять командой';
  }
  return message || 'Не удалось выполнить действие с командой';
}
