import React, { useState } from 'react'
import Icon from '../../lib/ui/Icon'
import { ACCOUNT_NAMES, getHoroscope, TOTAL_VARIATIONS } from '../../lib/horoscope'

export default function HoroscopeWidget() {
  const [prediction, setPrediction] = useState(() => getHoroscope())
  const [randomMode, setRandomMode] = useState(false)
  const reroll = () => { setPrediction(getHoroscope(new Date(Date.now() + Math.floor(Math.random() * 1e11)))); setRandomMode(true) }
  const reset = () => { setPrediction(getHoroscope()); setRandomMode(false) }

  return (
    <section className="relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-[24px] border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.10] via-bx-surface to-blue-500/[0.06] p-5 shadow-sm" aria-label="Бухо-гороскоп">
      <Constellation />
      <header className="relative flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-300"><Icon name="ai" className="h-4 w-4" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300">Прогноз дня</p><h2 className="text-sm font-black text-bx-text">Бухо-гороскоп</h2></div><span className="ml-auto rounded-full border border-violet-500/15 bg-bx-surface/70 px-2.5 py-1 text-[9px] font-bold text-bx-muted">{randomMode ? 'случайный' : new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span></header>
      <div className="relative mt-4 flex-1 rounded-2xl border border-violet-500/10 bg-bx-surface/65 p-4 backdrop-blur-sm"><p className="text-sm font-black leading-relaxed text-bx-text">{prediction.mood}</p><p className="mt-2 text-[10px] leading-relaxed text-bx-muted">{prediction.advice}</p><div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/[0.08] p-2.5 text-[9px] leading-relaxed text-amber-800 dark:text-amber-200"><Icon name="alert" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{prediction.warning}</div></div>
      <div className="relative mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-violet-500/10 bg-bx-surface/70 p-2.5"><p className="text-[8px] font-bold uppercase tracking-wide text-bx-muted">Счёт дня</p><p className="mt-1 text-xs font-black text-violet-700 dark:text-violet-300" title={ACCOUNT_NAMES[prediction.luckyAccount]}>{prediction.luckyAccount} · {ACCOUNT_NAMES[prediction.luckyAccount]}</p></div><div className="rounded-xl border border-blue-500/10 bg-bx-surface/70 p-2.5"><p className="text-[8px] font-bold uppercase tracking-wide text-bx-muted">Цвет дня</p><p className="mt-1 line-clamp-1 text-xs font-black text-blue-700 dark:text-blue-300">{prediction.color}</p></div></div>
      <footer className="relative mt-3 border-t border-violet-500/10 pt-3"><button onClick={reroll} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-extrabold text-white shadow-lg shadow-violet-600/20 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"><Icon name="recycle" className="h-4 w-4" />Рассмешить ещё раз</button><div className="mt-2 flex items-center">{randomMode ? <button onClick={reset} className="text-[9px] font-bold text-bx-muted hover:text-bx-text">Вернуть прогноз на сегодня</button> : <span className="text-[8px] font-semibold text-bx-muted">Бухгалтерский юмор без списания нервов</span>}<span className="ml-auto text-[8px] font-semibold tabular-nums text-bx-muted">{TOTAL_VARIATIONS.toLocaleString('ru-RU')} вариаций</span></div></footer>
    </section>
  )
}

function Constellation() {
  return <svg aria-hidden="true" viewBox="0 0 320 260" className="pointer-events-none absolute inset-0 h-full w-full text-violet-500 opacity-20 dark:text-blue-300 dark:opacity-15"><path d="M210 32 278 66l-40 62 52 64-86 36-42-70 28-62Z" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M238 128 190 96m14 132 34-100" stroke="currentColor" strokeWidth=".7" strokeDasharray="3 5" />{[[210,32],[278,66],[238,128],[290,192],[204,228],[162,158],[190,96]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" />)}</svg>
}
