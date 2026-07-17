import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BankExchangeRate, CurrencyRate } from '../../shared/types'
import { todayISO } from '../lib/dates'
import Icon from '../lib/ui/Icon'
import { widgetsApi } from '../lib/widgetsApi'

const CORE_CODES = ['USD', 'EUR', 'RUB'] as const
const EXTRA_CURRENCIES = [
  { code: 'GBP', name: 'Фунт стерлингов' },
  { code: 'CNY', name: 'Китайский юань' },
  { code: 'CHF', name: 'Швейцарский франк' },
  { code: 'JPY', name: 'Японская иена' },
  { code: 'KZT', name: 'Казахстанский тенге' },
  { code: 'AED', name: 'Дирхам ОАЭ' },
  { code: 'TRY', name: 'Турецкая лира' },
  { code: 'KRW', name: 'Вона Республики Корея' },
  { code: 'CAD', name: 'Канадский доллар' },
  { code: 'AUD', name: 'Австралийский доллар' },
] as const
const ALL_CODES = ['UZS', ...CORE_CODES, ...EXTRA_CURRENCIES.map(item => item.code)] as const
type CurrencyCode = typeof ALL_CODES[number]
type ForeignCode = Exclude<CurrencyCode, 'UZS'>

export interface CurrencyExportRow { requestedDate: string; rate: CurrencyRate }

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode, rates: Record<string, number>) {
  if (!Number.isFinite(amount)) return 0
  const source = from === 'UZS' ? 1 : rates[from] || 0
  const target = to === 'UZS' ? 1 : rates[to] || 0
  return source && target ? amount * source / target : 0
}

export function enumerateDates(from: string, to: string) {
  if (!from || !to || from > to) return []
  const dates: string[] = []
  const cursor = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  while (cursor <= end && dates.length < 32) { dates.push(localISO(cursor)); cursor.setDate(cursor.getDate() + 1) }
  return dates
}

export function buildCurrencyCsv(rows: CurrencyExportRow[]) {
  const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  const lines = [['Запрошенная дата', 'Дата действия курса', 'Код', 'Наименование', 'Курс, сум', 'Изменение']]
  rows.forEach(({ requestedDate, rate }) => lines.push([requestedDate, rate.date, rate.code, rate.name, rate.value.toFixed(4).replace('.', ','), rate.diff.toFixed(4).replace('.', ',')]))
  return `\uFEFF${lines.map(line => line.map(quote).join(';')).join('\r\n')}`
}

export function findBestBankRates(rates: BankExchangeRate[], code: string) {
  const available = rates.filter(rate => rate.code === code && rate.buy > 0 && rate.sell > 0)
  return {
    bestBuy: available.reduce<BankExchangeRate | null>((best, rate) => !best || rate.buy > best.buy ? rate : best, null),
    bestSell: available.reduce<BankExchangeRate | null>((best, rate) => !best || rate.sell < best.sell ? rate : best, null),
  }
}

export function filterBankRates(rates: BankExchangeRate[], selectedBankIds: string[]) {
  return selectedBankIds.length ? rates.filter(rate => selectedBankIds.includes(rate.bankId)) : rates
}

function localISO(date: Date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}` }
function daysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return localISO(date) }

export default function Currency() {
  const today = todayISO()
  const [extraCodes, setExtraCodes] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('bx_currency_extra_codes') || '[]') } catch { return [] } })
  const selectedCodes = useMemo(() => [...CORE_CODES, ...extraCodes] as ForeignCode[], [extraCodes])
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState<CurrencyCode>('USD')
  const [to, setTo] = useState<CurrencyCode>('UZS')
  const [chartCode, setChartCode] = useState<ForeignCode>('USD')
  const [period, setPeriod] = useState(14)
  const [history, setHistory] = useState<CurrencyRate[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [exactDate, setExactDate] = useState(today)
  const [exactRates, setExactRates] = useState<CurrencyRate[]>([])
  const [exactLoading, setExactLoading] = useState(false)
  const [exactError, setExactError] = useState('')
  const [rangeFrom, setRangeFrom] = useState(daysAgo(6))
  const [rangeTo, setRangeTo] = useState(today)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ done: 0, total: 0 })
  const [exportError, setExportError] = useState('')
  const [exportSuccess, setExportSuccess] = useState(false)
  const [bankCode, setBankCode] = useState<ForeignCode>('USD')
  const [bankRates, setBankRates] = useState<BankExchangeRate[]>([])
  const [bankLoading, setBankLoading] = useState(true)
  const [bankError, setBankError] = useState('')
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([])
  const bankRequestId = useRef(0)

  const load = useCallback(() => {
    setLoading(true); setError(false)
    widgetsApi.getRates(selectedCodes).then(setRates).catch(() => setError(true)).finally(() => setLoading(false))
  }, [selectedCodes])
  useEffect(load, [load])

  const loadBankRates = useCallback(() => {
    const requestId = ++bankRequestId.current
    setBankLoading(true); setBankError('')
    widgetsApi.getBankRates(selectedCodes)
      .then(items => { if (requestId === bankRequestId.current) setBankRates(items) })
      .catch(() => {
        if (requestId !== bankRequestId.current) return
        setBankRates([])
        setBankError('Официальные страницы банков сейчас не ответили. Повторите обновление позже.')
      })
      .finally(() => { if (requestId === bankRequestId.current) setBankLoading(false) })
  }, [selectedCodes])
  useEffect(loadBankRates, [loadBankRates])

  useEffect(() => {
    let active = true
    setHistoryLoading(true)
    Promise.all(Array.from({ length: period }, (_, index) => widgetsApi.getRateOnDate(chartCode, daysAgo(period - 1 - index))))
      .then(items => { if (active) setHistory(items.filter((item): item is CurrencyRate => Boolean(item))) })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [chartCode, period])

  const rateMap = useMemo(() => Object.fromEntries(rates.map(rate => [rate.code, rate.value])), [rates])
  const converterCodes = useMemo(() => ['UZS', ...selectedCodes] as CurrencyCode[], [selectedCodes])
  const converted = convertCurrency(Number(amount.replace(',', '.')), from, to, rateMap)
  const availableBanks = useMemo(() => Array.from(new Map(bankRates.map(rate => [rate.bankId, rate.bankName])).entries()).map(([id, name]) => ({ id, name })), [bankRates])
  const filteredBankRates = useMemo(() => filterBankRates(bankRates, selectedBankIds), [bankRates, selectedBankIds])
  const bankComparison = useMemo(() => findBestBankRates(filteredBankRates, bankCode), [filteredBankRates, bankCode])
  const visibleBankRates = useMemo(() => filteredBankRates.filter(rate => rate.code === bankCode), [filteredBankRates, bankCode])

  const toggleBank = (bankId: string) => {
    setSelectedBankIds(current => current.includes(bankId) ? current.filter(id => id !== bankId) : [...current, bankId])
  }

  const toggleExtra = (code: string) => {
    const next = extraCodes.includes(code) ? extraCodes.filter(item => item !== code) : [...extraCodes, code]
    setExtraCodes(next)
    localStorage.setItem('bx_currency_extra_codes', JSON.stringify(next))
    if (!next.includes(chartCode) && !CORE_CODES.includes(chartCode as typeof CORE_CODES[number])) setChartCode('USD')
    if (!next.includes(from) && !CORE_CODES.includes(from as typeof CORE_CODES[number]) && from !== 'UZS') setFrom('USD')
    if (!next.includes(to) && !CORE_CODES.includes(to as typeof CORE_CODES[number]) && to !== 'UZS') setTo('UZS')
  }

  const loadExactDate = async () => {
    setExactLoading(true); setExactError('')
    try { const result = await widgetsApi.getRatesOnDate(selectedCodes, exactDate); setExactRates(result); if (!result.length) setExactError('На выбранную дату курсы не найдены.') }
    catch { setExactError('Не удалось получить архив ЦБ РУз. Попробуйте ещё раз.') }
    finally { setExactLoading(false) }
  }

  const exportRange = async () => {
    const dates = enumerateDates(rangeFrom, rangeTo)
    if (!dates.length) { setExportError('Проверьте даты: начало должно быть раньше окончания.'); return }
    if (dates.length > 31) { setExportError('Один файл может охватывать не более 31 календарного дня.'); return }
    setExporting(true); setExportError(''); setExportSuccess(false); setExportProgress({ done: 0, total: dates.length })
    try {
      const rows: CurrencyExportRow[] = []
      for (let start = 0; start < dates.length; start += 5) {
        const batch = dates.slice(start, start + 5)
        const results = await Promise.all(batch.map(date => widgetsApi.getRatesOnDate(selectedCodes, date)))
        results.forEach((items, index) => items.forEach(rate => rows.push({ requestedDate: batch[index], rate })))
        setExportProgress({ done: Math.min(start + batch.length, dates.length), total: dates.length })
      }
      if (!rows.length) throw new Error('empty')
      downloadCsv(buildCurrencyCsv(rows), `BX_Курсы_${rangeFrom}_${rangeTo}.csv`)
      setExportSuccess(true)
    } catch { setExportError('Не удалось подготовить файл. Проверьте интернет и повторите.') }
    finally { setExporting(false) }
  }

  return (
    <main className="z-10 flex-1 overflow-y-auto bg-bx-bg px-5 py-5 text-bx-text sm:px-6">
      <div className="bx-page-container space-y-4">
        <header className="relative overflow-hidden rounded-[28px] border border-bx-border bg-gradient-to-r from-blue-600/[0.10] via-bx-surface to-cyan-500/[0.07] p-6 shadow-sm">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Финансовый инструмент</p><h1 className="mt-2 text-3xl font-black tracking-tight text-bx-text">Курсы валют</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-bx-muted">Курс ЦБ РУз, официальные предложения банков, архивная динамика и выгрузка периода в Excel-совместимый CSV.</p></div><button onClick={() => { load(); loadBankRates() }} className="flex min-h-11 items-center gap-2 rounded-xl border border-bx-border bg-bx-surface px-4 text-xs font-bold text-bx-text hover:border-blue-500/30"><Icon name="recycle" className="h-4 w-4" />Обновить всё</button></div>
        </header>

        <section className="rounded-[24px] border border-bx-border bg-bx-surface p-4 shadow-sm" aria-labelledby="currency-selection-title">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="lg:w-52"><p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Валютная лента</p><h2 id="currency-selection-title" className="mt-1 text-sm font-black text-bx-text">Основные + на выбор</h2><p className="mt-1 text-[9px] text-bx-muted">USD, EUR и RUB закреплены всегда.</p></div><div className="flex flex-1 flex-wrap gap-2">{EXTRA_CURRENCIES.map(item => { const chosen = extraCodes.includes(item.code); return <button key={item.code} onClick={() => toggleExtra(item.code)} aria-pressed={chosen} title={item.name} className={`min-h-10 rounded-xl border px-3 text-[10px] font-extrabold transition-colors ${chosen ? 'border-blue-500/30 bg-blue-600 text-white' : 'border-bx-border bg-bx-bg text-bx-muted hover:border-blue-500/30 hover:text-bx-text'}`}>{item.code}<span className="ml-1.5 font-medium opacity-75">{chosen ? 'выбрана' : '+'}</span></button> })}</div></div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Текущие курсы">
          {loading ? Array.from({ length: selectedCodes.length }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[22px] bg-bx-surface" />) : error ? <button onClick={load} className="col-span-full rounded-[22px] border border-dashed border-bx-border bg-bx-surface py-10 text-sm font-bold text-bx-muted">Курсы не загрузились · Повторить</button> : rates.map(rate => <RateCard key={rate.code} rate={rate} />)}
        </section>

        <section className="overflow-hidden rounded-[24px] border border-bx-border bg-bx-surface shadow-sm" aria-labelledby="bank-rates-title">
          <div className="border-b border-bx-border bg-gradient-to-r from-emerald-500/[0.08] via-bx-surface to-blue-500/[0.06] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Официальные страницы банков</p><h2 id="bank-rates-title" className="mt-1 text-lg font-black text-bx-text">Где выгоднее купить или продать валюту</h2><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-bx-muted">«Покупка» — банк покупает валюту у вас: выгоднее максимальный курс. «Продажа» — вы покупаете валюту у банка: выгоднее минимальный курс.</p></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Валюта для сравнения банков">{selectedCodes.map(code => <button key={code} onClick={() => setBankCode(code)} aria-pressed={bankCode === code} className={`min-h-10 rounded-xl px-3 text-[10px] font-black transition-colors ${bankCode === code ? 'bg-emerald-600 text-white' : 'border border-bx-border bg-bx-bg text-bx-muted hover:text-bx-text'}`}>{code}</button>)}</div>
            </div>
          </div>
          <div className="p-5">
            {!bankLoading && !bankError && availableBanks.length > 0 && <div className="mb-4 rounded-2xl border border-bx-border bg-bx-bg p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="min-w-36"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-bx-muted">Показывать банки</p><p className="mt-1 text-[9px] text-bx-muted">Можно выбрать несколько</p></div><div className="flex flex-1 flex-wrap gap-2" role="group" aria-label="Фильтр банков"><button onClick={() => setSelectedBankIds([])} aria-pressed={selectedBankIds.length === 0} className={`min-h-11 rounded-xl border px-3 text-[10px] font-black transition-colors ${selectedBankIds.length === 0 ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-bx-border bg-bx-surface text-bx-muted hover:border-emerald-500/30 hover:text-bx-text'}`}>Все банки</button>{availableBanks.map(bank => { const selected = selectedBankIds.includes(bank.id); return <button key={bank.id} onClick={() => toggleBank(bank.id)} aria-pressed={selected} className={`min-h-11 rounded-xl border px-3 text-[10px] font-black transition-colors ${selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-bx-border bg-bx-surface text-bx-muted hover:border-emerald-500/30 hover:text-bx-text'}`}>{bank.name}</button> })}</div>{selectedBankIds.length > 0 && <button onClick={() => setSelectedBankIds([])} className="min-h-11 self-start rounded-xl px-3 text-[10px] font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300 lg:self-center">Сбросить</button>}</div></div>}
            {bankLoading ? <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-bx-bg" />)}</div> : bankError ? <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/[0.08] p-5"><p role="alert" className="text-xs font-bold text-amber-800 dark:text-amber-200">{bankError}</p><button onClick={loadBankRates} className="mt-3 min-h-10 rounded-xl bg-amber-600 px-4 text-[10px] font-black text-white">Повторить</button></div> : visibleBankRates.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleBankRates.map(rate => {
              const bestBuy = bankComparison.bestBuy?.bankId === rate.bankId
              const bestSell = bankComparison.bestSell?.bankId === rate.bankId
              return <article key={`${rate.bankId}-${rate.code}`} className={`rounded-2xl border p-4 ${bestBuy || bestSell ? 'border-emerald-500/30 bg-emerald-500/[0.045]' : 'border-bx-border bg-bx-bg'}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-bx-text">{rate.bankName}</h3><p className="mt-1 text-[9px] text-bx-muted">{rate.updatedAt ? `Обновлено: ${formatBankUpdatedAt(rate.updatedAt)}` : 'Получено с официальной страницы'}</p></div><a href={rate.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-bx-border bg-bx-surface px-2.5 text-[9px] font-bold text-blue-600 dark:text-blue-300">Источник <Icon name="external" className="h-3 w-3" /></a></div><div className="mt-4 grid grid-cols-2 gap-2"><BankValue label="Банк покупает" value={rate.buy} highlighted={bestBuy} badge="Лучший курс" /><BankValue label="Банк продаёт" value={rate.sell} highlighted={bestSell} badge="Самая низкая цена" /></div><p className="mt-3 text-[9px] text-bx-muted">Разница покупки и продажи: <b className="tabular-nums text-bx-text">{formatRate(rate.sell - rate.buy)} сум</b></p></article>
            })}</div> : <div className="rounded-2xl border border-dashed border-bx-border px-4 py-8 text-center"><p className="text-xs font-bold text-bx-text">Для {bankCode} по выбранным банкам нет сравнимых курсов.</p><p className="mt-1 text-[10px] text-bx-muted">Выберите другие банки или верните фильтр «Все банки».</p>{selectedBankIds.length > 0 && <button onClick={() => setSelectedBankIds([])} className="mt-3 min-h-10 rounded-xl bg-emerald-600 px-4 text-[10px] font-black text-white">Показать все банки</button>}</div>}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm">
            <ToolHeader icon="planner" tone="blue" eyebrow="Архив ЦБ РУз" title="Курс на точную дату" />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"><DateField label="Дата курса" value={exactDate} onChange={setExactDate} max={today} /><button onClick={loadExactDate} disabled={exactLoading} className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white disabled:opacity-50">{exactLoading ? 'Получаем…' : 'Показать курс'}</button></div>
            {exactError && <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 p-3 text-[10px] font-bold text-rose-700 dark:text-rose-300">{exactError}</p>}
            {exactRates.length > 0 && <div className="mt-4 overflow-hidden rounded-2xl border border-bx-border"><div className="grid grid-cols-[70px_1fr_auto] gap-3 bg-bx-bg px-3 py-2 text-[8px] font-extrabold uppercase tracking-wide text-bx-muted"><span>Валюта</span><span>Действует с</span><span>Курс</span></div>{exactRates.map(rate => <div key={rate.code} className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-t border-bx-border px-3 py-2.5"><span className="text-xs font-black text-bx-text">{rate.code}</span><span className="text-[10px] text-bx-muted">{rate.date}</span><span className="text-xs font-black tabular-nums text-bx-text">{formatRate(rate.value)} сум</span></div>)}</div>}
            {!exactRates.length && !exactLoading && !exactError && <p className="mt-4 rounded-2xl border border-dashed border-bx-border py-6 text-center text-[10px] text-bx-muted">Выберите дату — здесь появится точный курс всех отмеченных валют.</p>}
          </article>

          <article className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm">
            <ToolHeader icon="download" tone="emerald" eyebrow="Excel-совместимый CSV" title="Выгрузка курсов за период" />
            <div className="mt-4 grid gap-2 sm:grid-cols-2"><DateField label="С даты" value={rangeFrom} onChange={setRangeFrom} max={rangeTo || today} /><DateField label="По дату" value={rangeTo} onChange={setRangeTo} min={rangeFrom} max={today} /></div>
            <div className="mt-3 rounded-xl bg-bx-bg p-3 text-[9px] leading-relaxed text-bx-muted"><b className="text-bx-text">В файл попадут:</b> {selectedCodes.join(', ')}. Период — не более 31 дня, как в официальном архиве ЦБ РУз.</div>
            {exportError && <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 p-3 text-[10px] font-bold text-rose-700 dark:text-rose-300">{exportError}</p>}
            {exportSuccess && !exporting && <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"><Icon name="check" className="h-4 w-4" />Файл сформирован и передан в загрузки.</p>}
            {exporting && <div className="mt-3"><div className="flex justify-between text-[9px] font-bold text-bx-muted"><span>Подготовка архива</span><span>{exportProgress.done} / {exportProgress.total} дней</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bx-bg"><div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${exportProgress.total ? exportProgress.done / exportProgress.total * 100 : 0}%` }} /></div></div>}
            <button onClick={exportRange} disabled={exporting} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="download" className="h-4 w-4" />{exporting ? 'Формируем файл…' : 'Выгрузить CSV'}</button>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <article className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm xl:col-span-2"><ToolHeader icon="exchange" tone="blue" eyebrow="Быстрый расчёт" title="Конвертер" /><label className="mt-5 block text-[9px] font-bold uppercase tracking-wide text-bx-muted">Сумма<input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" className="mt-2 h-12 w-full rounded-xl border border-bx-border bg-bx-bg px-4 text-lg font-black tabular-nums text-bx-text outline-none focus:border-blue-500" /></label><div className="mt-3 grid grid-cols-[1fr_42px_1fr] items-end gap-2"><CurrencySelect label="Из" value={from} codes={converterCodes} onChange={setFrom} /><button onClick={() => { setFrom(to); setTo(from) }} className="grid h-11 place-items-center rounded-xl border border-bx-border bg-bx-bg text-blue-600 dark:text-blue-300" title="Поменять валюты местами" aria-label="Поменять валюты местами"><Icon name="exchange" className="h-4 w-4" /></button><CurrencySelect label="В" value={to} codes={converterCodes} onChange={setTo} /></div><div className="mt-5 rounded-2xl bg-blue-600 p-4 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-blue-100">Результат</p><p className="mt-1 text-2xl font-black tabular-nums">{converted.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} <span className="text-sm">{to}</span></p></div></article>
          <article className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm xl:col-span-3"><div className="flex flex-wrap items-center gap-2"><div className="mr-auto"><p className="text-[9px] font-extrabold uppercase tracking-wide text-violet-600 dark:text-violet-300">Динамика</p><h2 className="text-sm font-black text-bx-text">История курса</h2></div>{selectedCodes.map(code => <button key={code} onClick={() => setChartCode(code)} className={`min-h-9 rounded-xl px-3 text-[10px] font-bold ${chartCode === code ? 'bg-blue-600 text-white' : 'bg-bx-bg text-bx-muted'}`}>{code}</button>)}<select aria-label="Период истории" value={period} onChange={event => setPeriod(Number(event.target.value))} className="h-9 rounded-xl border border-bx-border bg-bx-bg px-2 text-[10px] font-bold text-bx-text"><option value={7}>7 дней</option><option value={14}>14 дней</option><option value={30}>30 дней</option></select></div><div className="mt-5 min-h-[260px] rounded-2xl border border-bx-border/60 bg-bx-bg p-4">{historyLoading ? <div className="h-[220px] animate-pulse rounded-xl bg-bx-surface" /> : <RateChart values={history} />}</div><p className="mt-3 text-[9px] leading-relaxed text-bx-muted">Официальный источник: Центральный банк Республики Узбекистан. Для проводки всегда сверяйте дату активизации курса.</p></article>
        </section>
      </div>
    </main>
  )
}

function downloadCsv(content: string, filename: string) { const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url) }
function formatRate(value: number) { return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }
function formatBankUpdatedAt(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function BankValue({ label, value, highlighted, badge }: { label: string; value: number; highlighted: boolean; badge: string }) { return <div className={`rounded-xl border p-3 ${highlighted ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-bx-border bg-bx-surface'}`}><p className="text-[8px] font-black uppercase tracking-wide text-bx-muted">{label}</p><p className="mt-1 text-lg font-black tabular-nums text-bx-text">{formatRate(value)}</p>{highlighted && <p className="mt-1 text-[8px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{badge}</p>}</div> }
function RateCard({ rate }: { rate: CurrencyRate }) { return <article className="rounded-[22px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-xs font-black text-blue-600 dark:text-blue-300">{rate.code}</span><span className={`rounded-lg px-2 py-1 text-[9px] font-bold ${rate.diff >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'}`}>{rate.diff >= 0 ? '+' : '−'}{Math.abs(rate.diff).toFixed(2)}</span></div><p className="mt-4 text-2xl font-black tabular-nums text-bx-text">{formatRate(rate.value)} <span className="text-xs text-bx-muted">сум</span></p><p className="mt-1 text-[10px] text-bx-muted">{rate.name}</p></article> }
function ToolHeader({ icon, tone, eyebrow, title }: { icon: string; tone: 'blue' | 'emerald'; eyebrow: string; title: string }) { const style = tone === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'; return <div className="flex items-center gap-2.5"><span className={`grid h-9 w-9 place-items-center rounded-xl ${style}`}><Icon name={icon} className="h-4 w-4" /></span><div><p className={`text-[9px] font-extrabold uppercase tracking-wide ${tone === 'blue' ? 'text-blue-600 dark:text-blue-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{eyebrow}</p><h2 className="text-sm font-black text-bx-text">{title}</h2></div></div> }
function DateField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) { return <label className="block flex-1 text-[9px] font-bold uppercase tracking-wide text-bx-muted">{label}<input type="date" value={value} min={min} max={max} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-bold text-bx-text outline-none focus:border-blue-500" /></label> }
function CurrencySelect({ label, value, codes, onChange }: { label: string; value: CurrencyCode; codes: CurrencyCode[]; onChange: (value: CurrencyCode) => void }) { return <label className="text-[9px] font-bold uppercase tracking-wide text-bx-muted">{label}<select value={value} onChange={event => onChange(event.target.value as CurrencyCode)} className="mt-2 h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-black text-bx-text">{codes.map(code => <option key={code}>{code}</option>)}</select></label> }

function RateChart({ values }: { values: CurrencyRate[] }) {
  if (values.length < 2) return <div className="grid h-[220px] place-items-center text-xs text-bx-muted">Недостаточно исторических данных</div>
  const width = 620, height = 210, padding = 20
  const min = Math.min(...values.map(item => item.value)), max = Math.max(...values.map(item => item.value)), range = max - min || 1
  const points = values.map((item, index) => `${padding + index * (width - padding * 2) / (values.length - 1)},${height - padding - (item.value - min) / range * (height - padding * 2)}`).join(' ')
  return <div><svg viewBox={`0 0 ${width} ${height}`} className="h-[210px] w-full" role="img" aria-label={`Курс от ${min.toFixed(2)} до ${max.toFixed(2)}`}><defs><linearGradient id="rate-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".22" /><stop offset="1" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs><path d={`M ${points.split(' ').join(' L ')} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#rate-fill)" /><polyline points={points} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="flex justify-between text-[9px] font-bold text-bx-muted"><span>{values[0].date}</span><span>Мин. {formatRate(min)} · Макс. {formatRate(max)}</span><span>{values.at(-1)?.date}</span></div></div>
}
