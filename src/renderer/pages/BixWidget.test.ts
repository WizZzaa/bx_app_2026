import { describe, expect, it } from 'vitest'
import { animationDelay, clampPanelOffset, isWithinQuietHours, jokeDelay, loadCycle, pickFrameCycle, taskReminderAt, widgetHeightForPanel } from './BixWidget'

const quietSettings = {
  jokesEnabled: true,
  jokeFrequency: 'normal' as const,
  animationSpeed: 'normal' as const,
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

  it('offers five stable animation speeds', () => {
    expect(animationDelay('calm')).toBe(520)
    expect(animationDelay('slow')).toBe(400)
    expect(animationDelay('normal')).toBe(300)
    expect(animationDelay('fast')).toBe(220)
    expect(animationDelay('turbo')).toBe(150)
  })

  it('keeps only regenerated transparent frames and sorts them numerically', () => {
    expect(loadCycle({
      '../frames/idle/image_1.png': 'legacy-black-background',
      '../frames/idle/frame_010.png': 'new-10',
      '../frames/idle/image_2_5.png': 'fixed-2',
      '../frames/idle/frame_002.png': 'new-2',
    })).toEqual(['new-2', 'new-10'])
  })

  it('keeps a dragged panel inside the widget viewport', () => {
    const bounds = { baseLeft: 20, baseTop: 40, width: 300, height: 240, viewportWidth: 540, viewportHeight: 560 }
    expect(clampPanelOffset({ x: -200, y: -100 }, bounds)).toEqual({ x: -20, y: -40 })
    expect(clampPanelOffset({ x: 400, y: 500 }, bounds)).toEqual({ x: 220, y: 280 })
  })

  it('opens the Bix home panel at its full content height without a scrollbar', () => {
    // 468px is the measured scrollHeight of the six-card Home panel.
    expect(widgetHeightForPanel(468)).toBe(702)
    expect(widgetHeightForPanel(200)).toBe(560)
    expect(widgetHeightForPanel(1_100)).toBe(1_200)
  })

  it('calculates explicit task reminder offsets', () => {
    expect(taskReminderAt('2026-07-20', '10:00', 'none')).toBeNull()
    expect(taskReminderAt('2026-07-20', '10:00', 'at-time')).toBe(new Date('2026-07-20T10:00:00').toISOString())
    expect(taskReminderAt('2026-07-20', '10:00', '1h')).toBe(new Date('2026-07-20T09:00:00').toISOString())
    expect(taskReminderAt('2026-07-20', '', '1d')).toBe(new Date('2026-07-19T09:00:00').toISOString())
  })

  it('never mixes base frames into a partially generated outfit', () => {
    const base = { idle: ['base-idle'], thinking: ['base-thinking'], reminder: ['base-reminder'] } as unknown as Parameters<typeof pickFrameCycle>[0]
    const outfit = { idle: ['business-idle'], thinking: ['business-thinking'] }
    expect(pickFrameCycle(base, outfit, 'idle', 'business-static')).toEqual(['business-idle'])
    expect(pickFrameCycle(base, outfit, 'reminder', 'business-static')).toEqual(['business-thinking'])
    expect(pickFrameCycle(base, outfit, 'sleep', 'business-static')).toEqual(['business-static'])
  })
})
