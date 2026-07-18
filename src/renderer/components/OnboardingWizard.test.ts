import { describe, expect, it } from 'vitest'
import { canShowReminder, getOnboardingSurface } from './OnboardingWizard'

describe('company onboarding reminder', () => {
  const now = Date.parse('2026-07-17T09:00:00.000Z')

  it('shows a deferred reminder only when its scheduled time arrives', () => {
    expect(canShowReminder(null, now)).toBe(true)
    expect(canShowReminder('2026-07-17T08:59:59.000Z', now)).toBe(true)
    expect(canShowReminder('2026-07-17T09:00:01.000Z', now)).toBe(false)
  })

  it('hides the blocking dialog while a deferred reminder is still snoozed', () => {
    expect(getOnboardingSurface('not_started', null, now)).toBe('dialog')
    expect(getOnboardingSurface('deferred', '2026-07-18T09:00:00.000Z', now)).toBe('hidden')
    expect(getOnboardingSurface('deferred', '2026-07-17T08:59:59.000Z', now)).toBe('reminder')
    expect(getOnboardingSurface('completed', null, now)).toBe('hidden')
  })
})
