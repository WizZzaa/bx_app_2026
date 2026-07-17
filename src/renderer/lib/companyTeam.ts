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

export interface CompanyRoleGuideItem {
  role: CompanyRole;
  shortLabel: string;
  summary: string;
  can: string[];
  cannot: string[];
}

export const COMPANY_ROLE_GUIDE: CompanyRoleGuideItem[] = [
  {
    role: 'owner',
    shortLabel: 'Полный контроль',
    summary: 'Для человека, который отвечает за компанию и выдаёт доступ остальным.',
    can: [
      'Менять профиль и реквизиты компании',
      'Приглашать участников и удалять их доступ',
      'Назначать, переназначать и менять командные задачи',
      'Удалять созданные им задачи; основной владелец может удалить компанию',
    ],
    cannot: [
      'Видеть данные других компаний без отдельного приглашения',
    ],
  },
  {
    role: 'accountant',
    shortLabel: 'Работа и координация',
    summary: 'Для бухгалтера, который ведёт данные компании и координирует задачи.',
    can: [
      'Работать с доступными данными этой компании',
      'Создавать задачи и назначать их участникам команды',
      'Менять статус, срок и исполнителя командных задач',
      'Видеть задачи только начиная с даты вступления в команду',
    ],
    cannot: [
      'Приглашать или удалять участников',
      'Менять профиль компании и удалять компанию',
    ],
  },
  {
    role: 'assistant',
    shortLabel: 'Работа и координация',
    summary: 'Для помощника, которому нужен тот же рабочий контур задач, что и бухгалтеру.',
    can: [
      'Работать с доступными данными этой компании',
      'Создавать задачи и назначать их участникам команды',
      'Менять статус, срок и исполнителя командных задач',
      'Видеть задачи только начиная с даты вступления в команду',
    ],
    cannot: [
      'Приглашать или удалять участников',
      'Менять профиль компании и удалять компанию',
    ],
  },
  {
    role: 'viewer',
    shortLabel: 'Просмотр и свои задачи',
    summary: 'Для проверяющего или руководителя, которому не нужно управлять общей работой.',
    can: [
      'Просматривать доступные данные компании',
      'Создавать свои задачи и работать с назначенными ему задачами',
      'Видеть задачи только начиная с даты вступления в команду',
    ],
    cannot: [
      'Управлять чужими задачами и назначениями',
      'Приглашать участников или менять профиль компании',
      'Удалять компанию',
    ],
  },
];

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
