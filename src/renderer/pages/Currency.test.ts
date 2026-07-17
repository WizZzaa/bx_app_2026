import { describe, expect, it } from 'vitest'
import { buildCurrencyCsv, convertCurrency, enumerateDates, filterBankRates, findBestBankRates } from './Currency'
import type { BankExchangeRate } from '../../shared/types'

const rates = { USD: 12_500, EUR: 14_000, RUB: 160 }

describe('convertCurrency', () => {
  it('converts a foreign currency to sums', () => {
    expect(convertCurrency(2, 'USD', 'UZS', rates)).toBe(25_000)
  })

  it('converts between foreign currencies through sums', () => {
    expect(convertCurrency(140, 'EUR', 'RUB', rates)).toBe(12_250)
  })

  it('returns zero for an unavailable rate or invalid amount', () => {
    expect(convertCurrency(Number.NaN, 'USD', 'UZS', rates)).toBe(0)
    expect(convertCurrency(100, 'USD', 'EUR', { USD: 12_500 })).toBe(0)
  })
})

describe('currency archive helpers', () => {
  it('builds an inclusive date range and exposes ranges over one month', () => {
    expect(enumerateDates('2026-07-01', '2026-07-03')).toEqual(['2026-07-01', '2026-07-02', '2026-07-03'])
    expect(enumerateDates('2026-07-31', '2026-07-01')).toEqual([])
    expect(enumerateDates('2026-06-01', '2026-07-02')).toHaveLength(32)
  })

  it('creates an Excel-compatible CSV with requested and activation dates', () => {
    const csv = buildCurrencyCsv([{ requestedDate: '2026-07-12', rate: { code: 'USD', name: 'Доллар США', flag: '', value: 12_345.67, diff: -4.2, date: '11.07.2026' } }])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"2026-07-12";"11.07.2026";"USD";"Доллар США";"12345,6700";"-4,2000"')
  })
})

describe('bank exchange comparison', () => {
  const rows: BankExchangeRate[] = [
    { bankId: 'ipak-yuli', bankName: 'Ipak', sourceUrl: 'https://example.com/1', updatedAt: null, code: 'USD', buy: 12040, sell: 12140, centralBank: null },
    { bankId: 'aloqabank', bankName: 'Aloqa', sourceUrl: 'https://example.com/2', updatedAt: null, code: 'USD', buy: 12060, sell: 12130, centralBank: null },
    { bankId: 'trustbank', bankName: 'Trust', sourceUrl: 'https://example.com/3', updatedAt: null, code: 'USD', buy: 12050, sell: 12120, centralBank: null },
  ]

  it('chooses the highest bank purchase and the lowest bank sale independently', () => {
    const result = findBestBankRates(rows, 'USD')
    expect(result.bestBuy?.bankId).toBe('aloqabank')
    expect(result.bestSell?.bankId).toBe('trustbank')
  })

  it('filters the comparison by one or several selected banks', () => {
    expect(filterBankRates(rows, []).map(row => row.bankId)).toEqual(['ipak-yuli', 'aloqabank', 'trustbank'])
    expect(filterBankRates(rows, ['ipak-yuli', 'trustbank']).map(row => row.bankId)).toEqual(['ipak-yuli', 'trustbank'])

    const result = findBestBankRates(filterBankRates(rows, ['ipak-yuli', 'trustbank']), 'USD')
    expect(result.bestBuy?.bankId).toBe('trustbank')
    expect(result.bestSell?.bankId).toBe('trustbank')
  })
})
