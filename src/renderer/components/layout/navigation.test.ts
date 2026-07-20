import { describe, expect, it } from 'vitest'
import {
  ALL_CATALOG_DESTINATIONS,
  FUNCTION_CATALOG_GROUPS,
  isNavigationPathActive,
  MOBILE_NAVIGATION,
  PRIMARY_NAVIGATION,
} from './navigation'

describe('canonical application navigation', () => {
  it('keeps the primary desktop rail compact and links to the complete catalog', () => {
    expect(PRIMARY_NAVIGATION).toHaveLength(7)
    expect(PRIMARY_NAVIGATION.at(-1)).toMatchObject({ to: '/functions', label: 'Все функции' })
  })

  it('keeps four top-level mobile destinations plus More', () => {
    expect(MOBILE_NAVIGATION.map(item => item.label)).toEqual(['Главная', 'AI-консультант', 'База знаний', 'Переводчик'])
  })

  it('preserves every former secondary sidebar destination in the catalog', () => {
    const routes = ALL_CATALOG_DESTINATIONS.map(item => item.to)
    expect(routes).toEqual(expect.arrayContaining([
      '/news', '/counterparties', '/documents/templates', '/documents/my',
      '/finance', '/currency', '/calc', '/tools', '/services', '/support',
    ]))
    expect(FUNCTION_CATALOG_GROUPS.flatMap(group => group.items).some(item => item.to === '/hr')).toBe(false)
  })

  it('matches detail routes without making the dashboard match every route', () => {
    expect(isNavigationPathActive('/documents/my/42', '/documents/my')).toBe(true)
    expect(isNavigationPathActive('/', '/dashboard')).toBe(true)
    expect(isNavigationPathActive('/ai', '/dashboard')).toBe(false)
  })
})
