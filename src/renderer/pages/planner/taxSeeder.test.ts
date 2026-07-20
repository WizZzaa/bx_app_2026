import { describe, expect, it } from 'vitest';
import type { TaxDeadline } from '../../data/taxCalendar';
import {
  buildPreservedTaxDeadlineSourceKeys,
  buildTaxDeadlineEvents,
  buildTaxDeadlineRuleOptions,
  TAX_HORIZON_DAYS,
} from './taxSeeder';

const EDITORIAL_APPROVAL = {
  verified: true,
  sourceUrl: 'https://lex.uz/docs/4674902',
  verifiedAt: '2026-07-01',
  reviewedBy: 'Тестовый редактор',
  nextReviewAt: '2026-12-31',
  editorialStatus: 'approved' as const,
};

function approvedDeadline(overrides: Partial<TaxDeadline>): TaxDeadline {
  return {
    id: 'base',
    title: 'Тестовое обязательство',
    taxType: 'Тест',
    kind: 'both',
    day: 20,
    month: null,
    regime: 'ОСН',
    law: 'Тестовая статья',
    ...EDITORIAL_APPROVAL,
    ...overrides,
  };
}

const TEST_DEADLINES: TaxDeadline[] = [
  approvedDeadline({ id: 'vat-report', title: 'НДС — отчётность', taxType: 'НДС', selectionPolicy: 'vat' }),
  approvedDeadline({ id: 'profit-q2-report', title: 'Прибыль — II квартал', taxType: 'Прибыль', month: 7, selectionPolicy: 'core' }),
  approvedDeadline({ id: 'profit-q3-report', title: 'Прибыль — III квартал', taxType: 'Прибыль', month: 10, selectionPolicy: 'core' }),
  approvedDeadline({ id: 'excise-report', title: 'Акциз', taxType: 'Акциз', day: 10, regime: 'все' }),
  approvedDeadline({ id: 'pit-report', title: 'НДФЛ и соцналог', taxType: 'НДФЛ', day: 15, regime: 'все', selectionPolicy: 'employees' }),
  approvedDeadline({ id: 'turnover-report', title: 'Налог с оборота', taxType: 'Оборот', day: 15, regime: 'Налог с оборота', selectionPolicy: 'core' }),
];

const OSN_PROFILE = {
  regime: 'ОСН',
  bxStartDate: '2026-07-16',
  enabledObligationRules: ['vat-report', 'profit-q2-report', 'excise-report'],
};

function buildApprovedEvents(
  profile = OSN_PROFILE,
  from = '2026-07-16',
  horizonDays = TAX_HORIZON_DAYS,
) {
  return buildTaxDeadlineEvents('company-1', profile, from, horizonDays, TEST_DEADLINES);
}

function buildApprovedOptions(traits: { isVatPayer?: boolean; hasEmployees?: boolean } = {}) {
  return buildTaxDeadlineRuleOptions('ОСН', '2026-07-16', '2026-07-16', 60, traits, TEST_DEADLINES);
}

describe('buildTaxDeadlineEvents', () => {
  it('creates only editorially approved future obligations inside the rolling company horizon', () => {
    const events = buildApprovedEvents();

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => event.company_id === 'company-1')).toBe(true);
    expect(events.every(event => event.date >= '2026-07-16' && event.date <= '2026-09-14')).toBe(true);
    expect(events.every(event => event.status === 'todo' && event.source === 'seeded')).toBe(true);
  });

  it('does not create obligations for a tax regime that does not apply', () => {
    const events = buildTaxDeadlineEvents('company-1', {
      regime: 'Налог с оборота',
      bxStartDate: '2026-07-16',
      enabledObligationRules: ['turnover-report', 'vat-report'],
    }, '2026-07-16', 60, TEST_DEADLINES);

    expect(events.some(event => event.regime === 'ОСН')).toBe(false);
    expect(events.some(event => event.source_key?.startsWith('tax:turnover-report:'))).toBe(true);
  });

  it('does not extrapolate the reviewed 2026 calendar into another year', () => {
    expect(buildApprovedEvents(OSN_PROFILE, '2027-01-01', 60)).toEqual([]);
  });

  it('never creates an obligation before the company BX start date', () => {
    const events = buildApprovedEvents({ ...OSN_PROFILE, bxStartDate: '2026-08-01' });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => event.date >= '2026-08-01')).toBe(true);
  });

  it('creates only rules explicitly confirmed by the owner', () => {
    const events = buildApprovedEvents({ ...OSN_PROFILE, enabledObligationRules: ['vat-report'] });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => event.source_key?.startsWith('tax:vat-report:'))).toBe(true);
  });

  it('rejects the legacy verified flag without full editorial metadata', () => {
    const legacy = approvedDeadline({
      id: 'legacy',
      sourceUrl: undefined,
      verifiedAt: undefined,
      reviewedBy: undefined,
      nextReviewAt: undefined,
      editorialStatus: undefined,
    });
    const events = buildTaxDeadlineEvents('company-1', {
      ...OSN_PROFILE,
      enabledObligationRules: ['legacy'],
    }, '2026-07-16', 60, [legacy]);

    expect(events).toEqual([]);
  });

  it('keeps catalog choices visible but unchecked while their sources await review', () => {
    const options = buildTaxDeadlineRuleOptions('ОСН', '2026-07-16', '2026-07-16', 60);
    const vat = options.find(option => option.id === 'vat-report');

    expect(vat).toBeDefined();
    expect(vat?.calendarEligible).toBe(false);
    expect(vat?.defaultSelected).toBe(false);
    expect(vat?.recommendedDecision).toBe('needs_review');
    expect(vat?.editorialIssues).toContain('Нет ссылки на официальный источник');
  });

  it('uses company traits to recommend approved payroll obligations', () => {
    const withEmployees = buildApprovedOptions({ hasEmployees: true, isVatPayer: true });
    const withoutEmployees = buildApprovedOptions({ hasEmployees: false, isVatPayer: true });

    expect(withEmployees.find(option => option.id === 'pit-report')?.recommendedDecision).toBe('applies');
    expect(withoutEmployees.find(option => option.id === 'pit-report')?.recommendedDecision).toBe('not_applicable');
  });

  it('does not recommend approved VAT reporting to a non-VAT profile', () => {
    const withoutVat = buildApprovedOptions({ isVatPayer: false });
    const withVat = buildApprovedOptions({ isVatPayer: true });

    expect(withoutVat.find(option => option.id === 'vat-report')?.recommendedDecision).toBe('not_applicable');
    expect(withVat.find(option => option.id === 'vat-report')?.recommendedDecision).toBe('applies');
  });

  it('keeps confirmed approved rules whose next occurrence is outside the current horizon', () => {
    const options = buildApprovedOptions({ isVatPayer: true });
    const octoberProfitReport = options.find(option => option.id === 'profit-q3-report');

    expect(octoberProfitReport?.dates).toEqual([]);
    expect(octoberProfitReport?.recommendedDecision).toBe('applies');

    const earlyEvents = buildApprovedEvents({ ...OSN_PROFILE, enabledObligationRules: ['profit-q3-report'] });
    const laterEvents = buildApprovedEvents(
      { ...OSN_PROFILE, enabledObligationRules: ['profit-q3-report'] },
      '2026-08-30',
    );

    expect(earlyEvents).toEqual([]);
    expect(laterEvents.some(event => event.source_key === 'tax:profit-q3-report:2026-10-20')).toBe(true);
  });

  it('preserves existing events while a legacy card is waiting for editorial metadata', () => {
    const pending = approvedDeadline({
      id: 'pending',
      sourceUrl: undefined,
      editorialStatus: 'review',
      nextReviewAt: undefined,
    });
    const profile = { ...OSN_PROFILE, enabledObligationRules: ['pending'] };

    expect(buildTaxDeadlineEvents('company-1', profile, '2026-07-16', 60, [pending])).toEqual([]);
    expect(buildPreservedTaxDeadlineSourceKeys(profile, '2026-07-16', 60, [pending]))
      .toContain('tax:pending:2026-07-20');
  });

  it('does not preserve events for an explicitly archived card', () => {
    const archived = approvedDeadline({ id: 'archived', editorialStatus: 'archived' });
    const profile = { ...OSN_PROFILE, enabledObligationRules: ['archived'] };

    expect(buildPreservedTaxDeadlineSourceKeys(profile, '2026-07-16', 60, [archived]).size).toBe(0);
  });
});
