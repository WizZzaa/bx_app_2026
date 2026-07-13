import React, { useState, useMemo, useRef } from 'react'
import { useTransactions, type BxTransaction, type NewTransaction } from './finance/useTransactions'
import TxModal from './finance/TxModal'
import ImportModal from './finance/ImportModal'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { exportTransactionsToExcel } from '../lib/excelExport'
import { parseBankStatement, type ParsedTransaction } from '../lib/bankStatementParser'
import { supabase } from '../lib/db/supabase'
import { daysFromNowISO, todayISO } from '../lib/dates'
import { usePlan } from '../lib/plan'
import { useNavigate } from 'react-router-dom'

// «Контроль оплат» (бывшие «Финансы», сжаты по стратегии docs/05_strategy.md):
// кто должен нам / кому должны мы, напоминания об оплате в Планировщик,
// импорт выписки и отметка оплат. Учёт и P&L — работа 1С, не дублируем.

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n))
}

/** Сумма операции в сумах (по курсу на дату операции) */
function toUzs(t: BxTransaction): number {
  return t.amount * (t.exchange_rate || 1)
}

export default function Finance() {
  const { active } = useCompany()
  const { transactions, add, update, remove, syncStatus } = useTransactions(active?.id ?? null)
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isPro, loading: planLoading } = usePlan()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importTxs, setImportTxs] = useState<ParsedTransaction[]>([])
  const [editing, setEditing] = useState<BxTransaction | null>(null)
  const [defType, setDefType] = useState<'income' | 'expense'>('income')
  const [showHistory, setShowHistory] = useState(false)

  const receivable = useMemo(
    () => transactions.filter(t => t.status === 'unpaid' && t.type === 'income')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions])
  const payable = useMemo(
    () => transactions.filter(t => t.status === 'unpaid' && t.type === 'expense')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [transactions])
  const paid = useMemo(
    () => transactions.filter(t => t.status === 'paid')
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [transactions])

  const sums = useMemo(() => ({
    receivable: receivable.reduce((s, t) => s + toUzs(t), 0),
    payable: payable.reduce((s, t) => s + toUzs(t), 0),
  }), [receivable, payable])

  function openNew(type: 'income' | 'expense') { setEditing(null); setDefType(type); setModalOpen(true) }
  function openEdit(t: BxTransaction) { setEditing(t); setModalOpen(true) }

  async function handleSave(data: NewTransaction) {
    if (editing) await update(editing.id, data); else await add(data)
    toast.success(editing ? 'Операция обновлена' : 'Операция добавлена')
    setModalOpen(false); setEditing(null)
  }
  async function handleDelete() { if (editing) await remove(editing.id); toast.info('Операция удалена'); setModalOpen(false); setEditing(null) }

  async function markPaid(t: BxTransaction) {
    await update(t.id, { status: 'paid' })
    toast.success(`Отмечено оплаченным: ${fmt(toUzs(t))} сум`)
  }

  // Напоминание об оплате → событие Планировщика (завтра, высокий приоритет)
  async function remind(t: BxTransaction) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Нужен вход в аккаунт для напоминаний'); return }
    const who = t.counterparty || 'контрагент'
    const title = t.type === 'income'
      ? `Получить оплату: ${who} — ${fmt(toUzs(t))} сум`
      : `Оплатить: ${who} — ${fmt(toUzs(t))} сум`
    const date = daysFromNowISO(1)
    const { error } = await supabase.from('bx_events').insert({
      user_id: user.id,
      company_id: t.company_id,
      type: 'reminder',
      title,
      date,
      due_date: date,
      status: 'todo',
      priority: 'high',
      source: 'manual',
      note: `Создано из Контроля оплат ${todayISO()}`,
    })
    if (error) { toast.error('Не удалось создать напоминание'); return }
    const bc = new BroadcastChannel('bx-events-sync')
    bc.postMessage('reload')
    bc.close()
    toast.success('Напоминание на завтра создано в Планировщике')
  }

  // Экспорт в Excel (все операции)
  const handleExport = () => {
    if (transactions.length === 0) { toast.info('Нет данных для экспорта'); return }
    exportTransactionsToExcel(transactions, `Оплаты_${active?.name || 'компания'}_${todayISO()}`)
    toast.success('Таблица экспортирована в Excel')
  }

  // Импорт выписки
  const handleImportClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      try {
        const parsed = parseBankStatement(text, active?.inn || null)
        if (parsed.length === 0) { toast.error('Не удалось распознать операции в файле'); return }
        setImportTxs(parsed)
        setImportOpen(true)
      } catch (err) {
        console.error(err)
        toast.error('Ошибка при чтении выписки')
      }
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
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
        status: tx.status,
      })
      if (result) successCount++
    }
    toast.success(`Импортировано операций: ${successCount}`)
  }

  // Контроль оплат — возможность тарифа Pro
  if (!planLoading && !isPro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center text-2xl mb-4">🔒</div>
          <h1 className="text-lg font-bold text-bx-text mb-2">Контроль оплат — в тарифе Pro</h1>
          <p className="text-sm text-bx-muted mb-1">Дебиторка и кредиторка по каждому контрагенту, отметка оплат одним кликом и напоминания в Планировщике.</p>
          <p className="text-xs text-bx-muted mb-5">Полный учёт при этом остаётся в 1С — мы следим только за оплатами.</p>
          <button onClick={() => navigate('/settings')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            Посмотреть тарифы
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bx-bg">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt" className="hidden" />

      {/* Шапка */}
      <div className="flex-shrink-0 border-b border-bx-border px-6 py-4 flex items-center justify-between gap-4 flex-wrap bg-bx-surface shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-extrabold text-bx-text uppercase tracking-wider">Контроль оплат</h1>
          <span className="text-[11px] text-bx-muted bg-bx-surface-2 px-2.5 py-1 rounded-lg border border-bx-border font-semibold">Учет расчетов с контрагентами</span>
          {syncStatus && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-bold border border-emerald-500/20">{syncStatus}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleImportClick} className="px-3.5 py-2 border border-bx-border-2 text-bx-text hover:text-bx-text text-xs font-bold rounded-xl bg-bx-surface hover:bg-bx-surface-2 transition-all cursor-pointer shadow-sm">
            📥 Импорт выписки
          </button>
          <button onClick={handleExport} className="px-3.5 py-2 border border-bx-border-2 text-bx-text hover:text-bx-text text-xs font-bold rounded-xl bg-bx-surface hover:bg-bx-surface-2 transition-all cursor-pointer shadow-sm">
            📊 Экспорт в Excel
          </button>
          <button onClick={() => openNew('income')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md transition-transform active:scale-[0.98]">+ Нам должны</button>
          <button onClick={() => openNew('expense')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl cursor-pointer shadow-md transition-transform active:scale-[0.98]">+ Мы должны</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Итоги */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-bx-surface border border-bx-border border-l-[6px] border-l-emerald-500 rounded-2xl px-6 py-5 shadow-md flex flex-col justify-between min-h-[100px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Нам должны (Дебиторка)</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  {fmt(sums.receivable)} <span className="text-sm font-bold text-bx-muted uppercase">сум</span>
                </p>
              </div>
              <p className="text-[10px] text-bx-muted font-bold mt-2">Активных долгов клиентов: {receivable.length}</p>
            </div>

            <div className="bg-bx-surface border border-bx-border border-l-[6px] border-l-red-500 rounded-2xl px-6 py-5 shadow-md flex flex-col justify-between min-h-[100px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-red-700 dark:text-red-400">Мы должны (Кредиторка)</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                  {fmt(sums.payable)} <span className="text-sm font-bold text-bx-muted uppercase">сум</span>
                </p>
              </div>
              <p className="text-[10px] text-bx-muted font-bold mt-2">Наших неоплаченных счетов: {payable.length}</p>
            </div>
          </div>

          {/* Два списка */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DebtList
              title="Нам должны" accent="emerald" items={receivable}
              onEdit={openEdit} onPaid={markPaid} onRemind={remind}
              empty="Дебиторки нет — все клиенты рассчитались ✓"
            />
            <DebtList
              title="Мы должны" accent="red" items={payable}
              onEdit={openEdit} onPaid={markPaid} onRemind={remind}
              empty="Кредиторки нет — все счета оплачены ✓"
            />
          </div>

          {/* История оплат */}
          <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden shadow-sm">
            <button onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-bx-surface-2 transition-colors cursor-pointer text-left select-none">
              <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">📜 История последних оплат <span className="text-bx-muted font-bold ml-1.5">({paid.length})</span></h3>
              <span className="text-xs text-bx-muted font-bold">{showHistory ? 'свернуть ▴' : 'развернуть ▾'}</span>
            </button>
            {showHistory && (
              paid.length === 0 ? (
                <div className="text-center py-10 border-t border-bx-border text-bx-muted text-xs italic">
                  Оплаченных операций пока нет.
                </div>
              ) : (
                <div className="divide-y divide-bx-border/60 border-t border-bx-border">
                  {paid.map(t => (
                    <button key={t.id} onClick={() => openEdit(t)} className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-bx-surface-2/40 transition-colors text-left cursor-pointer">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 font-bold ${t.type === 'income' ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                        {t.type === 'income' ? '↑' : '↓'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-bx-text font-bold truncate">{t.counterparty || t.category || (t.type === 'income' ? 'Поступление' : 'Оплата')}</p>
                        <p className="text-[10px] text-bx-muted font-medium mt-0.5">{new Date(t.date).toLocaleDateString('ru-RU')}{t.description ? ` · ${t.description}` : ''}</p>
                      </div>
                      <span className={`text-sm font-black flex-shrink-0 tabular-nums ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'income' ? '+' : '−'}{fmt(toUzs(t))}<span className="text-[10px] font-bold text-bx-muted"> сум</span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          <p className="text-[10.5px] text-bx-muted text-center py-4 leading-relaxed bg-bx-surface/50 border border-bx-border border-dashed rounded-xl px-4">
            💡 <b>Контроль оплат</b> ориентирован исключительно на оперативную дебиторку и кредиторку. Полный бухгалтерский учет ведите в 1С. Любое напоминание можно в один клик продублировать в задачи Планировщика.
          </p>
        </div>
      </div>

      {modalOpen && (
        <TxModal
          tx={editing}
          defaultType={defType}
          companyId={active?.id ?? null}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}

      {importOpen && (
        <ImportModal
          isOpen={importOpen}
          transactions={importTxs}
          onSave={handleSaveImported}
          onClose={() => { setImportOpen(false); setImportTxs([]) }}
        />
      )}
    </div>
  )
}

// ── Список долгов ────────────────────────────────────────────────────────────
function DebtList({ title, accent, items, onEdit, onPaid, onRemind, empty }: {
  title: string
  accent: 'emerald' | 'red'
  items: BxTransaction[]
  onEdit: (t: BxTransaction) => void
  onPaid: (t: BxTransaction) => void
  onRemind: (t: BxTransaction) => void
  empty: string
}) {
  const today = todayISO()
  return (
    <div className="bg-bx-surface border border-bx-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-bx-border bg-bx-surface-2/40 flex justify-between items-center">
        <h3 className="text-xs font-black text-bx-text uppercase tracking-wider">{title}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 px-6 flex flex-col items-center justify-center">
          <span className="text-2xl mb-2">🎉</span>
          <p className="text-xs text-bx-muted font-bold italic">{empty}</p>
        </div>
      ) : (
        <div className="divide-y divide-bx-border/60">
          {items.map(t => {
            const days = Math.round((new Date(today).getTime() - new Date(t.date).getTime()) / 86400000)
            return (
              <div key={t.id} className="px-6 py-3.5 hover:bg-bx-surface-2/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <button onClick={() => onEdit(t)} className="w-full text-left flex items-center justify-between cursor-pointer">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs text-bx-text font-bold truncate leading-snug">{t.counterparty || t.category || 'Без контрагента'}</p>
                      <p className="text-[10px] text-bx-muted font-medium mt-0.5">
                        {new Date(t.date).toLocaleDateString('ru-RU')}
                        {days > 0 && <span className={days > 30 ? ' text-red-600 dark:text-red-400 font-extrabold' : ' text-amber-600 dark:text-amber-500 font-bold'}> · висит {days} дн.</span>}
                      </p>
                    </div>
                  </button>
                  <span className={`text-xs font-black flex-shrink-0 tabular-nums ${accent === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmt(t.amount * ((t as BxTransaction).exchange_rate || 1))}<span className="text-[9px] font-bold text-bx-muted"> сум</span>
                  </span>
                </div>
                <div className="flex gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onPaid(t)}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors font-semibold cursor-pointer shadow-sm">
                    ✓ Оплачено
                  </button>
                  <button onClick={() => onRemind(t)}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors font-semibold cursor-pointer shadow-sm">
                    🔔 Напомнить завтра
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
