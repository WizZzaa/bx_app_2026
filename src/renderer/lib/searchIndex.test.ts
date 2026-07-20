import { describe, expect, it } from 'vitest'
import { UTILITY_PROPOSALS } from '../data/workbenchCatalog'
import { groupSearchResults, search, UTILITY_IDEA_SEARCH_ITEMS } from './searchIndex'

describe('utility ideas in global search', () => {
  it('publishes every proposed utility as a direct search result', () => {
    expect(UTILITY_IDEA_SEARCH_ITEMS).toHaveLength(UTILITY_PROPOSALS.length)
    expect(UTILITY_IDEA_SEARCH_ITEMS.every(item => item.category === 'Идея')).toBe(true)
    expect(UTILITY_IDEA_SEARCH_ITEMS.every(item => item.route.startsWith('/tools?tool='))).toBe(true)
  })
})

describe('canonical global search', () => {
  const items = [
    { title: 'НДС', subtitle: 'Налог', category: 'Справочник', route: '/reference' },
    { title: 'Срок отчёта', subtitle: '2026-07-25', category: 'Задача', route: '/planner' },
    { title: 'НДС для ИП', subtitle: 'Статья', category: 'Статья', route: '/knowledge' },
  ]

  it('searches titles, subtitles and categories without mixing access rules', () => {
    expect(search(items, 'ндс')).toHaveLength(2)
    expect(search(items, 'задача')).toEqual([items[1]])
  })

  it('groups results by their visible type', () => {
    expect(groupSearchResults(items).map(group => group.category)).toEqual(['Справочник', 'Задача', 'Статья'])
  })
})
