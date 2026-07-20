import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const app = readFileSync(resolve(process.cwd(), 'src/renderer/App.tsx'), 'utf8')
const css = readFileSync(resolve(process.cwd(), 'src/renderer/styles/workspace-pages-d1.css'), 'utf8')
const preview = readFileSync(resolve(process.cwd(), 'src/renderer/WorkspaceD1.preview.tsx'), 'utf8')

const workspaceRoutes = [
  '/',
  '/dashboard',
  '/tools',
  '/translator',
  '/reference',
  '/services',
  '/functions',
  '/news',
  '/news/:id',
  '/knowledge',
  '/documents/templates',
  '/documents/my',
  '/finance',
  '/finance/:id',
  '/currency',
  '/planner',
  '/calc',
  '/ai',
  '/support',
  '/settings',
  '/account',
  '/counterparties',
  '/counterparties/:id',
  '/companies/:id',
] as const

describe('D1 workspace route contracts', () => {
  it('places every product route inside the shared Desktop and Web design frame', () => {
    expect(app).toContain("import './styles/workspace-pages-d1.css'")
    expect(app).toContain('className="bx-workspace-route')
    expect(app).toContain('data-bx-route={location.pathname}')

    workspaceRoutes.forEach((route) => {
      expect(app).toContain(`path="${route}"`)
    })
  })

  it('defines shared responsive, accessibility and motion guarantees', () => {
    expect(css).toContain('.bx-workspace-route')
    expect(css).toContain('min-height: var(--bx-target-min)')
    expect(css).toContain('@media (max-width: 1023px)')
    expect(css).toContain('@media (max-width: 767px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (forced-colors: active)')
  })

  it('covers dense, resource, tool, planning, AI and settings page families', () => {
    expect(css).toContain('.bx-resource-layout')
    expect(css).toContain("[data-bx-route='/ai']")
    expect(css).toContain("[data-bx-route='/translator']")
    expect(css).toContain("[data-bx-route='/planner']")
    expect(css).toContain("[data-bx-route='/tools']")
    expect(css).toContain("[data-bx-route='/settings']")
    expect(css).toContain("[data-bx-route='/account']")
  })

  it('does not add persistence or domain mutations to the visual layer', () => {
    expect(css).not.toContain('localStorage')
    expect(css).not.toContain('sessionStorage')
    expect(css).not.toMatch(/\.insert\(|\.update\(|\.delete\(/)
  })

  it('keeps the auth-free QA preview isolated from the production entry point', () => {
    expect(preview).toContain('<App />')
    expect(preview).not.toContain('AuthGate')
    expect(readFileSync(resolve(process.cwd(), 'vite.renderer.config.mts'), 'utf8')).not.toContain('workspace-preview.html')
  })
})
