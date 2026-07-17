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
    saveFontScale('120')
    expect(localStorage.getItem(FONT_SCALE_KEY)).toBe('120')
    expect(document.documentElement.dataset.fontScale).toBe('120')
    expect(document.documentElement.style.getPropertyValue('--bx-font-scale')).toBe('1.2')
    expect(document.documentElement.style.getPropertyValue('--bx-root-font-size')).toBe('19.2px')

    applyFontScale('130')
    expect(document.documentElement.dataset.fontScale).toBe('130')
  })

  it('supports the compact values used on smaller screens', () => {
    saveFontScale('75')
    expect(document.documentElement.dataset.fontScale).toBe('75')
    expect(document.documentElement.style.getPropertyValue('--bx-font-scale')).toBe('0.75')
    expect(document.documentElement.style.getPropertyValue('--bx-root-font-size')).toBe('12px')

    expect(normalizeFontScale('90')).toBe('90')
  })
})
