export const BX_DESIGN_FEATURE_ATTRIBUTE = 'data-bx-design' as const
export const BX_DESIGN_FEATURE_VALUE = 'd1' as const

const ENABLED_VALUES = new Set(['1', 'true', 'on'])
const DISABLED_VALUES = new Set(['0', 'false', 'off'])

export const parseBxDesignFeatureFlag = (value: unknown): boolean =>
  typeof value === 'string' && ENABLED_VALUES.has(value.trim().toLowerCase())

/**
 * D1 is the canonical BX interface. An explicit false value is retained as a
 * release rollback switch, while missing/empty values follow the supplied
 * default instead of silently restoring the legacy UI.
 */
export const resolveBxDesignFeatureFlag = (
  value: unknown,
  defaultEnabled = true,
): boolean => {
  if (typeof value !== 'string' || value.trim() === '') return defaultEnabled
  const normalized = value.trim().toLowerCase()
  if (ENABLED_VALUES.has(normalized)) return true
  if (DISABLED_VALUES.has(normalized)) return false
  return defaultEnabled
}

export const applyBxDesignFeature = (
  root: HTMLElement,
  enabled: boolean,
): void => {
  if (enabled) {
    root.setAttribute(BX_DESIGN_FEATURE_ATTRIBUTE, BX_DESIGN_FEATURE_VALUE)
    return
  }

  root.removeAttribute(BX_DESIGN_FEATURE_ATTRIBUTE)
}

export const isBxDesignFeatureEnabled = (
  root: Pick<HTMLElement, 'getAttribute'> | null | undefined =
    typeof document === 'undefined' ? undefined : document.documentElement,
): boolean => root?.getAttribute(BX_DESIGN_FEATURE_ATTRIBUTE) === BX_DESIGN_FEATURE_VALUE

export const loadBxDesignFont = async (enabled: boolean): Promise<void> => {
  if (!enabled) return
  await import('@fontsource-variable/geist')
}
