import React, { useState } from 'react'
import { APP_VERSION, CHANGELOG } from '../../../shared/version'
import { applyTheme, normalizeTheme } from '../../lib/theme'
import type { UpdateStatus } from '../../../main/services/updatePolicy'

interface Props {
  onLegacySignIn: (email: string, password: string) => Promise<string | null>
  onResetPassword: (email: string) => Promise<string | null>
  onTelegramSignIn: () => Promise<string | null>
  onRecoverWithCode: (code: string) => Promise<string | null>
}

const LoginScreen: React.FC<Props> = ({ onLegacySignIn, onResetPassword, onTelegramSignIn, onRecoverWithCode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingReferral, setPendingReferral] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [legacyLoading, setLegacyLoading] = useState(false)
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false)
  const [showLegacyLogin, setShowLegacyLogin] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [updateProgress, setUpdateProgress] = useState<number | null>(null)
  const [updateVersion, setUpdateVersion] = useState('')

  const latestEntry = CHANGELOG[0]

  // Telegram создаёт новый аккаунт при первом подтверждении. Реферал применит
  // PlanProvider после появления сессии, как и в прежнем сценарии регистрации.
  React.useEffect(() => {
    try {
      const ref = (new URLSearchParams(window.location.search).get('ref') || '').trim().toUpperCase()
      if (ref) {
        localStorage.setItem('bx_pending_ref', ref)
        setPendingReferral(ref)
      }
    } catch { /* нет window.location — десктоп */ }
  }, [])

  // Экран входа следует выбранной системной теме, как остальные поверхности BX.
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('bx_theme')
      applyTheme(normalizeTheme(savedTheme))
    }
    return undefined
  }, [])

  // Подписка на нативный autoUpdater из Electron
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.bx && window.bx.updater) {
      // Запросить начальный статус
      window.bx.updater.getStatus().then((res) => {
        setUpdateStatus(res.status)
        setUpdateProgress(res.progressPercent)
        setUpdateVersion(res.availableVersion)
      })

      // Слушать обновления статуса в реальном времени
      const unsubscribe = window.bx.updater.onUpdateStatus((data) => {
        setUpdateStatus(data.status)
        setUpdateProgress(data.progressPercent)
        setUpdateVersion(data.availableVersion)
        if (data.status === 'latest') {
          setUpdateStatus('latest')
          setTimeout(() => setUpdateStatus('idle'), 4000)
        } else if (data.status === 'error') {
          setUpdateStatus('error')
          setTimeout(() => setUpdateStatus('idle'), 4000)
        }
      })

      return () => unsubscribe()
    }
    return undefined
  }, [])

  const handleLegacySignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLegacyLoading(true)
    localStorage.setItem('bx_needs_telegram_migration', '1')
    try {
      const err = await onLegacySignIn(email, password)
      if (err) {
        localStorage.removeItem('bx_needs_telegram_migration')
        setError(err)
      }
    } catch {
      localStorage.removeItem('bx_needs_telegram_migration')
      setError('Не удалось проверить прежний аккаунт. Попробуйте ещё раз.')
    } finally {
      setLegacyLoading(false)
    }
  }

  const handleLegacyReset = async () => {
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError('Введите email ранее созданного аккаунта.')
      return
    }
    setLegacyLoading(true)
    try {
      const err = await onResetPassword(email.trim())
      if (err) setError(err)
      else setInfo('Ссылка восстановления отправлена на контактный email старого аккаунта.')
    } finally {
      setLegacyLoading(false)
    }
  }

  const handleTelegramSignIn = async () => {
    setError(null)
    setInfo('Подтвердите собственный контакт в Telegram и вернитесь в BX.')
    setTelegramLoading(true)
    try {
      const err = await onTelegramSignIn()
      if (err) {
        setInfo(null)
        setError(err)
      }
    } catch {
      setInfo(null)
      setError('Не удалось открыть безопасный вход Telegram. Попробуйте ещё раз.')
    } finally {
      setTelegramLoading(false)
    }
  }

  const handleRecovery = async () => {
    setError(null)
    setInfo('Подтвердите номер аккаунта в Telegram и вернитесь в BX.')
    setRecoveryLoading(true)
    try {
      const err = await onRecoverWithCode(recoveryCode.trim().toUpperCase())
      if (err) { setInfo(null); setError(err) }
    } catch {
      setInfo(null)
      setError('Не удалось начать восстановление. Попробуйте ещё раз.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleCheckUpdate = async () => {
    if (typeof window !== 'undefined' && window.bx && window.bx.updater) {
      setUpdateStatus('checking')
      try {
        const res = await window.bx.updater.checkForUpdates()
        setUpdateProgress(res.progressPercent)
        setUpdateVersion(res.availableVersion)
        if (res.status === 'ready') {
          setUpdateStatus('ready')
        } else if (res.status === 'downloading') {
          setUpdateStatus('downloading')
        } else if (res.status === 'checking') {
          setUpdateStatus('checking')
        } else if (res.status === 'error') {
          setUpdateStatus('error')
        } else {
          // Если запуск без упаковки или обновлений нет
          setUpdateStatus('latest')
          setTimeout(() => setUpdateStatus('idle'), 3000)
        }
      } catch {
        setUpdateStatus('error')
        setTimeout(() => setUpdateStatus('idle'), 3000)
      }
      return
    }

    // Резервный веб-вариант проверки
    setUpdateStatus('checking')
    try {
      const res = await fetch('https://api.github.com/repos/WizZzaa/bx_app_2026/releases/latest')
      if (!res.ok) throw new Error('Не удалось проверить')
      const data = await res.json()
      const remoteTag = (data.tag_name || '').replace(/^v/, '')
      if (remoteTag && remoteTag !== APP_VERSION) {
        window.open(`https://github.com/WizZzaa/bx_app_2026/releases/tag/${data.tag_name}`, '_blank')
        setUpdateStatus('idle')
      } else {
        setUpdateStatus('latest')
        setTimeout(() => setUpdateStatus('idle'), 3000)
      }
    } catch {
      setUpdateStatus('error')
      setTimeout(() => setUpdateStatus('idle'), 3000)
    }
  }

  const handleInstallUpdate = () => {
    if (typeof window !== 'undefined' && window.bx && window.bx.updater) {
      setUpdateStatus('installing')
      window.bx.updater.installUpdate()
    }
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-bx-bg px-4 py-8 font-sans text-bx-text">
      <div className="mx-auto w-full max-w-[440px] bx-animate-fade">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/25 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            BX
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-bx-text">
            BX Помощник
          </h1>
          <p className="mt-1.5 text-xs font-semibold text-bx-muted">
            Один подтверждённый номер — один аккаунт
          </p>
        </div>

        {/* Auto updater status banner */}
        {updateStatus === 'downloading' && (
          <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-xs text-blue-300 bx-animate-fade">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                <span>Обновление загружается в фоне…</span>
              </div>
              <span className="font-bold tabular-nums">{updateProgress === null ? 'идёт' : `${updateProgress}%`}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-950/80 ring-1 ring-blue-400/20">
              <div className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-300 ${updateProgress === null ? 'w-1/3 animate-pulse' : ''}`} style={updateProgress === null ? undefined : { width: `${updateProgress}%` }} />
            </div>
          </div>
        )}

        {updateStatus === 'ready' && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300 bx-animate-fade">
            <div>
              <p className="font-bold text-white mb-0.5">Обновление скачано!</p>
              <p className="text-[10px] text-slate-400">{updateVersion ? `Версия ${updateVersion} готова.` : 'Новая версия готова.'} BX сохранит работу и перезапустится.</p>
            </div>
            <button
              type="button"
              onClick={handleInstallUpdate}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Перезапустить и установить
            </button>
          </div>
        )}

        {updateStatus === 'installing' && (
          <div role="status" className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-200 bx-animate-fade">
            <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /><span className="font-bold">BX закрывается и запускает установку…</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-950/80"><div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-emerald-500 to-lime-300" /></div>
          </div>
        )}

        {/* Telegram — единственный публичный сценарий входа и регистрации. */}
        <section className="space-y-5 rounded-3xl border border-bx-border bg-bx-surface p-6 shadow-xl sm:p-8" aria-labelledby="telegram-login-title">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Без пароля BX</p>
            <h2 id="telegram-login-title" className="mt-2 text-xl font-black text-bx-text">Вход и создание аккаунта</h2>
            <p className="mt-2 text-sm leading-relaxed text-bx-muted">Откроется бот <b>@Tech_support_bx_bot</b>. В Telegram нажмите кнопку передачи собственного контакта — номер нельзя ввести вручную.</p>
          </div>

          {pendingReferral && <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-bx-text">Код приглашения <b>{pendingReferral}</b> сохранён и применится после первого входа.</div>}
          {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-300">{error}</div>}
          {info && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">{info}</div>}

          <button type="button" onClick={handleTelegramSignIn} disabled={telegramLoading || recoveryLoading || legacyLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 text-sm font-black text-white transition-colors hover:bg-[#1d8fc4] focus:outline-none focus:ring-2 focus:ring-[#229ED9]/40 focus:ring-offset-2 focus:ring-offset-bx-surface disabled:cursor-wait disabled:opacity-55">
            {telegramLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {telegramLoading ? 'Ожидаю подтверждение в Telegram…' : 'Продолжить через Telegram'}
          </button>
          <p className="text-center text-[10px] leading-relaxed text-bx-muted">Первое подтверждение создаёт аккаунт. Повторное открывает существующий. BX не получает пароль Telegram.</p>

          <button type="button" aria-expanded={showRecoveryOptions} onClick={() => { setShowRecoveryOptions(value => !value); setError(null); setInfo(null) }} className="min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-xs font-bold text-bx-text hover:border-blue-500/40">Проблемы со входом?</button>

          {showRecoveryOptions && <div className="space-y-4 border-t border-bx-border pt-4">
            <div>
              <p className="text-xs font-black text-bx-text">Одноразовый резервный код</p>
              <p className="mt-1 text-[10px] leading-relaxed text-bx-muted">Используйте один из кодов, ранее полученных в Telegram. Для завершения всё равно потребуется подтвердить номер аккаунта.</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input type="text" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX-XXXX" aria-label="Резервный код восстановления" autoComplete="one-time-code" className="min-h-11 min-w-0 flex-1 rounded-xl border border-bx-border bg-bx-bg px-3 text-sm uppercase tracking-wider text-bx-text outline-none focus:border-blue-500" />
                <button type="button" onClick={handleRecovery} disabled={recoveryLoading || recoveryCode.trim().length < 16} className="min-h-11 rounded-xl border border-blue-500/30 px-4 text-xs font-bold text-blue-600 hover:bg-blue-500/10 disabled:opacity-40 dark:text-blue-300">{recoveryLoading ? 'Ожидание…' : 'Восстановить'}</button>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3">
              <button type="button" aria-expanded={showLegacyLogin} onClick={() => { setShowLegacyLogin(value => !value); setError(null); setInfo(null) }} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-xs font-black text-bx-text"><span>Ранее входили по email и паролю?</span><span aria-hidden="true">{showLegacyLogin ? '−' : '+'}</span></button>
              {showLegacyLogin && <form onSubmit={handleLegacySignIn} className="mt-3 space-y-3 border-t border-amber-500/20 pt-3">
                <p className="text-[10px] leading-relaxed text-bx-muted">Переходный вход сохраняет доступ к прежним данным. После входа подтвердите Telegram в «Личном кабинете → Telegram и безопасность». Новые аккаунты здесь не создаются.</p>
                <label className="block text-[10px] font-bold text-bx-muted">Контактный email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm text-bx-text outline-none focus:border-blue-500" /></label>
                <label className="block text-[10px] font-bold text-bx-muted">Старый пароль<input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-sm text-bx-text outline-none focus:border-blue-500" /></label>
                <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={legacyLoading} onClick={() => void handleLegacyReset()} className="min-h-11 rounded-xl px-3 text-xs font-bold text-bx-muted hover:bg-bx-bg">Восстановить старый пароль</button><button type="submit" disabled={legacyLoading} className="min-h-11 rounded-xl bg-bx-text px-4 text-xs font-black text-bx-bg disabled:opacity-50">{legacyLoading ? 'Проверяю…' : 'Перенести вход'}</button></div>
              </form>}
            </div>
          </div>}
        </section>

        {/* ── Version badge + update check ── */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono bg-slate-800/50 border border-slate-700/50 rounded-lg px-2.5 py-1">
            v{APP_VERSION}
          </span>
          <button
            type="button"
            onClick={() => setShowChangelog(true)}
            className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors font-medium"
            tabIndex={0}
            aria-label="Показать что нового в этой версии"
          >
            Что нового
          </button>
          <span className="text-slate-700">·</span>
          <button
            type="button"
            onClick={handleCheckUpdate}
            disabled={updateStatus === 'checking' || updateStatus === 'downloading' || updateStatus === 'installing'}
            className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors font-medium flex items-center gap-1 disabled:opacity-50"
            tabIndex={0}
            aria-label="Проверить наличие обновлений"
          >
            {updateStatus === 'checking' && (
              <span className="w-2.5 h-2.5 border border-slate-500/50 border-t-blue-400 rounded-full animate-spin" />
            )}
            {updateStatus === 'latest' && (
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {updateStatus === 'error' && (
              <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
            )}
            {updateStatus === 'idle' && 'Обновления'}
            {updateStatus === 'checking' && 'Проверяю…'}
            {updateStatus === 'latest' && 'Актуальная версия'}
            {updateStatus === 'downloading' && 'Загружается…'}
            {updateStatus === 'ready' && 'Готово к установке'}
            {updateStatus === 'installing' && 'Перезапуск…'}
            {updateStatus === 'error' && 'Ошибка проверки'}
          </button>
        </div>
      </div>

      {/* ── Changelog modal ── */}
      {showChangelog && latestEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowChangelog(false)}
        >
          <div
            className="bg-[#111420] border border-bx-border rounded-2xl shadow-2xl w-[440px] max-h-[80vh] overflow-hidden bx-animate-fade"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Что нового в v{latestEntry.version}</h3>
                  <p className="text-[10px] text-slate-500">{latestEntry.date} · {latestEntry.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                aria-label="Закрыть"
                tabIndex={0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Changes list */}
            <div className="px-6 py-4 space-y-2.5 overflow-y-auto max-h-[50vh] custom-scrollbar">
              {latestEntry.changes.map((change, i) => (
                <div key={i} className="flex items-start gap-2.5 group">
                  <div className="w-5 h-5 mt-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{change}</p>
                </div>
              ))}
            </div>

            {/* Footer with previous versions */}
            <div className="px-6 py-3 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Предыдущие:</span>
                {CHANGELOG.slice(1, 4).map(entry => (
                  <span key={entry.version} className="bg-slate-800/60 border border-slate-700/40 rounded px-1.5 py-0.5 font-mono">
                    {entry.version}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                tabIndex={0}
                aria-label="Закрыть модалку с обновлениями"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginScreen
