import { describe, expect, it } from 'vitest'
import { calculateRegimeComparison } from './RegimeCompareCalc'

describe('calculateRegimeComparison', () => {
  const base = {
    domesticRevenueMln: 1_000,
    exportRevenueMln: 0,
    purchasesVat12Mln: 200,
    purchasesVat6Mln: 0,
    otherExpensesMln: 300,
    turnoverRate: 4,
    turnoverUnavailable: false,
    vat6Unavailable: false,
  }

  it('compares all three regimes and applies input VAT only to the general regime', () => {
    const [turnover, vat6, general] = calculateRegimeComparison(base)
    expect(turnover.tax).toBe(40_000_000)
    expect(vat6.tax).toBe(60_000_000)
    expect(general.lines.find(line => line.label === 'Входящий НДС к зачёту')?.value).toBeLessThan(0)
    expect(general.tax).toBeGreaterThan(0)
  })

  it('marks unavailable simplified scenarios without hiding the general regime', () => {
    const results = calculateRegimeComparison({ ...base, turnoverUnavailable: true, vat6Unavailable: true })
    expect(results.map(result => result.available)).toEqual([false, false, true])
  })
})
