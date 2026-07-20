import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import DocumentsTabs from './DocumentsTabs'

describe('DocumentsTabs', () => {
  it('exposes templates and personal documents as two tabs of one section', () => {
    render(<MemoryRouter><DocumentsTabs current="templates" /></MemoryRouter>)
    expect(screen.getByRole('navigation', { name: 'Раздел Документы' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Шаблоны' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Мои документы' }).getAttribute('aria-current')).toBeNull()
  })
})
