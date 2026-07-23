import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/db/supabase'
import { usePlan } from '../lib/plan'

type Locale = 'ru' | 'uz'
type Interest = 'taxes' | 'documents' | 'payroll' | 'foreign_trade' | 'onec' | 'ecp'
type Choice = 'free' | 'trial'

interface OnboardingProfile {
  product_onboarding_state: 'not_started' | 'completed'
  product_locale: Locale | null
  product_interests: Interest[] | null
}

const INTERESTS: Array<{ code: Interest; label: string; icon: string }> = [
  { code: 'taxes', label: 'Налоги', icon: '🧾' },
  { code: 'documents', label: 'Документы', icon: '📄' },
  { code: 'payroll', label: 'Зарплата', icon: '👥' },
  { code: 'foreign_trade', label: 'ВЭД', icon: '🌐' },
  { code: 'onec', label: '1С', icon: '🗄️' },
  { code: 'ecp', label: 'Сроки ЭЦП', icon: '🔐' },
]

export function toggleOnboardingInterest(current: Interest[], next: Interest): Interest[] {
  if (current.includes(next)) return current.filter(item => item !== next)
  return current.length < 3 ? [...current, next] : current
}

export function onboardingErrorMessage(message: string) {
  if (message.includes('TRIAL_ALREADY_USED')) return 'Пробный период уже использован. Выберите бесплатный тариф.'
  if (message.includes('TELEGRAM_VERIFICATION_REQUIRED')) return 'Для Trial сначала подтвердите вход через Telegram.'
  if (message.includes('TRIAL_NOT_AVAILABLE')) return 'Trial сейчас недоступен для этого аккаунта. Можно продолжить бесплатно.'
  return 'Не удалось сохранить выбор. Проверьте соединение и попробуйте ещё раз.'
}

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { refresh } = usePlan()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [locale, setLocale] = useState<Locale>('ru')
  const [interests, setInterests] = useState<Interest[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      if (!active || !authData.user) return
      const { data, error: loadError } = await supabase
        .from('bx_profiles')
        .select('product_onboarding_state, product_locale, product_interests')
        .eq('user_id', authData.user.id)
        .maybeSingle()
      if (!active || loadError || !data) return
      const profile = data as OnboardingProfile
      if (profile.product_locale) setLocale(profile.product_locale)
      if (profile.product_interests) setInterests(profile.product_interests)
      setVisible(profile.product_onboarding_state === 'not_started')
    }
    void load()
    return () => { active = false }
  }, [])

  const complete = async (choice: Choice) => {
    setSaving(true)
    setError('')
    try {
      const { error: saveError } = await supabase.rpc('bx_complete_product_onboarding', {
        p_locale: locale,
        p_interests: interests,
        p_choice: choice,
      })
      if (saveError) throw saveError
      await refresh()
      setStep(4)
    } catch (cause) {
      setError(onboardingErrorMessage(cause instanceof Error ? cause.message : String(cause)))
    } finally {
      setSaving(false)
    }
  }

  const open = (route: string) => {
    setVisible(false)
    navigate(route)
  }

  if (!visible) return null

  return (
    <div className="bx-onboarding-scrim">
      <section role="dialog" aria-modal="true" aria-labelledby="product-onboarding-title" className="bx-onboarding">
        <header className="bx-onboarding__header">
          <div className="bx-onboarding__meta">
            <p>Знакомство с BX · {Math.min(step, 3)}/3</p>
            {step < 4 && <span>Около минуты</span>}
          </div>
          <div className="bx-onboarding__progress" aria-hidden="true">
            {[1, 2, 3].map(index => <span key={index} className={index <= Math.min(step, 3) ? 'is-complete' : ''} />)}
          </div>
          <h2 id="product-onboarding-title">
            {step === 1 && 'На каком языке удобнее работать?'}
            {step === 2 && 'Что для вас сейчас важнее?'}
            {step === 3 && 'Выберите способ начать'}
            {step === 4 && 'Готово — попробуйте BX в деле'}
          </h2>
        </header>

        <div className="bx-onboarding__body">
          {step === 1 && <div className="bx-onboarding__grid cols-2">
            <ChoiceCard selected={locale === 'ru'} title="Русский" text="Интерфейс и материалы на русском" onClick={() => setLocale('ru')} />
            <ChoiceCard selected={locale === 'uz'} title="O‘zbekcha" text="O‘zbek tilidagi interfeys" onClick={() => setLocale('uz')} />
          </div>}

          {step === 2 && <>
            <p className="bx-onboarding__intro">Можно выбрать до трёх тем или пропустить шаг. Это влияет только на подсказки — все разделы останутся доступны по тарифу.</p>
            <div className="bx-onboarding__grid cols-3">
              {INTERESTS.map(item => <ChoiceCard key={item.code} selected={interests.includes(item.code)} title={`${item.icon} ${item.label}`} text={interests.includes(item.code) ? 'Выбрано' : 'Выбрать тему'} onClick={() => setInterests(value => toggleOnboardingInterest(value, item.code))} />)}
            </div>
            <p className="bx-onboarding__selection" aria-live="polite">Выбрано: {interests.length} из 3</p>
          </>}

          {step === 3 && <div className="bx-onboarding__grid cols-2">
            <ChoiceCard title="Free — бесплатно" text="Справочники, базовые инструменты и 3 AI-запроса за всё время аккаунта. Компания не требуется." onClick={() => void complete('free')} disabled={saving} />
            <ChoiceCard title="Trial — 7 дней" text="Возможности рабочего тарифа на 7 дней. Активируется один раз после Telegram-входа." onClick={() => void complete('trial')} disabled={saving} accent />
          </div>}

          {step === 4 && <div className="bx-onboarding__grid cols-3">
            <IntroCard icon="✨" title="Спросить AI" text="Задайте рабочий вопрос и получите ответ со ссылками." onClick={() => open('/ai')} />
            <IntroCard icon="📚" title="Открыть справочник" text="Найдите проверенный материал по налогам и учёту." onClick={() => open('/knowledge')} />
            <IntroCard icon="🌐" title="Попробовать перевод" text="Переведите документ между русским и узбекским." onClick={() => open('/translator')} />
          </div>}

          {error && <p role="alert" className="bx-auth-message is-error">{error}</p>}
        </div>

        <footer className="bx-onboarding__footer">
          {step > 1 && step < 4 ? <button type="button" onClick={() => setStep(value => Math.max(1, value - 1) as 1 | 2 | 3)} disabled={saving} className="bx-auth-button is-secondary">Назад</button> : <span />}
          {step === 1 && <button type="button" onClick={() => setStep(2)} className="bx-auth-button is-primary">Продолжить</button>}
          {step === 2 && <button type="button" onClick={() => setStep(3)} className="bx-auth-button is-primary">{interests.length ? 'Продолжить' : 'Пропустить'}</button>}
          {step === 4 && <button type="button" onClick={() => setVisible(false)} className="bx-auth-button is-primary">Перейти на главную</button>}
        </footer>
      </section>
    </div>
  )
}

function ChoiceCard({ title, text, selected = false, accent = false, disabled = false, onClick }: { title: string; text: string; selected?: boolean; accent?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`bx-onboarding-card ${selected || accent ? 'is-selected' : ''}`}><strong>{title}</strong><span>{text}</span></button>
}

function IntroCard({ icon, title, text, onClick }: { icon: string; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="bx-onboarding-card is-intro"><span className="bx-onboarding-card__icon">{icon}</span><strong>{title}</strong><span>{text}</span></button>
}
