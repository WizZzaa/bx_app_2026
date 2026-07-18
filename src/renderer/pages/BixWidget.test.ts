import { describe, expect, it } from 'vitest'
import { isWithinQuietHours, jokeDelay } from './BixWidget'

const quietSettings = {
  jokesEnabled: true,
  jokeFrequency: 'normal' as const,
  quietHours: true,
  quietFrom: '21:00',
  quietTo: '08:00',
  privateReminders: false,
  reducedMotion: false,
}

describe('Bix widget settings', () => {
  it('recognises quiet hours that run across midnight', () => {
    expect(isWithinQuietHours(quietSettings, new Date('2026-07-18T22:30:00'))).toBe(true)
    expect(isWithinQuietHours(quietSettings, new Date('2026-07-18T07:59:00'))).toBe(true)
    expect(isWithinQuietHours(quietSettings, new Date('2026-07-18T12:00:00'))).toBe(false)
  })

  it('does not mute Bix when quiet hours are disabled', () => {
    expect(isWithinQuietHours({ ...quietSettings, quietHours: false }, new Date('2026-07-18T22:30:00'))).toBe(false)
  })

  it('uses the exact selected joke frequency', () => {
    expect(jokeDelay('often')).toBe(2 * 60 * 1000)
    expect(jokeDelay('normal')).toBe(5 * 60 * 1000)
    expect(jokeDelay('rare')).toBe(10 * 60 * 1000)
  })
})
