export const FONT_SCALE_KEY = 'bx_font_scale'

export type FontScale = '100' | '110' | '125'

export const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; hint: string }> = [
  { value: '100', label: 'Обычный', hint: '100%' },
  { value: '110', label: 'Крупнее', hint: '110%' },
  { value: '125', label: 'Крупный', hint: '125%' },
]

export function normalizeFontScale(value: string | null | undefined): FontScale {
  if (value === '110') return '110'
  if (value === '120' || value === '125' || value === '130') return '125'
  return '100'
}

export function currentFontScale(): FontScale {
  if (typeof window === 'undefined') return '100'
  return normalizeFontScale(localStorage.getItem(FONT_SCALE_KEY))
}

export function applyFontScale(value: FontScale) {
  const normalized = normalizeFontScale(value)
  const multiplier = Number(normalized) / 100
  document.documentElement.dataset.fontScale = normalized
  document.documentElement.style.setProperty('--bx-font-scale', String(multiplier))
  document.documentElement.style.setProperty('--bx-root-font-size', `${16 * multiplier}px`)
}

export function saveFontScale(value: FontScale) {
  const normalized = normalizeFontScale(value)
  localStorage.setItem(FONT_SCALE_KEY, normalized)
  applyFontScale(normalized)
}
