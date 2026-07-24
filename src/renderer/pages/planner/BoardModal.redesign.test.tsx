import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BoardModal from './BoardModal'

afterEach(cleanup)

describe('BoardModal shared form redesign', () => {
  it('validates the name inline before saving', () => {
    const onSave = vi.fn()
    render(<BoardModal onSave={onSave} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))

    expect(screen.getByRole('alert').textContent).toContain('Введите название доски')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('preserves the board callback contract', () => {
    const onSave = vi.fn()
    render(<BoardModal onSave={onSave} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Название доски/), { target: { value: '  Клиенты  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать символ 📊' }))
    fireEvent.click(screen.getByRole('button', { name: 'Лавандовый' }))
    fireEvent.click(screen.getByRole('button', { name: 'Создать доску' }))

    expect(onSave).toHaveBeenCalledWith('Клиенты', '📊', 'purple')
  })
})
