export const BX_DESIGN_FEATURE_ATTRIBUTE = 'data-bx-design' as const
export const BX_DESIGN_FEATURE_VALUE = 'd1' as const

const ENABLED_VALUES = new Set(['1', 'true', 'on'])

export const parseBxDesignFeatureFlag = (value: unknown): boolean =>
  typeof value === 'string' && ENABLED_VALUES.has(value.trim().toLowerCase())

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
