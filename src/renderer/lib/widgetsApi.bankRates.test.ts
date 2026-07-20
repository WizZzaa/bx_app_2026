import { afterEach, describe, expect, it, vi } from 'vitest'
import { widgetsApi } from './widgetsApi'

describe('browser bank rates transport', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the production API route instead of the Vite-only preview route', async () => {
    const payload = [{
      bankId: 'ipak-yuli', bankName: 'Ipak Yuli Bank', sourceUrl: 'https://example.test',
      updatedAt: null, code: 'USD', buy: 12000, sell: 12100, centralBank: 12050,
    }]
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(widgetsApi.getBankRates(['USD', 'EUR'])).resolves.toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith('/api/bank-rates?codes=USD%2CEUR', {
      headers: { Accept: 'application/json' },
    })
  })

  it('rejects an HTML rewrite instead of attempting to parse it as bank data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })))

    await expect(widgetsApi.getBankRates()).rejects.toThrow('non-JSON')
  })
})
