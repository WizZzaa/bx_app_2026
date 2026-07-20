import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyBxDesignFeature,
  BX_DESIGN_FEATURE_ATTRIBUTE,
  BX_DESIGN_FEATURE_VALUE,
  isBxDesignFeatureEnabled,
  parseBxDesignFeatureFlag,
} from './feature'

describe('BX D1 feature gate', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(BX_DESIGN_FEATURE_ATTRIBUTE)
    vi.restoreAllMocks()
  })

  it('is opt-in and accepts only explicit enabled values', () => {
    expect(parseBxDesignFeatureFlag(undefined)).toBe(false)
    expect(parseBxDesignFeatureFlag('false')).toBe(false)
    expect(parseBxDesignFeatureFlag('0')).toBe(false)
    expect(parseBxDesignFeatureFlag('1')).toBe(true)
    expect(parseBxDesignFeatureFlag(' TRUE ')).toBe(true)
    expect(parseBxDesignFeatureFlag('on')).toBe(true)
  })

  it('applies and removes only the document feature marker', () => {
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')

    applyBxDesignFeature(document.documentElement, true)
    expect(document.documentElement.getAttribute(BX_DESIGN_FEATURE_ATTRIBUTE)).toBe(BX_DESIGN_FEATURE_VALUE)
    expect(isBxDesignFeatureEnabled()).toBe(true)

    applyBxDesignFeature(document.documentElement, false)
    expect(document.documentElement.hasAttribute(BX_DESIGN_FEATURE_ATTRIBUTE)).toBe(false)
    expect(isBxDesignFeatureEnabled()).toBe(false)
    expect(storageWrite).not.toHaveBeenCalled()
  })
})
