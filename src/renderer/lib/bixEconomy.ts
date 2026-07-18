export type BixEconomyOperationType = 'daily_claim' | 'care_food' | 'care_toy'

export type BixEconomyState = {
  coins: number
  food: number
  mood: number
  energy: number
  last_daily_claim: string | null
}

export type BixEconomyOperation = {
  id: string
  userId: string
  type: BixEconomyOperationType
  createdAt: string
}

export type BixEconomyResult = {
  ok: boolean
  claimed?: boolean
  reward?: number
  duplicate?: boolean
  error?: string
  state?: BixEconomyState
}

export type BixEconomyRpc = (
  operationId: string,
  operationType: BixEconomyOperationType,
) => Promise<{ data: BixEconomyResult | null; error: { message?: string } | null }>

const QUEUE_KEY = 'bx_bix_economy_queue_v1'
const MAX_QUEUE_SIZE = 100

function storageOrDefault(storage?: Storage): Storage | null {
  if (storage) return storage
  return typeof localStorage === 'undefined' ? null : localStorage
}

function uuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function makeBixEconomyOperation(type: BixEconomyOperationType, userId: string): BixEconomyOperation {
  return { id: uuid(), userId, type, createdAt: new Date().toISOString() }
}

export function loadBixEconomyQueue(storage?: Storage): BixEconomyOperation[] {
  const target = storageOrDefault(storage)
  if (!target) return []
  try {
    const value = JSON.parse(target.getItem(QUEUE_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter(item =>
      typeof item?.id === 'string'
      && typeof item?.userId === 'string'
      && ['daily_claim', 'care_food', 'care_toy'].includes(item?.type)
      && typeof item?.createdAt === 'string',
    ).slice(-MAX_QUEUE_SIZE)
  } catch {
    return []
  }
}

function saveBixEconomyQueue(queue: BixEconomyOperation[], storage?: Storage) {
  try {
    storageOrDefault(storage)?.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)))
  } catch {
    // A disabled or full localStorage must not break the widget UI.
  }
}

export function enqueueBixEconomyOperation(operation: BixEconomyOperation, storage?: Storage): BixEconomyOperation[] {
  const queue = loadBixEconomyQueue(storage)
  if (!queue.some(item => item.id === operation.id)) queue.push(operation)
  saveBixEconomyQueue(queue, storage)
  return queue
}

export async function syncBixEconomyQueue(rpc: BixEconomyRpc, userId: string, storage?: Storage) {
  const queue = loadBixEconomyQueue(storage)
  const results: BixEconomyResult[] = []
  let pending = [...queue]

  // A shared Windows profile can contain sessions of several BX accounts.
  // Never replay account A's offline action under account B's auth.uid().
  for (const operation of queue.filter(item => item.userId === userId)) {
    let response: Awaited<ReturnType<BixEconomyRpc>>
    try {
      response = await rpc(operation.id, operation.type)
    } catch {
      break
    }
    if (response.error || !response.data) break

    results.push(response.data)
    pending = pending.filter(item => item.id !== operation.id)
    saveBixEconomyQueue(pending, storage)
  }

  return {
    results,
    latestState: [...results].reverse().find(result => result.state)?.state ?? null,
    pending: pending.filter(item => item.userId === userId),
  }
}

export const BIX_ECONOMY_QUEUE_KEY = QUEUE_KEY
