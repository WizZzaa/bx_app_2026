import React, { useState } from 'react';
import { toWordsRu, toWordsUz } from '../../lib/numToWords';
import Button from '../../components/ui/Button';
import { MoneyField, Select } from '../../components/ui/FormControls';
import Icon from '../../lib/ui/Icon';

// ─── UI ─────────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { id: 'sum', code: 'UZS', label: 'Сум / тийин (UZS)' },
  { id: 'usd', code: 'USD', label: 'Доллар / цент (USD)' },
  { id: 'eur', code: 'EUR', label: 'Евро / цент (EUR)' },
  { id: 'rub', code: 'RUB', label: 'Рубль / копейка (RUB)' },
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
    // журнал последних сумм
    try {
      const prev: { raw: string; currency: string }[] = JSON.parse(localStorage.getItem('bx_n2w_history') || '[]')
      const next = [{ raw, currency }, ...prev.filter(h => h.raw !== raw)].slice(0, 8)
      localStorage.setItem('bx_n2w_history', JSON.stringify(next))
      setHistory(next)
    } catch { /* пусто */ }
  }

  const [history, setHistory] = useState<{ raw: string; currency: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('bx_n2w_history') || '[]') } catch { return [] }
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <MoneyField
          label="Сумма цифрами"
          currency={CURRENCIES.find(item => item.id === currency)?.code}
          value={raw}
          onChange={event => setRaw(event.target.value)}
          placeholder="1 234 567,89"
          containerClassName="col-span-2"
          className="text-lg"
        />
        <Select label="Валюта" value={currency} onChange={event => setCurrency(event.target.value)} containerClassName="col-span-2">
          {CURRENCIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
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

      {history.length > 0 && (
        <div>
          <p className="text-[10px] text-bx-muted uppercase tracking-widest font-semibold mb-1.5">Недавние суммы</p>
          <div className="flex flex-wrap gap-1.5">
            {history.map(h => (
              <button type="button" key={h.raw + h.currency}
                onClick={() => { setRaw(h.raw); setCurrency(h.currency) }}
                className="min-h-11 rounded-lg bg-bx-surface-2 px-3 py-2 text-[11px] tabular-nums text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text">
                {h.raw}
              </button>
            ))}
          </div>
        </div>
      )}

      {!raw && (
        <div className="text-center py-8 text-bx-muted">
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-bx-surface-2 text-bx-accent"><Icon name="calc" className="h-5 w-5" /></span>
          <p className="text-sm">Введите сумму — получите прописью</p>
          <p className="text-xs mt-1">Для договоров, актов, платёжных документов</p>
        </div>
      )}

      <p className="text-[11px] text-bx-muted">Используется в договорах (ст. 386 ГК РУз), актах, платёжных поручениях</p>
    </div>
  );
}

function ResultBox({ lang, text, copied, onCopy }: { lang: string; text: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-bx-bg rounded-xl border border-bx-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-bx-muted">{lang}</span>
        <Button type="button" variant="secondary" onClick={onCopy}
          className={copied ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : ''}>
          {copied ? '✓ Скопировано' : 'Копировать'}
        </Button>
      </div>
      <p className="text-sm text-bx-text leading-relaxed">{text}</p>
    </div>
  );
}
