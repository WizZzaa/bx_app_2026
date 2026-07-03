import React, { useState } from 'react';
import { toWordsRu, toWordsUz } from '../../lib/numToWords';

// ─── UI ─────────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { id: 'sum', label: 'Сум / тийин (UZS)' },
  { id: 'usd', label: 'Доллар / цент (USD)' },
  { id: 'eur', label: 'Евро / цент (EUR)' },
  { id: 'rub', label: 'Рубль / копейка (RUB)' },
];

export default function NumberToWords() {
  const [raw, setRaw] = useState('');
  const [currency, setCurrency] = useState('sum');
  const [copied, setCopied] = useState<'ru' | 'uz' | null>(null);

  const num = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
  const ruText = !isNaN(num) && raw ? toWordsRu(num, currency) : '';
  const uzText = !isNaN(num) && raw ? toWordsUz(num, currency) : '';

  function copy(text: string, lang: 'ru' | 'uz') {
    navigator.clipboard.writeText(text).catch(() => { void 0 })
    setCopied(lang)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Сумма (цифрами)</label>
          <input
            type="text"
            inputMode="decimal"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="1 234 567,89"
            className="w-full bg-[#0f1117] text-slate-200 text-xl px-4 py-3 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 font-mono"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5">Валюта</label>
          <div className="flex gap-2 flex-wrap">
            {CURRENCIES.map(c => (
              <button key={c.id} onClick={() => setCurrency(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${currency === c.id ? 'bg-blue-600 text-white' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ruText && (
        <div className="space-y-3">
          <ResultBox
            lang="🇷🇺 Русский"
            text={ruText}
            copied={copied === 'ru'}
            onCopy={() => copy(ruText, 'ru')}
          />
          <ResultBox
            lang="🇺🇿 O'zbek (lotin)"
            text={uzText}
            copied={copied === 'uz'}
            onCopy={() => copy(uzText, 'uz')}
          />
        </div>
      )}

      {!raw && (
        <div className="text-center py-8 text-slate-600">
          <p className="text-3xl mb-3">🔢</p>
          <p className="text-sm">Введите сумму — получите прописью</p>
          <p className="text-xs mt-1">Для договоров, актов, платёжных документов</p>
        </div>
      )}

      <p className="text-[11px] text-slate-600">Используется в договорах (ст. 386 ГК РУз), актах, платёжных поручениях</p>
    </div>
  );
}

function ResultBox({ lang, text, copied, onCopy }: { lang: string; text: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{lang}</span>
        <button onClick={onCopy}
          className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e2535] text-slate-400 hover:text-slate-200'}`}>
          {copied ? '✓ Скопировано' : 'Копировать'}
        </button>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{text}</p>
    </div>
  );
}
