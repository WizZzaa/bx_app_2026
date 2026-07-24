import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './ToastContext'

function Harness({ onUndo }: { onUndo: () => void }) {
  const toast = useToast()
  return <button type="button" onClick={() => toast.undo('Запись удалена', onUndo)}>Удалить</button>
}

describe('Toast undo', () => {
  afterEach(cleanup)

  it('offers a polite recovery action without stealing focus', () => {
    const onUndo = vi.fn()
    render(<ToastProvider><Harness onUndo={onUndo} /></ToastProvider>)

    const trigger = screen.getByRole('button', { name: 'Удалить' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(screen.getByRole('status').textContent).toContain('Запись удалена')
    expect(trigger).toBe(document.activeElement)
    fireEvent.click(screen.getByRole('button', { name: 'Отменить' }))
    expect(onUndo).toHaveBeenCalledOnce()
  })
})
