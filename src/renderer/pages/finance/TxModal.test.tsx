import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TxModal from './TxModal'

vi.mock('../../lib/useExchangeRates', () => ({
  useExchangeRates: () => ({ rates: { UZS: 1, USD: 12_800, EUR: 13_900, RUB: 145 } }),
}))

vi.mock('../../lib/db/useCounterparties', () => ({
  useCounterparties: () => ({
    counterparties: [{ id: 'cp-1', name: 'ООО Тест', inn: '123456789' }],
  }),
}))

afterEach(cleanup)

describe('finance transaction form', () => {
  it('shows an inline amount error and focuses the first invalid field', async () => {
    render(<TxModal companyId="company-1" onSave={vi.fn()} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Добавить в контроль' }))

    const amount = screen.getByRole('textbox', { name: /Сумма/ })
    expect(await screen.findByText('Введите сумму больше нуля.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(amount))
    expect(amount.getAttribute('aria-invalid')).toBe('true')
  })

  it('submits the existing transaction contract through the native form', async () => {
    const onSave = vi.fn(async () => undefined)
    render(<TxModal companyId="company-1" onSave={onSave} onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: /Сумма/ }), { target: { value: '250000' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Валюта' }), { target: { value: 'USD' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Контрагент' }), { target: { value: 'ООО Тест' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Категория' }), { target: { value: 'Услуги' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Назначение или комментарий' }), { target: { value: 'Счёт №5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в контроль' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      company_id: 'company-1',
      type: 'income',
      amount: 250000,
      currency: 'USD',
      exchange_rate: 12_800,
      category: 'Услуги',
      counterparty: 'ООО Тест',
      description: 'Счёт №5',
      status: 'unpaid',
    }))
  })
})
