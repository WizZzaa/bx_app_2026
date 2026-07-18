import { describe, expect, it } from 'vitest'
import { UTILITY_PROPOSALS } from '../data/workbenchCatalog'
import { UTILITY_IDEA_SEARCH_ITEMS } from './searchIndex'

describe('utility ideas in global search', () => {
  it('publishes every proposed utility as a direct search result', () => {
    expect(UTILITY_IDEA_SEARCH_ITEMS).toHaveLength(UTILITY_PROPOSALS.length)
    expect(UTILITY_IDEA_SEARCH_ITEMS.every(item => item.category === 'Идея')).toBe(true)
    expect(UTILITY_IDEA_SEARCH_ITEMS.every(item => item.route.startsWith('/tools?tool='))).toBe(true)
  })
})
