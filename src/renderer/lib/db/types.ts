// Типы строк таблиц Supabase (зеркало схемы БД).

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high';

export type CompanyLegalForm =
  | 'ooo'
  | 'ip'
  | 'joint_venture'
  | 'family_enterprise'
  | 'farm'
  | 'private_enterprise'
  | 'jsc'
  | 'self_employed'
  | 'other';
export type CompanyProfileStatus = 'draft' | 'confirmed';
export type CompanyLanguage = 'ru' | 'uz';
export type CompanyNotificationChannel = 'in_app' | 'desktop';
export type ObligationRuleDecision = 'applies' | 'not_applicable' | 'needs_review';

export interface CompanyProfileDetails {
  owner_name?: string;
  director_name?: string;
  legal_address?: string;
  activity_address?: string;
  bank_name?: string;
  mfo?: string;
  bank_account?: string;
  foreign_partner_country?: string;
  foreign_share_percent?: string;
  share_type?: 'ordinary' | 'preferred' | '';
  farm_region?: string;
  farm_area_hectares?: string;
  farm_specialization?: string;
  seasonal?: boolean;
  primary_activity?: 'trade' | 'services' | 'production' | 'construction' | 'agriculture' | 'other' | '';
  has_employees?: boolean;
  has_import?: boolean;
  has_export?: boolean;
  obligation_rule_decisions?: Record<string, ObligationRuleDecision>;
  custom_legal_form?: string;
}

export interface CompanyProfileInput {
  name: string;
  inn?: string | null;
  regime: string;
  legal_form: CompanyLegalForm;
  profile_details: CompanyProfileDetails;
  registration_date: string | null;
  bx_start_date: string;
  is_vat_payer: boolean;
  work_weekdays: number[];
  notification_channels: CompanyNotificationChannel[];
  preferred_language: CompanyLanguage;
  enabled_obligation_rules: string[];
  profile_status: CompanyProfileStatus;
  profile_confirmed_at: string | null;
  profile_version: number;
}

export type CompanyProfileForm = Omit<
  CompanyProfileInput,
  'profile_status' | 'profile_confirmed_at' | 'profile_version'
>;

export interface Company {
  id: string;
  user_id: string;
  name: string;
  inn: string | null;
  regime: string | null;     // 'ОСН' | 'Налог с оборота' | ...
  color: string | null;      // hex для метки
  is_active: boolean;
  legal_form: CompanyLegalForm | null;
  profile_details: CompanyProfileDetails;
  registration_date: string | null;
  bx_start_date: string | null;
  is_vat_payer: boolean;
  work_weekdays: number[];
  notification_channels: CompanyNotificationChannel[];
  preferred_language: CompanyLanguage;
  enabled_obligation_rules: string[];
  profile_status: CompanyProfileStatus;
  profile_confirmed_at: string | null;
  profile_version: number;
  created_at: string;
}

export type CompanyProfileRole = 'owner' | 'accountant' | 'assistant' | 'viewer';

export interface CompanyProfileActivity {
  id: string;
  company_id: string;
  actor_id: string | null;
  action: 'profile_changed' | 'proposal_accepted' | 'proposal_rejected';
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: string;
}

export interface CompanyProfileProposal {
  id: string;
  company_id: string;
  proposer_id: string;
  proposed_state: CompanyProfileForm;
  note: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;       // YYYY-MM-DD
  calendar_event_id: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  task_id: string | null;
  company_id: string | null;
  remind_at: string;             // timestamptz
  message: string;
  is_sent: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  company_id: string | null;
  tax_calendar_id: string | null;
  title: string;
  date: string;                  // YYYY-MM-DD
  type: 'tax' | 'report' | 'custom';
  created_at: string;
}

// --- Справочники ---
export interface TaxCalendarTemplate {
  id: string;
  title: string;
  description: string | null;
  tax_type: string | null;       // 'НДС' | 'Прибыль' | ...
  regime: string | null;
  month: number | null;          // 1..12; null = ежемесячно
  day: number;                   // день срока
  kind: 'payment' | 'report';
}
