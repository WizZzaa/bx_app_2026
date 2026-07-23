import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const shellCss = fs.readFileSync(path.join(projectRoot, 'src/renderer/styles/app-shell-d1.css'), 'utf8')
const tokensCss = fs.readFileSync(path.join(projectRoot, 'src/shared/design/tokens.css'), 'utf8')
const sidebarSource = fs.readFileSync(path.join(projectRoot, 'src/renderer/components/layout/Sidebar.tsx'), 'utf8')

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
})
