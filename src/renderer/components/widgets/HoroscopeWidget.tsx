import React, { useState } from 'react'
import { getHoroscope, TOTAL_VARIATIONS, type DailyHoroscope } from '../../lib/horoscope'
import imgHoroscope from '../../assets/widgets/horoscope.png'

// «Бухо-гороскоп» — предсказание дня для бухгалтера.
// По умолчанию детерминировано на сегодня; кнопка «Ещё» крутит случайные.

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

  const today = new Date()
  const dateStr = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <div
      className="rounded-xl h-full overflow-hidden relative flex flex-col"
      style={{
        border: '1px solid #6d28d940',
        background: '#130a22',
      }}
    >
      {/* Фоновая картинка — зодиак */}
      <img
        src={imgHoroscope}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.18,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Градиент для читабельности */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1a0d35e8 0%, #130a22c0 50%, #0d071a80 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Фиолетовое свечение справа-сверху */}
      <div
        style={{
          position: 'absolute', top: -15, right: -15,
          width: 100, height: 100, borderRadius: '50%',
          background: '#a855f720',
          filter: 'blur(25px)',
          pointerEvents: 'none',
        }}
      />

      {/* Золотое свечение снизу-слева */}
      <div
        style={{
          position: 'absolute', bottom: -10, left: -10,
          width: 80, height: 80, borderRadius: '50%',
          background: '#f59e0b15',
          filter: 'blur(20px)',
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
              style={{ background: '#a855f7', boxShadow: '0 0 6px #a855f7' }}
            />
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Бухо-гороскоп</h2>
          </div>
          <span className="text-[10px] text-purple-400/70 font-medium">
            {randomMode ? '🎲 случайный' : dateStr}
          </span>
        </div>

        {/* Основное предсказание */}
        <div
          className="flex-1 rounded-lg p-3 mb-3 space-y-2"
          style={{
            background: '#ffffff08',
            border: '1px solid #a855f718',
          }}
        >
          {/* Настрой */}
          <p
            className={`text-sm text-purple-100 leading-snug font-medium transition-all duration-300 ${spinning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
            style={{ transform: spinning ? 'translateY(4px)' : 'translateY(0)' }}
          >
            {h.mood}
          </p>

          {/* Совет */}
          <p
            className={`text-xs text-slate-400 leading-snug transition-all duration-300 ${spinning ? 'opacity-0' : 'opacity-100'}`}
          >
            {h.advice}
          </p>

          {/* Предостережение */}
          <div className="flex items-start gap-1.5">
            <span className="text-amber-400/80 text-xs flex-shrink-0">⚠</span>
            <p className={`text-[11px] text-amber-300/70 leading-snug transition-all duration-300 ${spinning ? 'opacity-0' : 'opacity-100'}`}>
              {h.warning}
            </p>
          </div>
        </div>

        {/* Счёт и цвет дня */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex-1 rounded-lg px-2 py-1.5 text-center"
            style={{ background: '#a855f715', border: '1px solid #a855f725' }}
          >
            <div className="text-[9px] text-purple-400/60 uppercase tracking-wider mb-0.5">Счёт дня</div>
            <div className="text-sm font-bold text-purple-300">{h.luckyAccount}</div>
          </div>
          <div
            className="flex-1 rounded-lg px-2 py-1.5 text-center"
            style={{ background: '#f59e0b12', border: '1px solid #f59e0b20' }}
          >
            <div className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-0.5">Цвет дня</div>
            <div className="text-[10px] font-medium text-amber-200/80 leading-tight">{h.color}</div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            onClick={reroll}
            disabled={spinning}
            className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
          >
            <span className={`inline-block transition-transform duration-300 ${spinning ? 'rotate-180' : ''}`}>🎲</span>
            Ещё предсказание
          </button>

          {randomMode && (
            <button
              onClick={backToToday}
              className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← сегодня
            </button>
          )}

          <span className="ml-auto text-[9px] text-slate-700 font-mono" title={`${TOTAL_VARIATIONS.toLocaleString('ru-RU')} вариаций`}>
            {!randomMode && `${TOTAL_VARIATIONS.toLocaleString('ru-RU')} вар.`}
          </span>
        </div>
      </div>
    </div>
  )
}
