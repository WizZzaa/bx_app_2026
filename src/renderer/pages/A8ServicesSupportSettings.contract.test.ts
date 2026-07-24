import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('A8 services, support, settings and account Apple-style contracts', () => {
  it('keeps the services registry, cloud cache and external-link safety intact', () => {
    const services = read('src/renderer/pages/Services.tsx')
    const repo = read('src/renderer/lib/db/servicesRepo.ts')

    expect(services).toContain('const QUICK_TASKS')
    expect(services).toContain('Что нужно сделать?')
    expect(services).toContain("window.open(url, '_blank', 'noopener,noreferrer')")
    expect(repo).toContain("const CACHE_KEY = 'bx_services_cloud_cache'")
    expect(repo).toContain(".from('bx_services')")
    expect(repo).toContain("localStorage.setItem(CACHE_KEY")
  })

  it('keeps support submission, history and autosaved draft on existing contracts', () => {
    const support = read('src/renderer/pages/Support.tsx')
    const tickets = read('src/renderer/pages/support/useTickets.ts')

    expect(support).toContain("localStorage.getItem('bx_support_draft')")
    expect(support).toContain("localStorage.setItem('bx_support_draft'")
    expect(support).toContain("localStorage.removeItem('bx_support_draft')")
    expect(support).toContain('const [creating, setCreating] = useState(hasSupport)')
    expect(support).toContain('Черновик сохраняется на устройстве')
    expect(tickets).toContain(".from('bx_tickets')")
    expect(tickets).toContain(".from('bx_ticket_messages')")
    expect(tickets).toContain(".eq('user_id', user.id)")
  })

  it('keeps account and application settings separated without changing storage keys', () => {
    const settings = read('src/renderer/pages/Settings.tsx')
    const navigation = read('src/renderer/pages/settingsNavigation.ts')
    const app = read('src/renderer/App.tsx')

    expect(app).toContain('<Route path="/settings" element={<Settings />} />')
    expect(app).toContain('<Route path="/account" element={<Settings surface="account" />} />')
    expect(navigation).toContain("const ACCOUNT_TABS")
    expect(navigation).toContain("const SETTINGS_TABS")
    expect(settings).toContain("const NOTIFY_KEY = 'bx_notify_days'")
    expect(settings).toContain("const IDLE_LOCK_KEY = 'bx_idle_lock'")
    expect(settings).toContain("localStorage.getItem('bx_ai_provider')")
    expect(settings).toContain('<TrustedDevicesPanel')
    expect(settings).toContain('Визуальный preview будущей онлайн-оплаты')
  })

  it('loads scoped styles lazily and provides accessible platform fallbacks', () => {
    const services = read('src/renderer/pages/Services.tsx')
    const support = read('src/renderer/pages/Support.tsx')
    const settings = read('src/renderer/pages/Settings.tsx')
    const app = read('src/renderer/App.tsx')
    const css = read('src/renderer/styles/a8-services-support-settings.css')

    expect(services).toContain("import '../styles/a8-services-support-settings.css'")
    expect(support).toContain("import '../styles/a8-services-support-settings.css'")
    expect(settings).toContain("import '../styles/a8-services-support-settings.css'")
    expect(app).not.toContain("import './styles/a8-services-support-settings.css'")
    expect(css).toContain('@media (max-width: 1023px)')
    expect(css).toContain('@media (max-width: 720px)')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('@media (prefers-reduced-transparency: reduce)')
    expect(css).toContain('@media (prefers-contrast: more)')
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('min-height: 2.75rem')
  })
})
