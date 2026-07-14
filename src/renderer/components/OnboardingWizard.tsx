import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../lib/plan'

// Онбординг первого запуска. Показывается один раз (флаг в localStorage).
// Первые 10 минут решают, останется ли пользователь: коротко объясняем ценность,
// анонсируем триал и уводим в ключевой раздел.

const ONBOARDING_KEY = 'bx_onboarding_v1'

interface Step {
  icon: string
  title: string
  desc: string
  to?: string
}

const STEPS: Step[] = [
  {
    icon: '🗓️',
    title: 'Ни одного пропущенного отчёта',
    desc: 'Планировщик с налоговым календарём РУз напомнит о каждом сроке сдачи и оплаты. Ведите задачи по всем своим компаниям в одном месте.',
    to: '/planner',
  },
  {
    icon: '🧮',
    title: 'Расчёты — за секунды',
    desc: 'Калькуляторы зарплаты, НДС, НДФЛ, ИНПС, отпускных и больничных считают по актуальным БРВ и МРОТ. Никаких формул в Excel вручную.',
    to: '/calc',
  },
  {
    icon: '🤖',
    title: 'AI-консультант рядом',
    desc: 'Задайте вопрос по НК РУз простым языком — AI ответит со ссылками на Lex.uz. А техподдержка поможет с 1С, E-Imzo и настройкой ПК.',
    to: '/ai',
  },
]

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { isTrial, trialDaysLeft, loading } = usePlan()
  const [done, setDone] = useState(() => localStorage.getItem(ONBOARDING_KEY) === '1')
  const [step, setStep] = useState(0)

  if (done || loading) return null

  const finish = (to?: string) => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setDone(true)
    if (to) navigate(to)
  }

  const isWelcome = step === 0
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="bg-bx-surface border border-bx-border-2 rounded-2xl w-[460px] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600/25 via-bx-surface to-transparent px-7 py-6 border-b border-bx-border text-center">
          <div className="text-4xl mb-2">{current.icon}</div>
          <h2 className="text-xl font-bold text-bx-text leading-snug">
            {isWelcome ? 'Добро пожаловать в BX!' : current.title}
          </h2>
          {isWelcome && (
            <p className="text-xs text-bx-muted mt-1">Ваше рабочее место бухгалтера Узбекистана</p>
          )}
        </div>

        <div className="px-7 py-5 space-y-4">
          {isWelcome && isTrial && trialDaysLeft > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600/15 to-transparent px-4 py-3 text-center">
              <p className="text-sm font-bold text-bx-text">🎁 Активирован Premium на {trialDaysLeft} дней</p>
              <p className="text-[11px] text-bx-muted mt-0.5">Все возможности открыты — попробуйте безлимитный AI, мультикомпанию и контроль оплат.</p>
            </div>
          )}
          <p className="text-sm text-bx-muted leading-relaxed text-center">{current.desc}</p>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-blue-500' : 'w-1.5 bg-bx-border-2'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-7 py-4 border-t border-bx-border">
          <button onClick={() => finish()} className="px-3 py-2 text-xs text-bx-muted hover:text-bx-text transition-colors">
            Пропустить
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm text-bx-muted hover:text-bx-text transition-colors">
                Назад
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98]">
                Далее
              </button>
            ) : (
              <button onClick={() => finish(current.to)}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98]">
                Начать работу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
