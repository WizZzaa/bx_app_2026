import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getAttemptsLeft, isLocked, recordFailedAttempt } from '../../lib/auth/pin'

interface Props {
  mode: 'set' | 'unlock'
  email?: string
  onSetPin: (pin: string) => Promise<void>
  onVerifyPin: (pin: string) => Promise<boolean>
  onSuccess: () => void
  onForgot: () => void
  onSkip?: () => void
}

const PIN_LENGTH = 4

const PinScreen: React.FC<Props> = ({
  mode,
  email,
  onSetPin,
  onVerifyPin,
  onSuccess,
  onForgot,
  onSkip,
}) => {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [lastFilledIdx, setLastFilledIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const initials = email ? email.split('@')[0].slice(0, 2).toUpperCase() : 'BX'

  useEffect(() => {
    const checkLock = () => {
      const status = isLocked()
      if (status.forceLogout) {
        onForgot()
        return
      }
      setLocked(status.locked)
      setLockRemaining(status.remainingMs)
    }
    checkLock()
    const interval = window.setInterval(checkLock, 1000)
    return () => window.clearInterval(interval)
  }, [onForgot])

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const formatTime = useCallback((ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }, [])

  const triggerShake = useCallback(() => {
    setShaking(true)
    window.setTimeout(() => setShaking(false), 500)
  }, [])

  const triggerSuccess = useCallback(() => {
    setSuccessPulse(true)
    window.setTimeout(() => setSuccessPulse(false), 600)
  }, [])

  const handleEnter = async (value: string) => {
    if (mode === 'set') {
      triggerSuccess()
      window.setTimeout(() => setStage('confirm'), 300)
      return
    }

    const ok = await onVerifyPin(value)
    if (ok) {
      triggerSuccess()
      window.setTimeout(() => onSuccess(), 400)
      return
    }

    const status = recordFailedAttempt()
    triggerShake()
    if (status.forceLogout) {
      onForgot()
      return
    }
    if (status.locked) {
      setLocked(true)
      setLockRemaining(status.remainingMs)
      setError('Слишком много попыток')
    } else {
      const left = getAttemptsLeft()
      setError(`Неверный PIN. Осталось ${left} ${left === 1 ? 'попытка' : left < 5 ? 'попытки' : 'попыток'}`)
    }
    setPin('')
  }

  const handleConfirm = async (value: string) => {
    if (value !== pin) {
      setError('PIN не совпадает, попробуйте снова')
      triggerShake()
      setPin('')
      setConfirm('')
      setStage('enter')
      return
    }
    triggerSuccess()
    await onSetPin(value)
    window.setTimeout(() => onSuccess(), 400)
  }

  const press = useCallback((digit: string) => {
    if (locked) return
    setError(null)
    const target = stage === 'confirm' ? confirm : pin
    if (target.length >= PIN_LENGTH) return
    const value = target + digit
    setLastFilledIdx(value.length - 1)
    window.setTimeout(() => setLastFilledIdx(-1), 200)

    if (stage === 'confirm') {
      setConfirm(value)
      if (value.length === PIN_LENGTH) void handleConfirm(value)
    } else {
      setPin(value)
      if (value.length === PIN_LENGTH) void handleEnter(value)
    }
  }, [confirm, locked, pin, stage])

  const backspace = useCallback(() => {
    if (locked) return
    setError(null)
    if (stage === 'confirm') setConfirm(value => value.slice(0, -1))
    else setPin(value => value.slice(0, -1))
  }, [locked, stage])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (locked) return
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault()
      press(event.key)
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      backspace()
    }
  }, [backspace, locked, press])

  const current = stage === 'confirm' ? confirm : pin
  const title = mode === 'set'
    ? stage === 'confirm' ? 'Повторите PIN' : 'Придумайте PIN-код'
    : 'Введите PIN-код'
  const subtitle = mode === 'set' && stage === 'enter'
    ? 'Четыре цифры для быстрого входа'
    : mode === 'unlock' ? email ?? '' : ''

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="bx-auth-screen"
      aria-label="Экран ввода PIN-кода"
      role="dialog"
      aria-modal="true"
    >
      <div className="bx-auth-screen__aura bx-auth-screen__aura--start" aria-hidden="true" />
      <div className="bx-auth-screen__aura bx-auth-screen__aura--end" aria-hidden="true" />

      <main className="bx-auth-card bx-pin-card">
        <div className="bx-pin-card__identity">
          {mode === 'unlock' && email
            ? <span className="bx-pin-card__avatar">{initials}</span>
            : <span className="bx-pin-card__brand">BX</span>}
          {mode === 'unlock' && (
            <span className={`bx-pin-card__status ${locked ? 'is-locked' : 'is-ready'}`} aria-hidden="true" />
          )}
        </div>

        <p className="bx-auth-card__eyebrow">{mode === 'unlock' ? 'Быстрый вход' : 'Защита приложения'}</p>
        <h1>{title}</h1>
        {subtitle && <p className="bx-auth-card__subtitle">{subtitle}</p>}

        <div
          className={`bx-pin-dots ${shaking ? 'bx-pin-shake' : ''} ${successPulse ? 'is-success' : ''}`}
          aria-label={`Введено цифр: ${current.length} из ${PIN_LENGTH}`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <span
              key={index}
              className={`${index < current.length ? 'is-filled' : ''} ${index === lastFilledIdx ? 'is-new' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {error && !locked && <p role="alert" className="bx-auth-message is-error">{error}</p>}
        {locked && (
          <div role="status" className="bx-auth-message is-warning">
            <strong>Ввод временно заблокирован</strong>
            <span>{formatTime(lockRemaining)}</span>
          </div>
        )}

        <div className="bx-pin-keypad" role="group" aria-label="Цифровая клавиатура">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              type="button"
              key={digit}
              onClick={() => press(digit)}
              disabled={locked}
              className="bx-pin-key"
              aria-label={`Цифра ${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled
            className="bx-pin-key bx-pin-key--utility"
            aria-label="Биометрический вход пока недоступен"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-1.074 8.198M12 10.5a3.5 3.5 0 10-7 0c0 3.042.487 5.978 1.386 8.722M12 10.5c0 3.388.458 6.672 1.316 9.78M6.286 19.97A9.438 9.438 0 019 10.5a3 3 0 015.946-.474" />
            </svg>
          </button>
          <button type="button" onClick={() => press('0')} disabled={locked} className="bx-pin-key" aria-label="Цифра 0">0</button>
          <button
            type="button"
            onClick={backspace}
            disabled={locked}
            className="bx-pin-key bx-pin-key--utility"
            aria-label="Удалить последнюю цифру"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
            </svg>
          </button>
        </div>

        <p className="bx-pin-card__hint">Можно вводить цифры с клавиатуры</p>
        <button type="button" onClick={onForgot} className="bx-auth-link">
          {mode === 'unlock' ? 'Забыли PIN? Войти через Telegram' : 'Выйти'}
        </button>
        {mode === 'set' && onSkip && (
          <button type="button" onClick={onSkip} className="bx-auth-link is-secondary">Входить без PIN</button>
        )}
      </main>
    </div>
  )
}

export default PinScreen
