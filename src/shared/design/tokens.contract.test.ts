import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/shared/design/tokens.css', 'utf8')

const blockAfter = (selector: string) => {
  const start = css.indexOf(selector)
  if (start < 0) throw new Error(`Missing selector: ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

const declarations = (block: string) => Array.from(block.matchAll(/(--bx-[a-z0-9-]+)\s*:\s*([^;]+);/g))
const declarationMap = (block: string) => new Map(declarations(block).map(match => [match[1], match[2].trim()]))

const themes = {
  light: declarationMap(blockAfter(":root[data-bx-design='d1'] {")),
  dark: declarationMap(blockAfter(":root[data-bx-design='d1'][data-theme='dark']")),
  highContrast: declarationMap(blockAfter(":root[data-bx-design='d1'][data-theme='high-contrast']")),
  systemDark: declarationMap(blockAfter(":root[data-bx-design='d1'][data-theme='system']")),
}

const colourTokens = [
  '--bx-canvas',
  '--bx-surface',
  '--bx-surface-subtle',
  '--bx-surface-strong',
  '--bx-text-primary',
  '--bx-text-secondary',
  '--bx-border',
  '--bx-brand',
  '--bx-brand-hover',
  '--bx-brand-soft',
  '--bx-brand-action',
  '--bx-contrast',
  '--bx-on-brand',
  '--bx-success',
  '--bx-warning',
  '--bx-warning-text',
  '--bx-danger',
  '--bx-info',
  '--bx-focus',
  '--bx-scrim',
] as const

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Expected six-digit hex, received ${hex}`)
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16))
}

const luminance = (hex: string) => {
  const channels = hexToRgb(hex).map(channel => {
    const normalized = channel / 255
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrast = (foreground: string, background: string) => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const tokenValue = (theme: Map<string, string>, token: string) => {
  const value = theme.get(token)
  if (!value) throw new Error(`Missing ${token}`)
  return value
}

describe('BX semantic design tokens', () => {
  it('keeps self-hosted Geist first with a system-safe fallback stack', () => {
    expect(themes.light.get('--bx-font-sans')).toBe('"Geist Variable", Geist, Inter, "Segoe UI", Roboto, Arial, sans-serif')
  })

  it('defines each custom property only once inside every canonical theme block', () => {
    for (const [name, selector] of [
      ['light', ":root[data-bx-design='d1'] {"],
      ['dark', ":root[data-bx-design='d1'][data-theme='dark']"],
      ['high-contrast', ":root[data-bx-design='d1'][data-theme='high-contrast']"],
      ['system-dark', ":root[data-bx-design='d1'][data-theme='system']"],
    ] as const) {
      const names = declarations(blockAfter(selector)).map(match => match[1])
      expect(new Set(names).size, `${name} contains a duplicate token`).toBe(names.length)
    }
  })

  it('keeps semantic colour roles in parity across light, dark and high contrast', () => {
    for (const theme of Object.values(themes)) {
      expect(colourTokens.filter(token => !theme.has(token))).toEqual([])
    }
  })

  it('maps the system dark preference to the explicit dark theme', () => {
    for (const token of colourTokens) {
      expect(themes.systemDark.get(token), `${token} differs in system dark mode`).toBe(themes.dark.get(token))
    }
  })

  it('matches the approved light and dark palette exactly', () => {
    expect(Object.fromEntries(colourTokens.map(token => [token, themes.light.get(token)]))).toEqual({
      '--bx-canvas': '#f7f6fa',
      '--bx-surface': '#ffffff',
      '--bx-surface-subtle': '#f1eff6',
      '--bx-surface-strong': '#e5dfec',
      '--bx-text-primary': '#27242f',
      '--bx-text-secondary': '#6e6877',
      '--bx-border': '#ded9e8',
      '--bx-brand': '#7568d8',
      '--bx-brand-hover': '#6659c8',
      '--bx-brand-soft': '#eeeafb',
      '--bx-brand-action': '#6659c8',
      '--bx-contrast': '#30284d',
      '--bx-on-brand': '#ffffff',
      '--bx-success': '#2f7d58',
      '--bx-warning': '#a96914',
      '--bx-warning-text': '#8a5a00',
      '--bx-danger': '#b53a45',
      '--bx-info': '#52677a',
      '--bx-focus': '#7568d8',
      '--bx-scrim': 'rgb(17 16 24 / 0.56)',
    })
    expect(Object.fromEntries(colourTokens.map(token => [token, themes.dark.get(token)]))).toEqual({
      '--bx-canvas': '#111018',
      '--bx-surface': '#181621',
      '--bx-surface-subtle': '#211e2b',
      '--bx-surface-strong': '#2a2636',
      '--bx-text-primary': '#f7f4fb',
      '--bx-text-secondary': '#c2bacd',
      '--bx-border': '#3d374a',
      '--bx-brand': '#b9a2e2',
      '--bx-brand-hover': '#c7b4e9',
      '--bx-brand-soft': '#2a2636',
      '--bx-brand-action': '#b9a2e2',
      '--bx-contrast': '#d3c1f2',
      '--bx-on-brand': '#1b1329',
      '--bx-success': '#57cc8a',
      '--bx-warning': '#f0b45a',
      '--bx-warning-text': '#f0b45a',
      '--bx-danger': '#ff8a80',
      '--bx-info': '#75b8ff',
      '--bx-focus': '#d3c1f2',
      '--bx-scrim': 'rgb(0 0 0 / 0.64)',
    })
  })

  it('meets WCAG AA for text, brand labels and semantic status text', () => {
    for (const theme of Object.values(themes)) {
      const canvas = tokenValue(theme, '--bx-canvas')
      const surface = tokenValue(theme, '--bx-surface')
      expect(contrast(tokenValue(theme, '--bx-text-primary'), canvas)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokenValue(theme, '--bx-text-secondary'), canvas)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokenValue(theme, '--bx-text-primary'), surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(tokenValue(theme, '--bx-on-brand'), tokenValue(theme, '--bx-brand-action'))).toBeGreaterThanOrEqual(4.5)
      for (const status of ['--bx-success', '--bx-warning-text', '--bx-danger', '--bx-info'] as const) {
        expect(contrast(tokenValue(theme, status), surface), `${status} lacks contrast`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('keeps high contrast opaque and preserves the hierarchy without shadows', () => {
    expect(themes.highContrast.get('--bx-canvas')).toBe('#000000')
    expect(themes.highContrast.get('--bx-text-primary')).toBe('#ffffff')
    expect(themes.highContrast.get('--bx-border')).toBe('#ffffff')
    expect(themes.highContrast.get('--bx-brand')).toBe('#ffeb00')
    expect(themes.highContrast.get('--bx-scrim')).toBe('#000000')
    expect(themes.highContrast.get('--bx-shadow-sm')).toBe('none')
    expect(themes.highContrast.get('--bx-shadow-overlay')).toBe('none')
  })

  it('keeps every runtime theme scoped behind the D1 feature marker', () => {
    expect(css).not.toMatch(/(^|\n):root\s*\{/)
    expect(css).not.toMatch(/(^|\n):root\[data-theme=/)
    expect(css.match(/:root\[data-bx-design='d1'\]/g)?.length).toBeGreaterThanOrEqual(6)
  })
})
