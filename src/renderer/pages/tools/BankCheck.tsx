import React, { useState } from 'react';
import { validateBankAccount, getBankNameByMfo, BANKS_MFO } from '../../lib/validation';

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
        <label className="block text-xs text-slate-400 mb-1.5">Расчётный счёт (20 цифр)</label>
        <input
          value={account}
          onChange={e => setAccount(e.target.value.replace(/[^\d\s]/g, '').slice(0, 25))}
          placeholder="2020 8000 9001 2345 6789"
          inputMode="numeric"
          autoFocus
          className={`w-full bg-[#0f1117] text-slate-200 text-lg px-4 py-3 rounded-lg border focus:outline-none tabular-nums tracking-wide ${
            accState === null ? 'border-[#2a3447] focus:border-blue-500/50'
            : accState ? 'border-emerald-500/50' : 'border-red-500/50'
          }`}
        />
        {accState !== null && (
          <p className={`text-xs mt-1.5 ${accState ? 'text-emerald-400' : 'text-red-400'}`}>
            {accState
              ? '✓ Формат верный: 20 цифр'
              : `✗ ${accClean.length !== 20 ? `Введено ${accClean.length} из 20 цифр` : 'Неверный формат счёта'}`}
          </p>
        )}
        {accState && (
          <p className="text-[11px] text-slate-500 mt-1">
            Балансовый счёт: <span className="text-slate-300 font-mono">{accClean.slice(0, 5)}</span> ·
            код валюты: <span className="text-slate-300 font-mono">{accClean.slice(5, 8)}</span>
            {accClean.slice(5, 8) === '000' ? ' (сум)' : ''}
          </p>
        )}
      </div>

      {/* МФО → банк */}
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">МФО банка (5 цифр)</label>
        <input
          value={mfo}
          onChange={e => setMfo(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="00377"
          inputMode="numeric"
          className="w-full bg-[#0f1117] text-slate-200 text-lg px-4 py-3 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 tabular-nums"
        />
        {mfo.length === 5 && (
          <p className={`text-xs mt-1.5 ${bank ? 'text-emerald-400' : 'text-amber-400'}`}>
            {bank ? `✓ ${bank}` : '⚠ Банк не найден в справочнике — проверьте МФО на cbu.uz'}
          </p>
        )}
      </div>

      {/* Справочник МФО */}
      <div className="rounded-2xl border border-[#1e2535] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#141820] border-b border-[#1e2535]">
          <p className="text-xs font-semibold text-slate-300">Справочник МФО <span className="text-slate-600 font-normal">· клик копирует код</span></p>
        </div>
        <div className="divide-y divide-[#1e2535]/60 max-h-72 overflow-y-auto">
          {Object.entries(BANKS_MFO).map(([code, name]) => (
            <button key={code} onClick={() => copy(code, code)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#1a2030] text-left transition-colors">
              <span className={`text-xs font-mono w-14 flex-shrink-0 ${copied === code ? 'text-emerald-400' : 'text-blue-400'}`}>
                {copied === code ? '✓' : code}
              </span>
              <span className="text-xs text-slate-300 truncate">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-600">
        Формат р/с РУз: 20 цифр (5 — балансовый счёт, 3 — код валюты, 12 — лицевой). Полный список МФО — на cbu.uz.
      </p>
    </div>
  );
}
