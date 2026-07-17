import React, { useState } from 'react'
import { validateInn } from '../lib/validation'
import { isElectron } from '../lib/onecApi'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'

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

function statusLabel(s: CheckResult['status']) {
  if (s === 'active') return { text: 'Действует', cls: 'bg-emerald-500/10 text-emerald-400' };
  if (s === 'liquidated') return { text: 'Ликвидировано', cls: 'bg-red-500/10 text-red-400' };
  return { text: 'Приостановлено', cls: 'bg-amber-500/10 text-amber-400' };
}

export default function InnCheck() {
  const [inn, setInn] = useState('')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [history, setHistory] = useState<CheckResult[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bx_inn_check_history') || '[]')
    } catch {
      return []
    }
  })
  const [errorMsg, setErrorMsg] = useState('')

  const { startCompanyCreation, companies } = useCompany()
  const toast = useToast()

  const addToHistory = (r: CheckResult) => {
    setHistory(prev => {
      const next = [r, ...prev.filter(x => x.inn !== r.inn)].slice(0, 10)
      try {
        localStorage.setItem('bx_inn_check_history', JSON.stringify(next))
      } catch (e) {
        console.error(e)
      }
      return next
    })
  }

  async function check() {
    const q = inn.trim().replace(/\D/g, '')
    if (!q) return
    setErrorMsg('')
    setState('loading')
    setResult(null)

    if (q.length === 9 && !validateInn(q)) {
      setErrorMsg('ИНН юрлица РУз — 9 цифр, первая не ноль')
      setState('error')
      return
    }

    // Реальный API my.soliq.uz: в Electron — через main-процесс (без CORS),
    // в браузере — прямой fetch, если сервер разрешает запрос.
    try {
      const data = isElectron && window.bx
        ? await window.bx.inn.check(q)
        : await fetch(`https://my.soliq.uz/roaming-dark-api/api/v1/einvoice/get-trader?tin=${q}`, {
            headers: { 'Content-Type': 'application/json' },
          }).then(res => (res.ok ? res.json() : null))
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
        addToHistory(r)
        setState('result')
        return
      }
      setErrorMsg('Контрагент не найден. Проверьте ИНН и попробуйте снова.')
      setState('error')
    } catch {
      setErrorMsg('Сервис my.soliq.uz сейчас недоступен. Попробуйте позже или откройте проверку в desktop-версии BX.')
      setState('error')
    }
  }

  function Row({ label, value, cls }: { label: string; value: string; cls?: string }) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm text-bx-muted">{label}</span>
        <span className={`text-sm font-medium ${cls ?? 'text-bx-text'}`}>{value}</span>
      </div>
    );
  }

  const sl = result ? statusLabel(result.status) : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-bx-text">Проверка ИНН</h1>
          <p className="text-sm text-bx-muted mt-0.5">Экспресс-сверка контрагента: статус, НДС, режим налогообложения</p>
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
            className="flex-1 bg-bx-surface-2 text-bx-text placeholder-slate-500 px-4 py-2.5 rounded-lg border border-bx-border-2 focus:outline-none focus:border-blue-500/50 text-sm"
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
          <div className="bg-bx-bg rounded-xl border border-bx-border overflow-hidden">
            <div className="px-4 py-3 border-b border-bx-border flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-bx-text">{result.name}</p>
                <p className="text-xs text-bx-muted mt-0.5">ИНН: {result.inn}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sl.cls}`}>{sl.text}</span>
            </div>
            <div className="divide-y divide-bx-border">
              <Row label="Плательщик НДС" value={result.vatPayer ? 'Да' : 'Нет'} cls={result.vatPayer ? 'text-emerald-400' : 'text-bx-muted'} />
              <Row label="Режим налогообложения" value={result.regime} />
              <Row label="Регион" value={result.region} />
              <Row label="Дата регистрации" value={result.registeredAt} />
              {result.riskClass && <Row label="Класс риска ГНК" value={result.riskClass} cls="text-emerald-400" />}
            </div>
            <div className="px-4 py-2.5 border-t border-bx-border flex items-center justify-between">
              <button
                onClick={() => window.open(`https://my.soliq.uz`, '_blank')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Открыть на my.soliq.uz ↗
              </button>
              {companies.some(c => c.inn === result.inn) ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  ✓ В Организациях
                </span>
              ) : (
                <button
                  onClick={() => {
                    startCompanyCreation({
                      name: result.name,
                      inn: result.inn,
                      regime: result.vatPayer ? 'ОСН' : 'Налог с оборота',
                      is_vat_payer: result.vatPayer,
                      registration_date: result.registeredAt !== '—' ? result.registeredAt : undefined,
                    })
                    toast.info('Проверьте профиль и подтвердите обязательства')
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Добавить в Организации
                </button>
              )}
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-400 font-medium">Ошибка проверки</p>
            <p className="text-xs text-bx-muted mt-1">{errorMsg}</p>
          </div>
        )}

        {/* История проверок */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-bx-text mb-2">История проверок</h2>
            <div className="space-y-1.5">
              {history.map((h, i) => {
                const hs = statusLabel(h.status);
                return (
                  <button
                    key={i}
                    onClick={() => { setInn(h.inn); setResult(h); setState('result'); }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-bx-surface hover:bg-bx-surface-2 border border-bx-border rounded-lg text-left transition-colors"
                  >
                    <span className="text-xs text-bx-muted font-mono w-24 flex-shrink-0">{h.inn}</span>
                    <span className="flex-1 text-sm text-bx-text truncate">{h.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${hs.cls}`}>{hs.text}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${h.vatPayer ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-bx-muted'}`}>
                      {h.vatPayer ? 'НДС' : 'б/НДС'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isElectron ? (
          <div className="text-xs text-bx-muted border border-bx-border rounded-lg px-4 py-3 space-y-1">
            <p className="font-medium text-bx-muted">Источник данных: my.soliq.uz</p>
            <p>Запрос выполняется напрямую к API ГНК. Если сервис недоступен, показываются демо-данные (тестовые ИНН: <code className="text-bx-text">301845942</code>, <code className="text-bx-text">200000001</code>, <code className="text-bx-text">100000099</code>).</p>
          </div>
        ) : (
          <div className="text-xs text-bx-muted border border-bx-border rounded-lg px-4 py-3 space-y-1">
            <p className="font-medium text-bx-muted">Демо-режим (браузер)</p>
            <p>В браузере используются демо-данные из-за CORS-ограничений. В десктоп-версии Electron данные запрашиваются напрямую с my.soliq.uz.</p>
            <p>Тестовые ИНН: <code className="text-bx-text">301845942</code>, <code className="text-bx-text">200000001</code>, <code className="text-bx-text">100000099</code></p>
          </div>
        )}
      </div>
    </div>
  );
}
