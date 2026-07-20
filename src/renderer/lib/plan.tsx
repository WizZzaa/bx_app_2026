import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './db/supabase'
import { TARIFF_MATRIX, TARIFF_MATRIX_VERSION, type TariffCode } from '../../shared/tariffs'

// Тарифный план пользователя (этап 2 стратегии, docs/05_strategy.md).
// Источник правды — bx_profiles.plan (клиент менять план не может, только читать).
// Матрица лимитов управляется из админки через таблицу bx_plan_features (галочки
// «функция → тариф»); клиент читает её и мягко деградирует к DEFAULT_PLAN_LIMITS,
// если таблицы ещё нет / офлайн / ошибка. Никаких хардкодов лимитов по разделам —
// всё берётся из limits, чтобы админка реально управляла доступом.

export type Plan = TariffCode

export interface PlanLimits {
  boards: number
  companies: number
  aiPerMonth: number
  aiSessionMax: number
  innPerDay: number
  documentsMax: number
  paymentsControl: boolean
  anydeskSupport: boolean
  signingControl: boolean // legacy key: only certificate monitoring, never signing
  backupsControl: boolean
  textHumanizer: boolean
  hrPayroll: boolean
  knowledgeBase: boolean
  templatesCustom: boolean
}

// Хардкод-фолбэк и сид для bx_plan_features. Free сознательно ужат: это «умный
// демо» — открыты воронка (Dashboard, налоговый календарь, калькуляторы, новости,
// проверка ИНН), но рабочие модули (финансы, HR-расчёты, облачные документы,
// база знаний, безлимитный AI) — только по подписке.
export const DEFAULT_PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    boards: 0,
    companies: TARIFF_MATRIX.free.companies,
    aiPerMonth: TARIFF_MATRIX.free.ai.amount,
    aiSessionMax: 10,
    innPerDay: 3,
    documentsMax: 0,
    paymentsControl: false,
    anydeskSupport: false,
    signingControl: false,
    backupsControl: false,
    textHumanizer: false,
    hrPayroll: false,
    knowledgeBase: false,
    templatesCustom: false,
  },
  trial: {
    boards: 1,
    companies: TARIFF_MATRIX.trial.companies,
    aiPerMonth: TARIFF_MATRIX.trial.ai.amount,
    aiSessionMax: TARIFF_MATRIX.trial.ai.amount,
    innPerDay: 10,
    documentsMax: Infinity,
    paymentsControl: true,
    anydeskSupport: false,
    signingControl: false,
    backupsControl: false,
    textHumanizer: true,
    hrPayroll: true,
    knowledgeBase: true,
    templatesCustom: false,
  },
  standard: {
    boards: 5,
    companies: TARIFF_MATRIX.standard.companies,
    aiPerMonth: TARIFF_MATRIX.standard.ai.amount,
    aiSessionMax: Infinity,
    innPerDay: 30,
    // Числового лимита документов нет: объём ограничивается облачной квотой.
    documentsMax: Infinity,
    paymentsControl: true,
    anydeskSupport: false,
    signingControl: true,
    backupsControl: true,
    textHumanizer: true,
    hrPayroll: true,
    knowledgeBase: true,
    templatesCustom: true,
  },
  premium: {
    boards: Infinity,
    companies: TARIFF_MATRIX.premium.companies,
    aiPerMonth: TARIFF_MATRIX.premium.ai.amount,
    aiSessionMax: Infinity,
    innPerDay: Infinity,
    documentsMax: Infinity,
    paymentsControl: true,
    anydeskSupport: true,
    signingControl: true,
    backupsControl: true,
    textHumanizer: true,
    hrPayroll: true,
    knowledgeBase: true,
    templatesCustom: true,
  },
}

// Обратная совместимость со старым именем.
export const PLAN_LIMITS = DEFAULT_PLAN_LIMITS

const PLANS: Plan[] = ['free', 'trial', 'standard', 'premium']
const NUMERIC_KEYS: (keyof PlanLimits)[] = ['boards', 'companies', 'aiPerMonth', 'aiSessionMax', 'innPerDay', 'documentsMax']

// В БД безлимит хранится как -1 (JSON не умеет Infinity). Здесь разворачиваем обратно.
function normalizeLimits(base: PlanLimits, override: Record<string, unknown> | null | undefined): PlanLimits {
  const out: PlanLimits = { ...base }
  if (!override) return out
  const rec = out as unknown as Record<string, number | boolean>
  for (const key of Object.keys(base) as (keyof PlanLimits)[]) {
    if (!(key in override)) continue
    const raw = override[key]
    if (NUMERIC_KEYS.includes(key)) {
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isNaN(n)) rec[key] = n < 0 ? Infinity : n
    } else {
      rec[key] = raw === true || raw === 'true' || raw === 1
    }
  }
  return out
}

function normalizeCanonicalLimits(base: PlanLimits, config: Record<string, unknown> | null | undefined): PlanLimits {
  if (!config) return { ...base }
  const ai = config.ai as { amount?: unknown } | undefined
  const companies = Number(config.companies)
  const templates = config.customTemplates
  const oneCBases = Number(config.oneCBackupBases)
  const support = String(config.support ?? 'none')
  return {
    ...base,
    companies: Number.isFinite(companies) ? companies : base.companies,
    aiPerMonth: Number.isFinite(Number(ai?.amount)) ? Number(ai?.amount) : base.aiPerMonth,
    templatesCustom: templates === null || Number(templates) > 0,
    backupsControl: Number.isFinite(oneCBases) && oneCBases > 0,
    anydeskSupport: support === 'premium_priority',
  }
}

interface PlanCtx {
  plan: Plan
  isPro: boolean // true для standard и premium (обратная совместимость)
  isPremium: boolean
  role: string
  isAdmin: boolean
  loading: boolean
  limits: PlanLimits
  allLimits: Record<Plan, PlanLimits>
  isTrial: boolean
  trialDaysLeft: number
  planExpiresAt: string | null
  referralCode: string | null
  refresh: () => Promise<void>
}

const CACHE_KEY = 'bx_plan_cache'
const Ctx = createContext<PlanCtx>({
  plan: 'free', isPro: false, isPremium: false, role: 'user', isAdmin: false, loading: true,
  limits: DEFAULT_PLAN_LIMITS.free, allLimits: DEFAULT_PLAN_LIMITS, isTrial: false, trialDaysLeft: 0,
  planExpiresAt: null, referralCode: null, refresh: async () => { /* переопределяется в PlanProvider */ },
})

const DAY_MS = 24 * 60 * 60 * 1000

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>(() => {
    const cached = localStorage.getItem(CACHE_KEY) as Plan
    return PLANS.includes(cached) ? cached : 'free'
  })
  const [role, setRole] = useState<string>('user')
  const [loading, setLoading] = useState(true)
  const [allLimits, setAllLimits] = useState<Record<Plan, PlanLimits>>(DEFAULT_PLAN_LIMITS)
  const [isTrial, setIsTrial] = useState(false)
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // 1) Версионируемая каноническая матрица. Legacy-таблица используется только
    // как fallback для старого сервера и не может перекрыть новую версию.
    let canonicalAvailable = false
    try {
      const { data: rows, error } = await supabase
        .from('bx_tariff_plans')
        .select('tariff_code, config')
        .eq('version', TARIFF_MATRIX_VERSION)
      if (error) throw error
      if (rows && rows.length) {
        const merged: Record<Plan, PlanLimits> = {
          free: { ...DEFAULT_PLAN_LIMITS.free },
          trial: { ...DEFAULT_PLAN_LIMITS.trial },
          standard: { ...DEFAULT_PLAN_LIMITS.standard },
          premium: { ...DEFAULT_PLAN_LIMITS.premium },
        }
        for (const row of rows) {
          const p = row.tariff_code as Plan
          if (PLANS.includes(p)) merged[p] = normalizeCanonicalLimits(DEFAULT_PLAN_LIMITS[p], row.config as Record<string, unknown>)
        }
        setAllLimits(merged)
        canonicalAvailable = true
      }
    } catch {
      // До завершения rollout читаем старую матрицу ниже.
    }

    if (!canonicalAvailable) try {
      const { data: rows } = await supabase.from('bx_plan_features').select('plan, limits')
      if (rows && rows.length) {
        const merged: Record<Plan, PlanLimits> = {
          free: { ...DEFAULT_PLAN_LIMITS.free }, trial: { ...DEFAULT_PLAN_LIMITS.trial },
          standard: { ...DEFAULT_PLAN_LIMITS.standard }, premium: { ...DEFAULT_PLAN_LIMITS.premium },
        }
        for (const row of rows) {
          const p = row.plan as Plan
          if (p !== 'trial' && PLANS.includes(p)) merged[p] = normalizeLimits(DEFAULT_PLAN_LIMITS[p], row.limits as Record<string, unknown>)
        }
        setAllLimits(merged)
      }
    } catch {
      // Офлайн: канонические defaults остаются безопасным fallback.
    }

    // 2) Профиль пользователя: план, срок, роль, триал.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const [{ data: entitlement }, { data, error }] = await Promise.all([
        supabase.rpc('bx_get_my_entitlements'),
        supabase
        .from('bx_profiles').select('*').eq('user_id', user.id).maybeSingle()
      ])
      if (error) throw error
      // Профиля ещё нет — создаём; сервер принудительно назначит Free и реф-код,
      // поэтому используем возвращённую строку, а не доверяем данным клиента.
      let prof = data
      if (!prof) {
        const { data: created } = await supabase
          .from('bx_profiles').insert({ user_id: user.id }).select('*').maybeSingle()
        prof = created ?? null
      }
      if (prof) {
        const entitlementData = entitlement && typeof entitlement === 'object'
          ? entitlement as Record<string, unknown>
          : null
        const expires: string | null = (entitlementData?.endsAt as string | null | undefined) ?? prof.plan_expires_at ?? null
        const expired = expires ? new Date(expires) < new Date() : false
        let p: Plan = 'free'
        if (!expired) {
          const canonicalPlan = entitlementData?.tariffCode as Plan | undefined
          if (canonicalPlan && PLANS.includes(canonicalPlan)) p = canonicalPlan
          else if (prof.is_trial === true) p = 'trial'
          else if (prof.plan === 'premium' || prof.plan === 'pro') p = 'premium'
          else if (prof.plan === 'standard') p = 'standard'
        }
        setPlan(p)
        setRole(prof.role || 'user')
        setPlanExpiresAt(expires)
        setIsTrial(!expired && p === 'trial')
        setReferralCode(prof.referral_code ?? null)
        localStorage.setItem(CACHE_KEY, p)
      } else {
        setPlan('free'); setRole('user'); setIsTrial(false); setPlanExpiresAt(null)
        localStorage.setItem(CACHE_KEY, 'free')
      }

      // Привязываем отложенный код приглашения (после появления профиля).
      const pendingRef = localStorage.getItem('bx_pending_ref')
      if (pendingRef && prof) {
        try {
          await supabase.rpc('bx_apply_referral', { p_code: pendingRef })
          localStorage.removeItem('bx_pending_ref') // одна попытка при успешном вызове
        } catch {
          // сеть недоступна — попробуем при следующем refresh
        }
      }
    } catch {
      // офлайн / нет таблицы — работаем по кэшу (по умолчанию free)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const trialDaysLeft = isTrial && planExpiresAt
    ? Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / DAY_MS))
    : 0

  return (
    <Ctx.Provider value={{
      plan,
      isPro: plan === 'trial' || plan === 'standard' || plan === 'premium',
      isPremium: plan === 'premium',
      role,
      isAdmin: role === 'admin' || role.startsWith('admin_') || role === 'product_operator',
      loading,
      limits: allLimits[plan],
      allLimits,
      isTrial,
      trialDaysLeft,
      planExpiresAt,
      referralCode,
      refresh,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function usePlan() {
  return useContext(Ctx)
}
