import React, { useEffect, useState } from 'react'
import { widgetsApi } from '../../lib/widgetsApi'
import type { WeatherData } from '../../../shared/types'

// ── Граничные условия для WeatherTheme ──────────────────────────
interface WeatherTheme {
  accent: string
  accentSoft: string
  bg: string
  tempColor: string
  // ── Светлая тема ──
  accentLight: string
  accentSoftLight: string
  bgLight: string
  tempColorLight: string
  // Свечения
  glow1: string
  glow2: string
  glow1Light: string
  glow2Light: string
}

const THEMES: Record<string, WeatherTheme> = {
  sunny: { 
    accent: '#fbbf24', 
    accentSoft: '#fde68a',
    bg: 'linear-gradient(135deg, #2e1a05 0%, #1a0f02 55%, #0f0901 100%)',
    tempColor: '#fbbf24',
    accentLight: '#b45309', 
    accentSoftLight: '#92400e',
    bgLight: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 55%, #fde68a 100%)',
    tempColorLight: '#78350f',
    glow1: '#fbbf2422', 
    glow2: '#ef444415',
    glow1Light: '#fbbf2433', 
    glow2Light: '#fca5a522'
  },
  partly_cloudy: { 
    accent: '#60a5fa', 
    accentSoft: '#93c5fd',
    bg: 'linear-gradient(135deg, #0f1a2e 0%, #0a1120 55%, #050810 100%)',
    tempColor: '#93c5fd',
    accentLight: '#1d4ed8', 
    accentSoftLight: '#1e40af',
    bgLight: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 55%, #bae6fd 100%)',
    tempColorLight: '#1e3a8a',
    glow1: '#60a5fa22', 
    glow2: '#38bdf815',
    glow1Light: '#60a5fa33', 
    glow2Light: '#7dd3fc22'
  },
  cloudy: { 
    accent: '#94a3b8', 
    accentSoft: '#cbd5e1',
    bg: 'linear-gradient(135deg, #1f2937 0%, #111827 55%, #030712 100%)',
    tempColor: '#cbd5e1',
    accentLight: '#475569', 
    accentSoftLight: '#334155',
    bgLight: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 55%, #e2e8f0 100%)',
    tempColorLight: '#0f172a',
    glow1: '#94a3b81a', 
    glow2: '#47556911',
    glow1Light: '#cbd5e133', 
    glow2Light: '#94a3b822'
  },
  rainy: { 
    accent: '#38bdf8', 
    accentSoft: '#7dd3fc',
    bg: 'linear-gradient(135deg, #0a1b2e 0%, #061120 55%, #030810 100%)',
    tempColor: '#7dd3fc',
    accentLight: '#0369a1', 
    accentSoftLight: '#075985',
    bgLight: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 55%, #7dd3fc 100%)',
    tempColorLight: '#075985',
    glow1: '#38bdf822', 
    glow2: '#0369a115',
    glow1Light: '#38bdf833', 
    glow2Light: '#0284c722'
  },
  storm: { 
    accent: '#c084fc', 
    accentSoft: '#e9d5ff',
    bg: 'linear-gradient(135deg, #1b0d2d 0%, #10081d 55%, #08040f 100%)',
    tempColor: '#c084fc',
    accentLight: '#7e22ce', 
    accentSoftLight: '#581c87',
    bgLight: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 55%, #e9d5ff 100%)',
    tempColorLight: '#581c87',
    glow1: '#a855f722', 
    glow2: '#facc1515',
    glow1Light: '#c084fc33', 
    glow2Light: '#fef08a22'
  },
  snow: { 
    accent: '#bae6fd', 
    accentSoft: '#e0f2fe',
    bg: 'linear-gradient(135deg, #0a2235 0%, #061522 55%, #030a11 100%)',
    tempColor: '#e0f2fe',
    accentLight: '#0284c7', 
    accentSoftLight: '#0369a1',
    bgLight: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 55%, #bae6fd 100%)',
    tempColorLight: '#0369a1',
    glow1: '#bae6fd1a', 
    glow2: '#38bdf811',
    glow1Light: '#e0f2fe33', 
    glow2Light: '#bae6fd22'
  },
  fog: { 
    accent: '#a1a1aa', 
    accentSoft: '#d4d4d8',
    bg: 'linear-gradient(135deg, #18181b 0%, #0f0f12 55%, #09090b 100%)',
    tempColor: '#d4d4d8',
    accentLight: '#52525b', 
    accentSoftLight: '#27272a',
    bgLight: 'linear-gradient(135deg, #fafafa 0%, #f4f4f5 55%, #e4e4e7 100%)',
    tempColorLight: '#27272a',
    glow1: '#a1a1aa15', 
    glow2: '#52525b11',
    glow1Light: '#d4d4d833', 
    glow2Light: '#a1a1aa22'
  },
}

// Краткий прогноз по температуре для Ташкента
const getTip = (temp: number, condition: string) => {
  if (condition === 'storm') return 'Оставайтесь дома — гроза!'
  if (condition === 'snow') return 'На улице снежно, оденьтесь теплее'
  if (condition === 'rainy') return 'Идёт дождь, не забудьте взять зонт'
  if (condition === 'fog') return 'На дорогах туман, будьте внимательны'
  if (temp >= 38) return 'Экстремальная жара — пейте больше воды'
  if (temp >= 32) return 'Жаркая погода — избегайте открытого солнца'
  if (temp >= 22) return 'Отличный день для продуктивного учета'
  if (temp < 5)   return 'Морозно — держите ноги в тепле'
  return 'Приятный день для работы с отчетами'
}

// ── Декоративный SVG-арт для каждого погодного условия ──────────────────
export function WeatherArt({ condition, isLight, accent, accentSoft }: { condition: string; isLight: boolean; accent: string; accentSoft: string }) {
  const common = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', pointerEvents: 'none' as const }
  const opacity = isLight ? 0.35 : 0.65;
  switch (condition) {
    case 'sunny':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          <circle cx="165" cy="45" r="28" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
          <circle cx="165" cy="45" r="16" fill={accent} opacity="0.75" />
          <circle cx="165" cy="45" r="42" fill="none" stroke={accentSoft} strokeWidth="0.8" strokeDasharray="3,5" opacity="0.5" />
          <circle cx="165" cy="45" r="56" fill="none" stroke={accentSoft} strokeWidth="0.6" strokeDasharray="1,6" opacity="0.3" />
        </svg>
      )
    case 'partly_cloudy':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          {/* Солнце на заднем плане */}
          <circle cx="155" cy="45" r="16" fill={accent} opacity="0.55" />
          <circle cx="155" cy="45" r="24" fill="none" stroke={accentSoft} strokeWidth="0.8" strokeDasharray="3,4" opacity="0.4" />
          {/* Облако на переднем плане */}
          <path d="M125 70 a14 14 0 0 1 14 -14 a12 12 0 0 1 18 2 a10 10 0 0 1 14 10 a14 14 0 0 1 -10 14 h-36 a14 14 0 0 1 0 -26 Z" fill={accentSoft} opacity="0.85" />
        </svg>
      )
    case 'cloudy':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          {/* Заднее облако */}
          <path d="M130 55 a18 18 0 0 1 20 -15 a16 16 0 0 1 22 3 a14 14 0 0 1 14 15 a18 18 0 0 1 -14 17 h-42 a18 18 0 0 1 0 -35 Z" fill={accentSoft} opacity="0.4" />
          {/* Переднее облако */}
          <path d="M100 75 a14 14 0 0 1 14 -13 a12 12 0 0 1 18 2 a10 10 0 0 1 12 10 a14 14 0 0 1 -10 14 h-34 a14 14 0 0 1 0 -27 Z" fill={accent} opacity="0.75" />
        </svg>
      )
    case 'rainy':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          <path d="M120 58 a16 16 0 0 1 16 -15 a14 14 0 0 1 18 2 a12 12 0 0 1 16 11 a16 16 0 0 1 -11 16 h-39 a16 16 0 0 1 0 -30 Z" fill={accentSoft} opacity="0.75" />
          {/* Капли дождя косые */}
          {[[120, 85], [132, 92], [144, 87], [156, 95], [168, 89], [130, 105], [142, 108], [154, 103]].map(([x, y], i) => (
            <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 10} stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          ))}
        </svg>
      )
    case 'storm':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          <path d="M120 58 a16 16 0 0 1 16 -15 a14 14 0 0 1 18 2 a12 12 0 0 1 16 11 a16 16 0 0 1 -11 16 h-39 a16 16 0 0 1 0 -30 Z" fill={accentSoft} opacity="0.5" />
          {/* Молния */}
          <path d="M146 72 L132 102 H143 L130 126 L154 91 H143 L151 72 Z" fill={accent} opacity="0.9" style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        </svg>
      )
    case 'snow':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          <path d="M120 58 a16 16 0 0 1 16 -15 a14 14 0 0 1 18 2 a12 12 0 0 1 16 11 a16 16 0 0 1 -11 16 h-39 a16 16 0 0 1 0 -30 Z" fill={accentSoft} opacity="0.65" />
          {/* Снежинки */}
          {[[122, 85], [138, 88], [154, 84], [170, 89], [130, 102], [146, 106], [162, 101]].map(([x, y], i) => (
            <g key={i} opacity="0.8" transform={`translate(${x}, ${y})`}>
              <line x1="-2" y1="0" x2="2" y2="0" stroke={accent} strokeWidth="0.8" />
              <line x1="0" y1="-2" x2="0" y2="2" stroke={accent} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="0.6" fill={accentSoft} />
            </g>
          ))}
        </svg>
      )
    case 'fog':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity }} preserveAspectRatio="xMidYMid slice">
          <path d="M 50 55 Q 80 48 110 55 T 170 55" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 30 75 Q 65 83 100 75 T 170 75" fill="none" stroke={accentSoft} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 60 95 Q 90 88 120 95 T 180 95" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <path d="M 40 115 Q 75 123 110 115 T 160 115" fill="none" stroke={accentSoft} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
        </svg>
      )
    default:
      return null
  }
}

export default function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)
  const [isLight, setIsLight] = useState(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false
  )

  useEffect(() => {
    let alive = true
    widgetsApi.getWeather()
      .then(d => { if (alive) setW(d) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [])

  const condition = w?.condition ?? 'sunny'
  const theme = THEMES[condition] ?? THEMES.sunny

  // Выбираем цвета в зависимости от темы
  const themeAccent = isLight ? theme.accentLight : theme.accent
  const themeAccentSoft = isLight ? theme.accentSoftLight : theme.accentSoft
  const themeBg = isLight ? theme.bgLight : theme.bg
  const themeTempColor = isLight ? theme.tempColorLight : theme.tempColor
  const themeGlow1 = isLight ? theme.glow1Light : theme.glow1
  const themeGlow2 = isLight ? theme.glow2Light : theme.glow2

  return (
    <div
      className="rounded-xl h-full min-h-[300px] overflow-hidden relative flex flex-col transition-all duration-500 shadow-sm"
      style={{
        border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.05)' : `${themeAccent}26`}`,
        background: themeBg,
      }}
    >
      {/* Тематический SVG-арт */}
      <WeatherArt condition={condition} isLight={isLight} accent={themeAccent} accentSoft={themeAccentSoft} />

      {/* Свечения по углам (из палитры темы) */}
      <div style={{ position: 'absolute', top: -15, right: -15, width: 110, height: 110, borderRadius: '50%', background: themeGlow1, filter: 'blur(28px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -12, left: -12, width: 90, height: 90, borderRadius: '50%', background: themeGlow2, filter: 'blur(22px)', pointerEvents: 'none' }} />

      {/* Контент */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: themeAccent, boxShadow: `0 0 6px ${themeAccent}` }}
            />
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: themeAccentSoft }}>Погода</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${themeAccent}1f`, color: themeAccentSoft, border: `1px solid ${themeAccent}33` }}>
            {w?.city || 'Ташкент'}
          </span>
        </div>

        {error ? (
          <div className="flex-1 flex items-center justify-center min-h-[140px]">
            <div className="text-center">
              <div className="text-2xl mb-1">🌐</div>
              <div className="text-xs text-bx-muted">Нет данных о погоде</div>
            </div>
          </div>
        ) : !w ? (
          <div className="flex-1 flex items-center justify-center min-h-[140px]">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Основная температура + Совет */}
            <div 
              className="flex-1 rounded-lg p-3 mb-3 space-y-2.5 border backdrop-blur-[2px] flex flex-col justify-center" 
              style={{ 
                background: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.04)', 
                borderColor: isLight ? 'rgba(0, 0, 0, 0.05)' : `${themeAccent}1f`
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl leading-none" style={{ filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>
                  {w.icon}
                </div>
                <div>
                  <div className="text-4xl font-black leading-none" style={{ color: themeTempColor }}>
                    {w.temp}°
                  </div>
                  <div className="text-xs mt-1 font-bold" style={{ color: isLight ? themeAccent : `${themeAccent}dd` }}>{w.desc}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-1.5 pt-2 border-t" style={{ borderColor: isLight ? 'rgba(0, 0, 0, 0.05)' : `${themeAccent}14` }}>
                <span className="text-[11px] leading-snug font-medium" style={{ color: isLight ? '#1e293b' : 'rgba(255, 255, 255, 0.8)' }}>
                  💡 {getTip(w.temp, condition)}
                </span>
              </div>
            </div>

            {/* Детали (Ощущается, Влажность, Ветер) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ощущ.', value: `${w.feels}°` },
                { label: 'Влажн.', value: `${w.humidity}%` },
                { label: 'Ветер', value: `${w.wind} м/с` },
              ].map(({ label, value }) => (
                <div key={label}
                  className="rounded-lg px-2 py-1.5 text-center border"
                  style={{ 
                    background: isLight ? 'rgba(255, 255, 255, 0.4)' : `${themeAccent}14`, 
                    borderColor: isLight ? 'rgba(0,0,0,0.05)' : `${themeAccent}26` 
                  }}>
                  <div className="text-[9px] mb-0.5 uppercase tracking-wider font-bold" style={{ color: isLight ? themeAccent : `${themeAccent}aa` }}>{label}</div>
                  <div className="text-xs font-bold text-bx-text">{value}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
