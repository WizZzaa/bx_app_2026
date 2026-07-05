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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return error?.message ?? null
  }, [])

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return error?.message ?? null
  }, [])

  return { ...state, signIn, signUp, signOut, resetPassword, resendConfirmation }
}
