import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CurrencyRate } from '../../../shared/types'
import Icon from '../../lib/ui/Icon'
import { widgetsApi } from '../../lib/widgetsApi'

export default function CurrencyWidget() {
  const navigate = useNavigate()
  const [rates, setRates] = useState<CurrencyRate[] | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    widgetsApi.getRates().then(setRates).catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-blue-500/15 bg-gradient-to-r from-blue-600/[0.08] via-bx-surface to-cyan-500/[0.06] p-4 shadow-sm sm:p-5" aria-label="Курсы валют">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative grid items-center gap-4 2xl:grid-cols-[220px_minmax(0,1fr)_150px]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name="exchange" className="h-5 w-5" /></span>
          <div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Центральный банк РУз</p><h2 className="mt-1 text-base font-black text-bx-text">Курсы валют</h2><p className="mt-0.5 text-[10px] text-bx-muted">{rates?.[0]?.date || 'Актуальные значения'}</p></div>
        </div>

        {error ? (
          <button onClick={load} className="rounded-xl border border-dashed border-bx-border py-4 text-xs font-bold text-bx-muted hover:text-bx-text">Не удалось загрузить · Повторить</button>
        ) : !rates ? (
          <div className="h-16 animate-pulse rounded-xl bg-bx-bg" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {rates.map(rate => <RateCard key={rate.code} rate={rate} />)}
          </div>
        )}

        <button onClick={() => navigate('/currency')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-bx-border bg-bx-surface px-4 text-xs font-extrabold text-bx-text transition-colors hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400">
          Все курсы <Icon name="arrowR" className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function RateCard({ rate }: { rate: CurrencyRate }) {
  const up = rate.diff >= 0
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl border border-bx-border/70 bg-bx-surface/90 px-3 py-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-bx-bg text-[10px] font-black tracking-wide text-bx-text">{rate.code}</span>
      <div className="min-w-0"><p className="text-sm font-black tabular-nums text-bx-text">{rate.value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</p><p className={`mt-0.5 flex items-center gap-1 text-[9px] font-bold tabular-nums ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}><Icon name="trending" className={`h-3 w-3 ${up ? '' : 'rotate-90'}`} />{up ? '+' : '−'}{Math.abs(rate.diff).toFixed(2)}</p></div>
    </div>
  )
}
