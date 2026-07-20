import React from 'react'
import { act, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RouteFocusManager from './RouteFocusManager'

function Fixture() {
  const navigate = useNavigate()
  return <main id="bx-main-content"><RouteFocusManager /><button onClick={() => navigate('/second')}>Далее</button><Routes><Route path="/" element={<h1>Первая</h1>} /><Route path="/second" element={<h1>Вторая</h1>} /></Routes></main>
}

describe('RouteFocusManager', () => {
  it('moves focus to the route heading after navigation', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1 })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    const view = render(<MemoryRouter><Fixture /></MemoryRouter>)
    expect(document.activeElement?.textContent).toBe('Первая')
    await act(async () => view.getByRole('button', { name: 'Далее' }).click())
    expect(document.activeElement?.textContent).toBe('Вторая')
    vi.restoreAllMocks()
  })
})
