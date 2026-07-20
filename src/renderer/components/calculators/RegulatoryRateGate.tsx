import React, { useMemo, useState } from 'react'
import {
  isRegulatoryValueEligible,
  regulatoryValuesFingerprint,
  regulatoryValuesForCalculator,
} from '../../data/calculatorRegulatoryValues'
import { useCalculatorRegulatoryCatalog } from '../../lib/calculatorRegulatory'
import { todayISO } from '../../lib/dates'

const SESSION_PREFIX = 'bx_calc_rate_ack_v1'

function sessionKey(calculatorId: string, fingerprint: string) {
  return `${SESSION_PREFIX}:${calculatorId}:${fingerprint}`
}

function openExternal(url: string) {
  if (window.bx?.shell?.openExternal) window.bx.shell.openExternal(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

export function RegulatoryRateGate({ calculatorId, children }: { calculatorId: string; children: React.ReactNode }) {
  const catalog = useCalculatorRegulatoryCatalog()
  const values = useMemo(() => regulatoryValuesForCalculator(calculatorId, catalog.values), [calculatorId, catalog.values])
  const asOf = todayISO()
  const fingerprint = useMemo(() => regulatoryValuesFingerprint(values), [values])
  const key = sessionKey(calculatorId, fingerprint)
  const allEligible = values.every(value => isRegulatoryValueEligible(value, asOf))
  const [confirmedFingerprint, setConfirmedFingerprint] = useState<string | null>(() => {
    try { return sessionStorage.getItem(key) === '1' ? fingerprint : null } catch { return null }
  })
  const manuallyConfirmed = confirmedFingerprint === fingerprint

  if (values.length === 0) return <>{children}</>

  const unlock = () => {
    try { sessionStorage.setItem(key, '1') } catch { /* подтверждение всё равно действует в памяти компонента */ }
    setConfirmedFingerprint(fingerprint)
  }

  const lock = () => {
    try { sessionStorage.removeItem(key) } catch { /* ignore */ }
    setConfirmedFingerprint(null)
  }

  const canCalculate = allEligible || manuallyConfirmed
  const pending = values.filter(value => !isRegulatoryValueEligible(value, asOf))

  return (
    <div className="space-y-4">
      <section className={`rounded-2xl border p-4 ${canCalculate ? 'border-violet-500/25 bg-violet-500/[0.06]' : 'border-amber-500/35 bg-amber-500/[0.08]'}`} aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${canCalculate ? 'text-violet-700 dark:text-violet-300' : 'text-amber-800 dark:text-amber-200'}`}>
              {allEligible ? 'Проверенные ставки' : manuallyConfirmed ? 'Ручная сверка на эту сессию' : 'Авторасчёт приостановлен'}
            </p>
            <h3 className="mt-1 text-sm font-black text-bx-text">
              {allEligible ? 'Источники и даты проверки доступны ниже' : manuallyConfirmed ? 'Расчёт разблокирован после вашего подтверждения' : 'Часть ставок ожидает редакционной проверки'}
            </h3>
            <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-bx-muted">
              {allEligible
                ? 'BX автоматически использует только актуальные опубликованные версии.'
                : 'Сверьте значения с официальными источниками. Подтверждение не публикует ставки, не меняет данные аккаунта и сбросится после закрытия вкладки или окна.'}
            </p>
            {catalog.status === 'unavailable' && <p className="mt-2 text-[10px] font-bold text-amber-800 dark:text-amber-200">Серверный реестр недоступен. Используются локальные значения только после ручной сверки.</p>}
          </div>
          {!allEligible && (manuallyConfirmed
            ? <button type="button" onClick={lock} className="min-h-10 rounded-xl border border-bx-border bg-bx-bg px-3 text-[10px] font-black text-bx-muted hover:text-bx-text">Снова заблокировать</button>
            : <button type="button" onClick={unlock} className="min-h-10 rounded-xl bg-amber-500 px-4 text-[11px] font-black text-slate-950 hover:bg-amber-400">Я сверил ставки — рассчитать</button>)}
        </div>
        <details className="mt-3 rounded-xl border border-bx-border bg-bx-bg/70 px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-bold text-bx-text">Используемые значения · {values.length}</summary>
          <div className="mt-3 space-y-2">
            {values.map(value => {
              const eligible = isRegulatoryValueEligible(value, asOf)
              return <div key={value.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-bx-border pt-2 first:border-0 first:pt-0">
                <span className="text-[11px] font-bold text-bx-text">{value.label}: {value.displayValue}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${eligible ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'}`}>{eligible ? `проверено ${value.checkedAt}` : 'ожидает проверки'}</span>
                <button type="button" onClick={() => openExternal(value.sourceUrl)} className="text-[10px] font-bold text-blue-700 underline decoration-blue-500/30 underline-offset-2 dark:text-blue-300">{value.sourceTitle}</button>
                <span className="text-[9px] text-bx-muted">версия {value.version} · действует с {value.effectiveFrom}</span>
              </div>
            })}
          </div>
        </details>
        {!canCalculate && <p className="mt-3 text-[10px] font-bold text-amber-800 dark:text-amber-200">Заблокировано значений: {pending.length}. Результат, PDF и запись в историю не формируются.</p>}
      </section>
      {canCalculate ? children : null}
    </div>
  )
}
