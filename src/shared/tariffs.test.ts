import { describe, expect, it } from 'vitest'
import { ADD_ONS, TARIFF_MATRIX, TARIFF_MATRIX_VERSION } from './tariffs'

describe('canonical tariff matrix', () => {
  it('matches the approved commercial prices and company limits', () => {
    expect(TARIFF_MATRIX_VERSION).toBe('2026-07-19.1')
    expect(TARIFF_MATRIX.free.companies).toBe(0)
    expect(TARIFF_MATRIX.standard.priceUzs).toEqual({ month: 200_000, year: 2_000_000 })
    expect(TARIFF_MATRIX.premium.priceUzs).toEqual({ month: 500_000, year: 5_000_000 })
    expect(TARIFF_MATRIX.premium.companies).toBe(5)
    expect(TARIFF_MATRIX.free.oneCBackupBases).toBe(0)
    expect(TARIFF_MATRIX.trial.oneCBackupBases).toBe(0)
    expect(TARIFF_MATRIX.standard.oneCBackupBases).toBe(1)
    expect(TARIFF_MATRIX.premium.oneCBackupBases).toBe(5)
  })

  it('keeps lifetime, daily and billing-cycle meters distinct', () => {
    expect(TARIFF_MATRIX.free.ai).toEqual({ amount: 3, window: 'account_lifetime' })
    expect(TARIFF_MATRIX.free.translations).toEqual({ amount: 3, window: 'day' })
    expect(TARIFF_MATRIX.trial.ai).toEqual({ amount: 15, window: 'account_lifetime' })
    expect(TARIFF_MATRIX.premium.remoteSupportMinutes).toEqual({ amount: 120, window: 'billing_cycle' })
  })

  it('contains only approved add-on prices', () => {
    expect(ADD_ONS.ai20.priceUzs).toBe(60_000)
    expect(ADD_ONS.translations20.priceUzs).toBe(60_000)
    expect(ADD_ONS.combo20.priceUzs).toBe(100_000)
    expect(ADD_ONS.storage1Gb.priceUzs).toBe(60_000)
  })
})
