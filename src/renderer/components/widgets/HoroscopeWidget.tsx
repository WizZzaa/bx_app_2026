import React, { useState } from 'react';
import { getHoroscope, TOTAL_VARIATIONS, DailyHoroscope } from '../../lib/horoscope';

// «Бухо-гороскоп» — предсказание дня для бухгалтера.
// По умолчанию детерминировано на сегодня; кнопка «Ещё» крутит случайные.

export default function HoroscopeWidget() {
  const [h, setH] = useState<DailyHoroscope>(() => getHoroscope());
  const [randomMode, setRandomMode] = useState(false);

  function reroll() {
    // случайная дата в пределах ~270 тыс. дней даёт другую комбинацию
    const rnd = new Date(Date.now() + Math.floor(Math.random() * 1e11));
    setH(getHoroscope(rnd));
    setRandomMode(true);
  }

  function backToToday() {
    setH(getHoroscope());
    setRandomMode(false);
  }

  return (
    <div className="rounded-xl border border-[#1e2535] bg-gradient-to-br from-[#241a3a] to-[#141820] p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-300">🔮 Бухо-гороскоп</h2>
        <span className="text-[10px] text-slate-600">{TOTAL_VARIATIONS.toLocaleString('ru-RU')} вариаций</span>
      </div>

      <div className="flex-1 space-y-2.5">
        <p className="text-sm text-purple-200 leading-snug">{h.mood}</p>
        <p className="text-xs text-slate-400 leading-snug">{h.advice}</p>
        <p className="text-xs text-amber-300/80 leading-snug">⚠ {h.warning}</p>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-[11px] text-slate-500">
            Счёт дня: <span className="text-purple-300 font-medium">{h.luckyAccount}</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Цвет: <span className="text-slate-300">{h.color}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          onClick={reroll}
          className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
        >
          🎲 Ещё предсказание
        </button>
        {randomMode && (
          <button onClick={backToToday} className="text-xs text-slate-500 hover:text-slate-300 ml-auto transition-colors">
            ← на сегодня
          </button>
        )}
      </div>
    </div>
  );
}
