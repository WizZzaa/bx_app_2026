import React, { useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
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
const field = 'bx-a6-field min-h-11 w-full rounded-xl border border-bx-border bg-bx-bg px-3 text-xs font-semibold text-bx-text outline-none'
const label = 'block text-[10px] font-black uppercase tracking-wider text-bx-muted'
const today = todayISO()

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
  const { rates } = useExchangeRates()
  const { counterparties } = useCounterparties(companyId)

  function handleCurrencyChange(nextCurrency: string) {
    setCurrency(nextCurrency)
    setExchangeRate(nextCurrency === 'UZS' ? 1 : rates[nextCurrency] || 1)
  }

  async function save() {
    const parsedAmount = Number.parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0 || saving) return
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
      ? <div className="bx-a6-sheet__delete-confirm"><span>Удалить обязательство?</span><button type="button" onClick={onDelete}>Удалить</button><button type="button" onClick={() => setConfirmDel(false)}>Оставить</button></div>
      : <button type="button" onClick={() => setConfirmDel(true)} className="bx-a6-sheet__destructive">Удалить</button>
    : null

  const footer = (
    <div className="bx-a6-sheet__footer">
      <div className="bx-a6-sheet__footer-leading">{deleteControl}</div>
      <button type="button" onClick={onClose} disabled={saving} className="bx-a6-button bx-a6-button--secondary">Отмена</button>
      <button type="button" onClick={() => void save()} disabled={!Number.parseFloat(amount) || saving} className="bx-a6-button bx-a6-button--primary">
        {saving ? 'Сохраняю…' : isEdit ? 'Сохранить изменения' : 'Добавить в контроль'}
      </button>
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
      <div className="bx-a6-form">
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
            <label className={label}>Сумма *
              <input autoFocus type="number" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0" className={`${field} mt-1.5`} onKeyDown={event => { if (event.key === 'Enter') void save() }} />
            </label>
            <label className={label}>Валюта
              <select value={currency} onChange={event => handleCurrencyChange(event.target.value)} className={`${field} mt-1.5`}>
                <option value="UZS">UZS (сум)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="RUB">RUB (₽)</option>
              </select>
            </label>
          </div>
          <div className={`grid gap-3 ${currency === 'UZS' ? '' : 'grid-cols-2'}`}>
            {currency !== 'UZS' && <label className={label}>Курс к UZS
              <input type="number" value={exchangeRate} onChange={event => setExchangeRate(Number(event.target.value))} placeholder="1" className={`${field} mt-1.5`} />
            </label>}
            <label className={label}>{status === 'unpaid' ? 'Срок оплаты' : 'Дата оплаты'}
              <input type="date" value={date} onChange={event => setDate(event.target.value)} className={`${field} mt-1.5`} />
            </label>
          </div>
        </section>

        <section className="bx-a6-form__section" aria-labelledby="transaction-details-title">
          <div className="bx-a6-form__heading"><span>2</span><div><h3 id="transaction-details-title">С кем и за что</h3><p>Выберите сохранённого контрагента или впишите нового.</p></div></div>
          <label className={label}>Контрагент
            <input list="transaction-counterparties" value={counterparty} onChange={event => setCounterparty(event.target.value)} placeholder="Название организации" className={`${field} mt-1.5`} />
            <datalist id="transaction-counterparties">{counterparties.map(item => <option key={item.id} value={item.name}>{item.inn}</option>)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>Категория
              <input list="tx-cats" value={category} onChange={event => setCategory(event.target.value)} placeholder="Выберите или впишите" className={`${field} mt-1.5`} />
              <datalist id="tx-cats">{categories.map(item => <option key={item} value={item} />)}</datalist>
            </label>
            <label className={label}>Статус
              <select value={status} onChange={event => setStatus(event.target.value as 'paid' | 'unpaid')} className={`${field} mt-1.5`}>
                <option value="unpaid">{type === 'income' ? 'Ждём оплату' : 'К оплате'}</option>
                <option value="paid">Оплачено</option>
              </select>
            </label>
          </div>
          <label className={label}>Назначение или комментарий
            <textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Что важно помнить об этой оплате" rows={3} className={`${field} mt-1.5 resize-y py-3`} />
          </label>
        </section>
      </div>
    </Sheet>
  )
}
