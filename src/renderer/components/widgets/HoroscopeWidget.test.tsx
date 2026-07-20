// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import HoroscopeWidget from './HoroscopeWidget'

describe('HoroscopeWidget redesign', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-20T12:00:00'))
  })
  afterEach(() => cleanup())
  afterAll(() => vi.useRealTimers())

  it('presents the horoscope as an optional mood break, not accounting guidance', () => {
    render(<HoroscopeWidget />)

    expect(screen.getByRole('heading', { name: 'Бухгороскоп' })).toBeTruthy()
    expect(screen.getByText('20 июля')).toBeTruthy()
    expect(screen.getByText(/для настроения, не для решений/)).toBeTruthy()
    expect(screen.getByText('Счёт дня')).toBeTruthy()
    expect(screen.getByText('Цвет дня')).toBeTruthy()
  })

  it('allows another prediction and restores the deterministic forecast of the day', () => {
    render(<HoroscopeWidget />)

    fireEvent.click(screen.getByRole('button', { name: /Другой прогноз/ }))
    expect(screen.getAllByText('Другой прогноз').length).toBeGreaterThanOrEqual(2)
    fireEvent.click(screen.getByRole('button', { name: 'Вернуть прогноз дня' }))
    expect(screen.getByText('20 июля')).toBeTruthy()
  })
})
