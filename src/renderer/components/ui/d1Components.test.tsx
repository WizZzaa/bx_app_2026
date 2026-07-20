import React from 'react'
import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BentoGrid, BentoItem } from './BentoGrid'
import { Dialog } from './Dialog'
import { Sheet } from './Sheet'
import { Skeleton, SkeletonGroup } from './Skeleton'
import { StatePanel } from './StatePanel'

describe('D1 base UI components', () => {
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

  it('exposes responsive bento spans without changing content semantics', () => {
    const { getByRole, getByText } = render(
      <BentoGrid as="section" aria-label="Сводка">
        <BentoItem span="lg">Основной блок</BentoItem>
      </BentoGrid>,
    )
    expect(getByRole('region', { name: 'Сводка' }).className).toContain('bx-d1-bento-grid')
    expect(getByText('Основной блок').className).toContain('bx-d1-bento-item--lg')
  })

  it('announces skeleton groups while keeping decorative bars hidden', () => {
    const { getByRole, container } = render(
      <SkeletonGroup label="Загружаем отчёт"><Skeleton width="50%" /></SkeletonGroup>,
    )
    expect(getByRole('status').textContent).toContain('Загружаем отчёт')
    expect(container.querySelector('.bx-d1-skeleton')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('uses assertive semantics only for actionable failure states', () => {
    const { getByRole, rerender } = render(
      <StatePanel status="error" title="Не удалось загрузить" description="Повторите попытку" />,
    )
    expect(getByRole('alert').getAttribute('aria-live')).toBe('assertive')

    rerender(<StatePanel status="empty" title="Пока пусто" />)
    expect(getByRole('status').getAttribute('aria-live')).toBe('polite')
  })

  it('closes a dialog on Escape and restores the previous focus', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const onClose = vi.fn()

    const { getByRole, unmount } = render(
      <Dialog open onClose={onClose} title="Настройки">
        <button type="button">Сохранить</button>
      </Dialog>,
    )

    expect(getByRole('dialog', { name: 'Настройки' })).toBeTruthy()
    expect(getByRole('button', { name: 'Закрыть' })).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('traps Tab navigation inside the dialog', () => {
    render(
      <Dialog
        open
        onClose={() => undefined}
        title="Подтверждение"
        footer={<button type="button">Последнее действие</button>}
      >
        <button type="button">Первое действие</button>
      </Dialog>,
    )

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
  })

  it('lets the mobile Back event close dialogs and sheets without writing history', () => {
    const dialogClose = vi.fn()
    render(<Dialog open onClose={dialogClose} title="Подтверждение">Содержимое</Dialog>)
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(dialogClose).toHaveBeenCalledTimes(1)
    cleanup()

    const sheetClose = vi.fn()
    const pushState = vi.spyOn(window.history, 'pushState')
    render(<Sheet open onClose={sheetClose} title="Фильтры">Содержимое</Sheet>)

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(sheetClose).toHaveBeenCalledTimes(1)
    expect(pushState).not.toHaveBeenCalled()
  })

  it('keeps every overlay close target at the canonical 44px minimum', () => {
    const tokens = readFileSync('src/shared/design/tokens.css', 'utf8')
    const components = readFileSync('src/renderer/components/ui/design-system.css', 'utf8')
    expect(tokens).toContain('--bx-target-min: 2.75rem;')
    expect(components).toMatch(/\.bx-d1-overlay__close\s*\{[\s\S]*min-width:\s*var\(--bx-target-min\);[\s\S]*min-height:\s*var\(--bx-target-min\);/)
  })
})
