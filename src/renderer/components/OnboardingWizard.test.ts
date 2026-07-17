import { describe, expect, it } from 'vitest'
import { canShowReminder } from './OnboardingWizard'

describe('company onboarding reminder', () => {
  const now = Date.parse('2026-07-17T09:00:00.000Z')

  it('shows a deferred reminder only when its scheduled time arrives', () => {
    expect(canShowReminder(null, now)).toBe(true)
    expect(canShowReminder('2026-07-17T08:59:59.000Z', now)).toBe(true)
    expect(canShowReminder('2026-07-17T09:00:01.000Z', now)).toBe(false)
  })
})
