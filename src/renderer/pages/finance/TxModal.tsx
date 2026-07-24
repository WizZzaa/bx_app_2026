import React, { useRef, useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import Button from '../../components/ui/Button'
import { DateField, Field, MoneyField, Select, Textarea } from '../../components/ui/FormControls'
import type { BxTransaction, NewTransaction } from './useTransactions'
import { useExchangeRates } from '../../lib/useExchangeRates'
import { todayISO } from '../../lib/dates'
import Icon from '../../lib/ui/Icon'
import { useCounterparties } from '../../lib/db/useCounterparties'

interface Props {
  tx?: BxTransaction | null
  defaultType?: 'income' | 'expense'
  companyId: string | null
  onSave: (data: NewTransaction) => void | Promise<void>
  onDelete?: () => void
  onClose: () => void
}

const INCOME_CATS = ['Выручка', 'Услуги', 'Аванс от клиента', 'Проценты', 'Возврат', 'Прочее']
const EXPENSE_CATS = ['Зарплата', 'Аренда', 'Налоги и взносы', 'Закупка товара', 'Материалы', 'Коммуналка', 'Связь / интернет', 'Банковские услуги', 'Транспорт', 'Реклама', 'Прочее']
const today = todayISO()
type TxErrors = Partial<Record<'amount' | 'exchangeRate' | 'date', string>>

export default function TxModal({ tx, defaultType, companyId, onSave, onDelete, onClose }: Props) {
  const isEdit = Boolean(tx)
  const [type, setType] = useState<'income' | 'expense'>(tx?.type ?? defaultType ?? 'income')
  const [amount, setAmount] = useState(tx?.amount ? String(tx.amount) : '')
  const [currency, setCurrency] = useState(tx?.currency ?? 'UZS')
  const [exchangeRate, setExchangeRate] = useState(tx?.exchange_rate ?? 1)
  const [date, setDate] = useState(tx?.date ?? today)
  const [category, setCategory] = useState(tx?.category ?? '')
  const [counterparty, setCounterparty] = useState(tx?.counterparty ?? '')
  const [description, setDescription] = useState(tx?.description ?? '')
  const [status, setStatus] = useState<'paid' | 'unpaid'>(tx?.status ?? 'unpaid')
  const [confirmDel, setConfirmDel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<TxErrors>({})
  const amountRef = useRef<HTMLInputElement>(null)
  const exchangeRateRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const { rates } = useExchangeRates()
  const { counterparties } = useCounterparties(companyId)

  function handleCurrencyChange(nextCurrency: string) {
    setCurrency(nextCurrency)
    setExchangeRate(nextCurrency === 'UZS' ? 1 : rates[nextCurrency] || 1)
  }

  async function save() {
    const parsedAmount = Number.parseFloat(amount)
    const nextErrors: TxErrors = {}
    if (!parsedAmount || parsedAmount <= 0) nextErrors.amount = 'Введите сумму больше нуля.'
    if (currency !== 'UZS' && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) nextErrors.exchangeRate = 'Введите курс к суму больше нуля.'
    if (!date) nextErrors.date = 'Укажите срок или дату оплаты.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || saving) {
      requestAnimationFrame(() => {
        if (nextErrors.amount) amountRef.current?.focus()
        else if (nextErrors.exchangeRate) exchangeRateRef.current?.focus()
        else if (nextErrors.date) dateRef.current?.focus()
      })
      return
    }
    setSaving(true)
    try {
      await onSave({
        company_id: companyId,
        type,
        amount: parsedAmount,
        date,
        currency,
        exchange_rate: currency === 'UZS' ? 1 : Number(exchangeRate),
        category: category.trim() || null,
        counterparty: counterparty.trim() || null,
        description: description.trim() || null,
        status,
      })
    } finally {
      setSaving(false)
    }
  }

  const categories = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const deleteControl = isEdit && onDelete
    ? confirmDel
      ? <div className="bx-a6-sheet__delete-confirm"><span>Удалить обязательство?</span><Button type="button" variant="danger" onClick={onDelete}>Удалить</Button><Button type="button" variant="secondary" onClick={() => setConfirmDel(false)}>Оставить</Button></div>
      : <Button type="button" variant="ghost" onClick={() => setConfirmDel(true)} className="bx-a6-sheet__destructive">Удалить</Button>
    : null

  const footer = (
    <div className="bx-a6-sheet__footer">
      <div className="bx-a6-sheet__footer-leading">{deleteControl}</div>
      <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="bx-a6-button bx-a6-button--secondary">Отмена</Button>
      <Button type="submit" form="bx-transaction-form" loading={saving} className="bx-a6-button bx-a6-button--primary">
        {isEdit ? 'Сохранить изменения' : 'Добавить в контроль'}
      </Button>
    </div>
  )

  return (
    <Sheet
      open
      onClose={onClose}
      title={isEdit ? 'Изменить обязательство' : 'Новое обязательство'}
      description="Сумма, срок и контрагент — достаточно для начала контроля. Остальное можно уточнить позже."
      closeLabel="Закрыть карточку обязательства"
      className="bx-a6-sheet bx-a6-transaction-sheet"
      footer={footer}
    >
      <form id="bx-transaction-form" className="bx-a6-form" onSubmit={event => { event.preventDefault(); void save() }} noValidate>
        <div className="bx-a6-segmented" role="group" aria-label="Направление расчёта">
          <button type="button" onClick={() => setType('income')} aria-pressed={type === 'income'}>
            <Icon name="trending" className="h-4 w-4" />Нам должны
          </button>
          <button type="button" onClick={() => setType('expense')} aria-pressed={type === 'expense'}>
            <Icon name="finance" className="h-4 w-4" />Мы должны
          </button>
        </div>

        <section className="bx-a6-form__section" aria-labelledby="transaction-amount-title">
          <div className="bx-a6-form__heading"><span>1</span><div><h3 id="transaction-amount-title">Сумма и срок</h3><p>Основные данные для контроля.</p></div></div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyField ref={amountRef} label="Сумма" required error={errors.amount} currency={currency} autoFocus value={amount} onChange={event => { setAmount(event.target.value); setErrors(current => ({ ...current, amount: undefined })) }} placeholder="0" />
            <Select label="Валюта" value={currency} onChange={event => { handleCurrencyChange(event.target.value); setErrors(current => ({ ...current, exchangeRate: undefined })) }}>
                <option value="UZS">UZS (сум)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="RUB">RUB (₽)</option>
            </Select>
          </div>
          <div className={`grid gap-3 ${currency === 'UZS' ? '' : 'grid-cols-2'}`}>
            {currency !== 'UZS' && <Field ref={exchangeRateRef} label="Курс к UZS" required error={errors.exchangeRate} type="number" inputMode="decimal" min="0" step="any" value={exchangeRate} onChange={event => { setExchangeRate(Number(event.target.value)); setErrors(current => ({ ...current, exchangeRate: undefined })) }} placeholder="1" />}
            <DateField ref={dateRef} label={status === 'unpaid' ? 'Срок оплаты' : 'Дата оплаты'} required error={errors.date} value={date} onChange={event => { setDate(event.target.value); setErrors(current => ({ ...current, date: undefined })) }} />
          </div>
        </section>

        <section className="bx-a6-form__section" aria-labelledby="transaction-details-title">
          <div className="bx-a6-form__heading"><span>2</span><div><h3 id="transaction-details-title">С кем и за что</h3><p>Выберите сохранённого контрагента или впишите нового.</p></div></div>
          <Field label="Контрагент" list="transaction-counterparties" value={counterparty} onChange={event => setCounterparty(event.target.value)} placeholder="Название организации" autoComplete="organization" />
          <datalist id="transaction-counterparties">{counterparties.map(item => <option key={item.id} value={item.name}>{item.inn}</option>)}</datalist>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Категория" list="tx-cats" value={category} onChange={event => setCategory(event.target.value)} placeholder="Выберите или впишите" />
            <datalist id="tx-cats">{categories.map(item => <option key={item} value={item} />)}</datalist>
            <Select label="Статус" value={status} onChange={event => setStatus(event.target.value as 'paid' | 'unpaid')}>
                <option value="unpaid">{type === 'income' ? 'Ждём оплату' : 'К оплате'}</option>
                <option value="paid">Оплачено</option>
            </Select>
          </div>
          <Textarea label="Назначение или комментарий" optionalLabel="необязательно" value={description} onChange={event => setDescription(event.target.value)} placeholder="Что важно помнить об этой оплате" rows={3} />
        </section>
      </form>
    </Sheet>
  )
}
