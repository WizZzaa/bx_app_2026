import { describe, expect, it } from 'vitest'
import { DEFAULT_PLANNER_VIEW } from './Planner'

describe('Planner default view', () => {
  it('opens the calendar when the planner is entered', () => {
    expect(DEFAULT_PLANNER_VIEW).toBe('calendar')
  })
})
