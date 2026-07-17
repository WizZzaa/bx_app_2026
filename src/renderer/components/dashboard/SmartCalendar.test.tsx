import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import SmartCalendar from './SmartCalendar'

describe('SmartCalendar dashboard preview', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-07-16T12:00:00')) })
  afterAll(() => vi.useRealTimers())

  it('shows entries on hover and adds a task on the selected date', () => {
    const onAdd = vi.fn()
    const onOpenEntry = vi.fn()
    render(
      <SmartCalendar
        marks={{ deadlines: new Set(), tasks: new Set([20]) }}
        entries={[{ id: 'event-1', date: '2026-07-20', title: 'Сдать отчёт', type: 'task', priority: 'high' }]}
        onOpen={vi.fn()}
        onAdd={onAdd}
        onOpenEntry={onOpenEntry}
      />,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: /20 июль 2026 г\.: 1 задач/i }))
    expect(screen.getByText('Сдать отчёт')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))
    expect(onAdd).toHaveBeenCalledWith('2026-07-20')

    fireEvent.click(screen.getByRole('button', { name: /Сдать отчёт/i }))
    expect(onOpenEntry).toHaveBeenCalledWith('event-1')
  })
})
