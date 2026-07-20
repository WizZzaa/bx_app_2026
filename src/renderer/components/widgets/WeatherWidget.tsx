import React, { useCallback, useEffect, useState } from 'react'
import type { WeatherData } from '../../../shared/types'
import Icon from '../../lib/ui/Icon'
import { widgetsApi } from '../../lib/widgetsApi'

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    setError(false)
    setLoading(true)
    widgetsApi.getWeather()
      .then(value => { setWeather(value); setUpdatedAt(new Date()) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  return (
    <section className="relative flex min-h-[220px] flex-col overflow-hidden rounded-[24px] border border-bx-border bg-gradient-to-br from-bx-surface via-bx-surface to-bx-accent/[0.06] p-4" aria-label="Погода в Ташкенте">
      <WeatherPattern />
      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-bx-accent/10 text-bx-accent"><Icon name="sun" className="h-5 w-5" /></span><div><p className="text-xs font-extrabold text-bx-accent">Сейчас за окном</p><h2 className="text-lg font-black text-bx-text">{weather?.city || 'Ташкент'}</h2></div></div>
        <button type="button" onClick={load} disabled={loading} aria-label="Обновить погоду" className="grid h-11 w-11 place-items-center rounded-xl border border-bx-border bg-bx-surface/80 text-bx-muted hover:text-bx-accent disabled:opacity-50"><Icon name="exchange" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </header>
      {error ? (
        <button onClick={load} className="relative my-auto rounded-xl border border-dashed border-bx-border py-5 text-xs font-bold text-bx-muted hover:text-bx-text">Нет данных · Повторить</button>
      ) : !weather ? (
        <div className="relative my-auto h-24 animate-pulse rounded-2xl bg-bx-bg/60" />
      ) : (
        <>
          <div className="relative flex items-end gap-4 py-4"><p className="text-5xl font-black tracking-tight text-bx-text">{weather.temp}°</p><div className="pb-1"><p className="text-sm font-extrabold text-bx-text">{weather.desc}</p><p className="mt-1 text-[10px] text-bx-muted">Ощущается как {weather.feels}°</p></div></div>
          <div className="relative grid grid-cols-2 gap-2">
            <Metric icon="percent" label="Влажность" value={`${weather.humidity}%`} />
            <Metric icon="trending" label="Ветер" value={`${weather.wind} м/с`} />
          </div>
          <p className="relative mt-2 text-[10px] text-bx-muted">Open-Meteo · {updatedAt ? `обновлено ${updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : 'ожидает обновления'}</p>
        </>
      )}
    </section>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex items-center gap-2.5 rounded-xl border border-bx-border/60 bg-bx-surface/75 p-2.5"><Icon name={icon} className="h-4 w-4 text-bx-accent" /><div><p className="text-[10px] font-bold text-bx-muted">{label}</p><p className="mt-0.5 text-sm font-black text-bx-text">{value}</p></div></div>
}

function WeatherPattern() {
  return <svg aria-hidden="true" viewBox="0 0 320 240" className="pointer-events-none absolute inset-0 h-full w-full opacity-30 dark:opacity-20"><circle cx="270" cy="42" r="26" fill="none" stroke="currentColor" className="text-sky-500" strokeWidth="1.5" /><circle cx="270" cy="42" r="46" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="1" strokeDasharray="3 7" /><path d="M168 195c28-34 60-51 96-51 20 0 40 6 56 16" fill="none" stroke="currentColor" className="text-sky-500" strokeWidth="1.5" /></svg>
}
