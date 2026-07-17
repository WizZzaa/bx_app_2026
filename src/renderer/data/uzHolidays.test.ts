import { describe, expect, it } from 'vitest'
import { getMonthNorms, getSpecialDay, specialDaysForMonth } from './uzHolidays'

describe('production calendar 2026', () => {
  it('returns verified holidays for their exact 2026 dates', () => {
    expect(getSpecialDay(new Date(2026, 2, 20))?.name).toContain('Рамазан')
    expect(getSpecialDay(new Date(2026, 4, 27))?.name).toContain('Курбан')
  })

  it('does not extrapolate 2026 holidays or work norms into another year', () => {
    expect(getSpecialDay(new Date(2027, 2, 20))).toBeNull()
    expect(specialDaysForMonth(2027, 2)).toEqual([])
    expect(getMonthNorms(3, 2027)).toBeNull()
  })

  it('returns the full list of special days for a visible month', () => {
    const march = specialDaysForMonth(2026, 2)
    expect(march.map(day => day.day)).toEqual([7, 8, 9, 19, 20, 21, 23])
  })
})
