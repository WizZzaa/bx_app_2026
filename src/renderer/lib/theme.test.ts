import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, currentTheme, nextTheme, saveTheme, subscribeToTheme, THEME_KEY } from './theme'

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
    expect(nextTheme('lime')).toBe('lavender-light')
    expect(nextTheme('lavender-light')).toBe('light')
  })

  it('applies the light lavender palette without dark variants', () => {
    applyTheme('lavender-light')
    expect(document.documentElement.classList.contains('lavender-light')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('lime')).toBe(false)
  })

  it('migrates the retired light lime theme to light lavender', () => {
    localStorage.setItem(THEME_KEY, 'lime-light')
    expect(currentTheme()).toBe('lavender-light')
    expect(localStorage.getItem(THEME_KEY)).toBe('lavender-light')
  })

  it('keeps theme controls synchronized in the same window', () => {
    const updates: string[] = []
    const unsubscribe = subscribeToTheme(theme => updates.push(theme))

    saveTheme('lime')

    expect(localStorage.getItem(THEME_KEY)).toBe('lime')
    expect(document.documentElement.dataset.theme).toBe('lime')
    expect(updates).toEqual(['lime'])
    unsubscribe()
  })

  it('applies a theme changed in another browser tab', () => {
    const updates: string[] = []
    const unsubscribe = subscribeToTheme(theme => updates.push(theme))
    localStorage.setItem(THEME_KEY, 'lavender-light')

    window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: 'lavender-light' }))

    expect(document.documentElement.dataset.theme).toBe('lavender-light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(updates).toEqual(['lavender-light'])
    unsubscribe()
  })
})
