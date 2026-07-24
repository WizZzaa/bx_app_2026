import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DateField, Field, MoneyField, Select, Upload } from './FormControls'

afterEach(cleanup)

describe('A9 form controls', () => {
  it('connects visible labels, hints and inline errors to native controls', () => {
    render(
      <Field
        label="ИНН"
        required
        hint="9 цифр"
        error="Проверьте номер"
        value="12"
        onChange={() => undefined}
      />,
    )

    const input = screen.getByRole('textbox', { name: /ИНН/ })
    expect(input.getAttribute('required')).not.toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toContain('-hint')
    expect(input.getAttribute('aria-describedby')).toContain('-error')
    expect(screen.getByRole('alert').textContent).toBe('Проверьте номер')
  })

  it('keeps select, date and money controls semantic and touch-ready', () => {
    render(
      <>
        <Select label="Валюта" value="USD" onChange={() => undefined}>
          <option>USD</option>
        </Select>
        <DateField label="Дата" value="2026-07-24" onChange={() => undefined} />
        <MoneyField label="Сумма" currency="UZS" value="1500" onChange={() => undefined} />
      </>,
    )

    expect(screen.getByRole('combobox', { name: /Валюта/ })).toBeTruthy()
    expect(screen.getByLabelText(/Дата/).getAttribute('type')).toBe('date')
    expect(screen.getByRole('textbox', { name: /Сумма/ }).getAttribute('inputmode')).toBe('decimal')
    expect(screen.getByText('UZS').getAttribute('aria-hidden')).toBe('true')
  })

  it('accepts a dropped file without storing or uploading it implicitly', () => {
    const onFiles = vi.fn()
    const file = new File(['demo'], 'contract.pdf', { type: 'application/pdf' })
    const { container } = render(
      <Upload label="Документ" accept=".pdf" onFiles={onFiles} />,
    )

    fireEvent.drop(container.querySelector('.bx-d1-upload') as HTMLElement, {
      dataTransfer: { files: [file] },
    })
    expect(onFiles).toHaveBeenCalledWith([file])
  })
})
