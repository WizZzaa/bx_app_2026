import React, { useState } from 'react'
import { APP_VERSION, CHANGELOG } from '../../../shared/version'
import { applyTheme } from '../../lib/theme'

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (email: string, password: string, referralCode?: string) => Promise<string | null>
  onResetPassword: (email: string) => Promise<string | null>
  onResendConfirmation: (email: string) => Promise<string | null>
}

const LoginScreen: React.FC<Props> = ({ onSignIn, onSignUp, onResetPassword, onResendConfirmation }) => {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'error' | 'downloading' | 'ready'>('idle')

  const latestEntry = CHANGELOG[0]

  // Код приглашения из ссылки (?ref=CODE) — в веб-версии сразу переводим в регистрацию.
  React.useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref')
      if (ref) { setReferralCode(ref.toUpperCase()); setMode('up') }
    } catch { /* нет window.location — десктоп */ }
  }, [])

  // Подписка на нативный autoUpdater из Electron
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const savedTheme = localStorage.getItem('bx_theme')
      applyTheme('dark') // экран входа всегда тёмный
      return () => {
        if (savedTheme === 'light') applyTheme('light')
      }
    }
    return undefined
  }, [])

  // Подписка на нативный autoUpdater из Electron
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.bx && window.bx.updater) {
      // Запросить начальный статус
      window.bx.updater.getStatus().then((res: any) => {
        if (res.status === 'ready') setUpdateStatus('ready')
        else if (res.status === 'downloading') setUpdateStatus('downloading')
      })

      // Слушать обновления статуса в реальном времени
      const unsubscribe = window.bx.updater.onUpdateStatus((data: any) => {
        if (data.status === 'ready') {
          setUpdateStatus('ready')
        } else if (data.status === 'downloading') {
          setUpdateStatus('downloading')
        } else if (data.status === 'checking') {
          setUpdateStatus('checking')
        } else if (data.status === 'error') {
          setUpdateStatus('error')
          setTimeout(() => setUpdateStatus('idle'), 4000)
        } else if (data.status === 'idle') {
          setUpdateStatus('idle')
        }
      })

      return () => unsubscribe()
    }
    return undefined
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setShowResend(false)
    setLoading(true)

    if (mode === 'reset') {
      const err = await onResetPassword(email)
      setLoading(false)
      if (err) {
        setError(err)
        return
      }
      setInfo('Ссылка для сброса пароля отправлена на ваш email. Проверьте почту.')
      return
    }

    const err = mode === 'in' ? await onSignIn(email, password) : await onSignUp(email, password, referralCode)
    setLoading(false)
    if (err) {
      setError(err)
      // Детектируем «Email not confirmed»
      if (err.toLowerCase().includes('email not confirmed') || err.toLowerCase().includes('не подтвержд')) {
        setShowResend(true)
      }
      return
    }
    if (mode === 'up') {
      setInfo('Аккаунт создан. Если включено подтверждение — проверьте почту, затем войдите.')
    }
  }

  const handleResend = async () => {
    setResending(true)
    const err = await onResendConfirmation(email)
    setResending(false)
    if (err) {
      setError(err)
      return
    }
    setShowResend(false)
    setInfo('Письмо с подтверждением отправлено повторно. Проверьте почту.')
    setError(null)
  }

  const handleToggleMode = () => {
    setMode(prev => prev === 'in' ? 'up' : 'in')
    setError(null)
    setInfo(null)
    setShowResend(false)
  }

  const handleForgotPassword = () => {
    setMode('reset')
    setError(null)
    setInfo(null)
    setShowResend(false)
  }

  const handleBackToLogin = () => {
    setMode('in')
    setError(null)
    setInfo(null)
    setShowResend(false)
  }

  const handleCheckUpdate = async () => {
    if (typeof window !== 'undefined' && window.bx && window.bx.updater) {
      setUpdateStatus('checking')
      try {
        const res = await window.bx.updater.checkForUpdates()
        if (res.status === 'ready') {
          setUpdateStatus('ready')
        } else if (res.status === 'downloading') {
          setUpdateStatus('downloading')
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
      window.bx.updater.installUpdate()
    }
  }

  const modeLabel = mode === 'in'
    ? 'Интеллектуальный вход'
    : mode === 'up'
      ? 'Создание аккаунта'
      : 'Восстановление доступа'

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#07090e] overflow-hidden relative font-sans select-none">
      {/* Background neon glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />

      <div className="w-[400px] z-10 bx-animate-fade">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/25 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            BX
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            BX Помощник
          </h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1.5 uppercase">
            {modeLabel}
          </p>
        </div>

        {/* Auto updater status banner */}
        {updateStatus === 'downloading' && (
          <div className="mb-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-300 bx-animate-fade">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Загрузка обновления в фоне…</span>
            </div>
          </div>
        )}

        {updateStatus === 'ready' && (
          <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300 bx-animate-fade">
            <div>
              <p className="font-bold text-white mb-0.5">Обновление скачано!</p>
              <p className="text-[10px] text-slate-400">Нажмите, чтобы установить новую версию</p>
            </div>
            <button
              type="button"
              onClick={handleInstallUpdate}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Установить
            </button>
          </div>
        )}

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-[#111420]/80 backdrop-blur-xl border border-bx-border rounded-3xl p-8 space-y-5 shadow-2xl shadow-blue-950/20">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0a0d14]/90 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500 focus:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all placeholder:text-slate-600"
                placeholder="you@example.com"
                tabIndex={0}
                aria-label="Ввод адреса электронной почты"
              />
            </div>
          </div>

          {/* Password — скрыт в режиме reset */}
          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Пароль</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0a0d14]/90 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500 focus:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  tabIndex={0}
                  aria-label="Ввод пароля"
                />
              </div>
              {/* Forgot password link — только в режиме входа */}
              {mode === 'in' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                    tabIndex={0}
                    aria-label="Забыли пароль? Восстановить доступ"
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Код приглашения — только при регистрации, необязательно */}
          {mode === 'up' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Код приглашения <span className="text-slate-600 normal-case font-medium">(необязательно)</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 010-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0a0d14]/90 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl border border-bx-border focus:outline-none focus:border-blue-500 focus:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all placeholder:text-slate-600 tracking-wider"
                  placeholder="Код друга (если есть)"
                  tabIndex={0}
                  aria-label="Код приглашения от друга"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Resend confirmation button */}
          {showResend && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full text-xs text-blue-400 bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-2.5 hover:bg-blue-950/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              tabIndex={0}
              aria-label="Отправить подтверждение повторно"
            >
              {resending ? (
                <span className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              Отправить подтверждение повторно
            </button>
          )}

          {/* Info message */}
          {info && (
            <div className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{info}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.985] text-white text-sm font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            tabIndex={0}
            aria-label={
              mode === 'in' ? 'Войти в аккаунт'
                : mode === 'up' ? 'Зарегистрировать новый аккаунт'
                  : 'Отправить ссылку для сброса пароля'
            }
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mode === 'reset' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                )}
              </svg>
            )}
            {mode === 'in' ? 'Войти' : mode === 'up' ? 'Зарегистрироваться' : 'Отправить ссылку'}
          </button>

          {/* Footer links */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/40 space-y-1.5">
            {mode === 'reset' ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none focus:underline"
                tabIndex={0}
                aria-label="Вернуться ко входу"
              >
                ← Вернуться ко входу
              </button>
            ) : (
              <div>
                {mode === 'in' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-blue-400 hover:text-blue-300 font-semibold focus:outline-none focus:underline"
                  tabIndex={0}
                  aria-label={mode === 'in' ? 'Переключиться на создание аккаунта' : 'Переключиться на вход'}
                >
                  {mode === 'in' ? 'Создать' : 'Войти'}
                </button>
              </div>
            )}
          </div>
        </form>

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
            disabled={updateStatus === 'checking'}
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
