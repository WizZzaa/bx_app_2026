import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransactions, type BxTransaction, type NewTransaction } from './finance/useTransactions'
import TxModal from './finance/TxModal'
import ImportModal from './finance/ImportModal'
import { useCompany } from '../lib/CompanyContext'
import { useToast } from '../lib/ui/ToastContext'
import { exportTransactionsToExcel } from '../lib/excelExport'
import { parseBankStatement, type ParsedTransaction } from '../lib/bankStatementParser'
import { createCanonicalEvent } from './planner/eventRepository'
import { daysFromNowISO, todayISO } from '../lib/dates'
import { usePlan } from '../lib/plan'
import Icon from '../lib/ui/Icon'
import {
  ResourceEmpty,
  ResourceHero,
  ResourceLayout,
  ResourceNavItem,
  ResourceSectionTitle,
  ResourceSidebar,
  primaryActionClass,
  secondaryActionClass,
} from '../components/workspace/ResourceWorkspace'
import {
  filterPayments,
  paymentDayDiff,
  paymentSummary,
  paymentTiming,
  transactionUzs,
  type PaymentView,
} from '../lib/paymentInsights'

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value))
}

const VIEW_META: Record<PaymentView, { label: string; icon: string }> = {
  all: { label: 'Все операции', icon: 'folder' },
  receivable: { label: 'Нам должны', icon: 'trending' },
  payable: { label: 'Мы должны', icon: 'finance' },
  overdue: { label: 'Просрочено', icon: 'alert' },
  upcoming: { label: 'Ближайшие 7 дней', icon: 'clock' },
  paid: { label: 'История оплат', icon: 'check' },
}

export default function Finance() {
  const { id: routeId } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { active } = useCompany()
  const { transactions, loading, add, update, remove, syncStatus } = useTransactions(active?.id ?? null)
  const { isPro, loading: planLoading } = usePlan()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<PaymentView>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BxTransaction | null>(null)
  const [defaultType, setDefaultType] = useState<'income' | 'expense'>('income')
  const [importOpen, setImportOpen] = useState(false)
  const [importTransactions, setImportTransactions] = useState<ParsedTransaction[]>([])
  const today = todayISO()
  const selected = routeId ? transactions.find(transaction => transaction.id === routeId) ?? null : null
  const summary = useMemo(() => paymentSummary(transactions, today), [today, transactions])
  const visible = useMemo(() => filterPayments(transactions, view, search, today), [search, today, transactions, view])

  function openNew(type: 'income' | 'expense') {
    setEditing(null)
    setDefaultType(type)
    setModalOpen(true)
  }

  function openEdit(transaction: BxTransaction) {
    setEditing(transaction)
    setDefaultType(transaction.type)
    setModalOpen(true)
  }

  async function saveTransaction(data: NewTransaction) {
    if (editing) {
      await update(editing.id, data)
      toast.success('Обязательство обновлено')
    } else {
      const created = await add(data)
      toast.success('Обязательство добавлено')
      if (created) navigate(`/finance/${created.id}`)
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function deleteTransaction(transaction: BxTransaction) {
    if (!window.confirm(`Удалить операцию «${transaction.counterparty || transaction.category || 'Без названия'}» на ${formatMoney(transactionUzs(transaction))} сум?`)) return
    await remove(transaction.id)
    setModalOpen(false)
    setEditing(null)
    toast.info('Операция удалена')
    navigate('/finance')
  }

  async function togglePaid(transaction: BxTransaction) {
    const nextStatus = transaction.status === 'paid' ? 'unpaid' : 'paid'
    await update(transaction.id, { status: nextStatus })
    toast.success(nextStatus === 'paid' ? 'Отмечено оплаченным' : 'Обязательство возвращено в работу')
  }

  async function createReminder(transaction: BxTransaction) {
    const amount = formatMoney(transactionUzs(transaction))
    const who = transaction.counterparty || 'контрагент'
    const title = transaction.type === 'income' ? `Получить оплату: ${who} — ${amount} сум` : `Оплатить: ${who} — ${amount} сум`
    const date = daysFromNowISO(1)
    const reminder = await createCanonicalEvent({
      company_id: transaction.company_id, type: 'reminder', title, date, due_date: date,
      status: 'todo', priority: 'high', source: 'manual', note: `Создано из Контроля оплат ${today}`,
    })
    if (!reminder) { toast.error('Не удалось создать напоминание'); return }
    toast.success('Напоминание на завтра добавлено в Планировщик')
  }

  async function duplicateTransaction(transaction: BxTransaction) {
    const created = await add({
      company_id: transaction.company_id, type: transaction.type, amount: transaction.amount, currency: transaction.currency,
      exchange_rate: transaction.exchange_rate, date: today, category: transaction.category, counterparty: transaction.counterparty,
      description: transaction.description ? `Копия: ${transaction.description}` : 'Копия обязательства', status: 'unpaid',
    })
    if (created) {
      toast.success('Создана копия со сроком на сегодня')
      navigate(`/finance/${created.id}`)
    }
  }

  function exportToExcel() {
    if (!transactions.length) { toast.info('Нет данных для экспорта'); return }
    exportTransactionsToExcel(transactions, `Оплаты_${active?.name || 'компания'}_${today}`)
    toast.success('Реестр выгружен в Excel')
  }

  function readStatement(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = loadEvent => {
      try {
        const parsed = parseBankStatement(loadEvent.target?.result as string, active?.inn || null)
        if (!parsed.length) { toast.error('В выписке не найдены операции'); return }
        setImportTransactions(parsed)
        setImportOpen(true)
      } catch {
        toast.error('Не удалось прочитать банковскую выписку')
      }
    }
    reader.readAsText(file, 'utf-8')
    event.target.value = ''
  }

  async function saveImported(selectedRows: ParsedTransaction[]) {
    let saved = 0
    for (const transaction of selectedRows) {
      const result = await add({ company_id: active?.id ?? null, type: transaction.type, amount: transaction.amount, date: transaction.date, category: transaction.category || 'Прочее', counterparty: transaction.counterparty, description: transaction.description, status: transaction.status })
      if (result) saved += 1
    }
    toast.success(`Импортировано операций: ${saved}`)
  }

  if (!planLoading && !isPro) return <div className="flex flex-1 items-center justify-center bg-bx-bg p-6"><div className="max-w-lg rounded-[24px] border border-bx-border bg-bx-surface p-7 text-center shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><Icon name="shield" className="h-6 w-6" /></span><h1 className="mt-4 text-xl font-black text-bx-text">Контроль оплат доступен в рабочем тарифе</h1><p className="mt-2 text-sm leading-relaxed text-bx-muted">Дебиторка, кредиторка, просрочка, карточки обязательств, банковские выписки и напоминания. Полный учёт при этом остаётся в 1С.</p><button type="button" onClick={() => navigate('/settings')} className={`${primaryActionClass} mt-5`}>Посмотреть тарифы</button></div></div>

  if (routeId) {
    if (loading && !selected) return <div className="flex flex-1 items-center justify-center bg-bx-bg text-xs text-bx-muted">Загружаем карточку оплаты…</div>
    if (!selected) return <div className="flex flex-1 items-center justify-center bg-bx-bg"><ResourceEmpty icon="finance" title="Операция не найдена" description="Возможно, она была удалена или относится к другой активной компании." action={<button type="button" onClick={() => navigate('/finance')} className={primaryActionClass}>Вернуться в реестр</button>} /></div>
    return <><PaymentDetail transaction={selected} today={today} syncStatus={syncStatus} onBack={() => navigate('/finance')} onEdit={() => openEdit(selected)} onTogglePaid={() => void togglePaid(selected)} onRemind={() => void createReminder(selected)} onDuplicate={() => void duplicateTransaction(selected)} onDelete={() => void deleteTransaction(selected)} onOpenPlanner={() => navigate('/planner')} />{modalOpen && <TxModal tx={editing} defaultType={defaultType} companyId={active?.id ?? null} onSave={saveTransaction} onDelete={editing ? () => void deleteTransaction(editing) : undefined} onClose={() => { setModalOpen(false); setEditing(null) }} />}</>
  }

  const counts: Record<PaymentView, number> = {
    all: transactions.length,
    receivable: transactions.filter(transaction => transaction.status === 'unpaid' && transaction.type === 'income').length,
    payable: transactions.filter(transaction => transaction.status === 'unpaid' && transaction.type === 'expense').length,
    overdue: summary.overdueCount,
    upcoming: summary.upcomingCount,
    paid: summary.paidCount,
  }
  const sidebar = <ResourceSidebar icon="finance" title="Контроль оплат" subtitle={active?.name || 'Выберите компанию'} search={search} searchPlaceholder="Контрагент, сумма или категория" onSearch={setSearch} onClear={() => setSearch('')} label="Состояние расчётов" footer={<button type="button" onClick={() => openNew('income')} className={`${primaryActionClass} w-full`}><Icon name="plus" className="h-4 w-4" />Добавить обязательство</button>}>
    {(Object.keys(VIEW_META) as PaymentView[]).map(item => <ResourceNavItem key={item} icon={VIEW_META[item].icon} label={VIEW_META[item].label} count={counts[item]} active={view === item} onClick={() => setView(item)} />)}
  </ResourceSidebar>

  return <ResourceLayout sidebar={sidebar}>
    <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={readStatement} className="sr-only" tabIndex={-1} />
    <div className="space-y-6">
      <ResourceHero eyebrow="Оперативные расчёты, не бухгалтерская система" title="Кому, сколько и когда нужно заплатить" description="BX держит в фокусе дебиторку и кредиторку, показывает просрочку, создаёт напоминания и хранит понятную карточку каждого обязательства. Проводки и полный учёт остаются в 1С." icon="finance" stats={[{ value: `${formatMoney(summary.receivable)} сум`, label: 'нам должны' }, { value: `${formatMoney(summary.payable)} сум`, label: 'мы должны' }, { value: summary.overdueCount, label: 'просрочено' }]} actions={<><button type="button" onClick={() => openNew('income')} className={primaryActionClass}><Icon name="plus" className="h-4 w-4" />Добавить оплату</button><button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryActionClass}><Icon name="download" className="h-4 w-4 rotate-180" />Импорт выписки</button></>} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Дебиторка" value={`${formatMoney(summary.receivable)} сум`} note={`${counts.receivable} активных оплат`} tone="emerald" icon="trending" />
        <MetricCard title="Кредиторка" value={`${formatMoney(summary.payable)} сум`} note={`${counts.payable} счетов к оплате`} tone="red" icon="finance" />
        <MetricCard title="Просрочено" value={`${formatMoney(summary.overdue)} сум`} note={`${summary.overdueCount} требуют действия`} tone="amber" icon="alert" />
        <MetricCard title="Ближайшие 7 дней" value={String(summary.upcomingCount)} note="обязательств в горизонте" tone="blue" icon="clock" />
      </section>
      <section className="space-y-4"><ResourceSectionTitle title={VIEW_META[view].label} subtitle="Откройте строку для полной карточки, истории состояния и действий" count={visible.length} action={<div className="flex gap-2"><button type="button" onClick={exportToExcel} className={secondaryActionClass}><Icon name="download" className="h-4 w-4" />Excel</button><button type="button" onClick={() => openNew('expense')} className={secondaryActionClass}><Icon name="plus" className="h-4 w-4" />Мы должны</button></div>} />
        {syncStatus && <div role="status" className="inline-flex items-center gap-2 rounded-lg border border-bx-border bg-bx-surface px-3 py-2 text-[10px] font-bold text-bx-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" />{syncStatus}</div>}
        {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl border border-bx-border bg-bx-surface" />)}</div> : visible.length ? <div className="overflow-hidden rounded-[20px] border border-bx-border bg-bx-surface shadow-sm"><div className="hidden grid-cols-[minmax(220px,1.4fr)_150px_140px_150px_170px] gap-3 border-b border-bx-border bg-bx-surface-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-bx-muted 2xl:grid"><span>Контрагент и назначение</span><span>Срок</span><span>Статус</span><span className="text-right">Сумма</span><span className="text-right">Действия</span></div><div className="divide-y divide-bx-border">{visible.map(transaction => <PaymentRow key={transaction.id} transaction={transaction} today={today} onOpen={() => navigate(`/finance/${transaction.id}`)} onTogglePaid={() => void togglePaid(transaction)} onRemind={() => void createReminder(transaction)} />)}</div></div> : <ResourceEmpty icon="finance" title="В этом разделе операций нет" description={search ? 'Измените поисковый запрос или выберите другой фильтр.' : view === 'paid' ? 'Оплаченные операции появятся здесь автоматически.' : 'Добавьте обязательство вручную или импортируйте банковскую выписку.'} action={<button type="button" onClick={() => openNew(view === 'payable' ? 'expense' : 'income')} className={primaryActionClass}>Добавить обязательство</button>} />}
      </section>
    </div>
    {modalOpen && <TxModal tx={editing} defaultType={defaultType} companyId={active?.id ?? null} onSave={saveTransaction} onDelete={editing ? () => void deleteTransaction(editing) : undefined} onClose={() => { setModalOpen(false); setEditing(null) }} />}
    {importOpen && <ImportModal isOpen transactions={importTransactions} onSave={saveImported} onClose={() => { setImportOpen(false); setImportTransactions([]) }} />}
  </ResourceLayout>
}

function MetricCard({ title, value, note, tone, icon }: { title: string; value: string; note: string; tone: 'emerald' | 'red' | 'amber' | 'blue'; icon: string }) {
  const colors = { emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', red: 'bg-red-500/10 text-red-700 dark:text-red-300', amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' }
  return <div className="rounded-[18px] border border-bx-border bg-bx-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.12em] text-bx-muted">{title}</p><p className="mt-2 text-xl font-black tabular-nums text-bx-text">{value}</p><p className="mt-1 text-[10px] text-bx-muted">{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon name={icon} className="h-[18px] w-[18px]" /></span></div></div>
}

function PaymentRow({ transaction, today, onOpen, onTogglePaid, onRemind }: { transaction: BxTransaction; today: string; onOpen: () => void; onTogglePaid: () => void; onRemind: () => void }) {
  const timing = paymentTiming(transaction, today)
  const days = paymentDayDiff(transaction.date, today)
  const timingText = timing === 'paid' ? 'Оплачено' : timing === 'overdue' ? `Просрочено на ${Math.abs(days)} дн.` : timing === 'today' ? 'Срок сегодня' : timing === 'upcoming' ? `Через ${days} дн.` : `Через ${days} дн.`
  const timingClass = timing === 'paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : timing === 'overdue' ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300' : timing === 'today' || timing === 'upcoming' ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-bx-border bg-bx-surface-2 text-bx-muted'
  return <div className="grid gap-3 px-4 py-3 transition-colors hover:bg-blue-500/[0.025] 2xl:grid-cols-[minmax(220px,1.4fr)_150px_140px_150px_170px] 2xl:items-center"><button type="button" onClick={onOpen} className="min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><p className="truncate text-xs font-black text-bx-text">{transaction.counterparty || transaction.category || 'Без контрагента'}</p><p className="mt-1 truncate text-[10px] text-bx-muted">{transaction.description || transaction.category || (transaction.type === 'income' ? 'Ожидаем поступление' : 'Планируем оплату')}</p></button><div><p className="text-[11px] font-bold tabular-nums text-bx-text">{new Date(`${transaction.date}T00:00:00`).toLocaleDateString('ru-RU')}</p><p className="mt-0.5 text-[10px] text-bx-muted">{transaction.type === 'income' ? 'Нам должны' : 'Мы должны'}</p></div><span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-black ${timingClass}`}>{timingText}</span><p className={`text-left text-sm font-black tabular-nums 2xl:text-right ${transaction.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{formatMoney(transactionUzs(transaction))}<span className="ml-1 text-[9px] text-bx-muted">сум</span></p><div className="flex justify-start gap-1.5 2xl:justify-end"><button type="button" onClick={onTogglePaid} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-bx-border bg-bx-bg px-2.5 text-[9px] font-black hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-300"><Icon name={transaction.status === 'paid' ? 'recycle' : 'check'} className="h-3.5 w-3.5" />{transaction.status === 'paid' ? 'Вернуть' : 'Оплачено'}</button>{transaction.status === 'unpaid' && <button type="button" onClick={onRemind} aria-label="Напомнить завтра" className="grid h-10 w-10 place-items-center rounded-lg border border-bx-border bg-bx-bg text-bx-muted hover:border-blue-500/30 hover:text-blue-600"><Icon name="bell" className="h-4 w-4" /></button>}<button type="button" onClick={onOpen} aria-label="Открыть карточку" className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"><Icon name="arrowR" className="h-4 w-4" /></button></div></div>
}

function PaymentDetail({ transaction, today, syncStatus, onBack, onEdit, onTogglePaid, onRemind, onDuplicate, onDelete, onOpenPlanner }: {
  transaction: BxTransaction
  today: string
  syncStatus: string
  onBack: () => void
  onEdit: () => void
  onTogglePaid: () => void
  onRemind: () => void
  onDuplicate: () => void
  onDelete: () => void
  onOpenPlanner: () => void
}) {
  const timing = paymentTiming(transaction, today)
  const days = paymentDayDiff(transaction.date, today)
  const amountUzs = transactionUzs(transaction)
  return <div className="flex flex-1 overflow-y-auto bg-bx-bg text-bx-text custom-scrollbar"><div className="bx-reading-container w-full space-y-5 py-5"><button type="button" onClick={onBack} className="inline-flex min-h-9 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-bx-muted hover:text-bx-text"><Icon name="arrowL" className="h-3.5 w-3.5" />Реестр оплат</button><header className="rounded-[24px] border border-bx-border bg-bx-surface p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Карточка обязательства</p><h1 className="mt-1 text-2xl font-black">{transaction.counterparty || transaction.category || 'Операция без названия'}</h1><p className="mt-1 text-xs text-bx-muted">{transaction.type === 'income' ? 'Нам должны' : 'Мы должны'} · срок {new Date(`${transaction.date}T00:00:00`).toLocaleDateString('ru-RU')}</p></div><button type="button" onClick={onEdit} className={primaryActionClass}><Icon name="settings" className="h-4 w-4" />Изменить</button></div></header><div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2"><div className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-wider text-bx-muted">Сумма обязательства</p><p className={`mt-2 text-3xl font-black tabular-nums ${transaction.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{formatMoney(amountUzs)} <span className="text-sm text-bx-muted">сум</span></p>{transaction.currency && transaction.currency !== 'UZS' && <p className="mt-2 text-[10px] text-bx-muted">{formatMoney(transaction.amount)} {transaction.currency} · курс {transaction.exchange_rate || 1}</p>}</div><div className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-wider text-bx-muted">Текущее состояние</p><p className="mt-2 text-lg font-black">{timing === 'paid' ? 'Оплачено' : timing === 'overdue' ? `Просрочено на ${Math.abs(days)} дней` : timing === 'today' ? 'Срок сегодня' : `До срока ${days} дней`}</p><p className="mt-2 text-[10px] text-bx-muted">{syncStatus || 'Локальные данные готовы'}</p></div></section><section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><h2 className="text-base font-black">Детали расчёта</h2><dl className="mt-4 grid gap-3 sm:grid-cols-2">{[['Категория', transaction.category || 'Не указана'], ['Контрагент', transaction.counterparty || 'Не указан'], ['Направление', transaction.type === 'income' ? 'Дебиторская задолженность' : 'Кредиторская задолженность'], ['Комментарий', transaction.description || 'Нет комментария']].map(([label, value]) => <div key={label} className="rounded-xl border border-bx-border bg-bx-bg p-3"><dt className="text-[9px] font-black uppercase tracking-wider text-bx-muted">{label}</dt><dd className="mt-1 text-xs font-bold leading-relaxed text-bx-text">{value}</dd></div>)}</dl></section><section className="rounded-[20px] border border-bx-border bg-bx-surface p-5 shadow-sm"><h2 className="text-base font-black">История состояния</h2><div className="mt-4 space-y-3"><TimelineItem title="Карточка создана" date={transaction.created_at} note="Обязательство добавлено в контроль оплат" /><TimelineItem title={`Срок ${transaction.status === 'paid' ? 'операции' : 'оплаты'}`} date={`${transaction.date}T00:00:00`} note={transaction.status === 'paid' ? 'Операция находится в истории' : timing === 'overdue' ? 'Срок прошёл — требуется действие' : 'Дата используется для контроля и фильтров'} /><TimelineItem title="Последнее изменение" date={transaction.updated_at} note={transaction.status === 'paid' ? 'Текущий статус: оплачено' : 'Текущий статус: ожидает оплаты'} /></div></section></div><aside className="space-y-4"><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 shadow-sm"><h2 className="text-sm font-black">Быстрые действия</h2><div className="mt-3 space-y-2"><button type="button" onClick={onTogglePaid} className={`${primaryActionClass} w-full`}><Icon name={transaction.status === 'paid' ? 'recycle' : 'check'} className="h-4 w-4" />{transaction.status === 'paid' ? 'Вернуть в работу' : 'Отметить оплаченным'}</button>{transaction.status === 'unpaid' && <button type="button" onClick={onRemind} className={`${secondaryActionClass} w-full`}><Icon name="bell" className="h-4 w-4" />Напомнить завтра</button>}<button type="button" onClick={onOpenPlanner} className={`${secondaryActionClass} w-full`}><Icon name="planner" className="h-4 w-4" />Открыть Планировщик</button><button type="button" onClick={onDuplicate} className={`${secondaryActionClass} w-full`}><Icon name="copy" className="h-4 w-4" />Создать копию</button></div></section><section className="rounded-[20px] border border-bx-border bg-bx-surface p-4 text-[11px] leading-relaxed text-bx-muted shadow-sm"><p className="font-black text-bx-text">Граница ответственности</p><p className="mt-2">BX напоминает о расчёте и хранит оперативное состояние. Банковские проводки, акты сверки и бухгалтерский учёт подтверждаются в 1С и первичных документах.</p></section><button type="button" onClick={onDelete} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-600 hover:bg-red-500/15 dark:text-red-300"><Icon name="trash" className="h-4 w-4" />Удалить операцию</button></aside></div></div>{/* modal is rendered by parent route on next render */}</div>
}

function TimelineItem({ title, date, note }: { title: string; date: string; note: string }) {
  return <div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-blue-600 bg-bx-surface" /><div><p className="text-xs font-black text-bx-text">{title}</p><p className="mt-0.5 text-[10px] tabular-nums text-bx-muted">{date ? new Date(date).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: date.includes('T00:00:00') ? undefined : 'short' }) : 'Дата не зафиксирована'}</p><p className="mt-1 text-[10px] leading-relaxed text-bx-muted">{note}</p></div></div>
}
