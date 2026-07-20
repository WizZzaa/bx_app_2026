import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaywallModal from './PaywallModal'

afterEach(cleanup)

describe('PaywallModal', () => {
  it('is a labelled modal, uses canonical prices and closes with Escape', () => {
    const onClose = vi.fn()
    render(<MemoryRouter><PaywallModal feature="История операций" onClose={onClose} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'История операций' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText(/200\s000 сум\/мес/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Сравнить тарифы' })).toBe(document.activeElement)
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps keyboard focus inside the dialog', () => {
    render(<MemoryRouter><PaywallModal feature="Экспорт" onClose={vi.fn()} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog')
    const secondary = screen.getByRole('button', { name: 'Продолжить в Free' })
    secondary.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Сравнить тарифы' })).toBe(document.activeElement)
  })
})
