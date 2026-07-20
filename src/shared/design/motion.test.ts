import { describe, expect, it } from 'vitest'
import {
  BX_ANIMATED_PROPERTIES,
  BX_MOTION_PRESETS,
  BX_REDUCED_MOTION_PRESETS,
  BX_REDUCED_MOTION_QUERY,
  BX_REDUCED_STAGGER,
  BX_STAGGER,
  resolveBxMotionPreset,
} from './motion'

describe('BX motion contract', () => {
  it('uses only transform and opacity frame properties', () => {
    expect(BX_ANIMATED_PROPERTIES).toEqual(['opacity', 'transform'])
    for (const preset of Object.values(BX_MOTION_PRESETS)) {
      for (const phase of [preset.enter, preset.exit]) {
        expect(Object.keys(phase.from).sort()).toEqual(['opacity', 'transform'])
        expect(Object.keys(phase.to).sort()).toEqual(['opacity', 'transform'])
      }
    }
  })

  it('keeps tween timing responsive and exits faster than entry', () => {
    for (const [name, preset] of Object.entries(BX_MOTION_PRESETS)) {
      const enter = preset.enter.transition
      const exit = preset.exit.transition
      const enterBudget = enter.type === 'spring' ? enter.settleMs : enter.durationMs
      const exitBudget = exit.durationMs
      expect(enterBudget, `${name} enter exceeds the complex-motion budget`).toBeLessThanOrEqual(400)
      expect(exitBudget, `${name} exit exceeds the complex-motion budget`).toBeLessThan(enterBudget)
      if (enter.type === 'tween') expect(enter.durationMs).toBeGreaterThanOrEqual(120)
      expect(exit.durationMs).toBeGreaterThanOrEqual(80)
    }
  })

  it('keeps the canonical sheet spring and bounded stagger', () => {
    expect(BX_MOTION_PRESETS.sheet.enter.transition).toEqual({
      type: 'spring',
      stiffness: 380,
      damping: 34,
      mass: 0.8,
      settleMs: 320,
    })
    expect(BX_STAGGER).toEqual({ delayMs: 30, maxChildren: 6 })
  })

  it('resolves reduced motion to immediate, spatially still states', () => {
    expect(BX_REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)')
    for (const name of Object.keys(BX_MOTION_PRESETS) as Array<keyof typeof BX_MOTION_PRESETS>) {
      const preset = resolveBxMotionPreset(name, true)
      expect(preset).toBe(BX_REDUCED_MOTION_PRESETS[name])
      for (const phase of [preset.enter, preset.exit]) {
        expect(phase.from).toEqual({ opacity: 1, transform: 'none' })
        expect(phase.to).toEqual({ opacity: 1, transform: 'none' })
        expect(phase.transition.type).toBe('tween')
        if (phase.transition.type === 'tween') expect(phase.transition.durationMs).toBe(0)
      }
    }
    expect(BX_REDUCED_STAGGER).toEqual({ delayMs: 0, maxChildren: 6 })
  })

  it('returns the canonical preset when reduced motion is not requested', () => {
    expect(resolveBxMotionPreset('dialog', false)).toBe(BX_MOTION_PRESETS.dialog)
  })
})
