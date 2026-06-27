import React, { useEffect, useState } from 'react';
import { widgetsApi } from '../../lib/widgetsApi';
import type { WeatherData } from '../../../shared/types';

// Виджет погоды по Ташкенту. Реальные данные с open-meteo (без API-ключа).

export default function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    widgetsApi.getWeather()
      .then(d => { if (alive) setW(d); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="rounded-xl border border-[#1e2535] bg-gradient-to-br from-[#16203a] to-[#141820] p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-slate-300">🌤 Погода</h2>
        <span className="text-xs text-slate-500">{w?.city || '…'}</span>
      </div>

      {error ? (
        <div className="text-sm text-slate-500 text-center py-6">Нет данных о погоде</div>
      ) : !w ? (
        <div className="text-sm text-slate-500 text-center py-6">Загрузка…</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="text-5xl leading-none">{w.icon}</div>
          <div>
            <div className="text-3xl font-bold text-white leading-none">{w.temp}°</div>
            <div className="text-xs text-slate-400 mt-1">{w.desc}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ощущается как {w.feels}°</div>
          </div>
          <div className="ml-auto text-right space-y-1">
            <div className="text-[11px] text-slate-500">💧 {w.humidity}%</div>
            <div className="text-[11px] text-slate-500">💨 {w.wind} м/с</div>
          </div>
        </div>
      )}
    </div>
  );
}
