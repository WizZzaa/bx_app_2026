import React, { useState } from 'react'

interface Props {
  onSignIn: (email: string, password: string) => Promise<string | null>
  onSignUp: (email: string, password: string) => Promise<string | null>
  onResetPassword: (email: string) => Promise<string | null>
  onResendConfirmation: (email: string) => Promise<string | null>
}

const LoginScreen: React.FC<Props> = ({ onSignIn, onSignUp, onResetPassword, onResendConfirmation }) => {
  const [mode, setMode] = useState<'in' | 'up' | 'reset'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)

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

    const err = mode === 'in' ? await onSignIn(email, password) : await onSignUp(email, password)
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
      </div>
    </div>
  )
}

export default LoginScreen
