import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginScreen from './LoginScreen'

const handlers = {
  onLegacySignIn: vi.fn(),
  onResetPassword: vi.fn(),
  onTelegramSignIn: vi.fn(),
  onRecoverWithCode: vi.fn(),
}

beforeEach(() => {
  Object.values(handlers).forEach(handler => handler.mockReset().mockResolvedValue(null))
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

afterEach(cleanup)

describe('Telegram-first LoginScreen', () => {
  it('shows Telegram as the primary flow and hides legacy credentials initially', async () => {
    render(<LoginScreen {...handlers} />)

    expect(screen.getByRole('button', { name: 'Продолжить через Telegram' })).toBeTruthy()
    expect(screen.queryByLabelText('Контактный email')).toBeNull()
    expect(screen.queryByText('Зарегистрироваться')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Продолжить через Telegram' }))
    await waitFor(() => expect(handlers.onTelegramSignIn).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('status').textContent).toContain('Подтвердите собственный контакт')
  })

  it('keeps an explicit migration path for an existing email account', async () => {
    render(<LoginScreen {...handlers} />)
    fireEvent.click(screen.getByRole('button', { name: 'Проблемы со входом?' }))
    fireEvent.click(screen.getByRole('button', { name: /Ранее входили по email и паролю/ }))

    fireEvent.change(screen.getByLabelText('Контактный email'), { target: { value: 'legacy@example.com' } })
    fireEvent.change(screen.getByLabelText('Старый пароль'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Перенести вход' }))

    await waitFor(() => expect(handlers.onLegacySignIn).toHaveBeenCalledWith('legacy@example.com', 'secret'))
    expect(localStorage.getItem('bx_needs_telegram_migration')).toBe('1')
  })

  it('preserves a referral code for the Telegram-created session', async () => {
    window.history.replaceState({}, '', '/?ref=bx2026')
    render(<LoginScreen {...handlers} />)

    expect(await screen.findByText(/BX2026/)).toBeTruthy()
    expect(localStorage.getItem('bx_pending_ref')).toBe('BX2026')
  })
})
