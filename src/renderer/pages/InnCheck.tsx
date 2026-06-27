import React, { useState } from 'react'
import { validateInn } from '../lib/validation'

interface CheckResult {
  inn: string;
  name: string;
  status: 'active' | 'liquidated' | 'suspended';
  vatPayer: boolean;
  regime: string;
  region: string;
  registeredAt: string;
  riskClass?: string;
}

type State = 'idle' | 'loading' | 'result' | 'error';

// Демо-данные для браузерного превью (в Electron можно будет обращаться к API my.soliq.uz)
const DEMO_RESULTS: Record<string, CheckResult> = {
  '301845942': {
    inn: '301845942',
    name: 'ООО "DEMO COMPANY"',
    status: 'active',
    vatPayer: true,
    regime: 'Общеустановленная система (ОСН)',
    region: 'г. Ташкент',
    registeredAt: '2018-03-15',
    riskClass: 'Низкий',
  },
  '200000001': {
    inn: '200000001',
    name: 'ИП Иванов Иван Иванович',
    status: 'active',
    vatPayer: false,
    regime: 'Единый налоговый платёж (ЕНП)',
    region: 'Самаркандская обл.',
    registeredAt: '2021-06-01',
    riskClass: 'Низкий',
  },
  '100000099': {
    inn: '100000099',
    name: 'ООО "ЛИКВИД ТЕСТ"',
    status: 'liquidated',
    vatPayer: false,
    regime: '—',
    region: 'Ташкентская обл.',
    registeredAt: '2010-01-10',
  },
};

function statusLabel(s: CheckResult['status']) {
  if (s === 'active') return { text: 'Действует', cls: 'bg-emerald-500/10 text-emerald-400' };
  if (s === 'liquidated') return { text: 'Ликвидировано', cls: 'bg-red-500/10 text-red-400' };
  return { text: 'Приостановлено', cls: 'bg-amber-500/10 text-amber-400' };
}

export default function InnCheck() {
  const [inn, setInn] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<CheckResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  async function check() {
    const q = inn.trim().replace(/\D/g, '')
    if (!q) return
    setErrorMsg('')
    setState('loading')
    setResult(null)

    if (q.length === 9 && !validateInn(q)) {
      setErrorMsg('Невалидный ИНН Узбекистана (ошибка контрольной цифры)')
      setState('error')
      return
    }

    await new Promise(r => setTimeout(r, 800))

    // Попытка реального API (my.soliq.uz) — в браузере будет CORS, в Electron — нет
    try {
      const res = await fetch(`https://my.soliq.uz/roaming-dark-api/api/v1/einvoice/get-trader?tin=${q}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.name) {
          const r: CheckResult = {
            inn: q,
            name: data.name,
            status: 'active',
            vatPayer: Boolean(data.vatNumber),
            regime: data.regimeName ?? '—',
            region: data.region ?? '—',
            registeredAt: data.registrationDate ?? '—',
          }
          setResult(r)
          setHistory(h => [r, ...h.filter(x => x.inn !== q)].slice(0, 10))
          setState('result')
          return
        }
      }
    } catch {
      // CORS или недоступно — используем демо
    }

    // Демо-данные
    if (DEMO_RESULTS[q]) {
      const r = DEMO_RESULTS[q]
      setResult(r)
      setHistory(h => [r, ...h.filter(x => x.inn !== q)].slice(0, 10))
      setState('result')
    } else {
      setErrorMsg('Контрагент не найден. Проверьте ИНН и попробуйте снова.')
      setState('error')
    }
  }

  function Row({ label, value, cls }: { label: string; value: string; cls?: string }) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-medium ${cls ?? 'text-slate-200'}`}>{value}</span>
      </div>
    );
  }

  const sl = result ? statusLabel(result.status) : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Проверка ИНН</h1>
          <p className="text-sm text-slate-500 mt-0.5">Экспресс-сверка контрагента: статус, НДС, режим налогообложения</p>
        </div>

        {/* Поиск */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={inn}
            onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="Введите ИНН (9 или 12 цифр)"
            className="flex-1 bg-[#1e2535] text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-lg border border-[#2a3447] focus:outline-none focus:border-blue-500/50 text-sm"
          />
          <button
            onClick={check}
            disabled={state === 'loading' || inn.trim().length < 9}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {state === 'loading' ? '...' : 'Проверить'}
          </button>
        </div>

        {/* Результат */}
        {state === 'result' && result && sl && (
          <div className="bg-[#0f1117] rounded-xl border border-[#1e2535] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e2535] flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-white">{result.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">ИНН: {result.inn}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sl.cls}`}>{sl.text}</span>
            </div>
            <div className="divide-y divide-[#1e2535]">
              <Row label="Плательщик НДС" value={result.vatPayer ? 'Да' : 'Нет'} cls={result.vatPayer ? 'text-emerald-400' : 'text-slate-400'} />
              <Row label="Режим налогообложения" value={result.regime} />
              <Row label="Регион" value={result.region} />
              <Row label="Дата регистрации" value={result.registeredAt} />
              {result.riskClass && <Row label="Класс риска ГНК" value={result.riskClass} cls="text-emerald-400" />}
            </div>
            <div className="px-4 py-2.5 border-t border-[#1e2535]">
              <button
                onClick={() => window.open(`https://my.soliq.uz`, '_blank')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Открыть на my.soliq.uz ↗
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-400 font-medium">Ошибка проверки</p>
            <p className="text-xs text-slate-400 mt-1">{errorMsg}</p>
          </div>
        )}

        {/* История проверок */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">История проверок</h2>
            <div className="space-y-1.5">
              {history.map((h, i) => {
                const hs = statusLabel(h.status);
                return (
                  <button
                    key={i}
                    onClick={() => { setInn(h.inn); setResult(h); setState('result'); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-[#141820] hover:bg-[#1e2535] border border-[#1e2535] rounded-lg text-left transition-colors"
                  >
                    <span className="text-xs text-slate-600 font-mono w-24 flex-shrink-0">{h.inn}</span>
                    <span className="flex-1 text-sm text-slate-300 truncate">{h.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${hs.cls}`}>{hs.text}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.vatPayer ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {h.vatPayer ? 'НДС' : 'б/НДС'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-600 border border-[#1e2535] rounded-lg px-4 py-3 space-y-1">
          <p className="font-medium text-slate-400">Демо-режим (браузер)</p>
          <p>В браузере используются демо-данные из-за CORS-ограничений. В десктоп-версии Electron данные запрашиваются напрямую с my.soliq.uz.</p>
          <p>Тестовые ИНН: <code className="text-slate-300">301845942</code>, <code className="text-slate-300">200000001</code>, <code className="text-slate-300">100000099</code></p>
        </div>
      </div>
    </div>
  );
}
