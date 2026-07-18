import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BIX_ECONOMY_QUEUE_KEY,
  enqueueBixEconomyOperation,
  loadBixEconomyQueue,
  makeBixEconomyOperation,
  syncBixEconomyQueue,
} from './bixEconomy'

describe('Bix economy offline queue', () => {
  beforeEach(() => localStorage.clear())

  it('stores each operation once', () => {
    const operation = makeBixEconomyOperation('care_food', 'user-a')
    enqueueBixEconomyOperation(operation)
    enqueueBixEconomyOperation(operation)
    expect(loadBixEconomyQueue()).toEqual([operation])
  })

  it('keeps operations when the network call fails', async () => {
    const operation = makeBixEconomyOperation('daily_claim', 'user-a')
    enqueueBixEconomyOperation(operation)
    const result = await syncBixEconomyQueue(async () => ({ data: null, error: { message: 'offline' } }), 'user-a')
    expect(result.pending).toEqual([operation])
    expect(localStorage.getItem(BIX_ECONOMY_QUEUE_KEY)).toContain(operation.id)
  })

  it('removes an idempotently accepted operation and returns server state', async () => {
    const operation = makeBixEconomyOperation('care_toy', 'user-a')
    enqueueBixEconomyOperation(operation)
    const rpc = vi.fn(async () => ({
      data: {
        ok: true,
        duplicate: true,
        state: { coins: 28, food: 72, mood: 100, energy: 91, last_daily_claim: null },
      },
      error: null,
    }))
    const result = await syncBixEconomyQueue(rpc, 'user-a')
    expect(rpc).toHaveBeenCalledWith(operation.id, 'care_toy')
    expect(result.pending).toEqual([])
    expect(result.latestState?.coins).toBe(28)
  })

  it('removes a terminal server rejection so it cannot retry forever', async () => {
    enqueueBixEconomyOperation(makeBixEconomyOperation('care_food', 'user-a'))
    const result = await syncBixEconomyQueue(async () => ({
      data: { ok: false, error: 'not_enough_coins' },
      error: null,
    }), 'user-a')
    expect(result.pending).toEqual([])
  })

  it('never replays another account offline operations', async () => {
    const foreign = makeBixEconomyOperation('care_food', 'user-b')
    const own = makeBixEconomyOperation('daily_claim', 'user-a')
    enqueueBixEconomyOperation(foreign)
    enqueueBixEconomyOperation(own)
    const rpc = vi.fn(async () => ({ data: { ok: true }, error: null }))
    const result = await syncBixEconomyQueue(rpc, 'user-a')
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith(own.id, own.type)
    expect(result.pending).toEqual([])
    expect(loadBixEconomyQueue()).toEqual([foreign])
  })
})
