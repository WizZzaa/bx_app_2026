export const UI_DENSITY_KEY = 'bx_ui_density'

export type UiDensity = 'comfortable' | 'compact'

export function normalizeUiDensity(value: unknown): UiDensity {
  return value === 'compact' ? 'compact' : 'comfortable'
}

export function currentUiDensity(): UiDensity {
  if (typeof window === 'undefined') return 'comfortable'
  return normalizeUiDensity(localStorage.getItem(UI_DENSITY_KEY))
}

export function applyUiDensity(value: UiDensity) {
  document.documentElement.dataset.density = normalizeUiDensity(value)
}

export function saveUiDensity(value: UiDensity) {
  const normalized = normalizeUiDensity(value)
  localStorage.setItem(UI_DENSITY_KEY, normalized)
  applyUiDensity(normalized)
}
