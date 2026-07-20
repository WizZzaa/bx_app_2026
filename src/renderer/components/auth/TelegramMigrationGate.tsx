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

  if (checking) return <div className="grid min-h-screen place-items-center bg-bx-bg"><span className="h-7 w-7 animate-spin rounded-full border-2 border-bx-border border-t-blue-500" /></div>

  return <div className="min-h-screen bg-bx-bg px-4 py-12 text-bx-text"><main className="mx-auto max-w-lg rounded-3xl border border-bx-border bg-bx-surface p-6 shadow-xl sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#229ED9]/10 text-xl">✈</span><p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Перенос существующего аккаунта</p><h1 className="mt-2 text-2xl font-black">Подтвердите Telegram</h1><p className="mt-3 text-sm leading-relaxed text-bx-muted">Прежний email-вход уже восстановил доступ к тому же аккаунту и данным. Теперь свяжите его с собственным контактом Telegram — после этого новые входы будут без пароля BX.</p>{error && <p role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">{error}</p>}<button type="button" onClick={() => void startLink()} disabled={linking} className="mt-6 min-h-12 w-full rounded-xl bg-[#229ED9] px-4 text-sm font-black text-white hover:bg-[#1d8fc4] disabled:opacity-55">{linking ? 'Ожидаю подтверждение в Telegram…' : 'Связать с Telegram'}</button><p className="mt-3 text-center text-[10px] leading-relaxed text-bx-muted">Ссылка действует 10 минут. BX принимает только контакт владельца Telegram-профиля.</p><div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-bx-border pt-4"><button type="button" onClick={() => void onSignOut()} className="min-h-11 rounded-xl px-3 text-xs font-bold text-bx-muted hover:bg-bx-bg">Выйти</button>{serverUnavailable && <button type="button" onClick={onComplete} className="min-h-11 rounded-xl border border-bx-border px-3 text-xs font-bold text-bx-text hover:bg-bx-bg">Продолжить и подтвердить в кабинете</button>}</div></main></div>
}
