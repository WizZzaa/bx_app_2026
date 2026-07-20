import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'
import { ACCOUNT_NAMES, getHoroscope, TOTAL_VARIATIONS } from '../../lib/horoscope'

export default function HoroscopeWidget() {
  const [prediction, setPrediction] = useState(() => getHoroscope())
  const [randomMode, setRandomMode] = useState(false)

  const reroll = () => {
    setPrediction(getHoroscope(new Date(Date.now() + Math.floor(Math.random() * 1e11))))
    setRandomMode(true)
  }
  const reset = () => {
    setPrediction(getHoroscope())
    setRandomMode(false)
  }

  return (
    <section className="bx-horoscope" aria-labelledby="bx-horoscope-title">
      <Constellation />
      <header className="bx-horoscope__header">
        <div className="bx-horoscope__title">
          <span aria-hidden="true"><Icon name="ai" /></span>
          <div><p>Неформальная пауза</p><h2 id="bx-horoscope-title">Бухгороскоп</h2></div>
        </div>
        <span className="bx-horoscope__date">{randomMode ? 'Другой прогноз' : new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
      </header>

      <div className="bx-horoscope__prediction">
        <small>Настрой дня</small>
        <p>{prediction.mood}</p>
        <span>{prediction.advice}</span>
      </div>

      <div className="bx-horoscope__warning">
        <Icon name="alert" />
        <p>{prediction.warning}</p>
      </div>

      <dl className="bx-horoscope__facts">
        <div><dt>Счёт дня</dt><dd title={ACCOUNT_NAMES[prediction.luckyAccount]}>{prediction.luckyAccount} · {ACCOUNT_NAMES[prediction.luckyAccount]}</dd></div>
        <div><dt>Цвет дня</dt><dd>{prediction.color}</dd></div>
      </dl>

      <footer className="bx-horoscope__footer">
        <button type="button" onClick={reroll}><Icon name="recycle" /> Другой прогноз</button>
        {randomMode && <button type="button" onClick={reset}>Вернуть прогноз дня</button>}
        <small>{TOTAL_VARIATIONS.toLocaleString('ru-RU')} комбинаций · для настроения, не для решений</small>
      </footer>
    </section>
  )
}

function Constellation() {
  return (
    <svg aria-hidden="true" viewBox="0 0 320 300" className="bx-horoscope__constellation">
      <path d="M210 32 278 66l-40 62 52 64-86 36-42-70 28-62Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M238 128 190 96m14 132 34-100" stroke="currentColor" strokeWidth=".7" strokeDasharray="3 5" />
      {[[210, 32], [278, 66], [238, 128], [290, 192], [204, 228], [162, 158], [190, 96]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" />)}
    </svg>
  )
}
