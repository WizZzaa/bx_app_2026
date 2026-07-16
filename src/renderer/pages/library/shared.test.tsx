import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { highlight } from './shared'

describe('knowledge search highlight', () => {
  it('uses a high-contrast marker in light and dark themes', () => {
    render(<p>{highlight('Социальный налог', 'соц')}</p>)
    const marker = screen.getByText('Соц')
    expect(marker.tagName).toBe('MARK')
    expect(marker.className).toContain('bg-amber-200')
    expect(marker.className).toContain('text-amber-950')
    expect(marker.className).toContain('dark:bg-amber-300/20')
    expect(marker.className).toContain('dark:text-amber-100')
  })
})
