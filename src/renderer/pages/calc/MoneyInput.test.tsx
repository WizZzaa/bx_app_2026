import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MoneyInput from './MoneyInput'

afterEach(cleanup)

describe('calculator MoneyInput', () => {
  it('keeps the shared permanent label and preserves live amount formatting', () => {
    const onChange = vi.fn()
    render(<MoneyInput label="Сумма операции" hint="Введите сумму без пробелов" value="" onChange={onChange} />)

    const input = screen.getByRole('textbox', { name: 'Сумма операции' })
    expect(input.getAttribute('inputmode')).toBe('decimal')
    expect(input.getAttribute('aria-describedby')).toContain('-hint')

    fireEvent.change(input, { target: { value: '1234567,89' } })
    expect(onChange).toHaveBeenCalledWith('1 234 567,89')
  })
})
