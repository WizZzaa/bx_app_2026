// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import TaxCalendar from './TaxCalendar'

describe('TaxCalendar dashboard module', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00'))
  })
  afterEach(() => cleanup())
  afterAll(() => vi.useRealTimers())

  it('keeps the calendar visible while unapproved common deadlines are withheld', () => {
    render(<TaxCalendar onPickDeadline={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Сроки и отчётность' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Проверяем календарь по официальным источникам')
    expect(screen.getByRole('button', { name: /20 Июль/i }).getAttribute('aria-pressed')).toBe('false')
  })

  it('opens an honest empty date and supports month navigation', () => {
    render(<TaxCalendar onPickDeadline={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /20 Июль/i }))
    expect(screen.getByRole('heading', { name: 'Общих сроков нет' })).toBeTruthy()
    expect(screen.getByText(/Личную задачу можно добавить/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }))
    expect(screen.getByText('Август', { exact: false })).toBeTruthy()
  })
})
