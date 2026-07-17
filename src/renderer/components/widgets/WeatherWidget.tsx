import React, { useCallback, useEffect, useState } from 'react'
import type { WeatherData } from '../../../shared/types'
import Icon from '../../lib/ui/Icon'
import { widgetsApi } from '../../lib/widgetsApi'

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)
  const load = useCallback(() => {
    setError(false)
    widgetsApi.getWeather().then(setWeather).catch(() => setError(true))
  }, [])
  useEffect(load, [load])

  return (
    <section className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-sky-500/15 bg-gradient-to-br from-sky-500/[0.10] via-bx-surface to-blue-500/[0.05] p-5 shadow-sm" aria-label="Погода">
      <WeatherPattern />
      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-300"><Icon name="sun" className="h-4 w-4" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-sky-600 dark:text-sky-300">За окном</p><h2 className="text-sm font-black text-bx-text">Погода</h2></div></div>
        <span className="rounded-full border border-sky-500/15 bg-bx-surface/70 px-2.5 py-1 text-[9px] font-bold text-bx-muted">{weather?.city || 'Ташкент'}</span>
      </header>
      {error ? (
        <button onClick={load} className="relative my-auto rounded-xl border border-dashed border-bx-border py-5 text-xs font-bold text-bx-muted hover:text-bx-text">Нет данных · Повторить</button>
      ) : !weather ? (
        <div className="relative my-auto h-24 animate-pulse rounded-2xl bg-bx-bg/60" />
      ) : (
        <>
          <div className="relative my-auto flex items-end gap-4 py-5"><p className="text-5xl font-black tracking-tight text-bx-text">{weather.temp}°</p><div className="pb-1"><p className="text-sm font-extrabold text-bx-text">{weather.desc}</p><p className="mt-1 text-[10px] text-bx-muted">Ощущается как {weather.feels}°</p></div></div>
          <div className="relative grid grid-cols-2 gap-2">
            <Metric icon="percent" label="Влажность" value={`${weather.humidity}%`} />
            <Metric icon="trending" label="Ветер" value={`${weather.wind} м/с`} />
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex items-center gap-2.5 rounded-xl border border-bx-border/60 bg-bx-surface/70 p-3"><Icon name={icon} className="h-4 w-4 text-sky-600 dark:text-sky-300" /><div><p className="text-[8px] font-bold uppercase tracking-wide text-bx-muted">{label}</p><p className="mt-0.5 text-xs font-black text-bx-text">{value}</p></div></div>
}

function WeatherPattern() {
  return <svg aria-hidden="true" viewBox="0 0 320 240" className="pointer-events-none absolute inset-0 h-full w-full opacity-30 dark:opacity-20"><circle cx="270" cy="42" r="26" fill="none" stroke="currentColor" className="text-sky-500" strokeWidth="1.5" /><circle cx="270" cy="42" r="46" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="1" strokeDasharray="3 7" /><path d="M168 195c28-34 60-51 96-51 20 0 40 6 56 16" fill="none" stroke="currentColor" className="text-sky-500" strokeWidth="1.5" /></svg>
}
