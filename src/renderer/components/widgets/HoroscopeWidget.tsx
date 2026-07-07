import React, { useState } from 'react'
import { getHoroscope, TOTAL_VARIATIONS, VARIANTS, type DailyHoroscope, type HoroscopeVariant } from '../../lib/horoscope'

// «Бухо-гороскоп» — предсказание дня для бухгалтера.
// Одна из 10 визуальных тем выбирается по дате; у каждой свой SVG-арт и палитра.
// По умолчанию детерминировано на сегодня; кнопка «Ещё» крутит случайные.

// ── SVG-арт для каждой темы (декоративный фон) ──────────────────────────────
export function Art({ v }: { v: HoroscopeVariant }) {
  const a = v.accent
  const s = v.accentSoft
  const common = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', pointerEvents: 'none' as const }
  switch (v.id) {
    case 'cosmos':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          <ellipse cx="150" cy="55" rx="46" ry="16" fill="none" stroke={a} strokeWidth="1" opacity="0.4" transform="rotate(-25 150 55)" />
          <ellipse cx="150" cy="55" rx="30" ry="10" fill="none" stroke={s} strokeWidth="1" opacity="0.3" transform="rotate(-25 150 55)" />
          <circle cx="150" cy="55" r="12" fill={a} opacity="0.8" />
          <circle cx="150" cy="55" r="12" fill="none" stroke={s} strokeWidth="0.6" opacity="0.6" />
          {[[30,30],[60,20],[100,40],[40,90],[170,120],[120,150],[80,170],[20,140],[190,80],[10,60]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r={i%3===0?1.6:1} fill={s} opacity={0.7} />
          ))}
          <path d="M30 30 L60 20 L100 40" fill="none" stroke={a} strokeWidth="0.5" opacity="0.35" />
        </svg>
      )
    case 'sunrise':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          <circle cx="100" cy="150" r="42" fill={a} opacity="0.55" />
          {Array.from({length:9}).map((_,i)=>{const ang=(i/8)*Math.PI - Math.PI; const x1=100+Math.cos(ang)*50; const y1=150+Math.sin(ang)*50; const x2=100+Math.cos(ang)*72; const y2=150+Math.sin(ang)*72; return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth="2" opacity="0.5" strokeLinecap="round" />})}
          <line x1="0" y1="150" x2="200" y2="150" stroke={s} strokeWidth="1.5" opacity="0.4" />
        </svg>
      )
    case 'zen':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          <path d="M160 200 Q150 120 165 40" fill="none" stroke={a} strokeWidth="3" opacity="0.5" />
          <path d="M165 90 Q120 70 100 95 Q135 100 165 90Z" fill={s} opacity="0.45" />
          <path d="M162 130 Q205 110 225 135 Q190 140 162 130Z" fill={a} opacity="0.4" />
          <path d="M158 60 Q120 45 105 70 Q140 72 158 60Z" fill={s} opacity="0.35" />
          <circle cx="45" cy="45" r="26" fill="none" stroke={a} strokeWidth="1" opacity="0.3" />
        </svg>
      )
    case 'retro':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          <defs><linearGradient id="rsun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s} /><stop offset="1" stopColor={a} /></linearGradient></defs>
          <circle cx="100" cy="70" r="40" fill="url(#rsun)" opacity="0.6" />
          {[40,52,64,76].map((y,i)=>(<rect key={i} x="60" y={y} width="80" height={3} fill={v.bg.includes('0d0420')?'#1a0730':'#130a22'} opacity="0.7" />))}
          {Array.from({length:7}).map((_,i)=>(<line key={i} x1="100" y1="120" x2={i*33-0} y2="200" stroke={a} strokeWidth="0.7" opacity="0.4" />))}
          {[130,150,170,190].map((y,i)=>(<line key={i} x1="0" y1={y} x2="200" y2={y} stroke={s} strokeWidth="0.6" opacity={0.4 - i*0.07} />))}
        </svg>
      )
    case 'night':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          <path d="M170 45 a26 26 0 1 0 8 40 a20 20 0 1 1 -8 -40Z" fill={a} opacity="0.7" />
          {[[30,40],[70,25],[110,55],[45,110],[150,130],[100,160],[25,150],[185,95]].map(([x,y],i)=>(
            <g key={i} opacity={0.7}><circle cx={x} cy={y} r="1.2" fill={s} /></g>
          ))}
          <path d="M55 90 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2Z" fill={s} opacity="0.7" />
        </svg>
      )
    case 'coffee':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          <rect x="70" y="110" width="60" height="46" rx="8" fill={a} opacity="0.5" />
          <path d="M130 118 q22 4 22 20 t-22 16" fill="none" stroke={a} strokeWidth="5" opacity="0.5" />
          <ellipse cx="100" cy="110" rx="30" ry="7" fill={s} opacity="0.5" />
          <path d="M88 90 q-6 -12 0 -22" fill="none" stroke={s} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
          <path d="M100 88 q-6 -12 0 -22" fill="none" stroke={s} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
          <path d="M112 90 q-6 -12 0 -22" fill="none" stroke={s} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        </svg>
      )
    case 'storm':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          <path d="M60 80 q-18 0 -18 16 q-16 2 -14 16 q2 12 18 12 h74 q20 0 20 -18 q0 -16 -18 -16 q-2 -22 -30 -18 q-14 2 -14 10Z" fill={s} opacity="0.45" />
          <path d="M108 120 l-14 22 h10 l-8 22 l22 -28 h-11 l9 -18Z" fill={v.accent} opacity="0.85" />
          {[70,95,140,160].map((x,i)=>(<line key={i} x1={x} y1="145" x2={x-8} y2="170" stroke={s} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />))}
        </svg>
      )
    case 'gold':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          {[150,132,114].map((y,i)=>(<g key={i}><ellipse cx="150" cy={y} rx="34" ry="11" fill={a} opacity={0.55 - i*0.06} /><ellipse cx="150" cy={y} rx="34" ry="11" fill="none" stroke={s} strokeWidth="0.8" opacity="0.5" /></g>))}
          <ellipse cx="150" cy="103" rx="34" ry="11" fill={s} opacity="0.6" />
          <text x="150" y="108" textAnchor="middle" fontSize="12" fill={v.bg.includes('100e03')?'#100e03':'#1c1805'} opacity="0.7" fontWeight="bold">$</text>
          <path d="M40 50 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3Z" fill={a} opacity="0.7" />
          <path d="M70 90 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2Z" fill={s} opacity="0.6" />
        </svg>
      )
    case 'sea':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          {[70,95,120,145,170].map((y,i)=>(
            <path key={i} d={`M-10 ${y} q25 -12 50 0 t50 0 t50 0 t50 0 t50 0`} fill="none" stroke={i%2?s:a} strokeWidth="2" opacity={0.5 - i*0.05} />
          ))}
          <circle cx="160" cy="45" r="18" fill={s} opacity="0.4" />
        </svg>
      )
    case 'fire':
      return (
        <svg viewBox="0 0 200 200" style={{ ...common, opacity: 0.55 }} preserveAspectRatio="xMidYMid slice">
          <path d="M100 40 q26 32 22 60 q-2 20 -22 30 q-20 -10 -22 -30 q-4 -28 22 -60Z" fill={a} opacity="0.5" />
          <path d="M100 70 q14 20 12 38 q-2 12 -12 18 q-10 -6 -12 -18 q-2 -18 12 -38Z" fill={s} opacity="0.6" />
          {[[40,150],[160,140],[30,90],[175,95]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="2" fill={a} opacity="0.5" />))}
        </svg>
      )
    default:
      return null
  }
}

export default function HoroscopeWidget() {
  const [h, setH] = useState<DailyHoroscope>(() => getHoroscope())
  const [randomMode, setRandomMode] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const reroll = () => {
    setSpinning(true)
    setTimeout(() => {
      const rnd = new Date(Date.now() + Math.floor(Math.random() * 1e11))
      setH(getHoroscope(rnd))
      setRandomMode(true)
      setSpinning(false)
    }, 400)
  }

  const backToToday = () => {
    setH(getHoroscope())
    setRandomMode(false)
  }

  const v = h.variant ?? VARIANTS[0]
  const today = new Date()
  const dateStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <div
      className="rounded-xl h-full min-h-[300px] overflow-hidden relative flex flex-col transition-all duration-500"
      style={{ border: `1px solid ${v.border}`, background: v.bg }}
    >
      {/* Тематический SVG-арт */}
      <div className={`transition-opacity duration-500 ${spinning ? 'opacity-0' : 'opacity-100'}`}>
        <Art v={v} />
      </div>

      {/* Свечения по углам (из палитры темы) */}
      <div style={{ position: 'absolute', top: -15, right: -15, width: 110, height: 110, borderRadius: '50%', background: v.glow1, filter: 'blur(28px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -12, left: -12, width: 90, height: 90, borderRadius: '50%', background: v.glow2, filter: 'blur(22px)', pointerEvents: 'none' }} />

      {/* Контент */}
      <div className="relative z-10 p-4 h-full flex flex-col">

        {/* Заголовок */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: v.accent, boxShadow: `0 0 6px ${v.accent}` }} />
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: v.accentSoft }}>Бухо-гороскоп</h2>
          </div>
          <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: v.accent }}>
            {randomMode ? '🎲 случайный' : dateStr}
          </span>
        </div>

        {/* Чип темы дня */}
        <div className="mb-2.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${v.accent}1f`, color: v.accentSoft, border: `1px solid ${v.accent}33` }}
          >
            <span>{v.emoji}</span>{v.label}
          </span>
        </div>

        {/* Основное предсказание */}
        <div className="flex-1 rounded-lg p-3 mb-3 space-y-2" style={{ background: '#ffffff0a', border: `1px solid ${v.accent}1f`, backdropFilter: 'blur(2px)' }}>
          <p
            className="text-sm leading-snug font-medium transition-all duration-300"
            style={{ color: v.textMain, opacity: spinning ? 0 : 1, transform: spinning ? 'translateY(4px)' : 'translateY(0)' }}
          >
            {h.mood}
          </p>
          <p className="text-xs leading-snug transition-all duration-300" style={{ color: v.textSub, opacity: spinning ? 0 : 1 }}>
            {h.advice}
          </p>
          <div className="flex items-start gap-1.5">
            <span className="text-amber-400/80 text-xs flex-shrink-0">⚠</span>
            <p className="text-[11px] text-amber-300/70 leading-snug transition-all duration-300" style={{ opacity: spinning ? 0 : 1 }}>
              {h.warning}
            </p>
          </div>
        </div>

        {/* Счёт и цвет дня */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{ background: `${v.accent}14`, border: `1px solid ${v.accent}26` }}>
            <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: `${v.accent}aa` }}>Счёт дня</div>
            <div className="text-sm font-bold" style={{ color: v.accentSoft }}>{h.luckyAccount}</div>
          </div>
          <div className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{ background: '#f59e0b12', border: '1px solid #f59e0b20' }}>
            <div className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-0.5">Цвет дня</div>
            <div className="text-[10px] font-medium text-amber-200/80 leading-tight">{h.color}</div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #ffffff0d' }}>
          <button
            onClick={reroll}
            disabled={spinning}
            className="flex items-center gap-1 text-[11px] transition-colors disabled:opacity-50"
            style={{ color: v.accent }}
          >
            <span className={`inline-block transition-transform duration-300 ${spinning ? 'rotate-180' : ''}`}>🎲</span>
            Ещё предсказание
          </button>

          {randomMode && (
            <button onClick={backToToday} className="ml-auto text-[11px] text-bx-muted hover:text-bx-text transition-colors">
              ← сегодня
            </button>
          )}

          {!randomMode && (
            <span className="ml-auto text-[9px] text-bx-muted font-mono" title={`${TOTAL_VARIATIONS.toLocaleString('ru-RU')} вариаций`}>
              {TOTAL_VARIATIONS.toLocaleString('ru-RU')} вар.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
