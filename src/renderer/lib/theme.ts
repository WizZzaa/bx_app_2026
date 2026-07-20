// Единая точка применения темы для Desktop и Web.
// Пользовательский выбор хранится отдельно от фактически применённой светлой/
// тёмной схемы, чтобы режим system мог следовать настройке ОС без потери выбора.

export const BX_THEMES = ['system', 'light', 'dark', 'high-contrast'] as const
export type BxTheme = typeof BX_THEMES[number]
export type ResolvedBxTheme = 'light' | 'dark' | 'high-contrast'
export const THEME_KEY = 'bx_theme'
export const THEME_CHANGE_EVENT = 'bx:theme-change'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

export function normalizeTheme(value: unknown): BxTheme {
  // Миграция ранее выпущенных тем без сброса пользовательской настройки.
  if (value === 'lime') return 'high-contrast'
  if (value === 'lime-light' || value === 'lavender-light') return 'light'
  return BX_THEMES.includes(value as BxTheme) ? value as BxTheme : 'light'
}

export function resolveTheme(theme: BxTheme): ResolvedBxTheme {
  if (theme !== 'system') return theme
  return window.matchMedia?.(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light'
}

export function applyTheme(theme: BxTheme): void {
  const root = document.documentElement
  const resolved = resolveTheme(theme)
  root.classList.toggle('light', resolved === 'light')
  root.classList.toggle('dark', resolved === 'dark' || resolved === 'high-contrast')
  root.classList.toggle('high-contrast', resolved === 'high-contrast')
  root.classList.remove('lime', 'lavender-light')
  root.dataset.theme = theme
  root.dataset.resolvedTheme = resolved
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
  const handleSystemThemeChange = () => {
    const theme = currentTheme()
    if (theme !== 'system') return
    applyTheme(theme)
    listener(theme)
  }
  const media = window.matchMedia?.(SYSTEM_DARK_QUERY)

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  window.addEventListener('storage', handleStorageChange)
  media?.addEventListener?.('change', handleSystemThemeChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    window.removeEventListener('storage', handleStorageChange)
    media?.removeEventListener?.('change', handleSystemThemeChange)
  }
}

export function currentTheme(): BxTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    const normalized = normalizeTheme(stored)
    if (stored && stored !== normalized) localStorage.setItem(THEME_KEY, normalized)
    return normalized
  } catch {
    return 'light'
  }
}

export function nextTheme(theme: BxTheme): BxTheme {
  const currentIndex = BX_THEMES.indexOf(theme)
  return BX_THEMES[(currentIndex + 1) % BX_THEMES.length]
}
