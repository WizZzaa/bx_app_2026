import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'
import { normalizeSiteUrl, type SiteResetMode, type SiteSessionResult } from '../../../shared/siteSession'

const LAST_SITE_KEY = 'bx_site_session_last_url'
const PRESETS = [
  { label: 'Soliq', url: 'https://my.soliq.uz' },
  { label: 'Didox', url: 'https://app.didox.uz' },
  { label: 'Faktura', url: 'https://app.faktura.uz' },
  { label: 'my.gov.uz', url: 'https://my.gov.uz' },
]

type BusyAction = 'open' | SiteResetMode | null

export default function SiteSessionReset() {
  const [url, setUrl] = useState(() => localStorage.getItem(LAST_SITE_KEY) ?? '')
  const [busy, setBusy] = useState<BusyAction>(null)
  const [result, setResult] = useState<SiteSessionResult | null>(null)
  const [showFullReset, setShowFullReset] = useState(false)
  const [confirmFull, setConfirmFull] = useState(false)
  const desktopAvailable = Boolean(window.bx?.siteSession)

  const parsed = (() => {
    try {
      return url.trim() ? normalizeSiteUrl(url) : null
    } catch {
      return null
    }
  })()

  const validate = () => {
    try {
      const normalized = normalizeSiteUrl(url)
      localStorage.setItem(LAST_SITE_KEY, normalized.url)
      setUrl(normalized.url)
      return normalized
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Проверьте адрес сайта' })
      return null
    }
  }

  const run = async (action: BusyAction) => {
    if (!action || busy) return
    const normalized = validate()
    if (!normalized) return

    if (!window.bx?.siteSession) {
      if (action === 'open') window.open(normalized.url, '_blank', 'noopener,noreferrer')
      setResult({
        success: false,
        error: action === 'open'
          ? 'Сайт открыт в обычном браузере. Очистка доступна в приложении BX для ПК.'
          : 'Очистка сайта доступна только в приложении BX для ПК.',
      })
      return
    }

    setBusy(action)
    setResult(null)
    try {
      const response = action === 'open'
        ? await window.bx.siteSession.open(normalized.url)
        : await window.bx.siteSession.reset(normalized.url, action)
      setResult(response)
      if (action === 'full' && response.success) {
        setConfirmFull(false)
        setShowFullReset(false)
      }
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Операция не выполнена' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[28px] border border-bx-border bg-bx-surface shadow-sm">
        <div className="border-b border-bx-border bg-gradient-to-br from-cyan-500/10 via-bx-surface to-blue-500/5 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                <Icon name="globe" className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Окно веб-сервисов BX</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-bx-text sm:text-3xl">Перезапустить зависший сайт</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-bx-muted">
                Откройте онлайн-сервис в отдельном окне BX. Если он зависнет, очистите только его кэш — остальные сайты и браузеры не пострадают.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 lg:max-w-xs">
              <div className="flex items-start gap-3">
                <Icon name="shield" className="mt-0.5 h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-extrabold text-bx-text">Безопасно для других сайтов</p>
                  <p className="mt-1 text-xs leading-5 text-bx-muted">Для каждого адреса BX создаёт отдельное хранилище данных.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
          <div className="space-y-5">
            {!desktopAvailable && (
              <div className="flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4" role="note">
                <Icon name="alert" className="mt-0.5 h-5 w-5 flex-none text-amber-700 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-extrabold text-bx-text">Сейчас открыта браузерная версия</p>
                  <p className="mt-1 text-xs leading-5 text-bx-muted">Она может открыть сайт, но не имеет права очищать его данные. Для сброса используйте BX для ПК.</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="site-reset-url" className="mb-2 block text-xs font-extrabold text-bx-text">Адрес зависшего сайта</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Icon name="globe" className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bx-muted" />
                  <input
                    id="site-reset-url"
                    type="url"
                    value={url}
                    onChange={event => { setUrl(event.target.value); setResult(null) }}
                    onKeyDown={event => { if (event.key === 'Enter') void run('open') }}
                    placeholder="Например: my.soliq.uz"
                    autoComplete="url"
                    className="min-h-12 w-full rounded-xl border border-bx-border bg-bx-bg py-3 pl-11 pr-4 text-sm font-semibold text-bx-text outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void run('open')}
                  disabled={Boolean(busy) || !url.trim()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bx-text px-5 text-sm font-extrabold text-bx-bg transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Icon name="external" className="h-4 w-4" />
                  {busy === 'open' ? 'Открываем…' : 'Открыть сайт'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Популярные сервисы">
                {PRESETS.map(preset => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => { setUrl(preset.url); setResult(null) }}
                    className="min-h-9 rounded-lg border border-bx-border bg-bx-surface-2 px-3 text-xs font-bold text-bx-muted transition hover:border-cyan-500/40 hover:text-bx-text focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/7 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                  <Icon name="recycle" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-bx-text">Безопасная очистка</h3>
                  <p className="mt-1 text-sm leading-6 text-bx-muted">Удалит кэш, старый код сайта и зависший service worker. Логин, cookies и введённые настройки останутся.</p>
                  <button
                    type="button"
                    onClick={() => void run('cache')}
                    disabled={Boolean(busy) || !url.trim() || !desktopAvailable}
                    className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Icon name="zap" className="h-4 w-4" />
                    {busy === 'cache' ? 'Очищаем и открываем…' : 'Очистить кэш и открыть заново'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-bx-border bg-bx-surface-2/65 p-5">
              <button
                type="button"
                onClick={() => { setShowFullReset(value => !value); setConfirmFull(false) }}
                className="flex min-h-11 w-full items-center justify-between gap-4 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-red-500/30"
                aria-expanded={showFullReset}
              >
                <span>
                  <span className="block text-sm font-extrabold text-bx-text">Полный сброс сайта</span>
                  <span className="mt-1 block text-xs text-bx-muted">Только если безопасная очистка не помогла</span>
                </span>
                <Icon name="arrowR" className={`h-5 w-5 flex-none text-bx-muted transition-transform ${showFullReset ? '-rotate-90' : 'rotate-90'}`} />
              </button>

              {showFullReset && (
                <div className="mt-4 border-t border-bx-border pt-4">
                  <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/8 p-4">
                    <Icon name="alert" className="mt-0.5 h-5 w-5 flex-none text-red-600 dark:text-red-400" />
                    <p className="text-xs leading-5 text-bx-muted">Будут удалены cookies, авторизация и локальные данные только этого сайта. После сброса потребуется войти заново.</p>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm text-bx-text focus-within:ring-2 focus-within:ring-red-500/30">
                    <input
                      type="checkbox"
                      checked={confirmFull}
                      onChange={event => setConfirmFull(event.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-bx-border accent-red-600"
                    />
                    <span>Понимаю, что на выбранном сайте будет выполнен выход из аккаунта</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void run('full')}
                    disabled={!confirmFull || Boolean(busy) || !url.trim() || !desktopAvailable}
                    className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-600 px-5 text-sm font-extrabold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    {busy === 'full' ? 'Выполняем полный сброс…' : 'Полностью сбросить этот сайт'}
                  </button>
                </div>
              )}
            </div>

            {result && (
              <div
                role="status"
                aria-live="polite"
                className={`flex gap-3 rounded-2xl border p-4 ${result.success ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-red-500/25 bg-red-500/8'}`}
              >
                <Icon name={result.success ? 'check' : 'alert'} className={`mt-0.5 h-5 w-5 flex-none ${result.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                <p className="text-sm font-semibold leading-6 text-bx-text">{result.message ?? result.error}</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-bx-border bg-bx-surface-2/65 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-bx-muted">Как пользоваться</p>
              <ol className="mt-4 space-y-4">
                {[
                  ['1', 'Введите адрес', 'Или выберите знакомый сервис ниже поля.'],
                  ['2', 'Работайте в окне BX', 'Вход и настройки сайта сохранятся.'],
                  ['3', 'Если завис — очистите', 'Начните с безопасной очистки кэша.'],
                ].map(([step, title, text]) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-bx-text text-xs font-black text-bx-bg">{step}</span>
                    <div>
                      <p className="text-sm font-extrabold text-bx-text">{title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-bx-muted">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-bx-border bg-bx-surface p-5">
              <div className="flex items-center gap-2">
                <Icon name="info" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-bx-text">Если сайт открыт в Chrome</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-bx-muted">BX не удаляет данные из личного браузера без разрешения. Для жёсткого обновления страницы используйте:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <kbd className="rounded-lg border border-bx-border bg-bx-surface-2 px-2.5 py-1.5 text-xs font-bold text-bx-text">Ctrl + Shift + R</kbd>
                <kbd className="rounded-lg border border-bx-border bg-bx-surface-2 px-2.5 py-1.5 text-xs font-bold text-bx-text">⌘ + Shift + R</kbd>
              </div>
            </div>

            {parsed && (
              <div className="rounded-2xl border border-bx-border bg-bx-surface p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-bx-muted">Будет очищен только</p>
                <p className="mt-2 break-all text-sm font-extrabold text-bx-text">{parsed.origin}</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
