import React, { useState, useEffect } from 'react'
import type { ParsedTransaction } from '../../lib/bankStatementParser'
import Icon from '../../lib/ui/Icon'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: ParsedTransaction[]
  onSave: (selected: ParsedTransaction[]) => Promise<void>
}

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n))
}

export default function ImportModal({ isOpen, onClose, transactions, onSave }: ImportModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [items, setItems] = useState<ParsedTransaction[]>([])
  const categories = [
    'Аренда', 'Зарплата', 'Налоги', 'Услуги связи', 'Хозяйственные расходы', 
    'Оборудование', 'Маркетинг', 'Поступление от клиента', 'Прочее'
  ]
  const [itemCategories, setItemCategories] = useState<{ [key: number]: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(transactions)
    setSelectedIndices(transactions.map((_, i) => i))
    
    // Автоматическое сопоставление категорий по типу
    const defaultCats: { [key: number]: string } = {}
    transactions.forEach((tx, idx) => {
      if (tx.type === 'income') {
        defaultCats[idx] = 'Поступление от клиента'
      } else {
        // Пробуем угадать по описанию
        const desc = tx.description.toLowerCase()
        if (desc.includes('налог') || desc.includes('ндс') || desc.includes('бюджет')) {
          defaultCats[idx] = 'Налоги'
        } else if (desc.includes('аренд') || desc.includes('помещен')) {
          defaultCats[idx] = 'Аренда'
        } else if (desc.includes('зарплат') || desc.includes('начислен') || desc.includes('сотр')) {
          defaultCats[idx] = 'Зарплата'
        } else if (desc.includes('услуг') || desc.includes('связ') || desc.includes('интернет')) {
          defaultCats[idx] = 'Услуги связи'
        } else {
          defaultCats[idx] = 'Прочее'
        }
      }
    })
    setItemCategories(defaultCats)
  }, [transactions])

  if (!isOpen) return null

  const handleToggleSelect = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const handleToggleAll = () => {
    if (selectedIndices.length === items.length) {
      setSelectedIndices([])
    } else {
      setSelectedIndices(items.map((_, i) => i))
    }
  }

  const handleCategoryChange = (index: number, cat: string) => {
    setItemCategories(prev => ({ ...prev, [index]: cat }))
  }

  const handleSaveClick = async () => {
    if (selectedIndices.length === 0) return
    setSaving(true)
    
    const toSave = selectedIndices.map(idx => ({
      ...items[idx],
      category: itemCategories[idx] || undefined
    }))
    
    await onSave(toSave)
    setSaving(false)
    onClose()
  }

  const totalIncome = items
    .filter((_, i) => selectedIndices.includes(i))
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = items
    .filter((_, i) => selectedIndices.includes(i))
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="statement-import-title" className="bg-bx-surface border border-bx-border rounded-[24px] w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-bx-border flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Предварительная проверка</p>
            <h3 id="statement-import-title" className="mt-1 text-base font-black text-bx-text">Импорт банковской выписки</h3>
            <p className="text-xs text-bx-muted mt-0.5">
              Найдено операций: {items.length}. Выбрано для импорта: {selectedIndices.length}
            </p>
          </div>
          <button type="button" aria-label="Закрыть импорт" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-bx-muted transition-colors hover:bg-bx-surface-2 hover:text-bx-text"><Icon name="crossSmall" className="h-4 w-4" /></button>
        </div>

        {/* Список транзакций */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-bx-border text-[11px] text-bx-muted uppercase tracking-wider">
                  <th className="py-2 px-3 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedIndices.length === items.length && items.length > 0}
                      onChange={handleToggleAll}
                      className="rounded border-bx-border-2 bg-bx-bg text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-3 w-28">Дата</th>
                  <th className="py-2 px-3 w-28">Тип</th>
                  <th className="py-2 px-3">Контрагент</th>
                  <th className="py-2 px-3 w-40">Категория</th>
                  <th className="py-2 px-3 w-36 text-right">Сумма (сум)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bx-border/50 text-xs text-bx-text">
                {items.map((tx, idx) => {
                  const isChecked = selectedIndices.includes(idx)
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-bx-surface-2/20 transition-colors ${!isChecked ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3 px-3">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleToggleSelect(idx)}
                          className="rounded border-bx-border-2 bg-bx-bg text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {new Date(tx.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          {tx.type === 'income' ? 'Нам поступило' : 'Мы оплатили'}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate" title={tx.description}>
                        <div className="font-medium truncate">{tx.counterparty}</div>
                        <div className="text-[10px] text-bx-muted truncate mt-0.5">{tx.description}</div>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={itemCategories[idx] || ''}
                          onChange={e => handleCategoryChange(idx, e.target.value)}
                          className="w-full bg-bx-bg text-bx-text text-xs rounded border border-bx-border-2 px-2 py-1 focus:outline-none focus:border-blue-500/50"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className={`py-3 px-3 text-right font-semibold font-mono text-sm ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Подвал / Итоги */}
        <div className="px-6 py-4 border-t border-bx-border bg-bx-bg/50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-6 text-xs">
            <div>
              <span className="text-bx-muted">Доходы к импорту:</span>
              <span className="text-emerald-400 font-semibold font-mono ml-2">{fmt(totalIncome)} сум</span>
            </div>
            <div>
              <span className="text-bx-muted">Расходы к импорту:</span>
              <span className="text-red-400 font-semibold font-mono ml-2">{fmt(totalExpense)} сум</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-bx-border-2 text-bx-text hover:text-bx-text text-xs font-medium rounded-lg hover:bg-bx-surface-2 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={selectedIndices.length === 0 || saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-bx-surface-2 disabled:text-bx-muted text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              {saving ? 'Импорт...' : `Импортировать (${selectedIndices.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
