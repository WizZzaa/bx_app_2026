import { describe, expect, it } from 'vitest';
import {
  deadlinesForMonth,
  isOfficialTaxSourceUrl,
  isTaxDeadlineCalendarEligible,
  summarizeTaxDeadlineCatalog,
  taxDeadlines,
  type TaxDeadline,
} from './taxCalendar';

const APPROVED: TaxDeadline = {
  id: 'approved',
  title: 'Проверенный срок',
  taxType: 'Тест',
  kind: 'both',
  day: 20,
  month: null,
  regime: 'все',
  law: 'Статья 1',
  verified: true,
  sourceUrl: 'https://lex.uz/docs/4674902',
  verifiedAt: '2026-07-01',
  reviewedBy: 'Редактор',
  nextReviewAt: '2026-12-31',
  editorialStatus: 'approved',
};

describe('tax calendar editorial gate', () => {
  it('accepts official hosts and rejects lookalike domains', () => {
    expect(isOfficialTaxSourceUrl('https://lex.uz/docs/4674902')).toBe(true);
    expect(isOfficialTaxSourceUrl('https://api.soliq.uz/path')).toBe(true);
    expect(isOfficialTaxSourceUrl('https://lex.uz.example.com/docs/1')).toBe(false);
    expect(isOfficialTaxSourceUrl('javascript:alert(1)')).toBe(false);
  });

  it('requires complete, current editorial metadata', () => {
    expect(isTaxDeadlineCalendarEligible(APPROVED, '2026-07-20')).toBe(true);
    expect(isTaxDeadlineCalendarEligible({ ...APPROVED, reviewedBy: '' }, '2026-07-20')).toBe(false);
    expect(isTaxDeadlineCalendarEligible({ ...APPROVED, verifiedAt: '2026-07-21' }, '2026-07-20')).toBe(false);
    expect(isTaxDeadlineCalendarEligible({ ...APPROVED, nextReviewAt: '2026-07-19' }, '2026-07-20')).toBe(false);
  });

  it('does not expose the legacy catalog through calendar helpers before review', () => {
    expect(deadlinesForMonth(2026, 6, undefined, '2026-07-20')).toEqual([]);
    expect(summarizeTaxDeadlineCatalog('2026-07-20')).toEqual({
      total: taxDeadlines.length,
      ready: 0,
      needsReview: taxDeadlines.length,
    });
  });

  it('summarizes approved and pending fixtures independently of the global catalog', () => {
    const pending = { ...APPROVED, id: 'pending', editorialStatus: 'review' as const };
    expect(summarizeTaxDeadlineCatalog('2026-07-20', [APPROVED, pending])).toEqual({
      total: 2,
      ready: 1,
      needsReview: 1,
    });
  });
});
