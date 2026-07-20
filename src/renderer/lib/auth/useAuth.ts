import { useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../db/supabase'

export interface AuthState {
  loading: boolean
  session: Session | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ loading: true, session: null })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ loading: false, session: data.session })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ loading: false, session })
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInLegacy = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' })
  }, [])

  const resetLegacyPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return error?.message ?? null
  }, [])

  const signInWithTelegram = useCallback(async () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const verifier = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    const verifierHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { action: 'start', verifierHash } })
    if (error || !data?.challengeId || !data?.botToken) return 'Не удалось начать вход через Telegram.'
    const botUrl = `https://t.me/Tech_support_bx_bot?start=${encodeURIComponent(data.botToken)}`
    const bridge = window as Window & { bx?: { openExternal?: (target: string) => void } }
    bridge.bx?.openExternal ? bridge.bx.openExternal(botUrl) : window.open(botUrl, '_blank')
    for (let attempt = 0; attempt < 200; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 3000))
      const poll = await supabase.functions.invoke('telegram-auth', {
        body: { action: 'poll', challengeId: data.challengeId, verifier },
      })
      if (poll.data?.status === 'expired') return 'Ссылка Telegram истекла. Попробуйте снова.'
      if (poll.data?.tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: poll.data.tokenHash, type: 'magiclink' })
        return verifyError?.message ?? null
      }
    }
    return 'Время ожидания Telegram истекло.'
  }, [])

  const recoverWithCode = useCallback(async (code: string) => {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const verifier = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
    const verifierHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const { data, error } = await supabase.functions.invoke('recovery-auth', { body: { action: 'start', code, verifierHash } })
    if (error || !data?.attemptId || !data?.botToken) return 'Код недействителен, уже использован или временно заблокирован.'
    const botUrl = `https://t.me/Tech_support_bx_bot?start=${encodeURIComponent(data.botToken)}`
    const bridge = window as Window & { bx?: { openExternal?: (target: string) => void } }
    bridge.bx?.openExternal ? bridge.bx.openExternal(botUrl) : window.open(botUrl, '_blank')
    for (let attempt = 0; attempt < 200; attempt += 1) {
      await new Promise(resolve => window.setTimeout(resolve, 3000))
      const poll = await supabase.functions.invoke('recovery-auth', { body: { action: 'poll', attemptId: data.attemptId, verifier } })
      if (poll.data?.status === 'expired') return 'Время подтверждения истекло. Начните восстановление заново.'
      if (poll.data?.tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: poll.data.tokenHash, type: 'magiclink' })
        if (verifyError) return verifyError.message
        const replacement = await supabase.functions.invoke('recovery-codes')
        if (replacement.error) return 'Доступ восстановлен, но новые резервные коды не доставлены. Запросите их в настройках безопасности.'
        return null
      }
      if (poll.error && poll.data?.error === 'RECOVERY_ALREADY_USED') return 'Этот код уже использован.'
    }
    return 'Время ожидания Telegram истекло.'
  }, [])

  return { ...state, signInLegacy, signOut, resetLegacyPassword, signInWithTelegram, recoverWithCode }
}
