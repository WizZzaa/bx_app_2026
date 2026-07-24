import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/db/supabase'

interface Props {
  onComplete: () => void
  onSignOut: () => Promise<void>
}

type IdentityStatus = { telegramVerified?: boolean }
type LinkStatus = { status?: string }

function openTelegram(url: string) {
  const bridge = window as Window & { bx?: { openExternal?: (target: string) => void } }
  bridge.bx?.openExternal ? bridge.bx.openExternal(url) : window.open(url, '_blank')
}

export default function TelegramMigrationGate({ onComplete, onSignOut }: Props) {
  const [checking, setChecking] = useState(true)
  const [linking, setLinking] = useState(false)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [serverUnavailable, setServerUnavailable] = useState(false)

  function complete() {
    localStorage.removeItem('bx_needs_telegram_migration')
    onComplete()
  }

  useEffect(() => {
    let active = true
    supabase.rpc('bx_get_my_identity_status').then(({ data, error: statusError }) => {
      if (!active) return
      const status = data as IdentityStatus | null
      if (!statusError && status?.telegramVerified) complete()
      else {
        setServerUnavailable(Boolean(statusError))
        setChecking(false)
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!challengeId) return undefined
    const timer = window.setInterval(async () => {
      const { data, error: pollError } = await supabase.rpc('bx_get_telegram_link_status', { p_challenge_id: challengeId })
      const status = data as LinkStatus | null
      if (pollError) {
        setError('Не удалось проверить подтверждение. Повторите попытку.')
        setLinking(false)
        setChallengeId(null)
      } else if (status?.status === 'verified') {
        window.clearInterval(timer)
        complete()
      } else if (status?.status === 'expired' || status?.status === 'revoked') {
        setError('Безопасная ссылка истекла. Создайте новую.')
        setLinking(false)
        setChallengeId(null)
      }
    }, 3000)
    return () => window.clearInterval(timer)
  }, [challengeId])

  async function startLink() {
    setError('')
    setLinking(true)
    const { data, error: challengeError } = await supabase.rpc('bx_create_telegram_link_challenge')
    const challenge = data as { challengeId?: string; token?: string } | null
    if (challengeError || !challenge?.challengeId || !challenge.token) {
      setError('Не удалось создать безопасную ссылку Telegram.')
      setServerUnavailable(true)
      setLinking(false)
      return
    }
    setChallengeId(challenge.challengeId)
    openTelegram(`https://t.me/Tech_support_bx_bot?start=${encodeURIComponent(challenge.token)}`)
  }

  if (checking) return <div className="bx-auth-screen"><span className="bx-auth-spinner" aria-label="Проверяем Telegram" /></div>

  return (
    <div className="bx-auth-screen">
      <div className="bx-auth-screen__aura bx-auth-screen__aura--start" aria-hidden="true" />
      <div className="bx-auth-screen__aura bx-auth-screen__aura--end" aria-hidden="true" />
      <main className="bx-auth-card bx-telegram-gate">
        <span className="bx-auth-card__icon is-telegram" aria-hidden="true">✈</span>
        <p className="bx-auth-card__eyebrow">Перенос существующего аккаунта</p>
        <h1>Подтвердите Telegram</h1>
        <p className="bx-auth-card__subtitle">Прежний email-вход уже восстановил доступ к тому же аккаунту и данным. Теперь свяжите его с собственным контактом Telegram — после этого новые входы будут без пароля BX.</p>
        {error && <p role="alert" className="bx-auth-message is-error">{error}</p>}
        <button type="button" onClick={() => void startLink()} disabled={linking} className="bx-auth-button is-telegram">
          {linking ? 'Ожидаю подтверждение в Telegram…' : 'Связать с Telegram'}
        </button>
        <p className="bx-auth-card__note">Ссылка действует 10 минут. BX принимает только контакт владельца Telegram-профиля.</p>
        <div className="bx-auth-actions">
          <button type="button" onClick={() => void onSignOut()} className="bx-auth-button is-secondary">Выйти</button>
          {serverUnavailable && <button type="button" onClick={onComplete} className="bx-auth-button is-secondary">Продолжить и подтвердить в кабинете</button>}
        </div>
      </main>
    </div>
  )
}
