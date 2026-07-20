import { readFileSync } from 'node:fs'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BX_REDUCED_MOTION_QUERY } from '../../../shared/design/motion'
import { BxMotion } from './BxMotion'

const setReducedMotion = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query === BX_REDUCED_MOTION_QUERY ? matches : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  })
}

describe('BxMotion mini adapter', () => {
  beforeEach(() => setReducedMotion(false))
  afterEach(cleanup)

  it('imports only the bundle-safe Motion Mini React entry', () => {
    const source = readFileSync('src/renderer/lib/ui/BxMotion.tsx', 'utf8')
    expect(source).toContain("from 'motion/react-mini'")
    expect(source).not.toMatch(/from ['"]motion\/react['"]/) 
    expect(source).not.toContain('LazyMotion')
  })

  it('settles on the canonical target without Web Animations support', () => {
    const { getByTestId } = render(<BxMotion data-testid="motion" preset="raise">Содержимое</BxMotion>)
    const element = getByTestId('motion')
    expect(element.style.opacity).toBe('1')
    expect(element.style.transform).toBe('none')
    expect(element.style.willChange).toBe('')
  })

  it('removes spatial movement when reduced motion is requested', () => {
    setReducedMotion(true)
    const { getByTestId } = render(<BxMotion data-testid="motion" preset="sheet">Содержимое</BxMotion>)
    const element = getByTestId('motion')
    expect(element.style.opacity).toBe('1')
    expect(element.style.transform).toBe('none')
  })
})
