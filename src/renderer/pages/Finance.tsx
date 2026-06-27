import React, { useState, useMemo, useRef } from 'react'
import { useTransactions, type BxTransaction, type NewTransaction } from './finance/useTransactions'
import TxModal from './finance/TxModal'
import ImportModal from './finance/ImportModal'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { exportTransactionsToExcel } from '../lib/excelExport'
import { parseBankStatement, type ParsedTransaction } from '../lib/bankStatementParser'
import { useExchangeRates } from '../lib/useExchangeRates'

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n))
}
function monthKey(d: string): string { return d.slice(0, 7) }
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']

export default function Finance() {
  const { active } = useCompany()
  const { transactions, add, update, remove, syncStatus } = useTransactions(active?.id ?? null)
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const nowMonth = new Date().toISOString().slice(0, 7)
  const [period, setPeriod] = useState(nowMonth)     // YYYY-MM
  const [allTime, setAllTime] = useState(false)
  const [typeF, setTypeF] = useState<'' | 'income' | 'expense'>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importTxs, setImportTxs] = useState<ParsedTransaction[]>([])
  const [editing, setEditing] = useState<BxTransaction | null>(null)
  const [defType, setDefType] = useState<'income' | 'expense'>('income')
  const { convert } = useExchangeRates()
  const [displayCurrency, setDisplayCurrency] = useState('UZS')

  // Транзакции выбранного периода
  const periodTx = useMemo(() => {
    return transactions.filter(t => allTime || monthKey(t.date) === period)
  }, [transactions, period, allTime])

  // Сводка периода (учитываем только оплаченные в P&L) с мультивалютным пересчетом
  const stats = useMemo(() => {
    let income = 0, expense = 0
    for (const t of periodTx) {
      if (t.status !== 'paid') continue
      const amt = convert(t.amount, t.currency || 'UZS', displayCurrency)
      if (t.type === 'income') income += amt; else expense += amt
    }
    return { income, expense, profit: income - expense }
  }, [periodTx, displayCurrency, convert])

  // Дебиторка / кредиторка — все неоплаченные (по всему периоду) с мультивалютным пересчетом
  const debts = useMemo(() => {
    let receivable = 0, payable = 0
    for (const t of transactions) {
      if (t.status !== 'unpaid') continue
      const amt = convert(t.amount, t.currency || 'UZS', displayCurrency)
      if (t.type === 'income') receivable += amt; else payable += amt
    }
    return { receivable, payable }
  }, [transactions, displayCurrency, convert])

  // График: последние 6 месяцев (доход/расход, оплаченные)
  const chart = useMemo(() => {
    const base = allTime ? new Date() : new Date(period + '-01T00:00:00')
    const months: { key: string; label: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      months.push({ key: d.toISOString().slice(0,7), label: MONTHS_SHORT[d.getMonth()], income: 0, expense: 0 })
    }
    for (const t of transactions) {
      if (t.status !== 'paid') continue
      const m = months.find(x => x.key === monthKey(t.date))
      if (m) { if (t.type === 'income') m.income += t.amount; else m.expense += t.amount }
    }
    const max = Math.max(1, ...months.flatMap(m => [m.income, m.expense]))
    return { months, max }
  }, [transactions, period, allTime])

  // Разбивка расходов по категориям за период с мультивалютным пересчетом
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of periodTx) {
      if (t.type !== 'expense' || t.status !== 'paid') continue
      const amt = convert(t.amount, t.currency || 'UZS', displayCurrency)
      const c = t.category || 'Без категории'
      map.set(c, (map.get(c) || 0) + amt)
    }
    const arr = [...map.entries()].map(([cat, sum]) => ({ cat, sum })).sort((a, b) => b.sum - a.sum)
    const total = arr.reduce((s, x) => s + x.sum, 0)
    return { arr: arr.slice(0, 6), total }
  }, [periodTx, displayCurrency, convert])

  const listTx = useMemo(() => typeF ? periodTx.filter(t => t.type === typeF) : periodTx, [periodTx, typeF])

  function openNew(type: 'income' | 'expense') { setEditing(null); setDefType(type); setModalOpen(true); }
  function openEdit(t: BxTransaction) { setEditing(t); setModalOpen(true); }
  async function handleSave(data: NewTransaction) {
    if (editing) await update(editing.id, data); else await add(data)
    toast.success(editing ? 'Операция обновлена' : 'Операция добавлена')
    setModalOpen(false); setEditing(null)
  }
  async function handleDelete() { if (editing) await remove(editing.id); toast.info('Операция удалена'); setModalOpen(false); setEditing(null) }

  // Экспорт в Excel
  const handleExport = () => {
    if (listTx.length === 0) {
      toast.info('Нет данных для экспорта')
      return
    }
    const suffix = allTime ? 'все_время' : period
    exportTransactionsToExcel(listTx, `Транзакции_${active?.name || 'компания'}_${suffix}`)
    toast.success('Таблица экспортирована в Excel')
  }

  // Импорт выписки
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      try {
        const parsed = parseBankStatement(text, active?.inn || null)
        if (parsed.length === 0) {
          toast.error('Не удалось распознать операции в файле')
          return
        }
        setImportTxs(parsed)
        setImportOpen(true)
      } catch (err) {
        console.error(err)
        toast.error('Ошибка при чтении выписки')
      }
    }
    reader.readAsText(file, 'utf-8') // Или CP1251, если кодировка не UTF
    e.target.value = '' // Сброс
  }

  const handleSaveImported = async (selected: ParsedTransaction[]) => {
    let successCount = 0
    for (const tx of selected) {
      const result = await add({
        company_id: active?.id ?? null,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        category: tx.category || 'Поступление от клиента',
        counterparty: tx.counterparty,
        description: tx.description,
        status: tx.status
      })
      if (result) successCount++
    }
    toast.success(`Импортировано операций: ${successCount}`)
  }

  const CAT_COLORS = ['bg-blue-500','bg-purple-500','bg-amber-500','bg-pink-500','bg-cyan-500','bg-slate-500']

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Скрытый input для выбора файла */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".txt" 
        className="hidden" 
      />

      {/* Шапка */}
      <div className="flex-shrink-0 border-b border-[#1e2535] px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-white">Финансы</h1>
          {!allTime ? (
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-[#0f1117] text-slate-200 text-xs px-2 py-1 rounded-lg border border-[#2a3447] focus:outline-none" />
          ) : <span className="text-xs text-slate-500">за всё время</span>}
          <button onClick={() => setAllTime(v => !v)}
            className={`text-[11px] px-2 py-1 rounded-lg transition-colors ${allTime ? 'bg-blue-600/25 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
            {allTime ? 'по месяцам' : 'всё время'}
          </button>
          <select
            value={displayCurrency}
            onChange={e => setDisplayCurrency(e.target.value)}
            className="bg-[#0f1117] text-slate-200 text-xs px-2 py-1 rounded-lg border border-[#2a3447] focus:outline-none"
          >
            <option value="UZS">UZS (сум)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="RUB">RUB (₽)</option>
          </select>
          {syncStatus && (
            <span className="text-[10px] text-slate-500 bg-[#1e2535] px-2 py-0.5 rounded-full">
              {syncStatus}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleImportClick} className="px-3 py-1.5 border border-[#2a3447] text-slate-300 hover:text-white text-xs font-medium rounded-lg bg-[#141820] hover:bg-[#1e2535] transition-colors">
            Импорт выписки
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 border border-[#2a3447] text-slate-300 hover:text-white text-xs font-medium rounded-lg bg-[#141820] hover:bg-[#1e2535] transition-colors">
            Экспорт в Excel
          </button>
          <button onClick={() => openNew('income')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg">+ Доход</button>
          <button onClick={() => openNew('expense')} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg">+ Расход</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Карточки */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Доходы" value={fmt(stats.income)} color="text-emerald-400" currency={displayCurrency} />
            <StatCard label="Расходы" value={fmt(stats.expense)} color="text-red-400" currency={displayCurrency} />
            <StatCard label="Прибыль" value={fmt(stats.profit)} color={stats.profit >= 0 ? 'text-blue-400' : 'text-red-400'} currency={displayCurrency} big />
            <StatCard label="Дебиторка" value={fmt(debts.receivable)} color="text-amber-400" currency={displayCurrency} hint="нам должны" />
            <StatCard label="Кредиторка" value={fmt(debts.payable)} color="text-orange-400" currency={displayCurrency} hint="мы должны" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* График по месяцам */}
            <div className="bg-[#141820] border border-[#1e2535] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Доходы и расходы · 6 мес.</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {chart.months.map(m => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="flex items-end gap-0.5 h-full w-full justify-center">
                      <div className="w-2.5 bg-emerald-500/80 rounded-t" style={{ height: `${(m.income / chart.max) * 100}%` }} title={`Доход: ${fmt(m.income)}`} />
                      <div className="w-2.5 bg-red-500/80 rounded-t" style={{ height: `${(m.expense / chart.max) * 100}%` }} title={`Расход: ${fmt(m.expense)}`} />
                    </div>
                    <span className="text-[10px] text-slate-600">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm" />Доход</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm" />Расход</span>
              </div>
            </div>

            {/* Разбивка расходов */}
            <div className="bg-[#141820] border border-[#1e2535] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Расходы по категориям</h3>
              {byCategory.arr.length === 0 ? (
                <p className="text-xs text-slate-600 py-8 text-center">Нет расходов за период</p>
              ) : (
                <div className="space-y-2.5">
                  {byCategory.arr.map((c, i) => {
                    const pct = byCategory.total ? Math.round(c.sum / byCategory.total * 100) : 0
                    return (
                      <div key={c.cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{c.cat}</span>
                          <span className="text-slate-500">{fmt(c.sum)} · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                          <div className={`h-full ${CAT_COLORS[i % CAT_COLORS.length]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Таблица операций */}
          <div className="bg-[#141820] border border-[#1e2535] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2535]">
              <h3 className="text-sm font-semibold text-white">Операции ({listTx.length})</h3>
              <div className="flex gap-1">
                {([['','Все'],['income','Доходы'],['expense','Расходы']] as const).map(([v,l]) => (
                  <button key={v} onClick={() => setTypeF(v)}
                    className={`text-[11px] px-2 py-0.5 rounded-md ${typeF === v ? 'bg-blue-600/25 text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}>{l}</button>
                ))}
              </div>
            </div>
            {listTx.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-10">Операций нет. Добавьте доход или расход.</p>
            ) : (
              <div className="divide-y divide-[#1e2535]/60">
                {listTx.map(t => {
                  const symMap: Record<string, string> = { UZS: ' сум', USD: ' $', EUR: ' €', RUB: ' ₽' }
                  const sym = symMap[t.currency || 'UZS'] || ` ${t.currency}`
                  return (
                    <button key={t.id} onClick={() => openEdit(t)} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#1e2535]/40 transition-colors text-left">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {t.type === 'income' ? '↑' : '↓'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 truncate">{t.category || (t.type === 'income' ? 'Доход' : 'Расход')}{t.counterparty ? ` · ${t.counterparty}` : ''}</p>
                        <p className="text-[10px] text-slate-600">
                          {new Date(t.date).toLocaleDateString('ru-RU')}
                          {t.description ? ` · ${t.description}` : ''}
                          {t.currency && t.currency !== 'UZS' ? ` · Курс: ${t.exchange_rate} UZS` : ''}
                        </p>
                      </div>
                      {t.status === 'unpaid' && <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">не оплачено</span>}
                      <span className={`text-sm font-medium flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                        <span className="text-[10px] font-normal text-slate-500">{sym}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <TxModal
          tx={editing}
          defaultType={defType}
          companyId={active?.id ?? null}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}

      {importOpen && (
        <ImportModal
          isOpen={importOpen}
          transactions={importTxs}
          onSave={handleSaveImported}
          onClose={() => { setImportOpen(false); setImportTxs([]); }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color, currency, hint, big }: { label: string; value: string; color: string; currency: string; hint?: string; big?: boolean }) {
  const symMap: Record<string, string> = { UZS: ' сум', USD: ' $', EUR: ' €', RUB: ' ₽' }
  const sym = symMap[currency] || ` ${currency}`
  return (
    <div className={`bg-[#141820] border border-[#1e2535] rounded-xl px-4 py-3 ${big ? 'ring-1 ring-blue-500/20' : ''}`}>
      <p className="text-[10px] text-slate-500">{label}{hint && <span className="text-slate-700"> · {hint}</span>}</p>
      <p className={`text-lg font-semibold ${color} mt-0.5 leading-tight`}>{value}</p>
      <p className="text-[9px] text-slate-700">{sym}</p>
    </div>
  )
}

