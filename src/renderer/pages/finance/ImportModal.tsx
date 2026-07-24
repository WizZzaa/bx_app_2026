import React, { useEffect, useState } from 'react'
import { Sheet } from '../../components/ui/Sheet'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/FormControls'
import type { ParsedTransaction } from '../../lib/bankStatementParser'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: ParsedTransaction[]
  onSave: (selected: ParsedTransaction[]) => Promise<void>
}

const categories = ['Аренда', 'Зарплата', 'Налоги', 'Услуги связи', 'Хозяйственные расходы', 'Оборудование', 'Маркетинг', 'Поступление от клиента', 'Прочее']

function fmt(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value))
}

function guessedCategory(transaction: ParsedTransaction): string {
  if (transaction.type === 'income') return 'Поступление от клиента'
  const description = transaction.description.toLowerCase()
  if (description.includes('налог') || description.includes('ндс') || description.includes('бюджет')) return 'Налоги'
  if (description.includes('аренд') || description.includes('помещен')) return 'Аренда'
  if (description.includes('зарплат') || description.includes('начислен') || description.includes('сотр')) return 'Зарплата'
  if (description.includes('услуг') || description.includes('связ') || description.includes('интернет')) return 'Услуги связи'
  return 'Прочее'
}

export default function ImportModal({ isOpen, onClose, transactions, onSave }: ImportModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [items, setItems] = useState<ParsedTransaction[]>([])
  const [itemCategories, setItemCategories] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(transactions)
    setSelectedIndices(transactions.map((_, index) => index))
    setItemCategories(Object.fromEntries(transactions.map((transaction, index) => [index, guessedCategory(transaction)])))
  }, [transactions])

  const selected = new Set(selectedIndices)
  const selectedItems = items.filter((_, index) => selected.has(index))
  const totalIncome = selectedItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = selectedItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)

  function toggle(index: number) {
    setSelectedIndices(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index])
  }

  function toggleAll() {
    setSelectedIndices(current => current.length === items.length ? [] : items.map((_, index) => index))
  }

  async function save() {
    if (!selectedIndices.length || saving) return
    setSaving(true)
    try {
      await onSave(selectedIndices.map(index => ({ ...items[index], category: itemCategories[index] || undefined })))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <div className="bx-a6-sheet__footer bx-a6-import-sheet__footer">
      <div className="bx-a6-import-summary" aria-live="polite">
        <span><small>Поступления</small><strong>+{fmt(totalIncome)} сум</strong></span>
        <span><small>Списания</small><strong>−{fmt(totalExpense)} сум</strong></span>
      </div>
      <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="bx-a6-button bx-a6-button--secondary">Отмена</Button>
      <Button type="button" onClick={() => void save()} disabled={!selectedIndices.length} loading={saving} className="bx-a6-button bx-a6-button--primary">
        Импортировать {selectedIndices.length}
      </Button>
    </div>
  )

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Проверка банковской выписки"
      description={`Найдено ${items.length} операций. Снимите выбор с лишних строк и уточните категории до импорта.`}
      closeLabel="Закрыть проверку выписки"
      className="bx-a6-sheet bx-a6-import-sheet"
      footer={footer}
    >
      <div className="bx-a6-import-toolbar">
        <label>
          <input type="checkbox" checked={items.length > 0 && selectedIndices.length === items.length} onChange={toggleAll} />
          Выбрать все
        </label>
        <span>{selectedIndices.length} из {items.length} попадут в контроль оплат</span>
      </div>

      <div className="bx-a6-import-list">
        {items.map((transaction, index) => {
          const isChecked = selected.has(index)
          return (
            <article key={`${transaction.date}-${transaction.amount}-${index}`} data-selected={isChecked}>
              <label className="bx-a6-import-list__check">
                <input type="checkbox" checked={isChecked} onChange={() => toggle(index)} />
                <span className="sr-only">Импортировать операцию {index + 1}</span>
              </label>
              <div className="bx-a6-import-list__main">
                <div><strong>{transaction.counterparty || 'Без контрагента'}</strong><time>{new Date(transaction.date).toLocaleDateString('ru-RU')}</time></div>
                <p title={transaction.description}>{transaction.description || 'Назначение не указано'}</p>
                <Select
                  label="Категория"
                  containerClassName="bx-a6-import-category"
                  value={itemCategories[index] || ''}
                  onChange={event => setItemCategories(current => ({ ...current, [index]: event.target.value }))}
                >
                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                </Select>
              </div>
              <div className="bx-a6-import-list__amount" data-type={transaction.type}>
                <span>{transaction.type === 'income' ? 'Поступление' : 'Списание'}</span>
                <strong>{transaction.type === 'income' ? '+' : '−'}{fmt(transaction.amount)}</strong>
                <small>сум</small>
              </div>
            </article>
          )
        })}
      </div>
    </Sheet>
  )
}
