import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackWidgetEvent } from '../lib/adminWidgetPolicy'
import WidgetBoundary from './WidgetBoundary'

vi.mock('../lib/adminWidgetPolicy', () => ({
  trackWidgetEvent: vi.fn().mockResolvedValue(undefined),
}))

const trackWidgetEventMock = vi.mocked(trackWidgetEvent)

function BrokenWidget(): React.JSX.Element {
  throw new Error('Widget crashed')
}

describe('WidgetBoundary telemetry', () => {
  beforeEach(() => {
    trackWidgetEventMock.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('tracks a successful initial mount once', () => {
    render(
      <WidgetBoundary name="Погода" widgetId="weather">
        <div>Прогноз загружен</div>
      </WidgetBoundary>,
    )

    expect(screen.getByText('Прогноз загружен')).toBeTruthy()
    expect(trackWidgetEventMock).toHaveBeenCalledTimes(1)
    expect(trackWidgetEventMock).toHaveBeenCalledWith('weather', 'load_success', expect.any(Number))
  })

  it('tracks only an error when a child throws during initial mount', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <WidgetBoundary name="Погода" widgetId="weather">
        <BrokenWidget />
      </WidgetBoundary>,
    )

    expect(screen.getByText('Виджет «Погода» не загрузился')).toBeTruthy()
    expect(screen.getByText('Widget crashed')).toBeTruthy()
    expect(trackWidgetEventMock).toHaveBeenCalledTimes(1)
    expect(trackWidgetEventMock).toHaveBeenCalledWith('weather', 'load_error', expect.any(Number))
    expect(trackWidgetEventMock).not.toHaveBeenCalledWith('weather', 'load_success', expect.any(Number))
  })
})
