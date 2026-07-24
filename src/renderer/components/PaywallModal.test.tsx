import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaywallModal from './PaywallModal'

afterEach(cleanup)

describe('PaywallModal', () => {
  it('is a labelled modal, uses canonical prices and closes with Escape', async () => {
    const onClose = vi.fn()
    render(<MemoryRouter><PaywallModal feature="История операций" onClose={onClose} /></MemoryRouter>)
    const dialog = screen.getByRole('dialog', { name: 'История операций' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText(/200\s000 сум\/мес/)).toBeTruthy()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Сравнить тарифы' })).toBe(document.activeElement))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps keyboard focus inside the dialog', async () => {
    render(<MemoryRouter><PaywallModal feature="Экспорт" onClose={vi.fn()} /></MemoryRouter>)
    const close = screen.getByRole('button', { name: 'Закрыть предложение подписки' })
    close.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Сравнить тарифы' })).toBe(document.activeElement)
    })
  })
})
