import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(path, 'utf8')

describe('Planner D1 visual contract', () => {
  it('uses the canonical soft-lavender semantic tokens for planner surfaces', () => {
    const css = read('src/renderer/pages/planner/PlannerD1.css')

    expect(css).toContain('background: var(--bx-brand-soft)')
    expect(css).toContain('background: var(--bx-brand-action)')
    expect(css).toContain('.bx-calendar-day.is-selected')
    expect(css).toContain('.bx-calendar-mobile-day')
  })

  it('does not reintroduce saturated violet brand surfaces in the planner entry points', () => {
    const planner = read('src/renderer/pages/Planner.tsx')
    const calendar = read('src/renderer/pages/planner/CalendarView.tsx')
    const modal = read('src/renderer/pages/planner/EventModal.tsx')

    expect(planner).not.toContain('bg-violet-600')
    expect(calendar).not.toContain('bg-purple-500')
    expect(modal).not.toContain('bg-violet-600')
  })

  it('keeps the planner inside the same centered adaptive canvas as the dashboard', () => {
    const css = read('src/renderer/pages/planner/PlannerD1.css')

    expect(css).toContain('width: min(100%, var(--bx-content-max))')
    expect(css).toContain('max-width: var(--bx-content-max)')
    expect(css).toContain('margin-inline: auto')
    expect(css).toContain('padding: var(--bx-space-4)')
    expect(css).toContain('@media (min-width: 48rem)')
    expect(css).toContain('@media (min-width: 64rem)')
  })
})
