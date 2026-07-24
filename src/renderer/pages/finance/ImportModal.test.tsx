import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ParsedTransaction } from '../../lib/bankStatementParser'
import ImportModal from './ImportModal'

const transactions: ParsedTransaction[] = [
  {
    date: '2026-07-20',
    amount: 1_000_000,
    type: 'income',
    counterparty: 'ООО Клиент',
    description: 'Оплата услуг',
    status: 'paid',
  },
  {
    date: '2026-07-21',
    amount: 300_000,
    type: 'expense',
    counterparty: 'Арендодатель',
    description: 'Аренда помещения',
    status: 'paid',
  },
]

afterEach(cleanup)

describe('bank statement import form', () => {
  it('labels every row category and saves only selected operations', async () => {
    const onSave = vi.fn(async () => undefined)
    render(<ImportModal isOpen transactions={transactions} onSave={onSave} onClose={vi.fn()} />)

    const categories = screen.getAllByRole('combobox', { name: 'Категория' })
    expect(categories).toHaveLength(2)
    expect((categories[1] as HTMLSelectElement).value).toBe('Аренда')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Импортировать операцию 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Импортировать 1' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({ counterparty: 'Арендодатель', category: 'Аренда' }),
    ])
  })
})
