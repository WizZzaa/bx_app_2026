// Единая точка применения темы.
// Классы .light и .lime включают свои CSS-переменные (globals.css),
// класс .dark управляет Tailwind dark:-вариантами (darkMode: 'class').
// Лаймовая тема остаётся тёмной по контрастной модели, поэтому получает
// одновременно классы .dark и .lime.

export const BX_THEMES = ['light', 'dark', 'lime'] as const
export type BxTheme = typeof BX_THEMES[number]
export const THEME_KEY = 'bx_theme'

export function normalizeTheme(value: unknown): BxTheme {
  return BX_THEMES.includes(value as BxTheme) ? value as BxTheme : 'dark'
}

export function applyTheme(theme: BxTheme): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme !== 'light')
  root.classList.toggle('lime', theme === 'lime')
  root.dataset.theme = theme
}

export function currentTheme(): BxTheme {
  try {
    return normalizeTheme(localStorage.getItem(THEME_KEY))
  } catch {
    return 'dark'
  }
}

export function nextTheme(theme: BxTheme): BxTheme {
  const currentIndex = BX_THEMES.indexOf(theme)
  return BX_THEMES[(currentIndex + 1) % BX_THEMES.length]
}
