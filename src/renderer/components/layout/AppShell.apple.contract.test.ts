import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const shellCss = fs.readFileSync(path.join(projectRoot, 'src/renderer/styles/app-shell-d1.css'), 'utf8')
const tokensCss = fs.readFileSync(path.join(projectRoot, 'src/shared/design/tokens.css'), 'utf8')
const sidebarSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/layout/Sidebar.tsx'), 'utf8')
const topbarSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/layout/Topbar.tsx'), 'utf8')
const titlebarSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/layout/Titlebar.tsx'), 'utf8')
const paletteSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/CommandPalette.tsx'), 'utf8')
const authCss = fs.readFileSync(path.join(projectRoot, 'src/renderer/styles/auth-shell-d1.css'), 'utf8')
const pinSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/auth/PinScreen.tsx'), 'utf8')
const onboardingSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/OnboardingWizard.tsx'), 'utf8')

describe('Apple-style application shell contract', () => {
  it('uses platform typography and restrained functional materials', () => {
    expect(tokensCss).toContain('-apple-system, BlinkMacSystemFont')
    expect(shellCss).toContain('backdrop-filter: blur(28px) saturate(165%)')
    expect(shellCss).toContain('.bx-app-sidebar__footer::before')
    expect(shellCss).not.toContain('animate-pulse')
  })

  it('responds on press and honors independent accessibility preferences', () => {
    expect(shellCss).toMatch(/\.bx-app-nav-item:active[\s\S]*transform: scale\(0\.97\)/)
    expect(shellCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(shellCss).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(shellCss).toContain('@media (prefers-contrast: more)')
    expect(shellCss).toContain('@media (forced-colors: active)')
  })

  it('preserves the sidebar state key and exposes critical destinations', () => {
    expect(sidebarSource).toContain("const STORAGE_KEY = 'bx_sidebar_collapsed'")
    expect(sidebarSource).toContain('SIDEBAR_NAVIGATION_GROUPS')
    expect(sidebarSource).toContain('APP_DESTINATIONS.support')
    expect(sidebarSource).toContain('APP_DESTINATIONS.settings')
    expect(sidebarSource).toContain('APP_DESTINATIONS.account')
  })

  it('keeps one global search entry and preserves operational topbar actions', () => {
    expect(topbarSource).toContain('Открыть глобальный поиск')
    expect(topbarSource).not.toContain('buildIndex')
    expect(topbarSource).not.toContain('saveTheme')
    expect(topbarSource).toContain("localStorage.setItem('bx_tools_last', 'notes')")
    expect(topbarSource).toContain("localStorage.setItem('bx_planner_open_event_id', notification.event_id)")
    expect(topbarSource).toContain('syncOfflineData')
    expect(topbarSource).toContain('CompanySwitcher')
  })

  it('restores focus and keeps keyboard navigation inside the command palette', () => {
    expect(paletteSource).toContain('previousFocusRef.current?.focus()')
    expect(paletteSource).toContain("event.key === 'Escape'")
    expect(paletteSource).toContain("event.key === 'ArrowDown'")
    expect(paletteSource).toContain("event.key === 'Tab'")
    expect(paletteSource).toContain('role="listbox"')
    expect(paletteSource).toContain('aria-activedescendant')
  })

  it('retains Electron window actions while using the shared titlebar geometry', () => {
    expect(titlebarSource).toContain('bx-app-titlebar')
    expect(titlebarSource).toContain('window.bx.window.minimize')
    expect(titlebarSource).toContain('windowApi.maximize')
    expect(titlebarSource).toContain('window.bx.window.close')
  })

  it('applies the same accessible Apple-style contract to PIN and onboarding', () => {
    expect(authCss).toContain('backdrop-filter: blur(28px) saturate(160%)')
    expect(authCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(authCss).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(authCss).toContain('@media (prefers-contrast: more)')
    expect(authCss).toContain('@media (forced-colors: active)')
    expect(pinSource).toContain("const PIN_LENGTH = 4")
    expect(pinSource).toContain('recordFailedAttempt')
    expect(pinSource).toContain('onSetPin')
    expect(onboardingSource).toContain("'bx_complete_product_onboarding'")
    expect(onboardingSource).toContain("complete('free')")
    expect(onboardingSource).toContain("complete('trial')")
  })
})
