import React, { useState } from 'react';
import { validateBankAccount, getBankNameByMfo, BANKS_MFO } from '../../lib/validation';
import { Field } from '../../components/ui/FormControls';

// Проверка банковских реквизитов: р/с (20 цифр) и определение банка по МФО.
// Ежедневная рутина бухгалтера при сверке платёжек.

export default function BankCheck() {
  const [account, setAccount] = useState('');
  const [mfo, setMfo] = useState('');
  const [copied, setCopied] = useState('');

  const accClean = account.replace(/\D/g, '');
  const accState = accClean.length === 0 ? null : accClean.length === 20 && validateBankAccount(accClean);
  const bank = mfo.length === 5 ? getBankNameByMfo(mfo) : '';

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 1200);
    } catch { /* небезопасный контекст */ }
  }

  return (
    <div className="space-y-5">
      {/* Расчётный счёт */}
      <div>
        <Field
          label="Расчётный счёт"
          hint={accState ? 'Формат верный: 20 цифр.' : 'Введите 20 цифр расчётного счёта без дополнительных символов.'}
          error={accState === false ? (accClean.length !== 20 ? `Введено ${accClean.length} из 20 цифр.` : 'Неверный формат счёта.') : undefined}
          value={account}
          onChange={e => setAccount(e.target.value.replace(/[^\d\s]/g, '').slice(0, 25))}
          placeholder="2020 8000 9001 2345 6789"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          className="text-lg tabular-nums tracking-wide"
        />
        {accState && (
          <p className="text-[11px] text-bx-muted mt-1">
            Балансовый счёт: <span className="text-bx-text font-mono">{accClean.slice(0, 5)}</span> ·
            код валюты: <span className="text-bx-text font-mono">{accClean.slice(5, 8)}</span>
            {accClean.slice(5, 8) === '000' ? ' (сум)' : ''}
          </p>
        )}
      </div>

      {/* МФО → банк */}
      <div>
        <Field
          label="МФО банка"
          hint={bank ? bank : 'Введите 5 цифр; название банка появится автоматически.'}
          error={mfo.length === 5 && !bank ? 'Банк не найден в справочнике — проверьте МФО на cbu.uz.' : undefined}
          value={mfo}
          onChange={e => setMfo(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="00377"
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          className="text-lg tabular-nums"
        />
      </div>

      {/* Справочник МФО */}
      <div className="rounded-2xl border border-bx-border overflow-hidden">
        <div className="px-4 py-2.5 bg-bx-surface border-b border-bx-border">
          <p className="text-xs font-semibold text-bx-text">Справочник МФО <span className="text-bx-muted font-normal">· клик копирует код</span></p>
        </div>
        <div className="divide-y divide-bx-border/60 max-h-72 overflow-y-auto">
          {Object.entries(BANKS_MFO).map(([code, name]) => (
            <button type="button" key={code} onClick={() => copy(code, code)}
              className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-bx-surface-2">
              <span className={`text-xs font-mono w-14 flex-shrink-0 ${copied === code ? 'text-emerald-400' : 'text-blue-400'}`}>
                {copied === code ? '✓' : code}
              </span>
              <span className="text-xs text-bx-text truncate">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-bx-muted">
        Формат р/с РУз: 20 цифр (5 — балансовый счёт, 3 — код валюты, 12 — лицевой). Полный список МФО — на cbu.uz.
      </p>
    </div>
  );
}
