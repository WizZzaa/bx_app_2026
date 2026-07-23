import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/renderer/pages/DashboardD1.css'), 'utf8')
const a1Css = readFileSync(resolve(process.cwd(), 'src/renderer/pages/DashboardA1.css'), 'utf8')
const entry = readFileSync(resolve(process.cwd(), 'src/renderer/pages/Dashboard.tsx'), 'utf8')
const view = readFileSync(resolve(process.cwd(), 'src/renderer/pages/DashboardD1.tsx'), 'utf8')
const weather = readFileSync(resolve(process.cwd(), 'src/renderer/components/widgets/WeatherWidget.tsx'), 'utf8')

describe('D1 Dashboard contracts', () => {
  it('stays lazy and guarded so the legacy dashboard remains the default rollback', () => {
    expect(entry).toContain("lazy(() => import('./DashboardD1'))")
    expect(entry).toContain('isBxDesignFeatureEnabled()')
    expect(entry).toContain('return <LegacyDashboard />')
  })

  it('defines mobile, tablet and desktop compositions without fixed desktop widths', () => {
    expect(css).toContain('@media (max-width: 47.999rem)')
    expect(css).toContain('@media (min-width: 48rem)')
    expect(css).toContain('@media (min-width: 64rem)')
    expect(css).toContain('grid-template-columns: repeat(8, minmax(0, 1fr))')
    expect(css).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))')
    expect(css).toContain('width: min(100%, var(--bx-content-max))')
    expect(css).not.toMatch(/min-width:\s*[4-9]\d\dpx/)
  })

  it('keeps desktop dashboard modules on shared column axes instead of inherited bento spans', () => {
    expect(view).toContain('useDesktopWorkspace')
    expect(view).toContain('bx-d1-dashboard__main-column')
    expect(view).toContain('bx-d1-dashboard__signal-column')
    expect(css).toContain('.bx-d1-dashboard__main-column > *')
    expect(css).toContain('grid-column: 1 / -1')
  })

  it('keeps touch, focus, sticky safe-area and reduced-motion guarantees explicit', () => {
    expect(css).toContain('min-height: var(--bx-target-min)')
    expect(css).toContain('outline: var(--bx-focus-width) solid var(--bx-focus)')
    expect(css).toContain('env(safe-area-inset-bottom)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(view).toContain('IntersectionObserver')
    expect(view).toContain("preset=\"raise\"")
  })

  it('does not write dashboard state to browser storage or mutate domain records', () => {
    expect(view).not.toContain('localStorage')
    expect(view).not.toContain('sessionStorage')
    expect(view).not.toMatch(/\.insert\(|\.update\(|\.delete\(/)
  })

  it('uses the A1 daily control center without duplicating domain state', () => {
    expect(view).toContain("import './DashboardA1.css'")
    expect(view).toContain('bx-d1-dashboard__pause')
    expect(view).toContain('Ближайшее дело, важные сроки и рабочие сигналы')
    expect(a1Css).toContain('grid-column: 1 / -1')
    expect(a1Css).toContain('transform: scale(0.97)')
    expect(a1Css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(a1Css).toContain('@media (prefers-contrast: more)')
    expect(a1Css).toContain('@media (forced-colors: active)')
  })

  it('keeps weather semantics in the shared BX design system', () => {
    expect(weather).toContain('className="bx-weather"')
    expect(weather).toContain('aria-label="Погода в Ташкенте"')
    expect(weather).not.toContain('bg-gradient-to-br')
    expect(weather).not.toContain('animate-pulse')
    expect(a1Css).toContain('.bx-weather__metrics')
    expect(a1Css).toContain('.bx-weather__source')
  })
})
