import { beforeEach, describe, expect, it } from 'vitest'
import { applyFontScale, currentFontScale, FONT_SCALE_KEY, normalizeFontScale, saveFontScale } from './uiScale'

describe('uiScale', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-font-scale')
    document.documentElement.style.removeProperty('--bx-font-scale')
    document.documentElement.style.removeProperty('--bx-root-font-size')
  })

  it('falls back to the safe Full HD baseline for unknown values', () => {
    expect(normalizeFontScale('999')).toBe('100')
    expect(currentFontScale()).toBe('100')
  })

  it('persists and applies the selected font scale immediately', () => {
    saveFontScale('125')
    expect(localStorage.getItem(FONT_SCALE_KEY)).toBe('125')
    expect(document.documentElement.dataset.fontScale).toBe('125')
    expect(document.documentElement.style.getPropertyValue('--bx-font-scale')).toBe('1.25')
    expect(document.documentElement.style.getPropertyValue('--bx-root-font-size')).toBe('20px')

    applyFontScale('110')
    expect(document.documentElement.dataset.fontScale).toBe('110')
  })

  it('migrates retired scales without shrinking text', () => {
    expect(normalizeFontScale('75')).toBe('100')
    expect(normalizeFontScale('90')).toBe('100')
    expect(normalizeFontScale('120')).toBe('125')
    expect(normalizeFontScale('130')).toBe('125')
  })
})
