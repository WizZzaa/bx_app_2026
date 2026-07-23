import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../lib/auth/useAuth'
import { hasPin, setPin, verifyPin, clearPin, isPinEnabled, setPinEnabled } from '../../lib/auth/pin'
import { useIdleLock } from '../../lib/auth/useIdleLock'
import LoginScreen from './LoginScreen'
import PinScreen from './PinScreen'
import DeviceGateScreen from './DeviceGateScreen'
import TelegramMigrationGate from './TelegramMigrationGate'
import { registerCurrentDevice, type DeviceRegistrationStatus } from '../../lib/auth/device'
import { publicContactEmail } from '../../lib/auth/accountIdentity'

/**
 * Поток входа:
 * 1. Нет сессии → основной Telegram-вход; email доступен только для переноса legacy-аккаунта.
 * 2. Есть сессия, нет PIN → установка PIN.
 * 3. Есть сессия и PIN, не разблокировано в этом запуске → ввод PIN.
 * 4. Разблокировано → приложение.
 *    + Автоблокировка по неактивности (если включена в настройках).
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session, signInLegacy, signOut, resetLegacyPassword, signInWithTelegram, recoverWithCode } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [deviceStatus, setDeviceStatus] = useState<DeviceRegistrationStatus | 'checking'>('checking')
  const [telegramMigrationPending, setTelegramMigrationPending] = useState(false)

  const checkDevice = useCallback(async () => {
    setDeviceStatus('checking')
    const result = await registerCurrentDevice()
    setDeviceStatus(result.status)
  }, [])

  useEffect(() => {
    if (session) {
      setTelegramMigrationPending(localStorage.getItem('bx_needs_telegram_migration') === '1')
      void checkDevice()
    } else {
      setDeviceStatus('checking')
      setTelegramMigrationPending(false)
    }
  }, [session, checkDevice])

  const handleLock = useCallback(() => {
    setUnlocked(false)
  }, [])

  // Автоблокировка активна только когда приложение разблокировано и PIN включён
  useIdleLock(handleLock, unlocked && isPinEnabled())

  const skipPin = useCallback(() => {
    setPinEnabled(false)
    setUnlocked(true)
  }, [])

  const forgot = useCallback(async () => {
    clearPin()
    setUnlocked(false)
    await signOut()
  }, [signOut])

  if (loading) {
    return (
      <div className="bx-auth-screen">
        <span className="bx-auth-spinner" aria-label="Проверяем вход" />
      </div>
    )
  }

  // Нет сессии → Telegram-first. Действующие legacy-аккаунты не теряют доступ.
  if (!session) {
    return (
      <LoginScreen
        onLegacySignIn={signInLegacy}
        onResetPassword={resetLegacyPassword}
        onTelegramSignIn={signInWithTelegram}
        onRecoverWithCode={recoverWithCode}
      />
    )
  }

  if (telegramMigrationPending) {
    return <TelegramMigrationGate onComplete={() => setTelegramMigrationPending(false)} onSignOut={signOut} />
  }

  if (deviceStatus === 'checking') {
    return <div className="bx-auth-screen"><span className="bx-auth-spinner" aria-label="Проверяем устройство" /></div>
  }

  if (deviceStatus !== 'trusted') {
    return <DeviceGateScreen status={deviceStatus} onRetry={checkDevice} onSignOut={signOut} />
  }

  // PIN отключён пользователем → сразу в приложение
  if (!isPinEnabled()) {
    return <>{children}</>
  }

  // Есть сессия, но PIN не задан → предложить установить (можно пропустить)
  if (!hasPin()) {
    return (
      <PinScreen
        mode="set"
        onSetPin={setPin}
        onVerifyPin={verifyPin}
        onSuccess={() => setUnlocked(true)}
        onForgot={forgot}
        onSkip={skipPin}
      />
    )
  }

  // Есть сессия и PIN, но в этом запуске ещё не разблокировано → ввести PIN
  if (!unlocked) {
    return (
      <PinScreen
        mode="unlock"
        email={publicContactEmail(session.user.email)}
        onSetPin={setPin}
        onVerifyPin={verifyPin}
        onSuccess={() => setUnlocked(true)}
        onForgot={forgot}
      />
    )
  }

  return <>{children}</>
}
