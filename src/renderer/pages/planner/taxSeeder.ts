import { supabase } from '../../lib/db/supabase';
import { taxDeadlines } from '../../data/taxCalendar';
import type { NewEvent } from './useEvents';
import { todayISO, toLocalISO } from '../../lib/dates';
import type { TaxDeadline } from '../../data/taxCalendar';

const TAX_CALENDAR_YEAR = 2026;
export const TAX_HORIZON_DAYS = 60;

type CompanyRegime = string;

export interface CompanyTaxProfile {
  regime: CompanyRegime;
  bxStartDate: string;
  enabledObligationRules: string[];
  assigneeId?: string | null;
}

export interface TaxDeadlineRuleOption {
  id: string;
  title: string;
  taxType: string;
  kind: TaxDeadline['kind'];
  regime: string;
  dates: string[];
  defaultSelected: boolean;
}

export interface TaxDeadlineSyncResult {
  added: number;
  removed: number;
}

function addDaysISO(base: string, days: number): string {
  const [year, month, day] = base.split('-').map(Number);
  return toLocalISO(new Date(year, month - 1, day + days));
}

function datesForDeadline(deadline: TaxDeadline, from: string, to: string, notBefore: string): string[] {
  const months = deadline.month === null
    ? Array.from({ length: 12 }, (_, index) => index + 1)
    : [deadline.month];

  return months
    .map(month => `${TAX_CALENDAR_YEAR}-${String(month).padStart(2, '0')}-${String(deadline.day).padStart(2, '0')}`)
    .filter(date => date >= from && date >= notBefore && date <= to);
}

export function buildTaxDeadlineRuleOptions(
  companyRegime: CompanyRegime,
  bxStartDate: string,
  from = todayISO(),
  horizonDays = TAX_HORIZON_DAYS,
): TaxDeadlineRuleOption[] {
  const to = addDaysISO(from, Math.max(0, horizonDays));
  const notBefore = bxStartDate > from ? bxStartDate : from;

  return taxDeadlines
    .filter(deadline => deadline.verified)
    .filter(deadline => deadline.regime === 'все' || deadline.regime === companyRegime)
    .map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      taxType: deadline.taxType,
      kind: deadline.kind,
      regime: deadline.regime,
      dates: datesForDeadline(deadline, from, to, notBefore),
      // Общие правила часто условны. Их владелец выбирает вручную.
      defaultSelected: deadline.regime !== 'все',
    }))
    .filter(rule => rule.dates.length > 0);
}

/**
 * Строит только подтверждённые обязательства внутри скользящего горизонта.
 * Прошлые даты не создаются и никогда автоматически не отмечаются выполненными.
 */
export function buildTaxDeadlineEvents(
  companyId: string,
  profile: CompanyTaxProfile,
  from = todayISO(),
  horizonDays = TAX_HORIZON_DAYS,
): NewEvent[] {
  const to = addDaysISO(from, Math.max(0, horizonDays));
  const notBefore = profile.bxStartDate > from ? profile.bxStartDate : from;
  const enabledRules = new Set(profile.enabledObligationRules);
  const events: NewEvent[] = [];

  for (const deadline of taxDeadlines) {
    if (!deadline.verified) continue;
    if (!enabledRules.has(deadline.id)) continue;
    if (deadline.regime !== 'все' && deadline.regime !== profile.regime) continue;

    for (const date of datesForDeadline(deadline, from, to, notBefore)) {

      events.push({
        company_id: companyId,
        type: 'tax_deadline',
        title: deadline.title,
        date,
        due_date: date,
        status: 'todo',
        priority: deadline.kind === 'payment' || deadline.kind === 'both' ? 'high' : 'normal',
        tags: [deadline.taxType],
        tax_type: deadline.taxType,
        kind: deadline.kind,
        regime: deadline.regime,
        note: deadline.note ?? null,
        source: 'seeded',
        source_key: `tax:${deadline.id}:${date}`,
        reminder_at: null,
        recurrence: null,
        assignee_id: profile.assigneeId ?? null,
      });
    }
  }

  return events;
}

/**
 * Продлевает 60-дневный горизонт для одной активной компании.
 * Проверка выполняется по данным Supabase, поэтому очистка localStorage или
 * повторный запуск приложения не создают новые копии событий.
 */
export async function syncTaxDeadlines(
  userId: string,
  companyId: string,
  horizonDays = TAX_HORIZON_DAYS,
): Promise<TaxDeadlineSyncResult> {
  const { data: company, error: companyError } = await supabase
    .from('bx_companies')
    .select('regime, is_active, bx_start_date, enabled_obligation_rules, profile_status')
    .eq('id', companyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (companyError) throw companyError;
  if (
    !company?.is_active
    || !company.regime
    || !company.bx_start_date
    || company.profile_status !== 'confirmed'
  ) {
    console.warn('Tax deadlines skipped: company profile is inactive, incomplete, or not confirmed');
    return { added: 0, removed: 0 };
  }

  const from = todayISO();
  const to = addDaysISO(from, Math.max(0, horizonDays));
  const candidates = buildTaxDeadlineEvents(companyId, {
    regime: company.regime,
    bxStartDate: company.bx_start_date,
    enabledObligationRules: company.enabled_obligation_rules ?? [],
    assigneeId: userId,
  }, from, horizonDays);
  const { data: existing, error: existingError } = await supabase
    .from('bx_events')
    .select('id, source_key, status')
    .eq('company_id', companyId)
    .eq('source', 'seeded')
    .gte('date', from)
    .lte('date', to);

  if (existingError) throw existingError;

  const candidateKeys = new Set(candidates.map(event => event.source_key).filter(Boolean));
  const existingKeys = new Set((existing ?? []).map(event => event.source_key).filter(Boolean));
  const obsoleteIds = (existing ?? [])
    .filter(event => event.status !== 'done' && event.source_key && !candidateKeys.has(event.source_key))
    .map(event => event.id);
  const missing = candidates.filter(event => event.source_key && !existingKeys.has(event.source_key));

  if (obsoleteIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('bx_events')
      .delete()
      .in('id', obsoleteIds);
    if (deleteError) throw deleteError;
  }

  if (missing.length > 0) {
    const { error: insertError } = await supabase
      .from('bx_events')
      .upsert(missing.map(event => ({ ...event, user_id: userId })), {
        onConflict: 'user_id,company_id,source_key',
        ignoreDuplicates: true,
      });

    if (insertError) throw insertError;
  }

  return { added: missing.length, removed: obsoleteIds.length };
}

export async function seedTaxDeadlines(
  userId: string,
  companyId: string,
  horizonDays = TAX_HORIZON_DAYS,
): Promise<number> {
  const result = await syncTaxDeadlines(userId, companyId, horizonDays);
  return result.added;
}
