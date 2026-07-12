import { describe, it, expect } from 'vitest'
import { toLocalISO, todayISO, daysFromNowISO, nextRecurrenceISO } from './dates'

describe('toLocalISO', () => {
  it('форматирует по локальным компонентам с ведущими нулями', () => {
    expect(toLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toLocalISO(new Date(2026, 6, 12))).toBe('2026-07-12')
    expect(toLocalISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('не уезжает на день назад в локальную полночь (баг UTC+5)', () => {
    // Локальная полночь 1 июля — при toISOString() уехала бы на 30 июня
    expect(toLocalISO(new Date(2026, 6, 1, 0, 0, 0))).toBe('2026-07-01')
  })
})

describe('todayISO / daysFromNowISO', () => {
  it('daysFromNowISO(0) совпадает с todayISO', () => {
    expect(daysFromNowISO(0)).toBe(todayISO())
  })
})

describe('nextRecurrenceISO', () => {
  it('weekly = +7 дней', () => {
    expect(nextRecurrenceISO('2026-01-15', 'weekly')).toBe('2026-01-22')
  })
  it('monthly с зажимом до последнего дня месяца', () => {
    expect(nextRecurrenceISO('2026-01-31', 'monthly')).toBe('2026-02-28')
  })
  it('monthly учитывает високосный февраль', () => {
    expect(nextRecurrenceISO('2024-01-31', 'monthly')).toBe('2024-02-29')
  })
  it('quarterly = +3 месяца', () => {
    expect(nextRecurrenceISO('2026-01-15', 'quarterly')).toBe('2026-04-15')
  })
  it('yearly = +1 год', () => {
    expect(nextRecurrenceISO('2026-01-15', 'yearly')).toBe('2027-01-15')
  })
})
