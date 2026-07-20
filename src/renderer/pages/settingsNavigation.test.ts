import { describe, expect, it } from 'vitest'
import { initialTabForSurface, navigationForSurface } from './settingsNavigation'

describe('account and application settings boundaries', () => {
  it('keeps account, billing, team and security in the personal cabinet', () => {
    expect(navigationForSurface('account').map(item => item.id)).toEqual(['overview', 'integrations', 'billing', 'team', 'security', 'privacy'])
    expect(initialTabForSurface('account')).toBe('overview')
  })

  it('keeps only application behavior in settings', () => {
    expect(navigationForSurface('settings').map(item => item.id)).toEqual(['workspace', 'notifications', 'ai', 'data', 'about'])
    expect(initialTabForSurface('settings')).toBe('workspace')
  })

  it('does not duplicate a section across the two surfaces', () => {
    const account = new Set(navigationForSurface('account').map(item => item.id))
    expect(navigationForSurface('settings').some(item => account.has(item.id))).toBe(false)
  })
})
