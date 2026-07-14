// Единая точка применения темы.
// Класс .light включает светлые CSS-переменные (globals.css),
// класс .dark управляет Tailwind dark:-вариантами (darkMode: 'class').
// Классы всегда инверсны — иначе dark:-стили следуют теме ОС, а не приложению.

export type BxTheme = 'dark' | 'light'
export const THEME_KEY = 'bx_theme'

export function applyTheme(theme: BxTheme): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme !== 'light')
}

export function currentTheme(): BxTheme {
  try {
    return (localStorage.getItem(THEME_KEY) as BxTheme) || 'dark'
  } catch {
    return 'dark'
  }
}
