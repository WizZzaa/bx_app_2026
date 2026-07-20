import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TelegramMigrationGate from './TelegramMigrationGate'

const rpc = vi.hoisted(() => vi.fn())
vi.mock('../../lib/db/supabase', () => ({ supabase: { rpc } }))

beforeEach(() => {
  rpc.mockReset()
  localStorage.setItem('bx_needs_telegram_migration', '1')
})

afterEach(cleanup)

describe('TelegramMigrationGate', () => {
  it('finishes immediately when the legacy account is already linked', async () => {
    rpc.mockResolvedValue({ data: { telegramVerified: true }, error: null })
    const onComplete = vi.fn()
    render(<TelegramMigrationGate onComplete={onComplete} onSignOut={vi.fn()} />)

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(localStorage.getItem('bx_needs_telegram_migration')).toBeNull()
  })

  it('creates a Telegram link for an unlinked legacy account', async () => {
    rpc
      .mockResolvedValueOnce({ data: { telegramVerified: false }, error: null })
      .mockResolvedValueOnce({ data: { challengeId: 'challenge-1', token: 'token-1' }, error: null })
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<TelegramMigrationGate onComplete={vi.fn()} onSignOut={vi.fn()} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Связать с Telegram' }))
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('bx_create_telegram_link_challenge'))
    expect(open).toHaveBeenCalledWith(expect.stringContaining('Tech_support_bx_bot?start=token-1'), '_blank')
    open.mockRestore()
  })

  it('does not lock data when the identity service is unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'offline' } })
    const onComplete = vi.fn()
    render(<TelegramMigrationGate onComplete={onComplete} onSignOut={vi.fn()} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Продолжить и подтвердить в кабинете' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('bx_needs_telegram_migration')).toBe('1')
  })
})
