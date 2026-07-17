import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import DocumentWorkflowBridge from './DocumentWorkflowBridge'

afterEach(cleanup)

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

describe('DocumentWorkflowBridge', () => {
  it('explains the shared workflow and opens templates from Documents', () => {
    render(<MemoryRouter initialEntries={['/documents']}><DocumentWorkflowBridge current="documents" /><LocationProbe /></MemoryRouter>)

    expect(screen.getByText('Шаблоны и Документы работают вместе')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Перейти к шаблонам/ }))
    expect(screen.getByTestId('location').textContent).toBe('/templates')
  })

  it('opens the document archive from Templates', () => {
    render(<MemoryRouter initialEntries={['/templates']}><DocumentWorkflowBridge current="templates" /><LocationProbe /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /Открыть Документы/ }))
    expect(screen.getByTestId('location').textContent).toBe('/documents')
  })
})
