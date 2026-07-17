import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, currentTheme, nextTheme, THEME_KEY } from './theme'

describe('application themes', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.theme
  })

  it('applies the graphite and lime palette as a dark theme', () => {
    applyTheme('lime')
    expect(document.documentElement.classList.contains('lime')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('lime')
  })

  it('reads only supported stored themes', () => {
    localStorage.setItem(THEME_KEY, 'lime')
    expect(currentTheme()).toBe('lime')
    localStorage.setItem(THEME_KEY, 'unknown')
    expect(currentTheme()).toBe('dark')
  })

  it('cycles through all four themes', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('lime')
    expect(nextTheme('lime')).toBe('lime-light')
    expect(nextTheme('lime-light')).toBe('light')
  })

  it('applies the light lime palette without dark variants', () => {
    applyTheme('lime-light')
    expect(document.documentElement.classList.contains('lime-light')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('lime')).toBe(false)
  })
})
