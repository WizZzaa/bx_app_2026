import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfirmationDialog } from './ConfirmationDialog'
import { PopoverMenu } from './PopoverMenu'

describe('A9 overlays', () => {
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

  it('focuses the safe action before a destructive confirmation', () => {
    render(
      <ConfirmationDialog
        open
        title="Удалить документ?"
        description="Восстановить файл не получится."
        confirmLabel="Удалить"
        tone="destructive"
        onConfirm={() => undefined}
        onClose={() => undefined}
      />,
    )

    expect(screen.getByRole('button', { name: 'Отмена' })).toBe(document.activeElement)
    expect(screen.getByRole('button', { name: 'Удалить' }).className).toContain('bg-red-600')
  })

  it('supports arrow navigation and Escape in a context menu', () => {
    const onClose = vi.fn()
    render(
      <PopoverMenu open onClose={onClose} label="Действия" x={12} y={16}>
        <button type="button" role="menuitem">Первое</button>
        <button type="button" role="menuitem">Второе</button>
      </PopoverMenu>,
    )

    expect(screen.getByRole('menuitem', { name: 'Первое' })).toBe(document.activeElement)
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(screen.getByRole('menuitem', { name: 'Второе' })).toBe(document.activeElement)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
