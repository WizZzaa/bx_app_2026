export const FONT_SCALE_KEY = 'bx_font_scale'

export type FontScale = '100' | '110' | '120' | '130'

export const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; hint: string }> = [
  { value: '100', label: 'Обычный', hint: '100%' },
  { value: '110', label: 'Крупнее', hint: '110%' },
  { value: '120', label: 'Крупный', hint: '120%' },
  { value: '130', label: 'Максимум', hint: '130%' },
]

export function normalizeFontScale(value: string | null | undefined): FontScale {
  return FONT_SCALE_OPTIONS.some(option => option.value === value) ? value as FontScale : '100'
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
