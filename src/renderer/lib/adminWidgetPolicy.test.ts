import { describe, expect, it } from 'vitest'
import { defaultRuntimeWidgetPolicy, isRuntimeWidgetAllowed } from './adminWidgetPolicy'

describe('runtime widget policy', () => {
  it('honours published enablement and safe mode', () => {
    const policy = defaultRuntimeWidgetPolicy()
    expect(isRuntimeWidgetAllowed(policy, 'currency-rates', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
    policy.safeMode = true
    expect(isRuntimeWidgetAllowed(policy, 'currency-rates', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(false)
    expect(isRuntimeWidgetAllowed(policy, 'smart-calendar', { plan: 'free', role: 'user', placement: 'dashboard' })).toBe(true)
  })

  it('enforces audience and plugin dependency', () => {
    const policy = defaultRuntimeWidgetPolicy()
    policy.widgets.push({ id: 'private-ai', enabled: true, placement: 'dashboard', audience: 'pro', source: 'plugin', order: 20, blockedByPlugin: true })
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'premium', role: 'user' })).toBe(false)
    policy.widgets[policy.widgets.length - 1].blockedByPlugin = false
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'premium', role: 'user' })).toBe(true)
    expect(isRuntimeWidgetAllowed(policy, 'private-ai', { plan: 'free', role: 'user' })).toBe(false)
  })
})
