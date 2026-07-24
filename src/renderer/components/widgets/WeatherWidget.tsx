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
    <section className="bx-weather" aria-label="Погода в Ташкенте">
      <WeatherPattern />
      <header className="bx-weather__header">
        <div className="bx-weather__title">
          <span aria-hidden="true"><Icon name="sun" /></span>
          <div><p>Сейчас за окном</p><h2>{weather?.city || 'Ташкент'}</h2></div>
        </div>
        <button type="button" onClick={load} disabled={loading} aria-label="Обновить погоду" className={loading ? 'is-loading' : ''}><Icon name="exchange" /></button>
      </header>
      {error ? (
        <button type="button" onClick={load} className="bx-weather__retry">Нет данных · Повторить</button>
      ) : !weather ? (
        <div className="bx-weather__skeleton" aria-label="Загрузка погоды" />
      ) : (
        <>
          <div className="bx-weather__current"><p>{weather.temp}°</p><div><strong>{weather.desc}</strong><span>Ощущается как {weather.feels}°</span></div></div>
          <div className="bx-weather__metrics">
            <Metric icon="percent" label="Влажность" value={`${weather.humidity}%`} />
            <Metric icon="trending" label="Ветер" value={`${weather.wind} м/с`} />
          </div>
          <p className="bx-weather__source">Open-Meteo · {updatedAt ? `обновлено ${updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : 'ожидает обновления'}</p>
        </>
      )}
    </section>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="bx-weather__metric"><Icon name={icon} /><div><span>{label}</span><strong>{value}</strong></div></div>
}

function WeatherPattern() {
  return <svg aria-hidden="true" viewBox="0 0 320 240" className="bx-weather__pattern"><circle cx="270" cy="42" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="270" cy="42" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" /><path d="M168 195c28-34 60-51 96-51 20 0 40 6 56 16" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
}
