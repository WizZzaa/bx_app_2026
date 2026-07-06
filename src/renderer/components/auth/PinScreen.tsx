import React, { useState, useEffect, useCallback, useRef } from 'react'
import { isLocked, recordFailedAttempt, getAttemptsLeft } from '../../lib/auth/pin'

interface Props {
  mode: 'set' | 'unlock'
  email?: string
  onSetPin: (pin: string) => Promise<void>
  onVerifyPin: (pin: string) => Promise<boolean>
  onSuccess: () => void
  onForgot: () => void // выйти и войти заново по паролю
  onSkip?: () => void  // отказаться от PIN (только для mode='set')
}

const PIN_LENGTH = 4

const PinScreen: React.FC<Props> = ({ mode, email, onSetPin, onVerifyPin, onSuccess, onForgot, onSkip }) => {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(getAttemptsLeft())
  const [shaking, setShaking] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const [lastFilledIdx, setLastFilledIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Аватар — инициалы из email
  const initials = email
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : 'BX'

  // Проверяем статус блокировки при монтировании и обновляем таймер
  useEffect(() => {
    const checkLock = () => {
      const status = isLocked()
      if (status.forceLogout) {
        onForgot()
        return
      }
      setLocked(status.locked)
      setLockRemaining(status.remainingMs)
      setAttemptsLeft(getAttemptsLeft())
    }
    checkLock()
    const interval = setInterval(checkLock, 1000)
    return () => clearInterval(interval)
  }, [onForgot])

  // Фокус на контейнер при монтировании (для клавиатурного ввода)
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
    setTimeout(() => setShaking(false), 500)
  }, [])

  const triggerSuccess = useCallback(() => {
    setSuccessPulse(true)
    setTimeout(() => setSuccessPulse(false), 600)
  }, [])

  const press = useCallback((d: string) => {
    if (locked) return
    setError(null)
    const target = stage === 'confirm' ? confirm : pin
    if (target.length >= PIN_LENGTH) return
    const val = target + d
    setLastFilledIdx(val.length - 1)
    setTimeout(() => setLastFilledIdx(-1), 200)

    if (stage === 'confirm') {
      setConfirm(val)
      if (val.length === PIN_LENGTH) handleConfirm(val)
    } else {
      setPin(val)
      if (val.length === PIN_LENGTH) handleEnter(val)
    }
  }, [locked, stage, confirm, pin])

  const backspace = useCallback(() => {
    if (locked) return
    setError(null)
    if (stage === 'confirm') setConfirm(c => c.slice(0, -1))
    else setPin(p => p.slice(0, -1))
  }, [locked, stage])

  // Поддержка ввода с клавиатуры
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (locked) return
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      press(e.key)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      backspace()
    }
  }, [locked, press, backspace])

  const handleEnter = async (val: string) => {
    if (mode === 'set') {
      triggerSuccess()
      setTimeout(() => setStage('confirm'), 300)
    } else {
      const ok = await onVerifyPin(val)
      if (ok) {
        triggerSuccess()
        setTimeout(() => onSuccess(), 400)
      } else {
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
          setAttemptsLeft(left)
          setError(`Неверный PIN. Осталось ${left} ${left === 1 ? 'попытка' : left < 5 ? 'попытки' : 'попыток'}`)
        }
        setPin('')
      }
    }
  }

  const handleConfirm = async (val: string) => {
    if (val !== pin) {
      setError('PIN не совпадает, попробуйте снова')
      triggerShake()
      setPin('')
      setConfirm('')
      setStage('enter')
      return
    }
    triggerSuccess()
    await onSetPin(val)
    setTimeout(() => onSuccess(), 400)
  }

  const current = stage === 'confirm' ? confirm : pin
  const title = mode === 'set'
    ? (stage === 'confirm' ? 'Повторите PIN' : 'Придумайте PIN-код')
    : 'Введите PIN-код'
  const subtitle = mode === 'set' && stage === 'enter'
    ? '4 цифры для быстрого входа'
    : mode === 'unlock'
      ? email ?? ''
      : ''

  // Стили вынесены в объекты для надёжности (не зависят от JIT Tailwind)
  const styles = {
    root: {
      display: 'grid',
      placeItems: 'center',
      width: '100vw',
      height: '100vh',
      background: '#07090e',
      overflow: 'hidden',
      position: 'relative' as const,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none' as const,
      outline: 'none',
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      zIndex: 10,
      gap: '0px',
    },
    keypadCard: {
      background: 'rgba(17, 20, 32, 0.7)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(30, 37, 53, 0.8)',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
    },
    keypadGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 72px)',
      gap: '12px',
      justifyContent: 'center',
    },
    digitBtn: {
      width: '72px',
      height: '56px',
      borderRadius: '16px',
      background: 'linear-gradient(145deg, #1e2535, #171c28)',
      border: '1px solid rgba(42, 52, 71, 0.5)',
      color: '#fff',
      fontSize: '20px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
    },
    actionBtn: {
      width: '72px',
      height: '56px',
      borderRadius: '16px',
      background: 'transparent',
      border: 'none',
      color: '#64748b',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={styles.root}
      aria-label="Экран ввода PIN-кода"
      role="dialog"
    >
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-indigo-600/8 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div style={styles.content} className="bx-animate-fade">
        {/* Avatar / Logo */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          {mode === 'unlock' && email ? (
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '20px', fontWeight: 700,
              boxShadow: '0 8px 32px rgba(59,130,246,0.3), 0 0 0 3px rgba(59,130,246,0.15), 0 0 0 6px rgba(7,9,14,1)',
            }}>
              {initials}
            </div>
          ) : (
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '26px', fontWeight: 900,
              boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
            }}>
              BX
            </div>
          )}
          {/* Статус-индикатор */}
          {mode === 'unlock' && (
            <div style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '11px', height: '11px', borderRadius: '50%',
                background: locked ? '#f59e0b' : '#22c55e',
                boxShadow: locked ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(34,197,94,0.5)',
              }} />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{subtitle}</p>
        )}

        {/* PIN Dots — крупные */}
        <div
          className={shaking ? 'bx-pin-shake' : ''}
          style={{ display: 'flex', gap: '20px', margin: '28px 0' }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < current.length
            const justFilled = i === lastFilledIdx
            const allFilled = successPulse && current.length === PIN_LENGTH
            return (
              <div
                key={i}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: filled ? 'none' : '2.5px solid #475569',
                  background: allFilled
                    ? '#34d399'
                    : filled
                      ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                      : 'transparent',
                  boxShadow: allFilled
                    ? '0 0 16px rgba(52,211,153,0.6), 0 0 4px rgba(52,211,153,0.3)'
                    : filled
                      ? '0 0 14px rgba(59,130,246,0.5), 0 0 4px rgba(99,102,241,0.3)'
                      : 'none',
                  transform: justFilled ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            )
          })}
        </div>

        {/* Error / Lock message */}
        {error && !locked && (
          <div style={{
            fontSize: '12px', color: '#f87171', marginBottom: '16px',
            background: 'rgba(127, 29, 29, 0.2)', border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '300px',
          }}>
            <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {locked && (
          <div style={{
            fontSize: '12px', color: '#fbbf24', marginBottom: '16px',
            background: 'rgba(120, 53, 15, 0.2)', border: '1px solid rgba(245, 158, 11, 0.15)',
            borderRadius: '12px', padding: '12px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', maxWidth: '300px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span style={{ fontWeight: 600 }}>Ввод заблокирован</span>
            </div>
            <span style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 700, color: '#fcd34d' }}>
              {formatTime(lockRemaining)}
            </span>
          </div>
        )}

        {/* Keypad Card */}
        <div style={styles.keypadCard}>
          <div style={styles.keypadGrid} role="group" aria-label="Цифровая клавиатура">
            {['1','2','3','4','5','6','7','8','9'].map(d => (
              <button
                key={d}
                onClick={() => press(d)}
                disabled={locked}
                style={{
                  ...styles.digitBtn,
                  opacity: locked ? 0.2 : 1,
                  pointerEvents: locked ? 'none' : 'auto',
                }}
                onMouseDown={e => { (e.target as HTMLElement).style.transform = 'scale(0.9)' }}
                onMouseUp={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
                tabIndex={-1}
                aria-label={`Цифра ${d}`}
              >
                {d}
              </button>
            ))}
            {/* Touch ID */}
            <button
              onClick={() => {/* Touch ID placeholder */}}
              disabled={locked || mode === 'set'}
              style={{
                ...styles.actionBtn,
                opacity: (locked || mode === 'set') ? 0.15 : 1,
                pointerEvents: (locked || mode === 'set') ? 'none' : 'auto',
              }}
              tabIndex={-1}
              aria-label="Touch ID"
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-1.074 8.198M12 10.5a3.5 3.5 0 10-7 0c0 3.042.487 5.978 1.386 8.722M12 10.5c0 3.388.458 6.672 1.316 9.78M6.286 19.97A9.438 9.438 0 019 10.5a3 3 0 015.946-.474" />
              </svg>
            </button>
            {/* Zero */}
            <button
              onClick={() => press('0')}
              disabled={locked}
              style={{
                ...styles.digitBtn,
                opacity: locked ? 0.2 : 1,
                pointerEvents: locked ? 'none' : 'auto',
              }}
              onMouseDown={e => { (e.target as HTMLElement).style.transform = 'scale(0.9)' }}
              onMouseUp={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
              tabIndex={-1}
              aria-label="Цифра 0"
            >
              0
            </button>
            {/* Backspace */}
            <button
              onClick={backspace}
              disabled={locked}
              style={{
                ...styles.actionBtn,
                opacity: locked ? 0.15 : 1,
                pointerEvents: locked ? 'none' : 'auto',
              }}
              tabIndex={-1}
              aria-label="Удалить последнюю цифру"
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p style={{
          fontSize: '10px', color: '#475569', marginTop: '14px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          Можно вводить с клавиатуры
        </p>

        {/* Forgot / Exit */}
        <button
          onClick={onForgot}
          style={{
            fontSize: '12px', color: '#64748b', marginTop: '20px',
            background: 'none', border: 'none', cursor: 'pointer',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = '#60a5fa' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = '#64748b' }}
          tabIndex={0}
          aria-label={mode === 'unlock' ? 'Забыли PIN? Войти по паролю' : 'Выйти'}
        >
          {mode === 'unlock' ? 'Забыли PIN? Войти по паролю' : 'Выйти'}
        </button>

        {/* Отказаться от PIN (только при установке) */}
        {mode === 'set' && onSkip && (
          <button
            onClick={onSkip}
            style={{
              fontSize: '12px', color: '#475569', marginTop: '10px',
              background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#94a3b8' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#475569' }}
            tabIndex={0}
          >
            Входить без PIN
          </button>
        )}
      </div>

      {/* CSS animation for shake */}
      <style>{`
        @keyframes bx-pin-shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-8px); }
          30%, 70% { transform: translateX(8px); }
        }
        .bx-pin-shake {
          animation: bx-pin-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
      `}</style>
    </div>
  )
}

export default PinScreen
