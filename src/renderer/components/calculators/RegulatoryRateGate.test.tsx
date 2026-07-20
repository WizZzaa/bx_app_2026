import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RegulatoryRateGate } from './RegulatoryRateGate'

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

describe('RegulatoryRateGate', () => {
  it('does not mount a regulated calculator before explicit confirmation', () => {
    render(<RegulatoryRateGate calculatorId="vat"><div>calculator result</div></RegulatoryRateGate>)

    expect(screen.queryByText('calculator result')).toBeNull()
    expect(screen.getByText('Авторасчёт приостановлен')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Я сверил ставки — рассчитать' }))

    expect(screen.getByText('calculator result')).toBeTruthy()
    expect(sessionStorage.length).toBe(1)
  })

  it('renders a non-regulatory utility without confirmation', () => {
    render(<RegulatoryRateGate calculatorId="currency"><div>currency converter</div></RegulatoryRateGate>)
    expect(screen.getByText('currency converter')).toBeTruthy()
    expect(screen.queryByText('Авторасчёт приостановлен')).toBeNull()
  })
})
