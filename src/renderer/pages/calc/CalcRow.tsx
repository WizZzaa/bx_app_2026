import React, { useState } from 'react';

// Общий ряд результата калькулятора: клик по значению копирует число в буфер
// (для вставки в платёжки и 1С — без текста «UZS» и пробелов-разделителей).

export function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const numeric = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const text = /\d/.test(numeric) ? numeric : value;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard недоступен (небезопасный контекст) — молча пропускаем */ }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 group">
      <span className="text-sm text-bx-muted">{label}</span>
      <button
        onClick={copy}
        title="Скопировать число"
        className={`text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
          copied ? 'text-emerald-400' : highlight ? 'text-blue-400 hover:text-blue-300' : 'text-bx-text hover:text-bx-text'
        }`}
      >
        {copied ? 'Скопировано ✓' : value}
        {!copied && (
          <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 5V4a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 3 4v5A1.5 1.5 0 0 0 4.5 10.5H5" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
