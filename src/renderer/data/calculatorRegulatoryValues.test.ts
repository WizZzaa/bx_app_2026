import { describe, expect, it } from 'vitest'
import {
  CALCULATOR_REGULATORY_KEYS,
  CALCULATOR_REGULATORY_VALUES,
  calculatorRequiresManualConfirmation,
  isRegulatoryValueEligible,
  mergePublishedCalculatorRegulatoryValues,
  regulatoryValuesFingerprint,
  regulatoryValuesForCalculator,
  unpublishedCalculatorRegulatoryValues,
} from './calculatorRegulatoryValues'

describe('calculator regulatory values', () => {
  it('maps every calculator dependency to one canonical value', () => {
    const keys = new Set(CALCULATOR_REGULATORY_VALUES.map(value => value.key))
    for (const mappedKeys of Object.values(CALCULATOR_REGULATORY_KEYS)) {
      for (const key of mappedKeys) expect(keys.has(key), `missing ${key}`).toBe(true)
    }
  })

  it('uses only official domains for source candidates', () => {
    for (const value of CALCULATOR_REGULATORY_VALUES) {
      const hostname = new URL(value.sourceUrl).hostname.replace(/^www\./, '')
      expect(['lex.uz', 'cbu.uz']).toContain(hostname)
    }
  })

  it('fails closed when editorial metadata is incomplete', () => {
    const vat = regulatoryValuesForCalculator('vat')[0]
    expect(vat.editorialStatus).toBe('review')
    expect(isRegulatoryValueEligible(vat, '2026-07-20')).toBe(false)
    expect(calculatorRequiresManualConfirmation('vat', '2026-07-20')).toBe(true)
  })

  it('accepts an approved official value only inside its review window', () => {
    const cbu = CALCULATOR_REGULATORY_VALUES.find(value => value.key === 'indicator.cbu.policy_rate')
    expect(cbu).toBeDefined()
    if (!cbu) throw new Error('missing CBU policy rate')
    expect(isRegulatoryValueEligible(cbu, '2026-07-20')).toBe(true)
    expect(isRegulatoryValueEligible(cbu, '2026-07-29')).toBe(false)
  })

  it('changes the acknowledgement fingerprint when a version changes', () => {
    const values = regulatoryValuesForCalculator('salary')
    const current = regulatoryValuesFingerprint(values)
    const changed = regulatoryValuesFingerprint([{ ...values[0], version: 'next' }, ...values.slice(1)])
    expect(changed).not.toBe(current)
  })

  it('does not gate non-regulatory utility calculators', () => {
    expect(regulatoryValuesForCalculator('currency')).toEqual([])
    expect(calculatorRequiresManualConfirmation('currency', '2026-07-20')).toBe(false)
  })

  it('demotes every bundled value until the server confirms publication', () => {
    expect(unpublishedCalculatorRegulatoryValues().every(value => value.editorialStatus === 'review')).toBe(true)
    expect(unpublishedCalculatorRegulatoryValues().every(value => !value.checkedAt && !value.reviewedBy)).toBe(true)
  })

  it('merges only valid published server rows and keeps missing keys fail-closed', () => {
    const values = mergePublishedCalculatorRegulatoryValues([{
      key: 'tax.vat.standard',
      label: 'НДС — серверная версия',
      display_value: '11%',
      numeric_value: '11',
      version_label: 'verified-2026-08',
      effective_from: '2026-08-01',
      effective_to: null,
      source_title: 'Налоговый кодекс',
      official_source_url: 'https://lex.uz/ru/docs/4674902',
      source_checked_at: '2026-07-20T09:00:00+05:00',
      next_review_at: '2026-08-20T09:00:00+05:00',
      reviewed_by: '00000000-0000-0000-0000-000000000001',
      workflow_status: 'published',
      source_status: 'verified',
    }, {
      key: 'tax.ndfl.standard',
      label: 'Поддельная версия',
      display_value: '1%',
      numeric_value: 1,
      version_label: 'invalid-host',
      effective_from: '2026-01-01',
      effective_to: null,
      source_title: 'Неофициальный источник',
      official_source_url: 'https://example.com/rate',
      source_checked_at: '2026-07-20T09:00:00+05:00',
      next_review_at: '2026-08-20T09:00:00+05:00',
      reviewed_by: '00000000-0000-0000-0000-000000000001',
      workflow_status: 'published',
      source_status: 'verified',
    }], '2026-08-10')

    expect(values.find(value => value.key === 'tax.vat.standard')).toMatchObject({
      numericValue: 11,
      version: 'verified-2026-08',
      editorialStatus: 'approved',
    })
    expect(values.find(value => value.key === 'tax.ndfl.standard')?.editorialStatus).toBe('review')
    expect(values.find(value => value.key === 'indicator.cbu.policy_rate')?.editorialStatus).toBe('review')
  })
})
