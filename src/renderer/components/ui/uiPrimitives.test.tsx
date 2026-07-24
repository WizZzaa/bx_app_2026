import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button'
import DataTable from './DataTable'
import FormField from './FormField'
import { Textarea } from './FormControls'
import ListPanel, { ListPanelItem } from './ListPanel'

describe('BX accessible UI primitives', () => {
  it('connects a permanent field label, hint and actionable error', () => {
    render(<FormField label="Сумма" hint="В сумах" error="Введите сумму больше нуля" required>{props => <input {...props} />}</FormField>)
    const input = screen.getByRole('textbox', { name: /Сумма/ })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const describedBy = input.getAttribute('aria-describedby') || ''
    expect(describedBy).toContain('-hint')
    expect(describedBy).toContain('-error')
    expect(screen.getByRole('alert').textContent).toContain('больше нуля')
  })

  it('keeps multiline form input labelled, described and invalid when needed', () => {
    render(<Textarea label="Описание проблемы" hint="Не добавляйте пароль" error="Добавьте подробности" required />)
    const textarea = screen.getByRole('textbox', { name: /Описание проблемы/ })
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    expect(textarea.getAttribute('aria-describedby')).toContain('-hint')
    expect(screen.getByText('Добавьте подробности').getAttribute('role')).toBe('alert')
  })

  it('exposes loading state without changing the button label', () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Сохранить</Button>)
    const button = screen.getByRole('button', { name: /Сохранить/ })
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('labels scrollable tables and semantic lists', () => {
    render(<><DataTable label="Ставки"><tbody><tr><td>12%</td></tr></tbody></DataTable><ListPanel label="Документы"><ListPanelItem>Счёт</ListPanelItem></ListPanel></>)
    expect(screen.getByRole('region', { name: 'Ставки' })).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Документы' })).toBeTruthy()
    expect(screen.getByRole('listitem').textContent).toBe('Счёт')
  })
})
