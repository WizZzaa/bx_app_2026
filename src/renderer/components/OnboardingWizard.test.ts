import { describe, expect, it } from 'vitest'
import { onboardingErrorMessage, toggleOnboardingInterest } from './OnboardingWizard'

describe('product onboarding', () => {
  it('selects at most three unique interests and allows deselection', () => {
    expect(toggleOnboardingInterest([], 'taxes')).toEqual(['taxes'])
    expect(toggleOnboardingInterest(['taxes'], 'taxes')).toEqual([])
    expect(toggleOnboardingInterest(['taxes', 'documents', 'payroll'], 'ecp')).toEqual(['taxes', 'documents', 'payroll'])
  })

  it('explains canonical trial failures without exposing server details', () => {
    expect(onboardingErrorMessage('TRIAL_ALREADY_USED')).toContain('уже использован')
    expect(onboardingErrorMessage('TELEGRAM_VERIFICATION_REQUIRED')).toContain('Telegram')
    expect(onboardingErrorMessage('unexpected internal detail')).not.toContain('internal detail')
  })
})
