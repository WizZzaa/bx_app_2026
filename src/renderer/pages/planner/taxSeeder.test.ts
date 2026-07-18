import { describe, expect, it } from 'vitest';
import { buildTaxDeadlineEvents, buildTaxDeadlineRuleOptions, TAX_HORIZON_DAYS } from './taxSeeder';

const OSN_PROFILE = {
  regime: 'ОСН',
  bxStartDate: '2026-07-16',
  enabledObligationRules: ['vat-report', 'profit-q2-report', 'excise-report'],
};

describe('buildTaxDeadlineEvents', () => {
  it('creates only verified future obligations inside the rolling company horizon', () => {
    const events = buildTaxDeadlineEvents('company-1', OSN_PROFILE, '2026-07-16', TAX_HORIZON_DAYS);

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
    }, '2026-07-16', 60);

    expect(events.some(event => event.regime === 'ОСН')).toBe(false);
    expect(events.every(event => event.regime === 'все' || event.regime === 'Налог с оборота')).toBe(true);
  });

  it('does not extrapolate the verified 2026 calendar into another year', () => {
    expect(buildTaxDeadlineEvents('company-1', OSN_PROFILE, '2027-01-01', 60)).toEqual([]);
  });

  it('never creates an obligation before the company BX start date', () => {
    const events = buildTaxDeadlineEvents('company-1', {
      ...OSN_PROFILE,
      bxStartDate: '2026-08-01',
    }, '2026-07-16', 60);

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => event.date >= '2026-08-01')).toBe(true);
  });

  it('creates only rules explicitly confirmed by the owner', () => {
    const events = buildTaxDeadlineEvents('company-1', {
      ...OSN_PROFILE,
      enabledObligationRules: ['vat-report'],
    }, '2026-07-16', 60);

    expect(events.length).toBeGreaterThan(0);
    expect(events.every(event => event.source_key?.startsWith('tax:vat-report:'))).toBe(true);
  });

  it('keeps conditional common rules and unknown VAT status unchecked in the profile preview', () => {
    const options = buildTaxDeadlineRuleOptions('ОСН', '2026-07-16', '2026-07-16', 60);
    const excise = options.find(option => option.id === 'excise-report');
    const vat = options.find(option => option.id === 'vat-report');

    expect(excise?.defaultSelected).toBe(false);
    expect(vat?.defaultSelected).toBe(false);
    expect(vat?.recommendedDecision).toBe('needs_review');
  });

  it('uses company traits to recommend payroll obligations', () => {
    const withEmployees = buildTaxDeadlineRuleOptions(
      'ОСН',
      '2026-07-16',
      '2026-07-16',
      60,
      { hasEmployees: true, isVatPayer: true },
    );
    const withoutEmployees = buildTaxDeadlineRuleOptions(
      'ОСН',
      '2026-07-16',
      '2026-07-16',
      60,
      { hasEmployees: false, isVatPayer: true },
    );

    expect(withEmployees.find(option => option.id === 'pit-report')?.recommendedDecision).toBe('applies');
    expect(withoutEmployees.find(option => option.id === 'pit-report')?.recommendedDecision).toBe('not_applicable');
  });

  it('does not recommend VAT reporting to a non-VAT profile', () => {
    const withoutVat = buildTaxDeadlineRuleOptions(
      'ОСН',
      '2026-07-16',
      '2026-07-16',
      60,
      { isVatPayer: false },
    );
    const withVat = buildTaxDeadlineRuleOptions(
      'ОСН',
      '2026-07-16',
      '2026-07-16',
      60,
      { isVatPayer: true },
    );

    expect(withoutVat.find(option => option.id === 'vat-report')?.recommendedDecision).toBe('not_applicable');
    expect(withVat.find(option => option.id === 'vat-report')?.recommendedDecision).toBe('applies');
  });

  it('keeps confirmed rules whose next occurrence is outside the current horizon', () => {
    const options = buildTaxDeadlineRuleOptions('ОСН', '2026-07-16', '2026-07-16', 60, { isVatPayer: true });
    const octoberProfitReport = options.find(option => option.id === 'profit-q3-report');

    expect(octoberProfitReport).toBeDefined();
    expect(octoberProfitReport?.dates).toEqual([]);
    expect(octoberProfitReport?.recommendedDecision).toBe('applies');

    const earlyEvents = buildTaxDeadlineEvents('company-1', {
      ...OSN_PROFILE,
      enabledObligationRules: ['profit-q3-report'],
    }, '2026-07-16', 60);
    const laterEvents = buildTaxDeadlineEvents('company-1', {
      ...OSN_PROFILE,
      enabledObligationRules: ['profit-q3-report'],
    }, '2026-08-30', 60);

    expect(earlyEvents).toEqual([]);
    expect(laterEvents.some(event => event.source_key === 'tax:profit-q3-report:2026-10-20')).toBe(true);
  });
});
