import React, { useState } from 'react';
import { Row } from './CalcRow';

// Блок результата калькулятора: строки с копированием по клику
// + кнопка «Копировать расчёт» (весь разбор текстом — для клиента/мессенджера)
// + журнал последних расчётов (localStorage), который читает Calc.tsx.

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
  // не дублируем идентичный последний расчёт
  if (prev[0]?.text === entry.text) return;
  const next = [entry, ...prev].slice(0, HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export default function CalcResult({ title, rows }: { title: string; rows: CalcRowData[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const text = `${title}\n${rows.map(r => `${r.label}: ${r.value}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      const main = rows.find(r => r.highlight)?.value ?? rows[rows.length - 1]?.value ?? '';
      logCalc({ title, text, main, ts: Date.now() });
    } catch { /* небезопасный контекст — молча */ }
  }

  return (
    <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
      <div className="divide-y divide-[#1e2535]">
        {rows.map((r, i) => <Row key={i} label={r.label} value={r.value} highlight={r.highlight} />)}
      </div>
      <div className="border-t border-[#1e2535] px-4 py-2 flex justify-end">
        <button
          onClick={copyAll}
          className={`text-[11px] font-medium transition-colors ${copied ? 'text-emerald-400' : 'text-blue-400 hover:text-blue-300'}`}
        >
          {copied ? '✓ Расчёт скопирован' : '⧉ Копировать расчёт целиком'}
        </button>
      </div>
    </div>
  );
}
