import React, { useState } from 'react';
import { Row } from './CalcRow';

// Блок результата калькулятора:
// — hero-зона: главное значение крупно, клик копирует число
// — вторичные строки с копированием по клику
// — кнопка «Скопировать расчёт» (весь разбор текстом) в hero
// — журнал последних расчётов (localStorage), который читает Calc.tsx

export interface CalcRowData {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface CalcHistoryEntry {
  title: string;
  text: string;      // полный текст расчёта
  main: string;      // главное значение (highlight-строка)
  ts: number;
}

const HISTORY_KEY = 'bx_calc_history_v1';
const HISTORY_MAX = 15;
export const HISTORY_EVENT = 'bx-calc-history-changed';

export function readCalcHistory(): CalcHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

export function clearCalcHistory() {
  localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

function logCalc(entry: CalcHistoryEntry) {
  const prev = readCalcHistory();
  if (prev[0]?.text === entry.text) return; // не дублируем идентичный последний
  const next = [entry, ...prev].slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export default function CalcResult({ title, rows }: { title: string; rows: CalcRowData[] }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedMain, setCopiedMain] = useState(false);

  const main = rows.find(r => r.highlight);
  const secondary = rows.filter(r => !r.highlight);
  const fullText = `${title}\n${rows.map(r => `${r.label}: ${r.value}`).join('\n')}`;

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
      logCalc({ title, text: fullText, main: main?.value ?? rows[rows.length - 1]?.value ?? '', ts: Date.now() });
    } catch { /* небезопасный контекст — молча */ }
  }

  async function copyMain() {
    if (!main) return;
    const numeric = main.value.replace(/[^\d,.-]/g, '').replace(',', '.');
    try {
      await navigator.clipboard.writeText(/\d/.test(numeric) ? numeric : main.value);
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 1200);
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-2xl border border-[#1e2535] overflow-hidden">
      {/* Hero: главный результат */}
      {main && (
        <div className="relative bg-gradient-to-br from-blue-600/15 via-[#141b2e] to-[#0f1117] px-5 py-4 border-b border-[#1e2535]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-blue-300/70 uppercase tracking-wider font-semibold mb-1">{main.label}</p>
              <button
                onClick={copyMain}
                title="Скопировать число"
                className={`text-2xl font-bold tabular-nums leading-tight transition-colors ${
                  copiedMain ? 'text-emerald-400' : 'text-white hover:text-blue-300'
                }`}
              >
                {copiedMain ? 'Скопировано ✓' : main.value}
              </button>
            </div>
            <button
              onClick={copyAll}
              title="Скопировать весь расчёт текстом"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all flex-shrink-0 ${
                copiedAll
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#0f1117]/60 border-[#2a3447] text-slate-300 hover:border-blue-500/50 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 3 4v5A1.5 1.5 0 0 0 4.5 10.5H5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              {copiedAll ? 'Расчёт скопирован' : 'Весь расчёт'}
            </button>
          </div>
        </div>
      )}

      {/* Вторичные строки */}
      <div className="divide-y divide-[#1e2535] bg-[#0f1117]">
        {secondary.map((r, i) => <Row key={i} label={r.label} value={r.value} />)}
      </div>
    </div>
  );
}
