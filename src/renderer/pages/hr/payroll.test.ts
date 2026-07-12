import { describe, it, expect } from 'vitest'
import { calcPayroll, DEFAULT_RATES } from './payroll'

describe('calcPayroll', () => {
  it('считает зарплату 1 000 000 сум по ставкам по умолчанию', () => {
    const r = calcPayroll(1_000_000)
    // ИНПС 0.1% = 1000; НДФЛ 12% = 120000, минус ИНПС = 119000
    expect(r.inps).toBe(1_000)
    expect(r.ndfl).toBe(119_000)
    expect(r.totalWithheld).toBe(120_000)
    expect(r.net).toBe(880_000)
    // Соцналог работодателя 12%
    expect(r.social).toBe(120_000)
    expect(r.employerCost).toBe(1_120_000)
  })

  it('нулевой оклад → все выплаты нулевые', () => {
    const r = calcPayroll(0)
    expect(r).toMatchObject({ gross: 0, ndfl: 0, inps: 0, totalWithheld: 0, net: 0, social: 0, employerCost: 0 })
  })

  it('отрицательный оклад зажимается до нуля', () => {
    const r = calcPayroll(-5000)
    expect(r.gross).toBe(0)
    expect(r.net).toBe(0)
  })

  it('НДФЛ никогда не отрицательный при большом ИНПС', () => {
    const r = calcPayroll(1_000_000, { ...DEFAULT_RATES, ndfl: 0.05, inps: 1 })
    expect(r.ndfl).toBeGreaterThanOrEqual(0)
  })

  it('уважает переданные ставки', () => {
    const r = calcPayroll(1_000_000, { ndfl: 12, inps: 0, social: 25, brv: 412_000, mrot: 1_271_000 })
    expect(r.inps).toBe(0)
    expect(r.ndfl).toBe(120_000)
    expect(r.social).toBe(250_000)
  })
})
