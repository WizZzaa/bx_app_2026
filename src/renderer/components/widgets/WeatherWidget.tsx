import React, { useEffect, useState } from 'react'
import { widgetsApi } from '../../lib/widgetsApi'
import type { WeatherData } from '../../../shared/types'

// ── Маппинг condition → картинка + цветовая тема ──────────────────────────
import imgSunny   from '../../assets/widgets/weather_sunny.png'
import imgPartly  from '../../assets/widgets/weather_cloudy.png'
import imgCloudy  from '../../assets/widgets/weather_cloudy.png'
import imgRainy   from '../../assets/widgets/weather_rainy.png'
import imgStorm   from '../../assets/widgets/weather_storm.png'
import imgSnow    from '../../assets/widgets/weather_snow.png'
import imgFog     from '../../assets/widgets/weather_fog.png'

interface WeatherTheme {
  img: string
  accent: string       // CSS-цвет акцента
  gradFrom: string     // from-color overlay
  gradTo: string
  tempColor: string
}

const THEMES: Record<string, WeatherTheme> = {
  sunny:        { img: imgSunny,  accent: '#f59e0b', gradFrom: '#1a1200', gradTo: '#0a1628', tempColor: '#fbbf24' },
  partly_cloudy:{ img: imgPartly, accent: '#60a5fa', gradFrom: '#0f1a2e', gradTo: '#141820', tempColor: '#93c5fd' },
  cloudy:       { img: imgCloudy, accent: '#94a3b8', gradFrom: '#111827', gradTo: '#0d1117', tempColor: '#cbd5e1' },
  rainy:        { img: imgRainy,  accent: '#38bdf8', gradFrom: '#0a1828', gradTo: '#0a1117', tempColor: '#7dd3fc' },
  storm:        { img: imgStorm,  accent: '#a855f7', gradFrom: '#1a0d2e', gradTo: '#0d0d14', tempColor: '#c084fc' },
  snow:         { img: imgSnow,   accent: '#bae6fd', gradFrom: '#0a1a2e', gradTo: '#0a1117', tempColor: '#e0f2fe' },
  fog:          { img: imgFog,    accent: '#9ca3af', gradFrom: '#111115', gradTo: '#0f1015', tempColor: '#d1d5db' },
}

// Краткий прогноз по температуре для Ташкента
const getTip = (temp: number, condition: string) => {
  if (condition === 'storm') return 'Оставайтесь дома — гроза!'
  if (condition === 'snow') return 'Оденьтесь теплее'
  if (condition === 'rainy') return 'Возьмите зонт'
  if (condition === 'fog') return 'Будьте осторожны на дороге'
  if (temp >= 38) return 'Экстремальная жара — пейте воду'
  if (temp >= 32) return 'Жарко — избегайте прямого солнца'
  if (temp >= 22) return 'Отличная погода для работы'
  if (temp < 5)   return 'Холодно — одевайтесь теплее'
  return 'Приятный день для продуктивной работы'
}

export default function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    widgetsApi.getWeather()
      .then(d => { if (alive) setW(d) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  const condition = w?.condition ?? 'sunny'
  const theme = THEMES[condition] ?? THEMES.sunny

  return (
    <div
      className="rounded-xl h-full overflow-hidden relative"
      style={{
        border: `1px solid ${theme.accent}25`,
        background: theme.gradFrom,
      }}
    >
      {/* Фоновая картинка */}
      <img
        src={theme.img}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.22,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Темный градиент для читабельности */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${theme.gradFrom}f0 0%, ${theme.gradFrom}a0 50%, ${theme.gradTo}80 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Акцентное свечение */}
      <div
        style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: theme.accent + '15',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Контент */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
            />
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Погода</h2>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: theme.accent + '20', color: theme.accent }}>
            {w?.city || 'Ташкент'}
          </span>
        </div>

        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">🌐</div>
              <div className="text-xs text-slate-500">Нет данных о погоде</div>
            </div>
          </div>
        ) : !w ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Основная температура */}
            <div className="flex items-end gap-3 mb-3">
              <div className="text-5xl leading-none" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>
                {w.icon}
              </div>
              <div>
                <div className="text-4xl font-black leading-none" style={{ color: theme.tempColor }}>
                  {w.temp}°
                </div>
                <div className="text-xs mt-0.5" style={{ color: theme.accent + 'cc' }}>{w.desc}</div>
              </div>
            </div>

            {/* Детали */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { label: 'Ощущ.', value: `${w.feels}°` },
                { label: 'Влажн.', value: `${w.humidity}%` },
                { label: 'Ветер', value: `${w.wind} м/с` },
              ].map(({ label, value }) => (
                <div key={label}
                  className="rounded-lg px-2 py-1.5 text-center"
                  style={{ background: theme.accent + '12', border: `1px solid ${theme.accent}20` }}>
                  <div className="text-[9px] text-slate-500 mb-0.5 uppercase tracking-wider">{label}</div>
                  <div className="text-xs font-semibold text-slate-200">{value}</div>
                </div>
              ))}
            </div>

            {/* Совет дня */}
            <div className="mt-auto">
              <p className="text-[10px] leading-tight" style={{ color: theme.accent + 'aa' }}>
                💡 {getTip(w.temp, condition)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
