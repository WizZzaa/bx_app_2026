import { beforeEach, describe, expect, it } from 'vitest'
import { applyUiDensity, currentUiDensity, saveUiDensity, UI_DENSITY_KEY } from './uiDensity'

describe('uiDensity', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-density')
  })

  it('uses comfortable density by default', () => {
    expect(currentUiDensity()).toBe('comfortable')
  })

  it('persists compact density without changing font scale', () => {
    document.documentElement.dataset.fontScale = '125'
    saveUiDensity('compact')
    expect(localStorage.getItem(UI_DENSITY_KEY)).toBe('compact')
    expect(document.documentElement.dataset.density).toBe('compact')
    expect(document.documentElement.dataset.fontScale).toBe('125')
    applyUiDensity('comfortable')
    expect(document.documentElement.dataset.density).toBe('comfortable')
  })
})
