import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useConfirmationDialog } from './useConfirmationDialog'

function Harness({ onResult }: { onResult: (value: boolean) => void }) {
  const { confirm, confirmationDialog } = useConfirmationDialog()
  return (
    <>
      <button
        type="button"
        onClick={() => {
          void confirm({
            title: 'Удалить запись?',
            description: 'Это действие нельзя отменить.',
            confirmLabel: 'Удалить',
            tone: 'destructive',
          }).then(onResult)
        }}
      >
        Открыть
      </button>
      {confirmationDialog}
    </>
  )
}

describe('useConfirmationDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    document.body.style.overflow = ''
  })

  it('resolves true only after the explicit destructive action', async () => {
    const onResult = vi.fn()
    render(<Harness onResult={onResult} />)

    fireEvent.click(screen.getByRole('button', { name: 'Открыть' }))
    expect(await screen.findByRole('button', { name: 'Отмена' })).toBe(document.activeElement)
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it('resolves false on Escape and restores focus to the trigger', async () => {
    const onResult = vi.fn()
    render(<Harness onResult={onResult} />)
    const trigger = screen.getByRole('button', { name: 'Открыть' })

    trigger.focus()
    fireEvent.click(trigger)
    await screen.findByRole('button', { name: 'Отмена' })
    fireEvent.keyDown(document, { key: 'Escape' })

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
    expect(trigger).toBe(document.activeElement)
  })
})
