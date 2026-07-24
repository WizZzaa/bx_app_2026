import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EventModal from './EventModal'

afterEach(cleanup)

describe('EventModal task-first redesign', () => {
  it('keeps the essential fields visible and saves without opening advanced settings', () => {
    const onSave = vi.fn()
    render(<EventModal defaultDate="2026-07-20" onSave={onSave} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Новая задача или событие' })).toBeTruthy()
    expect(screen.getByLabelText(/Название/)).toBeTruthy()
    expect(screen.getByText('Дополнительные настройки').closest('details')?.open).toBe(false)

    fireEvent.change(screen.getByLabelText(/Название/), { target: { value: 'Сверить отчёт' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Сверить отчёт',
      date: '2026-07-20',
      type: 'task',
    }))
  })

  it('shows an inline error instead of silently ignoring an empty title', () => {
    const onSave = vi.fn()
    render(<EventModal defaultDate="2026-07-20" onSave={onSave} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(screen.getByRole('alert').textContent).toContain('Введите короткое и понятное название')
    expect(onSave).not.toHaveBeenCalled()
  })

  it('exposes recurrence, tags and reminder as progressive details', () => {
    render(<EventModal defaultDate="2026-07-20" onSave={vi.fn()} onClose={vi.fn()} />)

    fireEvent.click(screen.getByText('Дополнительные настройки'))
    expect(screen.getByLabelText(/Повторение/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '#НДС' })).toBeTruthy()
  })
})
