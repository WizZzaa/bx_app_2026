import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './db/supabase'

// Тарифный план пользователя (этап 2 стратегии, docs/05_strategy.md).
// Источник правды — bx_profiles.plan (клиент менять план не может, только читать).
// Мягкая деградация: нет таблицы / офлайн / нет сессии → 'free' (или кэш).

export type Plan = 'free' | 'pro'

export const PLAN_LIMITS = {
  free: {
    boards: 1,
    companies: 1,
    aiPerMonth: 10,
    innPerDay: 5,
    paymentsControl: false,
  },
  pro: {
    boards: Infinity,
    companies: Infinity,
    aiPerMonth: Infinity,
    innPerDay: Infinity,
    paymentsControl: true,
  },
} as const

interface PlanCtx {
  plan: Plan
  isPro: boolean
  loading: boolean
  limits: (typeof PLAN_LIMITS)['free' | 'pro']
  refresh: () => Promise<void>
}

const CACHE_KEY = 'bx_plan_cache'
const Ctx = createContext<PlanCtx>({
  plan: 'free', isPro: false, loading: true, limits: PLAN_LIMITS.free, refresh: async () => {},
})

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>(() =>
    (localStorage.getItem(CACHE_KEY) === 'pro' ? 'pro' : 'free'))
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('bx_profiles').select('plan, plan_expires_at').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (!data) {
        // Первый вход до срабатывания триггера — создаём free-профиль
        await supabase.from('bx_profiles').insert({ user_id: user.id }).select().maybeSingle()
        setPlan('free')
        localStorage.setItem(CACHE_KEY, 'free')
      } else {
        const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
        const p: Plan = data.plan === 'pro' && !expired ? 'pro' : 'free'
        setPlan(p)
        localStorage.setItem(CACHE_KEY, p)
      }
    } catch {
      // таблицы ещё нет / офлайн — работаем по кэшу (по умолчанию free)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <Ctx.Provider value={{ plan, isPro: plan === 'pro', loading, limits: PLAN_LIMITS[plan], refresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePlan() {
  return useContext(Ctx)
}
