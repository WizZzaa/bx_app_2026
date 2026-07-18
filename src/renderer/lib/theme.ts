// Единая точка применения темы.
// Классы .light, .lime и .lavender-light включают свои CSS-переменные (globals.css),
// класс .dark управляет Tailwind dark:-вариантами (darkMode: 'class').
// Лаймовая тема остаётся тёмной по контрастной модели, поэтому получает
// одновременно классы .dark и .lime.

export const BX_THEMES = ['light', 'dark', 'lime', 'lavender-light'] as const
export type BxTheme = typeof BX_THEMES[number]
export const THEME_KEY = 'bx_theme'
export const THEME_CHANGE_EVENT = 'bx:theme-change'

export function normalizeTheme(value: unknown): BxTheme {
  if (value === 'lime-light') return 'lavender-light'
  return BX_THEMES.includes(value as BxTheme) ? value as BxTheme : 'dark'
}

export function applyTheme(theme: BxTheme): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light' || theme === 'lavender-light')
  root.classList.toggle('dark', theme === 'dark' || theme === 'lime')
  root.classList.toggle('lime', theme === 'lime')
  root.classList.toggle('lavender-light', theme === 'lavender-light')
  root.dataset.theme = theme
}

export function saveTheme(theme: BxTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Тема всё равно применяется в текущем окне, даже если хранилище недоступно.
  }
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent<BxTheme>(THEME_CHANGE_EVENT, { detail: theme }))
}

export function subscribeToTheme(listener: (theme: BxTheme) => void): () => void {
  const handleThemeChange = (event: Event) => {
    const theme = normalizeTheme((event as CustomEvent<unknown>).detail)
    applyTheme(theme)
    listener(theme)
  }
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_KEY) return
    const theme = currentTheme()
    applyTheme(theme)
    listener(theme)
  }

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  window.addEventListener('storage', handleStorageChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.removeEventListener('storage', handleStorageChange)
  }
}

export function currentTheme(): BxTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    const normalized = normalizeTheme(stored)
    if (stored && stored !== normalized) localStorage.setItem(THEME_KEY, normalized)
    return normalized
  } catch {
    return 'dark'
  }
}

export function nextTheme(theme: BxTheme): BxTheme {
  const currentIndex = BX_THEMES.indexOf(theme)
  return BX_THEMES[(currentIndex + 1) % BX_THEMES.length]
}
