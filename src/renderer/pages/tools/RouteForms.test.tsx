import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import BankCheck from './BankCheck'
import DateCalc from './DateCalc'
import NumberToWords from './NumberToWords'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('tool route forms', () => {
  it('keeps bank details native, labelled and actionable when invalid', () => {
    render(<BankCheck />)

    const account = screen.getByRole('textbox', { name: 'Расчётный счёт' })
    expect(account.getAttribute('inputmode')).toBe('numeric')
    fireEvent.change(account, { target: { value: '123' } })
    expect(screen.getByRole('alert').textContent).toContain('3 из 20')

    const mfo = screen.getByRole('textbox', { name: 'МФО банка' })
    fireEvent.change(mfo, { target: { value: '99999' } })
    expect(screen.getAllByRole('alert').at(-1)?.textContent).toContain('Банк не найден')
  })

  it('exposes calculator modes and date inputs with permanent labels', () => {
    render(<DateCalc />)

    expect(screen.getByRole('group', { name: 'Режим калькулятора дат' })).toBeTruthy()
    expect(screen.getByLabelText(/^Начальная дата/).getAttribute('type')).toBe('date')
    expect(screen.getByLabelText(/^Конечная дата/).getAttribute('type')).toBe('date')

    fireEvent.click(screen.getByRole('button', { name: 'Прибавить дни к дате' }))
    expect(screen.getByRole('spinbutton', { name: 'Количество дней' })).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Тип прибавляемых дней' })).toBeTruthy()
  })

  it('uses shared money and select controls for number-to-words', () => {
    render(<NumberToWords />)

    const amount = screen.getByRole('textbox', { name: 'Сумма цифрами' })
    const currency = screen.getByRole('combobox', { name: 'Валюта' })
    expect(amount.getAttribute('inputmode')).toBe('decimal')
    expect((currency as HTMLSelectElement).value).toBe('sum')

    fireEvent.change(amount, { target: { value: '1250' } })
    expect(screen.getByText(/Русский/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Копировать' })).toHaveLength(2)
  })
})
