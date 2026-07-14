// Телеметрия ошибок: фатальные сбои рендерера улетают в bx_error_logs,
// откуда их читает админ-консоль (Аналитика / Релизы).
// Шлём только настоящие сбои (краш рендера, непойманные исключения/промисы),
// с дедупликацией и потолком на сессию — никакого флуда.

import { supabase } from './db/supabase'
import { APP_VERSION } from '../../shared/version'

const MAX_PER_SESSION = 10
const seen = new Set<string>()
let sent = 0

function detectPlatform(): string {
  const bx = (window as unknown as { bx?: { platform?: string } }).bx
  if (bx?.platform) return bx.platform // win32 | darwin | linux (Electron)
  return 'web'
}

export async function reportError(message: string, stack?: string | null): Promise<void> {
  try {
    const key = message.slice(0, 200)
    if (!message || seen.has(key) || sent >= MAX_PER_SESSION) return
    seen.add(key)
    sent++

    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('bx_error_logs').insert({
      user_id: session?.user?.id ?? null,
      version: APP_VERSION,
      platform: detectPlatform(),
      message: message.slice(0, 1000),
      stack: stack ? String(stack).slice(0, 4000) : null,
    })
  } catch {
    // телеметрия никогда не должна ломать приложение
  }
}

/** Глобальные ловушки: непойманные исключения и отклонённые промисы. */
export function installGlobalErrorReporting(): void {
  window.addEventListener('error', e => {
    reportError(e.message || 'Unknown error', e.error?.stack ?? `${e.filename}:${e.lineno}`)
  })
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason
    reportError(
      (r && (r.message || String(r))) || 'Unhandled rejection',
      r && r.stack ? r.stack : null,
    )
  })
}
