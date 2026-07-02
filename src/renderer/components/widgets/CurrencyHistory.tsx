import React, { useState, useEffect, useCallback } from 'react';
import { widgetsApi } from '../../lib/widgetsApi';
import { toLocalISO } from '../../lib/dates';

interface Props { onClose: () => void; }

const CODES = ['USD', 'EUR', 'RUB'];
const FLAGS: Record<string, string> = { USD: '🇺🇸', EUR: '🇪🇺', RUB: '🇷🇺' };
const PERIODS = [
  { label: '7 дней',  days: 7  },
  { label: '14 дней', days: 14 },
  { label: '30 дней', days: 30 },
];

interface RatePoint { date: string; value: number; }

function dateStr(d: Date) {
  return toLocalISO(d);
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function fmtVal(v: number) {
  return v.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Simple SVG sparkline
function Sparkline({ points, color }: { points: RatePoint[]; color: string }) {
  if (points.length < 2) return null;
  const vals = points.map(p => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 300, H = 56;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = vals.map(v => H - ((v - min) / range) * (H - 8) - 4);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const last = vals[vals.length - 1];
  const first = vals[0];
  const up = last >= first;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id={`g_${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g_${color})`} />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={color} />
    </svg>
  );
}

export default function CurrencyHistory({ onClose }: Props) {
  const [period, setPeriod] = useState(14);
  const [activeCode, setActiveCode] = useState('USD');
  const [history, setHistory] = useState<Record<string, RatePoint[]>>({});
  const [loading, setLoading] = useState(false);
  const [onDateMode, setOnDateMode] = useState(false);
  const [onDateVal, setOnDateVal] = useState(dateStr(new Date()));
  const [onDateRates, setOnDateRates] = useState<{ code: string; value: number; name: string }[] | null>(null);
  const [onDateLoading, setOnDateLoading] = useState(false);

  const loadHistory = useCallback(async (days: number) => {
    setLoading(true);
    const today = new Date();
    const results: Record<string, RatePoint[]> = {};
    await Promise.all(CODES.map(async code => {
      const pts: RatePoint[] = [];
      // Fetch in parallel batches — cbu.uz supports single date per call
      const dates = Array.from({ length: days }, (_, i) => dateStr(addDays(today, -(days - 1 - i))));
      const fetched = await Promise.all(
        dates.map(d => widgetsApi.getRateOnDate(code, d).catch(() => null))
      );
      fetched.forEach((r, i) => {
        if (r) pts.push({ date: dates[i], value: r.value });
      });
      results[code] = pts;
    }));
    setHistory(results);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(period); }, [period, loadHistory]);

  async function fetchOnDate() {
    setOnDateLoading(true);
    const rates = await Promise.all(CODES.map(async code => {
      const r = await widgetsApi.getRateOnDate(code, onDateVal).catch(() => null);
      return r ? { code, value: r.value, name: r.name } : null;
    }));
    setOnDateRates(rates.filter(Boolean) as { code: string; value: number; name: string }[]);
    setOnDateLoading(false);
  }

  const pts = history[activeCode] ?? [];
  const last = pts[pts.length - 1];
  const first = pts[0];
  const diff = last && first ? last.value - first.value : 0;
  const up = diff >= 0;
  const COLORS: Record<string, string> = { USD: '#3b82f6', EUR: '#8b5cf6', RUB: '#f59e0b' };

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#141820] border border-[#2a3447] rounded-2xl w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2535]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">История курсов ЦБ РУз</h2>
            <div className="flex gap-1 bg-[#0f1117] border border-[#1e2535] rounded-lg p-0.5">
              <button onClick={() => setOnDateMode(false)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${!onDateMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                График
              </button>
              <button onClick={() => setOnDateMode(true)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${onDateMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                На дату
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!onDateMode ? (
            <>
              {/* Period selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Период:</span>
                {PERIODS.map(p => (
                  <button key={p.days} onClick={() => setPeriod(p.days)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${period === p.days ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Currency tabs */}
              <div className="flex gap-2">
                {CODES.map(code => (
                  <button key={code} onClick={() => setActiveCode(code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeCode === code ? 'bg-[#1e2535] text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}>
                    <span>{FLAGS[code]}</span>
                    <span className="font-medium">{code}</span>
                  </button>
                ))}
              </div>

              {/* Chart area */}
              <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] p-4">
                {loading ? (
                  <div className="h-14 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : pts.length > 1 ? (
                  <>
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-2xl font-bold text-slate-200 font-mono">
                          {last ? fmtVal(last.value) : '—'}
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5">сум</span>
                      </div>
                      <div className={`text-sm font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {up ? '▲' : '▼'} {Math.abs(diff).toFixed(1)} за период
                      </div>
                    </div>
                    <Sparkline points={pts} color={COLORS[activeCode] ?? '#3b82f6'} />
                    <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                      <span>{pts[0] ? fmt(pts[0].date) : ''}</span>
                      <span>{last ? fmt(last.date) : ''}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600 text-center py-4">Нет данных</p>
                )}
              </div>

              {/* Table of last values */}
              {pts.length > 0 && (
                <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
                  <div className="grid grid-cols-3 px-4 py-2 border-b border-[#1e2535] text-[11px] text-slate-600 font-medium">
                    <span>Дата</span><span className="text-right">Курс (сум)</span><span className="text-right">Изм.</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[#1e2535]">
                    {[...pts].reverse().slice(0, 15).map((p, i, arr) => {
                      const prev = arr[i + 1];
                      const d = prev ? p.value - prev.value : 0;
                      return (
                        <div key={p.date} className="grid grid-cols-3 px-4 py-2 text-xs">
                          <span className="text-slate-400">{fmt(p.date)}</span>
                          <span className="text-slate-200 text-right font-mono">{fmtVal(p.value)}</span>
                          <span className={`text-right font-mono text-[11px] ${d > 0 ? 'text-emerald-400' : d < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                            {d !== 0 ? `${d > 0 ? '+' : ''}${d.toFixed(1)}` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Курс на дату */
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Выберите дату</label>
                <div className="flex gap-2">
                  <input type="date" value={onDateVal}
                    max={dateStr(new Date())}
                    onChange={e => { setOnDateVal(e.target.value); setOnDateRates(null); }}
                    className="bg-[#0f1117] text-slate-200 px-3 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm flex-1" />
                  <button onClick={fetchOnDate} disabled={onDateLoading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
                    {onDateLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Получить
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">Используется для расчёта таможенной стоимости (ГТД) и пересчёта в СКВ</p>
              </div>

              {onDateRates && (
                <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#1e2535]">
                    <p className="text-xs text-slate-500">Курс ЦБ РУз на {new Date(onDateVal).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  {onDateRates.map(r => (
                    <div key={r.code} className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2535] last:border-0">
                      <span className="text-lg">{FLAGS[r.code]}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-200">{r.code}</p>
                        <p className="text-[10px] text-slate-600">{r.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-slate-200">{fmtVal(r.value)}</p>
                        <p className="text-[10px] text-slate-600">сум</p>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(r.value.toFixed(2))}
                        className="text-[10px] px-2 py-0.5 bg-[#1e2535] text-slate-500 hover:text-slate-300 rounded transition-colors ml-1">
                        Копировать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-4 text-[11px] text-slate-700 text-center">
          Источник данных: cbu.uz — Центральный банк Республики Узбекистан
        </div>
      </div>
    </div>
  );
}
