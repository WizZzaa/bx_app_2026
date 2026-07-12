import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './db/supabase'

// Тарифный план пользователя (этап 2 стратегии, docs/05_strategy.md).
// Источник правды — bx_profiles.plan (клиент менять план не может, только читать).
// Мягкая деградация: нет таблицы / офлайн / нет сессии → 'free' (или кэш).

export type Plan = 'free' | 'standard' | 'premium'

export const PLAN_LIMITS = {
  free: {
    boards: 1,
    companies: 1,
    aiPerMonth: 10,
    innPerDay: 5,
    paymentsControl: false,
    anydeskSupport: false,
    signingControl: false,
    backupsControl: false,
    textHumanizer: false,
  },
  standard: {
    boards: 5,
    companies: 3,
    aiPerMonth: 150,
    innPerDay: 30,
    paymentsControl: true,
    anydeskSupport: false,
    signingControl: true,
    backupsControl: false,
    textHumanizer: true,
  },
  premium: {
    boards: Infinity,
    companies: Infinity,
    aiPerMonth: Infinity,
    innPerDay: Infinity,
    paymentsControl: true,
    anydeskSupport: true,
    signingControl: true,
    backupsControl: true,
    textHumanizer: true,
  },
} as const

interface PlanCtx {
  plan: Plan
  isPro: boolean // true для standard и premium (обратная совместимость)
  isPremium: boolean
  role: 'user' | 'admin'
  isAdmin: boolean
  loading: boolean
  limits: (typeof PLAN_LIMITS)['free' | 'standard' | 'premium']
  refresh: () => Promise<void>
}

const CACHE_KEY = 'bx_plan_cache'
const Ctx = createContext<PlanCtx>({
  plan: 'free', isPro: false, isPremium: false, role: 'user', isAdmin: false, loading: true, limits: PLAN_LIMITS.free, refresh: async () => { /* переопределяется в PlanProvider */ },
})

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>(() => {
    const cached = localStorage.getItem(CACHE_KEY) as Plan
    return ['free', 'standard', 'premium'].includes(cached) ? cached : 'free'
  })
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('bx_profiles').select('plan, plan_expires_at, role').eq('user_id', user.id).maybeSingle()
      if (error) throw error
      if (!data) {
        // Первый вход до срабатывания триггера — создаём free-профиль
        await supabase.from('bx_profiles').insert({ user_id: user.id }).select().maybeSingle()
        setPlan('free')
        setRole('user')
        localStorage.setItem(CACHE_KEY, 'free')
      } else {
        const expired = data.plan_expires_at && new Date(data.plan_expires_at) < new Date()
        let p: Plan = 'free'
        if (!expired) {
          if (data.plan === 'premium' || data.plan === 'pro') p = 'premium'
          else if (data.plan === 'standard') p = 'standard'
        }
        setPlan(p)
        setRole((data.role as 'user' | 'admin') || 'user')
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
    <Ctx.Provider value={{ 
      plan, 
      isPro: plan === 'standard' || plan === 'premium', 
      isPremium: plan === 'premium',
      role, 
      isAdmin: role === 'admin', 
      loading, 
      limits: PLAN_LIMITS[plan], 
      refresh 
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePlan() {
  return useContext(Ctx)
}
