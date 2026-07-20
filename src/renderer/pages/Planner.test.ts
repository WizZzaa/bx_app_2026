import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PLANNER_VIEW } from './Planner'

describe('Planner default view', () => {
  it('opens the calendar when the planner is entered', () => {
    expect(DEFAULT_PLANNER_VIEW).toBe('calendar')
  })

  it('does not delete board or card caches merely by mounting the planner', () => {
    const source = readFileSync('src/renderer/pages/Planner.tsx', 'utf8')

    expect(source).not.toContain("localStorage.removeItem('bx_boards_cache_v1')")
    expect(source).not.toContain("startsWith('bx_cards_cache_')")
  })
})
