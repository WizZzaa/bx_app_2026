import React, { useCallback, useEffect, useState } from 'react'
import { useCompany } from '../lib/CompanyContext'
import { supabase } from '../lib/db/supabase'

type OnboardingState = 'not_started' | 'deferred' | 'completed'

interface OnboardingProfile {
  company_onboarding_state: OnboardingState
  company_onboarding_remind_at: string | null
}

const LEGACY_KEY = 'bx_onboarding_v1'

export function canShowReminder(remindAt: string | null, now = Date.now()) {
  return !remindAt || new Date(remindAt).getTime() <= now
}

export default function OnboardingWizard() {
  const { companies, startCompanyCreation } = useCompany()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [remindAt, setRemindAt] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const saveState = useCallback(async (next: OnboardingState, companyId?: string) => {
    setSaving(true)
    try {
      const { error } = await supabase.rpc('bx_set_company_onboarding_state', {
        p_state: next,
        p_company_id: companyId ?? null,
      })
      if (error) throw error
      setState(next)
      setRemindAt(next === 'deferred' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null)
      localStorage.setItem(LEGACY_KEY, '1')
    } catch (error) {
      console.error('[company-onboarding] unable to save progress:', error)
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!active) return
      if (!user) {
        setState('completed')
        return
      }
      setUserId(user.id)
      const { data, error } = await supabase
        .from('bx_profiles')
        .select('company_onboarding_state, company_onboarding_remind_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return
      if (error || !data) {
        setState('not_started')
        return
      }
      const profile = data as OnboardingProfile
      setState(profile.company_onboarding_state)
      setRemindAt(profile.company_onboarding_remind_at)
    }
    void load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!userId || state === null || state === 'completed') return
    const firstOwnedCompany = companies.find(company => company.user_id === userId)
    if (firstOwnedCompany) void saveState('completed', firstOwnedCompany.id)
  }, [companies, saveState, state, userId])

  if (state === null || state === 'completed') return null

  const openCompanyWizard = () => startCompanyCreation()
  const showReminder = state === 'deferred' && canShowReminder(remindAt)

  if (showReminder) {
    return (
      <aside className="fixed bottom-5 right-5 z-[55] w-[min(420px,calc(100vw-2.5rem))] rounded-2xl border border-blue-500/25 bg-bx-surface p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/12 text-lg">🏢</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-bx-text">Создайте первую компанию, когда будет удобно</p>
            <p className="mt-1 text-xs leading-5 text-bx-muted">Это включит личный календарь обязательств, задачи и корректные права доступа для команды.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={openCompanyWizard} disabled={saving} className="min-h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">Создать компанию</button>
              <button type="button" onClick={() => void saveState('deferred')} disabled={saving} className="min-h-10 rounded-xl px-3 text-xs font-bold text-bx-muted hover:text-bx-text disabled:opacity-50">Напомнить завтра</button>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xl">
      <section role="dialog" aria-modal="true" aria-labelledby="company-onboarding-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-bx-border bg-bx-surface shadow-2xl">
        <header className="border-b border-bx-border bg-gradient-to-br from-blue-600/20 via-bx-surface to-transparent px-6 py-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Первый шаг в BX</p>
          <h2 id="company-onboarding-title" className="mt-2 text-2xl font-black text-bx-text">Сначала создадим вашу компанию</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-bx-muted">BX будет показывать сроки, задачи и документы только в контексте выбранной компании — так данные не смешиваются, а команда видит только разрешённое.</p>
        </header>
        <div className="grid gap-3 p-6 sm:grid-cols-3">
          <Info icon="🗓️" title="Сроки по вашим данным" text="Календарь строится от даты начала работы в BX." />
          <Info icon="✅" title="Только нужные правила" text="Вы выбираете налоговый режим и обязательства." />
          <Info icon="👥" title="Команда без путаницы" text="Позже можно пригласить бухгалтера и назначать задачи." />
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-bx-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => void saveState('deferred')} disabled={saving} className="min-h-11 px-2 text-xs font-bold text-bx-muted hover:text-bx-text disabled:opacity-50">Продолжить позже</button>
          <button type="button" onClick={openCompanyWizard} disabled={saving} className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-50">Создать первую компанию</button>
        </footer>
      </section>
    </div>
  )
}

function Info({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="rounded-2xl border border-bx-border bg-bx-bg p-4"><span className="text-lg">{icon}</span><h3 className="mt-3 text-xs font-black text-bx-text">{title}</h3><p className="mt-1.5 text-[11px] leading-5 text-bx-muted">{text}</p></article>
}
