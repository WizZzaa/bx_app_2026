import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, currentTheme, nextTheme, resolveTheme, saveTheme, subscribeToTheme, THEME_KEY } from './theme'

describe('application themes', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    delete document.documentElement.dataset.theme
  })

  it('applies the high contrast palette as a dark theme', () => {
    applyTheme('high-contrast')
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('high-contrast')
    expect(document.documentElement.dataset.resolvedTheme).toBe('high-contrast')
  })

  it('reads only supported stored themes', () => {
    localStorage.setItem(THEME_KEY, 'high-contrast')
    expect(currentTheme()).toBe('high-contrast')
    localStorage.setItem(THEME_KEY, 'unknown')
    expect(currentTheme()).toBe('light')
  })

  it('cycles through all four themes', () => {
    expect(nextTheme('system')).toBe('light')
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('high-contrast')
    expect(nextTheme('high-contrast')).toBe('system')
  })

  it('applies the light palette without dark variants', () => {
    applyTheme('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false)
  })

  it('migrates retired palettes to their canonical accessible equivalents', () => {
    localStorage.setItem(THEME_KEY, 'lime')
    expect(currentTheme()).toBe('high-contrast')
    expect(localStorage.getItem(THEME_KEY)).toBe('high-contrast')
    localStorage.setItem(THEME_KEY, 'lavender-light')
    expect(currentTheme()).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('resolves the system choice using the operating system preference', () => {
    const original = window.matchMedia
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia
    expect(resolveTheme('system')).toBe('dark')
    window.matchMedia = original
  })

  it('keeps theme controls synchronized in the same window', () => {
    const updates: string[] = []
    const unsubscribe = subscribeToTheme(theme => updates.push(theme))

    saveTheme('high-contrast')

    expect(localStorage.getItem(THEME_KEY)).toBe('high-contrast')
    expect(document.documentElement.dataset.theme).toBe('high-contrast')
    expect(updates).toEqual(['high-contrast'])
    unsubscribe()
  })

  it('applies a theme changed in another browser tab', () => {
    const updates: string[] = []
    const unsubscribe = subscribeToTheme(theme => updates.push(theme))
    localStorage.setItem(THEME_KEY, 'light')

    window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: 'light' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(updates).toEqual(['light'])
    unsubscribe()
  })
})
